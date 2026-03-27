import { useState, useMemo } from 'react';
import {
  Box,
  Paper,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  Alert,
  Snackbar,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  InputAdornment,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import SearchIcon from '@mui/icons-material/Search';
import Layout from '~/components/Layout';
import { getActivityList } from '~/services/api';

export function meta() {
  return [{ title: 'Activity List - LearningDB' }];
}

interface ActivityWithDate {
  ACTIVITY_ID: number;
  ACT_NAME: string;
  ACT_STATUS?: string;
  CREATED_AT?: string;
}

const STATUSES = [
  { value: '', label: 'All Status' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'completed', label: 'Completed' },
  { value: 'paused', label: 'Paused' },
  { value: 'not_started', label: 'Not Started' },
  { value: 'skipped', label: 'Skipped' },
  { value: 'cancelled', label: 'Cancelled' },
];

const getStatusColor = (status: string) => {
  switch (status) {
    case 'in_progress':
      return 'primary';
    case 'completed':
      return 'success';
    case 'paused':
      return 'warning';
    case 'cancelled':
    case 'skipped':
      return 'error';
    default:
      return 'default';
  }
};

type SortOrder = 'asc' | 'desc';
type SortField = 'ACTIVITY_ID' | 'ACT_NAME' | 'ACT_STATUS' | 'CREATED_AT';

export default function ActivityList() {
  const [userId, setUserId] = useState('');
  const [data, setData] = useState<ActivityWithDate[]>([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });
  
  // Search, Filter, Sort state
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [sortField, setSortField] = useState<SortField>('CREATED_AT');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  const handleLoad = async () => {
    if (!userId.trim()) {
      setSnackbar({ open: true, message: 'Please enter a User ID', severity: 'error' });
      return;
    }

    setLoading(true);
    try {
      const response = await getActivityList(parseInt(userId));
      setData(response.data.data);
    } catch (error) {
      console.error('Error loading data:', error);
      setSnackbar({ open: true, message: 'Error loading activity list', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  };

  // Filter and sort data
  const filteredAndSortedData = useMemo(() => {
    let result = [...data];

    // Search filter
    if (searchTerm.trim()) {
      const search = searchTerm.toLowerCase();
      result = result.filter(
        (item) =>
          item.ACT_NAME.toLowerCase().includes(search) ||
          item.ACTIVITY_ID.toString().includes(search)
      );
    }

    // Status filter
    if (statusFilter) {
      result = result.filter((item) => item.ACT_STATUS === statusFilter);
    }

    // Sort
    result.sort((a, b) => {
      let aVal: string | number = '';
      let bVal: string | number = '';

      switch (sortField) {
        case 'ACTIVITY_ID':
          aVal = a.ACTIVITY_ID;
          bVal = b.ACTIVITY_ID;
          break;
        case 'ACT_NAME':
          aVal = a.ACT_NAME.toLowerCase();
          bVal = b.ACT_NAME.toLowerCase();
          break;
        case 'ACT_STATUS':
          aVal = a.ACT_STATUS || '';
          bVal = b.ACT_STATUS || '';
          break;
        case 'CREATED_AT':
          aVal = a.CREATED_AT || '';
          bVal = b.CREATED_AT || '';
          break;
      }

      if (aVal < bVal) return sortOrder === 'asc' ? -1 : 1;
      if (aVal > bVal) return sortOrder === 'asc' ? 1 : -1;
      return 0;
    });

    return result;
  }, [data, searchTerm, statusFilter, sortField, sortOrder]);

  return (
    <Layout>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Activity List
        </Typography>

        {/* User ID and Load */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
          <TextField
            label="User ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            size="small"
            type="number"
          />
          <Button variant="contained" onClick={handleLoad} disabled={loading}>
            {loading ? 'Loading...' : 'Load'}
          </Button>
        </Box>

        {/* Search and Filter Controls */}
        {data.length > 0 && (
          <Box sx={{ display: 'flex', gap: 2, mb: 3, flexWrap: 'wrap', alignItems: 'center' }}>
            <TextField
              label="Search Activities"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              size="small"
              sx={{ minWidth: 250 }}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon />
                  </InputAdornment>
                ),
              }}
              placeholder="Search by name or ID..."
            />
            <FormControl size="small" sx={{ minWidth: 150 }}>
              <InputLabel>Status Filter</InputLabel>
              <Select
                value={statusFilter}
                label="Status Filter"
                onChange={(e: SelectChangeEvent) => setStatusFilter(e.target.value)}
              >
                {STATUSES.map((status) => (
                  <MenuItem key={status.value} value={status.value}>
                    {status.label}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <Typography variant="body2" color="text.secondary">
              Showing {filteredAndSortedData.length} of {data.length} activities
            </Typography>
          </Box>
        )}

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell width={100}>
                  <TableSortLabel
                    active={sortField === 'ACTIVITY_ID'}
                    direction={sortField === 'ACTIVITY_ID' ? sortOrder : 'asc'}
                    onClick={() => handleSort('ACTIVITY_ID')}
                  >
                    ID
                  </TableSortLabel>
                </TableCell>
                <TableCell>
                  <TableSortLabel
                    active={sortField === 'ACT_NAME'}
                    direction={sortField === 'ACT_NAME' ? sortOrder : 'asc'}
                    onClick={() => handleSort('ACT_NAME')}
                  >
                    ACT_NAME
                  </TableSortLabel>
                </TableCell>
                <TableCell width={150}>
                  <TableSortLabel
                    active={sortField === 'ACT_STATUS'}
                    direction={sortField === 'ACT_STATUS' ? sortOrder : 'asc'}
                    onClick={() => handleSort('ACT_STATUS')}
                  >
                    STATUS
                  </TableSortLabel>
                </TableCell>
                <TableCell width={180}>
                  <TableSortLabel
                    active={sortField === 'CREATED_AT'}
                    direction={sortField === 'CREATED_AT' ? sortOrder : 'asc'}
                    onClick={() => handleSort('CREATED_AT')}
                  >
                    CREATED_AT
                  </TableSortLabel>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filteredAndSortedData.map((row) => (
                <TableRow key={row.ACTIVITY_ID} hover>
                  <TableCell>{row.ACTIVITY_ID}</TableCell>
                  <TableCell>{row.ACT_NAME}</TableCell>
                  <TableCell>
                    <Chip
                      label={row.ACT_STATUS}
                      color={getStatusColor(row.ACT_STATUS || '')}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="text.secondary">
                      {row.CREATED_AT}
                    </Typography>
                  </TableCell>
                </TableRow>
              ))}
              {filteredAndSortedData.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    {data.length === 0 ? 'No data to display' : 'No activities match your search/filter'}
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </Layout>
  );
}
