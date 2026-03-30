import { useState } from 'react';
import {
  Alert,
  Box,
  Button,
  Paper,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import Layout from '~/components/Layout';
import { runBayes } from '~/services/api';
import type { BayesResult } from '~/services/api';

export function meta() {
  return [{ title: 'Run Bayes - LearningDB' }];
}

export default function RunBayes() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
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
      <Paper sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h5" gutterBottom>
          Run Bayes Analysis
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            fullWidth={isMobile}
            label="Total Minutes (optional)"
            value={totalMinutes}
            onChange={(e) => setTotalMinutes(e.target.value)}
            size="small"
            type="number"
            helperText="Leave empty for probability ratios"
          />
          <Button fullWidth={isMobile} variant="contained" onClick={handleRunBayes} disabled={loading}>
            {loading ? 'Running...' : 'Run Bayes'}
          </Button>
        </Box>

        {isMobile ? (
          <Stack spacing={1}>
            {data.map((row) => (
              <Paper key={row.ACTIVITY_ID} variant="outlined" sx={{ p: 1.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {row.ACT_NAME}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  ID: {row.ACTIVITY_ID}
                </Typography>
                <Typography variant="body2">Total: {row.Total.toFixed(2)}</Typography>
                <Typography variant="body2">Learning: {row.Learning.toFixed(2)}</Typography>
                <Typography variant="body2">Overview: {row.Overview.toFixed(2)}</Typography>
                <Typography variant="body2">Practice: {row.Practice.toFixed(2)}</Typography>
              </Paper>
            ))}
            {data.length > 0 && (
              <Paper variant="outlined" sx={{ p: 1.5, bgcolor: 'rgba(11, 110, 230, 0.05)' }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 0.6 }}>
                  TOTAL
                </Typography>
                <Typography variant="body2">Total: {totals.Total.toFixed(2)}</Typography>
                <Typography variant="body2">Learning: {totals.Learning.toFixed(2)}</Typography>
                <Typography variant="body2">Overview: {totals.Overview.toFixed(2)}</Typography>
                <Typography variant="body2">Practice: {totals.Practice.toFixed(2)}</Typography>
              </Paper>
            )}
            {data.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                Click "Run Bayes" to see results
              </Typography>
            )}
          </Stack>
        ) : (
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
        )}
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
