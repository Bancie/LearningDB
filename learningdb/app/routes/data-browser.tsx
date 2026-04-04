import { isAxiosError } from 'axios';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'react-router';
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Typography,
  useMediaQuery,
  useTheme,
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material';
import {
  deleteTableRow,
  getTableColumns,
  getTables,
  listTableRows,
  updateTableRow,
} from '~/services/api';
import type { Column } from '~/services/api';

export function meta() {
  return [{ title: 'Data Browser - LearningDB' }];
}

function apiDetail(err: unknown): string {
  if (isAxiosError(err)) {
    const d = err.response?.data;
    if (typeof d === 'object' && d !== null && 'detail' in d) {
      return String((d as { detail: unknown }).detail);
    }
  }
  return err instanceof Error ? err.message : 'Request failed';
}

function formatCell(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'object') return JSON.stringify(value);
  return String(value);
}

function coerceValue(sqlType: string, raw: string): unknown {
  const t = sqlType.toLowerCase();
  const trimmed = raw.trim();
  if (trimmed === '') return null;
  if (t.includes('int') || t === 'year') {
    const n = parseInt(trimmed, 10);
    if (!Number.isNaN(n)) return n;
  }
  if (
    t.includes('decimal') ||
    t.includes('float') ||
    t.includes('double') ||
    t.includes('numeric')
  ) {
    const n = parseFloat(trimmed);
    if (!Number.isNaN(n)) return n;
  }
  return raw;
}

function pickPrimaryKey(
  row: Record<string, unknown>,
  columns: Column[],
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const col of columns) {
    if (col.is_primary_key) {
      out[col.name] = row[col.name];
    }
  }
  return out;
}

function hasPrimaryKey(columns: Column[]): boolean {
  return columns.some((c) => c.is_primary_key);
}

export default function DataBrowser() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [searchParams, setSearchParams] = useSearchParams();

  const [tables, setTables] = useState<string[]>([]);
  const [selectedTable, setSelectedTable] = useState('');
  const [columns, setColumns] = useState<Column[]>([]);
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [sortBy, setSortBy] = useState<string>('');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');
  /** From URL only (deep links); no manual filter UI. */
  const [appliedFilters, setAppliedFilters] = useState<Record<string, unknown>>({});

  const [loadingTables, setLoadingTables] = useState(false);
  const [loadingData, setLoadingData] = useState(false);
  const [snackbar, setSnackbar] = useState<{
    open: boolean;
    message: string;
    severity: 'success' | 'error';
  }>({ open: false, message: '', severity: 'success' });

  const [editOpen, setEditOpen] = useState(false);
  const [editForm, setEditForm] = useState<Record<string, string>>({});
  const [editRow, setEditRow] = useState<Record<string, unknown> | null>(null);

  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteRow, setDeleteRow] = useState<Record<string, unknown> | null>(null);

  const columnNames = useMemo(() => columns.map((c) => c.name), [columns]);

  const loadTables = useCallback(async () => {
    setLoadingTables(true);
    try {
      const res = await getTables();
      setTables(res.data.tables);
    } catch (err) {
      console.error(err);
      setSnackbar({ open: true, message: apiDetail(err), severity: 'error' });
    } finally {
      setLoadingTables(false);
    }
  }, []);

  useEffect(() => {
    void loadTables();
  }, [loadTables]);

  // Sync table from URL once tables are loaded
  useEffect(() => {
    if (!tables.length) return;
    const want = searchParams.get('table');
    if (!want) return;
    const match = tables.find((x) => x.toLowerCase() === want.toLowerCase());
    if (match && match !== selectedTable) {
      setSelectedTable(match);
    }
  }, [tables, searchParams, selectedTable]);

  const filtersParam = searchParams.get('filters');

  // Sync filters from URL only (e.g. links from Activity list)
  useEffect(() => {
    if (!filtersParam) {
      setAppliedFilters({});
      return;
    }
    try {
      const parsed = JSON.parse(filtersParam) as unknown;
      if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) return;
      setAppliedFilters(parsed as Record<string, unknown>);
    } catch {
      /* ignore */
    }
  }, [filtersParam]);

  const loadColumns = useCallback(async (tableName: string) => {
    if (!tableName) {
      setColumns([]);
      return;
    }
    try {
      const res = await getTableColumns(tableName);
      setColumns(res.data.columns);
    } catch (err) {
      console.error(err);
      setColumns([]);
      setSnackbar({ open: true, message: apiDetail(err), severity: 'error' });
    }
  }, []);

  useEffect(() => {
    setRows([]);
    setTotal(0);
    if (!selectedTable) {
      setColumns([]);
      return;
    }
    void loadColumns(selectedTable);
  }, [selectedTable, loadColumns]);

  const fetchRows = useCallback(async () => {
    if (!selectedTable) return;
    setLoadingData(true);
    try {
      const res = await listTableRows(selectedTable, {
        limit: rowsPerPage,
        offset: page * rowsPerPage,
        sort_by: sortBy || null,
        sort_dir: sortDir,
        filters: appliedFilters,
      });
      setRows(res.data.rows);
      setTotal(res.data.total);
    } catch (err) {
      console.error(err);
      setRows([]);
      setTotal(0);
      setSnackbar({ open: true, message: apiDetail(err), severity: 'error' });
    } finally {
      setLoadingData(false);
    }
  }, [selectedTable, page, rowsPerPage, sortBy, sortDir, appliedFilters]);

  useEffect(() => {
    if (!selectedTable || !columns.length) {
      return;
    }
    void fetchRows();
  }, [selectedTable, columns.length, fetchRows]);

  const handleTableChange = (event: SelectChangeEvent) => {
    const name = event.target.value;
    setSelectedTable(name);
    setPage(0);
    setSortBy('');
    setAppliedFilters({});
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      if (name) p.set('table', name);
      else p.delete('table');
      p.delete('filters');
      return p;
    });
  };

  const openEdit = (row: Record<string, unknown>) => {
    setEditRow(row);
    const form: Record<string, string> = {};
    columns.forEach((c) => {
      form[c.name] = formatCell(row[c.name]);
    });
    setEditForm(form);
    setEditOpen(true);
  };

  const saveEdit = async () => {
    if (!selectedTable || !editRow || !columns.length) return;
    const pk = pickPrimaryKey(editRow, columns);
    const updates: Record<string, unknown> = {};
    for (const col of columns) {
      if (col.is_primary_key) continue;
      const raw = editForm[col.name] ?? '';
      updates[col.name] = coerceValue(col.type, raw);
    }
    setLoadingData(true);
    try {
      await updateTableRow(selectedTable, pk, updates);
      setSnackbar({ open: true, message: 'Row updated', severity: 'success' });
      setEditOpen(false);
      await fetchRows();
    } catch (err) {
      setSnackbar({ open: true, message: apiDetail(err), severity: 'error' });
    } finally {
      setLoadingData(false);
    }
  };

  const confirmDelete = async () => {
    if (!selectedTable || !deleteRow || !columns.length) return;
    const pk = pickPrimaryKey(deleteRow, columns);
    setLoadingData(true);
    try {
      await deleteTableRow(selectedTable, pk);
      setSnackbar({ open: true, message: 'Row deleted', severity: 'success' });
      setDeleteOpen(false);
      setDeleteRow(null);
      await fetchRows();
    } catch (err) {
      setSnackbar({ open: true, message: apiDetail(err), severity: 'error' });
    } finally {
      setLoadingData(false);
    }
  };

  const pkOk = hasPrimaryKey(columns);

  return (
    <>
      <Stack spacing={2}>
        <Typography variant="h5" gutterBottom>
          Data browser
        </Typography>
        <Typography variant="body2" color="text.secondary">
          View, edit, and delete rows with server-side sort and pagination. Optional row scope via URL
          query (deep links). Dangerous on production data; use TABLE_BROWSER_DENYLIST on the server if
          needed.
        </Typography>

        <FormControl size="small" sx={{ minWidth: isMobile ? '100%' : 280 }}>
          <InputLabel>Table</InputLabel>
          <Select
            label="Table"
            value={selectedTable}
            onChange={handleTableChange}
            disabled={loadingTables}
          >
            <MenuItem value="">
              <em>Select a table</em>
            </MenuItem>
            {tables.map((t) => (
              <MenuItem key={t} value={t}>
                {t}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        {selectedTable && columns.length > 0 && (
          <>
            <Stack direction={isMobile ? 'column' : 'row'} spacing={1} alignItems={isMobile ? 'stretch' : 'center'}>
              <FormControl size="small" sx={{ minWidth: isMobile ? '100%' : 200 }}>
                <InputLabel>Sort by</InputLabel>
                <Select
                  label="Sort by"
                  value={sortBy}
                  onChange={(e: SelectChangeEvent) => {
                    setSortBy(e.target.value);
                    setPage(0);
                  }}
                >
                  <MenuItem value="">
                    <em>Primary key (default)</em>
                  </MenuItem>
                  {columns.map((c) => (
                    <MenuItem key={c.name} value={c.name}>
                      {c.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
              <FormControl size="small" sx={{ minWidth: isMobile ? '100%' : 140 }}>
                <InputLabel>Direction</InputLabel>
                <Select
                  label="Direction"
                  value={sortDir}
                  onChange={(e: SelectChangeEvent<'asc' | 'desc'>) => {
                    setSortDir(e.target.value as 'asc' | 'desc');
                    setPage(0);
                  }}
                >
                  <MenuItem value="asc">Ascending</MenuItem>
                  <MenuItem value="desc">Descending</MenuItem>
                </Select>
              </FormControl>
            </Stack>

            <TableContainer>
              <Table size="small">
                <TableHead>
                  <TableRow>
                    {columnNames.map((name) => (
                      <TableCell key={name}>{name}</TableCell>
                    ))}
                    <TableCell align="right" width={160}>
                      Actions
                    </TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {loadingData && rows.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={columnNames.length + 1} align="center">
                        Loading…
                      </TableCell>
                    </TableRow>
                  ) : (
                    rows.map((row, idx) => (
                      <TableRow key={idx}>
                        {columnNames.map((name) => (
                          <TableCell key={name} sx={{ maxWidth: 220, wordBreak: 'break-word' }}>
                            {formatCell(row[name])}
                          </TableCell>
                        ))}
                        <TableCell align="right">
                          <Button
                            size="small"
                            onClick={() => openEdit(row)}
                            disabled={!pkOk}
                          >
                            Edit
                          </Button>
                          <Button
                            size="small"
                            color="error"
                            onClick={() => {
                              setDeleteRow(row);
                              setDeleteOpen(true);
                            }}
                            disabled={!pkOk}
                          >
                            Delete
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                  {!loadingData && rows.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={columnNames.length + 1} align="center">
                        No rows
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>

            <TablePagination
              component="div"
              count={total}
              page={page}
              onPageChange={(_, p) => setPage(p)}
              rowsPerPage={rowsPerPage}
              onRowsPerPageChange={(e) => {
                setRowsPerPage(parseInt(e.target.value, 10));
                setPage(0);
              }}
              rowsPerPageOptions={[10, 25, 50, 100]}
            />
          </>
        )}
      </Stack>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Edit row</DialogTitle>
        <DialogContent dividers>
          <Stack spacing={1.5} sx={{ pt: 1 }}>
            {columns.map((col) => (
              <TextField
                key={col.name}
                label={`${col.name}${col.is_primary_key ? ' (PK)' : ''}`}
                fullWidth
                size="small"
                value={editForm[col.name] ?? ''}
                onChange={(e) =>
                  setEditForm((prev) => ({ ...prev, [col.name]: e.target.value }))
                }
                disabled={col.is_primary_key}
                helperText={col.type}
              />
            ))}
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => void saveEdit()} disabled={loadingData}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteOpen} onClose={() => setDeleteOpen(false)}>
        <DialogTitle>Delete row?</DialogTitle>
        <DialogContent>
          <Typography variant="body2">
            This cannot be undone. Foreign key constraints may block the delete.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteOpen(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={() => void confirmDelete()} disabled={loadingData}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

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
