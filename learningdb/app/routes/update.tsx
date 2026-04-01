import { useState, useEffect } from 'react';
import {
  Alert,
  Box,
  Button,
  Chip,
  FormControl,
  Grid,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import {
  getActivityIds,
  getActivityList,
  updatePrior,
  updatePosterior,
  updateStatus,
  updateZero,
  checkPrior,
} from '~/services/api';

export function meta() {
  return [{ title: 'Update Data - LearningDB' }];
}

const ALLOWED_STATUSES = [
  'not_started',
  'in_progress',
  'paused',
  'completed',
  'skipped',
  'cancelled',
];

const POSTERIOR_TYPES = [
  { label: 'Learning', value: 1 },
  { label: 'Overview', value: 2 },
  { label: 'Practice', value: 3 },
];

export default function UpdateData() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [activityIds, setActivityIds] = useState<number[]>([]);
  const [selectedActivity, setSelectedActivity] = useState('');
  const [newStatus, setNewStatus] = useState('');
  const [priorProb, setPriorProb] = useState('');
  const [posteriorType, setPosteriorType] = useState('');
  const [posteriorProb, setPosteriorProb] = useState('');
  const [loading, setLoading] = useState(false);
  const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: 'success' | 'error' | 'info' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    loadActivityIds();
  }, []);

  const loadActivityIds = async () => {
    try {
      const response = await getActivityIds('in_progress');
      setActivityIds(response.data.activity_ids);
    } catch (error) {
      try {
        const fallback = await getActivityList(1);
        const fallbackIds = (fallback.data.data ?? [])
          .filter((item) => item.ACT_STATUS === 'in_progress')
          .map((item) => item.ACTIVITY_ID);
        setActivityIds(fallbackIds);
        if (!fallbackIds.length) {
          setSnackbar({ open: true, message: 'No in-progress activities found', severity: 'info' });
        }
      } catch (fallbackError) {
        console.error('Error loading activity IDs:', error);
        setSnackbar({ open: true, message: 'Error loading activity IDs', severity: 'error' });
      }
    }
  };

  const handleUpdateStatus = async () => {
    if (!selectedActivity || !newStatus) {
      setSnackbar({ open: true, message: 'Please select activity and status', severity: 'error' });
      return;
    }

    setLoading(true);
    try {
      const response = await updateStatus(parseInt(selectedActivity), newStatus);
      setSnackbar({ open: true, message: response.data.message, severity: 'success' });
      setNewStatus('');
    } catch (error) {
      console.error('Error updating status:', error);
      setSnackbar({ open: true, message: 'Error updating status', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePrior = async () => {
    if (!selectedActivity || !priorProb) {
      setSnackbar({ open: true, message: 'Please select activity and enter probability', severity: 'error' });
      return;
    }

    setLoading(true);
    try {
      const response = await updatePrior(parseInt(selectedActivity), parseFloat(priorProb));
      setSnackbar({ open: true, message: response.data.message, severity: 'success' });
      setPriorProb('');
    } catch (error) {
      console.error('Error updating prior:', error);
      setSnackbar({ open: true, message: 'Error updating prior probability', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePosterior = async () => {
    if (!selectedActivity || !posteriorType || !posteriorProb) {
      setSnackbar({ open: true, message: 'Please fill all posterior fields', severity: 'error' });
      return;
    }

    setLoading(true);
    try {
      const response = await updatePosterior(
        parseInt(selectedActivity),
        parseInt(posteriorType),
        parseFloat(posteriorProb)
      );
      setSnackbar({ open: true, message: response.data.message, severity: 'success' });
      setPosteriorProb('');
    } catch (error) {
      console.error('Error updating posterior:', error);
      setSnackbar({ open: true, message: 'Error updating posterior probability', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleZeroOut = async () => {
    if (!window.confirm('Zero out all probs for non-in_progress activities?')) {
      return;
    }

    setLoading(true);
    try {
      const response = await updateZero();
      setSnackbar({ open: true, message: response.data.message, severity: 'success' });
    } catch (error) {
      console.error('Error zeroing out:', error);
      setSnackbar({ open: true, message: 'Error zeroing out probabilities', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  const handleCheckPrior = async () => {
    setLoading(true);
    try {
      const response = await checkPrior();
      const { valid, message } = response.data;
      setSnackbar({
        open: true,
        message,
        severity: valid ? 'success' : 'error',
      });
    } catch (error) {
      console.error('Error checking prior:', error);
      setSnackbar({ open: true, message: 'Error checking prior sum', severity: 'error' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Stack spacing={2}>
        <Box>
          <Typography variant="h5" gutterBottom>
            Update Data
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select one active activity, then update status and probability values.
          </Typography>
          <FormControl fullWidth>
            <InputLabel>Activity ID</InputLabel>
            <Select
              value={selectedActivity}
              label="Activity ID"
              onChange={(e: SelectChangeEvent) => setSelectedActivity(e.target.value)}
            >
              {activityIds.map((id) => (
                <MenuItem key={id} value={id.toString()}>
                  {id}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          {selectedActivity && (
            <Chip
              color="primary"
              variant="outlined"
              sx={{ mt: 1.5, fontWeight: 600 }}
              label={`Editing Activity #${selectedActivity}`}
            />
          )}
        </Box>

        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper elevation={0} variant="outlined" sx={{ p: 2.5, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Update Status
              </Typography>
              <Stack spacing={1.2}>
                <FormControl fullWidth>
                  <InputLabel>New Status</InputLabel>
                  <Select
                    value={newStatus}
                    label="New Status"
                    onChange={(e: SelectChangeEvent) => setNewStatus(e.target.value)}
                  >
                    {ALLOWED_STATUSES.map((status) => (
                      <MenuItem key={status} value={status}>
                        {status}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Button fullWidth={isMobile} variant="contained" onClick={handleUpdateStatus} disabled={loading}>
                  Update Status
                </Button>
              </Stack>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper elevation={0} variant="outlined" sx={{ p: 2.5, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Update Prior Probability
              </Typography>
              <Stack spacing={1.2}>
                <TextField
                  fullWidth
                  label="New Prior Prob"
                  type="number"
                  inputProps={{ step: 0.01, min: 0, max: 1 }}
                  value={priorProb}
                  onChange={(e) => setPriorProb(e.target.value)}
                />
                <Button fullWidth={isMobile} variant="contained" onClick={handleUpdatePrior} disabled={loading}>
                  Update Prior
                </Button>
              </Stack>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper elevation={0} variant="outlined" sx={{ p: 2.5, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Update Posterior
              </Typography>
              <Stack spacing={1.2}>
                <FormControl fullWidth>
                  <InputLabel>Posterior Type</InputLabel>
                  <Select
                    value={posteriorType}
                    label="Posterior Type"
                    onChange={(e: SelectChangeEvent) => setPosteriorType(e.target.value)}
                  >
                    {POSTERIOR_TYPES.map((type) => (
                      <MenuItem key={type.value} value={type.value.toString()}>
                        {type.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <TextField
                  fullWidth
                  label="New Value"
                  type="number"
                  inputProps={{ step: 0.01, min: 0, max: 1 }}
                  value={posteriorProb}
                  onChange={(e) => setPosteriorProb(e.target.value)}
                />
                <Button
                  fullWidth={isMobile}
                  variant="contained"
                  onClick={handleUpdatePosterior}
                  disabled={loading}
                >
                  Update Posterior
                </Button>
              </Stack>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12, md: 6 }}>
            <Paper elevation={0} variant="outlined" sx={{ p: 2.5, height: '100%' }}>
              <Typography variant="h6" gutterBottom>
                Utilities
              </Typography>
              <Stack spacing={1.2}>
                <Button
                  fullWidth={isMobile}
                  variant="outlined"
                  color="warning"
                  onClick={handleZeroOut}
                  disabled={loading}
                >
                  Zero Out Others
                </Button>
                <Button fullWidth={isMobile} variant="outlined" onClick={handleCheckPrior} disabled={loading}>
                  Check Prior Sum
                </Button>
              </Stack>
            </Paper>
          </Grid>
        </Grid>
      </Stack>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
      >
        <Alert severity={snackbar.severity}>{snackbar.message}</Alert>
      </Snackbar>
    </>
  );
}
