import { useState } from 'react';
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
  Alert,
  Snackbar,
} from '@mui/material';
import Layout from '~/components/Layout';
import { getCurrentActivityOutput } from '~/services/api';
import type { ActivityOutput } from '~/services/api';

export function meta() {
  return [{ title: 'Current Activity Output - LearningDB' }];
}

export default function CurrentActivityOutput() {
  const [userId, setUserId] = useState('');
  const [data, setData] = useState<ActivityOutput[]>([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const handleLoad = async () => {
    if (!userId.trim()) {
      setSnackbar({ open: true, message: 'Please enter a User ID', severity: 'error' });
      return;
    }

    setLoading(true);
    try {
      const response = await getCurrentActivityOutput(parseInt(userId));
      setData(response.data.data);
    } catch (error) {
      console.error('Error loading data:', error);
      setSnackbar({ open: true, message: 'Error loading activity output', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Current Activity Output
        </Typography>

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

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>AO_ID</TableCell>
                <TableCell>ACT_NAME</TableCell>
                <TableCell>START_TIME</TableCell>
                <TableCell>FINISH_TIME</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.AO_ID}>
                  <TableCell>{row.AO_ID}</TableCell>
                  <TableCell>{row.ACT_NAME}</TableCell>
                  <TableCell>{row.START_TIME}</TableCell>
                  <TableCell>{row.FINISH_TIME}</TableCell>
                </TableRow>
              ))}
              {data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} align="center">
                    No data to display
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
