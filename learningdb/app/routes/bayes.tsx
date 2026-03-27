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
import { runBayes } from '~/services/api';
import type { BayesResult } from '~/services/api';

export function meta() {
  return [{ title: 'Run Bayes - LearningDB' }];
}

export default function RunBayes() {
  const [totalMinutes, setTotalMinutes] = useState('');
  const [data, setData] = useState<BayesResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  const handleRunBayes = async () => {
    setLoading(true);
    try {
      const minutes = totalMinutes.trim() ? parseFloat(totalMinutes) : undefined;
      const response = await runBayes(minutes);
      setData(response.data.data);
    } catch (error) {
      console.error('Error running Bayes:', error);
      setSnackbar({ open: true, message: 'Error running Bayes analysis', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  // Calculate totals
  const totals = data.reduce(
    (acc, row) => ({
      Total: acc.Total + row.Total,
      Learning: acc.Learning + row.Learning,
      Overview: acc.Overview + row.Overview,
      Practice: acc.Practice + row.Practice,
    }),
    { Total: 0, Learning: 0, Overview: 0, Practice: 0 }
  );

  return (
    <Layout>
      <Paper sx={{ p: 3 }}>
        <Typography variant="h5" gutterBottom>
          Run Bayes Analysis
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center' }}>
          <TextField
            label="Total Minutes (optional)"
            value={totalMinutes}
            onChange={(e) => setTotalMinutes(e.target.value)}
            size="small"
            type="number"
            helperText="Leave empty for probability ratios"
          />
          <Button variant="contained" onClick={handleRunBayes} disabled={loading}>
            {loading ? 'Running...' : 'Run Bayes'}
          </Button>
        </Box>

        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ACTIVITY_ID</TableCell>
                <TableCell>ACT_NAME</TableCell>
                <TableCell align="right">Total</TableCell>
                <TableCell align="right">Learning</TableCell>
                <TableCell align="right">Overview</TableCell>
                <TableCell align="right">Practice</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map((row) => (
                <TableRow key={row.ACTIVITY_ID}>
                  <TableCell>{row.ACTIVITY_ID}</TableCell>
                  <TableCell>{row.ACT_NAME}</TableCell>
                  <TableCell align="right">{row.Total.toFixed(2)}</TableCell>
                  <TableCell align="right">{row.Learning.toFixed(2)}</TableCell>
                  <TableCell align="right">{row.Overview.toFixed(2)}</TableCell>
                  <TableCell align="right">{row.Practice.toFixed(2)}</TableCell>
                </TableRow>
              ))}
              {data.length > 0 && (
                <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                  <TableCell colSpan={2}>
                    <strong>TOTAL</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>{totals.Total.toFixed(2)}</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>{totals.Learning.toFixed(2)}</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>{totals.Overview.toFixed(2)}</strong>
                  </TableCell>
                  <TableCell align="right">
                    <strong>{totals.Practice.toFixed(2)}</strong>
                  </TableCell>
                </TableRow>
              )}
              {data.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    Click "Run Bayes" to see results
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
