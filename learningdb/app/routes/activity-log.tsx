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
import { getCurrentActivityLog } from '~/services/api';
import type { ActivityLog } from '~/services/api';

export function meta() {
  return [{ title: 'Current Activity Log - LearningDB' }];
}

export default function CurrentActivityLog() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [userId, setUserId] = useState('');
  const [data, setData] = useState<ActivityLog[]>([]);
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
      const response = await getCurrentActivityLog(parseInt(userId));
      setData(response.data.data);
    } catch (error) {
      console.error('Error loading data:', error);
      setSnackbar({ open: true, message: 'Error loading activity log', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <Paper sx={{ p: { xs: 2, sm: 3 } }}>
        <Typography variant="h5" gutterBottom>
          Current Activity Log
        </Typography>

        <Box sx={{ display: 'flex', gap: 1, mb: 2, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            fullWidth={isMobile}
            label="User ID"
            value={userId}
            onChange={(e) => setUserId(e.target.value)}
            size="small"
            type="number"
          />
          <Button fullWidth={isMobile} variant="contained" onClick={handleLoad} disabled={loading}>
            {loading ? 'Loading...' : 'Load'}
          </Button>
        </Box>

        {isMobile ? (
          <Stack spacing={1}>
            {data.map((row) => (
              <Paper key={`${row.ACTIVITY_ID}-${row.ACTI_LOG_ID}`} variant="outlined" sx={{ p: 1.5 }}>
                <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                  {row.ACT_NAME}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Activity ID: {row.ACTIVITY_ID}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Log ID: {row.ACTI_LOG_ID}
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.4 }}>
                  {row.START_TIME}
                </Typography>
              </Paper>
            ))}
            {data.length === 0 && (
              <Typography variant="body2" color="text.secondary" sx={{ py: 3, textAlign: 'center' }}>
                No data to display
              </Typography>
            )}
          </Stack>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>ACTIVITY_ID</TableCell>
                  <TableCell>ACTI_LOG_ID</TableCell>
                  <TableCell>ACT_NAME</TableCell>
                  <TableCell>START_TIME</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {data.map((row) => (
                  <TableRow key={`${row.ACTIVITY_ID}-${row.ACTI_LOG_ID}`}>
                    <TableCell>{row.ACTIVITY_ID}</TableCell>
                    <TableCell>{row.ACTI_LOG_ID}</TableCell>
                    <TableCell>{row.ACT_NAME}</TableCell>
                    <TableCell>{row.START_TIME}</TableCell>
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
