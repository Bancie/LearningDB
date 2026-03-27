import { useState, useEffect } from 'react';
import {
  Box,
  Paper,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Button,
  Alert,
  Snackbar,
  Grid,
  CircularProgress,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import Layout from '~/components/Layout';
import { getTables, getTableColumns, insertRecord } from '~/services/api';
import type { Column } from '~/services/api';

export function meta() {
  return [{ title: 'Import Data - LearningDB' }];
}

export default function ImportData() {
  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [columns, setColumns] = useState<Column[]>([]);
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    loadTables();
  }, []);

  const loadTables = async () => {
    try {
      const response = await getTables();
      setTables(response.data.tables);
    } catch (error) {
      console.error('Error loading tables:', error);
      setSnackbar({ open: true, message: 'Error loading tables', severity: 'error' });
    }
  };

  const handleTableChange = async (event: SelectChangeEvent) => {
    const tableName = event.target.value;
    setSelectedTable(tableName);
    setFormData({});
    
    if (tableName) {
      try {
        const response = await getTableColumns(tableName);
        setColumns(response.data.columns);
        
        // Initialize form data
        const initialData: Record<string, string> = {};
        response.data.columns.forEach((col) => {
          if (!col.is_primary_key || !col.autoincrement) {
            initialData[col.name] = '';
          }
        });
        setFormData(initialData);
      } catch (error) {
        console.error('Error loading columns:', error);
        setSnackbar({ open: true, message: 'Error loading columns', severity: 'error' });
      }
    }
  };

  const handleInputChange = (columnName: string, value: string) => {
    setFormData((prev) => ({ ...prev, [columnName]: value }));
  };

  const fillNow = (columnName: string) => {
    const now = new Date();
    // Format for datetime-local input: YYYY-MM-DDTHH:mm
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const formatted = `${year}-${month}-${day}T${hours}:${minutes}`;
    setFormData((prev) => ({ ...prev, [columnName]: formatted }));
  };

  const fillToday = (columnName: string) => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    const formatted = `${year}-${month}-${day}`;
    setFormData((prev) => ({ ...prev, [columnName]: formatted }));
  };

  const handleSubmit = async () => {
    // Validate required fields
    for (const col of columns) {
      if (!col.is_primary_key || !col.autoincrement) {
        if (!formData[col.name] && !col.nullable) {
          setSnackbar({ open: true, message: `Please fill in ${col.name}`, severity: 'error' });
          return;
        }
      }
    }

    // Prepare data - convert datetime-local format to MySQL format
    const preparedData: Record<string, string> = {};
    for (const col of columns) {
      if (formData[col.name]) {
        const typeLower = col.type.toLowerCase();
        const isDateTime = typeLower.includes('datetime') || typeLower.includes('timestamp');
        
        if (isDateTime && formData[col.name].includes('T')) {
          // Convert YYYY-MM-DDTHH:mm to YYYY-MM-DD HH:mm:ss
          preparedData[col.name] = formData[col.name].replace('T', ' ') + ':00';
        } else {
          preparedData[col.name] = formData[col.name];
        }
      }
    }

    setLoading(true);
    try {
      await insertRecord(selectedTable, preparedData);
      setSnackbar({ open: true, message: `Record inserted into ${selectedTable}`, severity: 'success' });
      
      // Clear form
      const clearedData: Record<string, string> = {};
      Object.keys(formData).forEach((key) => {
        clearedData[key] = '';
      });
      setFormData(clearedData);
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Error inserting record';
      setSnackbar({ open: true, message, severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const renderField = (column: Column) => {
    if (column.is_primary_key && column.autoincrement) {
      return null;
    }

    const typeLower = column.type.toLowerCase();
    // Check for datetime or timestamp types
    const isDateTime = typeLower.includes('datetime') || typeLower.includes('timestamp');
    // Check for date-only type (not datetime or timestamp)
    const isDate = typeLower.includes('date') && !isDateTime;
    const hasEnums = column.enums && column.enums.length > 0;

    return (
      <Grid size={{ xs: 12, md: 6 }} key={column.name}>
        <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
          {hasEnums ? (
            <FormControl fullWidth>
              <InputLabel>{column.name}</InputLabel>
              <Select
                value={formData[column.name] || ''}
                label={column.name}
                onChange={(e) => handleInputChange(column.name, e.target.value)}
              >
                {column.enums!.map((enumVal) => (
                  <MenuItem key={enumVal} value={enumVal}>
                    {enumVal}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          ) : (
            <TextField
              fullWidth
              label={column.name}
              type={isDateTime || isDate ? 'datetime-local' : 'text'}
              value={formData[column.name] || ''}
              onChange={(e) => handleInputChange(column.name, e.target.value)}
              InputLabelProps={isDateTime || isDate ? { shrink: true } : undefined}
              helperText={column.type}
            />
          )}
          {isDateTime && (
            <Button variant="outlined" onClick={() => fillNow(column.name)} sx={{ minWidth: 80, height: 56 }}>
              Now
            </Button>
          )}
          {isDate && !isDateTime && (
            <Button variant="outlined" onClick={() => fillToday(column.name)} sx={{ minWidth: 80, height: 56 }}>
              Today
            </Button>
          )}
        </Box>
      </Grid>
    );
  };

  return (
    <Layout>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Import Data
        </Typography>

        <FormControl fullWidth sx={{ mb: 3 }}>
          <InputLabel>Choose Table</InputLabel>
          <Select value={selectedTable} label="Choose Table" onChange={handleTableChange}>
            {tables.map((table) => (
              <MenuItem key={table} value={table}>
                {table}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {columns.length > 0 && (
          <>
            <Grid container spacing={2} sx={{ mb: 3 }}>
              {columns.map(renderField)}
            </Grid>

            <Button
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : null}
            >
              Insert Record
            </Button>
          </>
        )}
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Layout>
  );
}
