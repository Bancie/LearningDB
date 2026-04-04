import { useEffect, useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  CircularProgress,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import { TableColumnFormField, buildInsertRecordPayload } from '~/components/table-record-fields';
import { getTables, getTableColumns, insertRecord } from '~/services/api';
import type { Column } from '~/services/api';

export function meta() {
  return [{ title: 'Import Data - LearningDB' }];
}

export default function ImportData() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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

  const handleSubmit = async () => {
    for (const col of columns) {
      if (!col.is_primary_key || !col.autoincrement) {
        if (!formData[col.name] && !col.nullable) {
          setSnackbar({ open: true, message: `Please fill in ${col.name}`, severity: 'error' });
          return;
        }
      }
    }

    const preparedData = buildInsertRecordPayload(columns, formData);

    setLoading(true);
    try {
      await insertRecord(selectedTable, preparedData);
      setSnackbar({ open: true, message: `Record inserted into ${selectedTable}`, severity: 'success' });

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

    return (
      <Grid size={{ xs: 12, md: 6 }} key={column.name}>
        <TableColumnFormField
          column={column}
          value={formData[column.name] || ''}
          onChange={(v) => handleInputChange(column.name, v)}
          isMobile={isMobile}
        />
      </Grid>
    );
  };

  return (
    <>
      <Stack spacing={3}>
        <Box>
          <Typography variant="h5" gutterBottom>
            Import Data
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select table, fill fields, then insert one record.
          </Typography>
          <FormControl fullWidth>
            <InputLabel>Choose Table</InputLabel>
            <Select value={selectedTable} label="Choose Table" onChange={handleTableChange}>
              {tables.map((table) => (
                <MenuItem key={table} value={table}>
                  {table}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {selectedTable && (
            <Chip
              label={`Selected: ${selectedTable}`}
              color="primary"
              variant="outlined"
              sx={{ mt: 1.5, fontWeight: 600 }}
            />
          )}
        </Box>

        {columns.length > 0 && (
          <Box>
            <Typography
              variant="subtitle1"
              sx={{ fontWeight: 700, mb: 1.2, color: 'text.primary', letterSpacing: '-0.01em' }}
            >
              Record Details
            </Typography>
            <Grid container spacing={1.5} sx={{ mb: 2 }}>
              {columns.map(renderField)}
            </Grid>

            <Button
              fullWidth={isMobile}
              variant="contained"
              color="primary"
              onClick={handleSubmit}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : null}
            >
              {loading ? 'Inserting...' : 'Insert Record'}
            </Button>
          </Box>
        )}
      </Stack>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert severity={snackbar.severity} onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}>
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
