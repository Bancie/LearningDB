import * as React from "react";

import { Alert } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { WizardFields } from "~/import-wizard/WizardFields";
import {
  formatKitWorkTypeLabel,
  resolveImportTables,
  type ResolvedTables,
} from "~/import-wizard/table-utils";
import {
  deleteLoggingHistory,
  getLoggingHistoryDetail,
  getTableColumns,
  updateLoggingHistoryDetail,
  type Column,
  type LoggingHistoryDetail,
  type LoggingHistorySpecialtyKit,
} from "~/services/api";
import { formatApiError } from "~/utils/formatApiError";

type Props = {
  actiLogId: number | null;
  open: boolean;
  onClose: () => void;
  onChanged: () => void;
};

type SpecialtyKitState = {
  table: string;
  logical: string;
  label: string;
  rows: Array<Record<string, unknown>>;
  columns: Column[];
};

function snapshotState(
  activityLog: Record<string, unknown>,
  activityOutput: Record<string, unknown>,
  kitRows: Array<Record<string, unknown>>,
  specialtyKits: SpecialtyKitState[],
): string {
  return JSON.stringify({
    activityLog,
    activityOutput,
    kitRows,
    specialtyKits: specialtyKits.map((kit) => ({
      table: kit.table,
      logical: kit.logical,
      rows: kit.rows,
    })),
  });
}

function normalizeSpecialtyKits(
  kits: LoggingHistorySpecialtyKit[] | undefined,
  columnMap: Record<string, Column[]>,
): SpecialtyKitState[] {
  return (kits ?? []).map((kit) => {
    const logical = (kit.logical || kit.table).toUpperCase();
    return {
      table: kit.table,
      logical,
      label: formatKitWorkTypeLabel(logical),
      rows: kit.rows?.length ? kit.rows : [{}],
      columns: columnMap[kit.table] ?? columnMap[logical.toLowerCase()] ?? [],
    };
  });
}

export function HistoryDetailDialog({ actiLogId, open, onClose, onChanged }: Props) {
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [detail, setDetail] = React.useState<LoggingHistoryDetail | null>(null);
  const [tables, setTables] = React.useState<ResolvedTables | null>(null);
  const [colsLog, setColsLog] = React.useState<Column[]>([]);
  const [colsOut, setColsOut] = React.useState<Column[]>([]);
  const [colsKit, setColsKit] = React.useState<Column[]>([]);
  const [activityLog, setActivityLog] = React.useState<Record<string, unknown>>({});
  const [activityOutput, setActivityOutput] = React.useState<Record<string, unknown>>({});
  const [kitRows, setKitRows] = React.useState<Array<Record<string, unknown>>>([]);
  const [specialtyKits, setSpecialtyKits] = React.useState<SpecialtyKitState[]>([]);
  const [initialSnapshot, setInitialSnapshot] = React.useState<string | null>(null);
  const [closeConfirmOpen, setCloseConfirmOpen] = React.useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = React.useState(false);
  const [saveToast, setSaveToast] = React.useState(false);
  const toastTimer = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const omitLog = React.useMemo(() => new Set<string>(["USER_ID", "ACTIVITY_ID"]), []);
  const omitOut = React.useMemo(() => new Set<string>(["ACTI_LOG_ID"]), []);
  const omitKit = React.useMemo(() => new Set<string>(["AO_ID"]), []);

  React.useEffect(() => {
    return () => {
      if (toastTimer.current) clearTimeout(toastTimer.current);
    };
  }, []);

  React.useEffect(() => {
    if (!open || actiLogId == null) return;
    let cancelled = false;
    setLoading(true);
    setError(null);
    (async () => {
      try {
        const t = await resolveImportTables();
        if (cancelled) return;
        setTables(t);
        const [log, out, kit] = await Promise.all([
          getTableColumns(t.log),
          getTableColumns(t.output),
          getTableColumns(t.kit),
        ]);
        if (cancelled) return;
        setColsLog(log.data.columns);
        setColsOut(out.data.columns);
        setColsKit(kit.data.columns);

        const { data } = await getLoggingHistoryDetail(actiLogId);
        if (cancelled) return;
        setDetail(data.data);
        const nextActivityLog = data.data.activity_log ?? {};
        const nextActivityOutput = data.data.activity_output ?? {};
        const nextKitRows = data.data.kit_rows ?? [];
        const specialtyPayload = data.data.specialty_kits ?? [];

        const columnEntries = await Promise.all(
          specialtyPayload.map(async (specialty) => {
            const { data: colData } = await getTableColumns(specialty.table);
            return [specialty.table, colData.columns] as const;
          }),
        );
        if (cancelled) return;
        const columnMap = Object.fromEntries(columnEntries) as Record<string, Column[]>;
        const nextSpecialty = normalizeSpecialtyKits(specialtyPayload, columnMap);

        setActivityLog(nextActivityLog);
        setActivityOutput(nextActivityOutput ?? {});
        setKitRows(nextKitRows.length ? nextKitRows : [{}]);
        setSpecialtyKits(nextSpecialty);
        setInitialSnapshot(
          snapshotState(
            nextActivityLog,
            nextActivityOutput ?? {},
            nextKitRows.length ? nextKitRows : [{}],
            nextSpecialty,
          ),
        );
      } catch (e) {
        if (!cancelled) setError(formatApiError(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open, actiLogId]);

  if (!open || actiLogId == null) return null;

  const dirty =
    initialSnapshot != null &&
    initialSnapshot !== snapshotState(activityLog, activityOutput, kitRows, specialtyKits);

  const showSaveToast = () => {
    setSaveToast(true);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => {
      setSaveToast(false);
      toastTimer.current = null;
    }, 3200);
  };

  const applyDetail = async (next: LoggingHistoryDetail) => {
    const nl = next.activity_log ?? activityLog;
    const no = next.activity_output ?? activityOutput;
    const nk = next.kit_rows ?? kitRows;
    const specialtyPayload = next.specialty_kits ?? [];
    const missingCols = specialtyPayload.filter(
      (kit) => !specialtyKits.some((existing) => existing.table === kit.table && existing.columns.length > 0),
    );
    const loaded = await Promise.all(
      missingCols.map(async (kit) => {
        const { data } = await getTableColumns(kit.table);
        return [kit.table, data.columns] as const;
      }),
    );
    const columnMap: Record<string, Column[]> = {
      ...Object.fromEntries(specialtyKits.map((kit) => [kit.table, kit.columns])),
      ...Object.fromEntries(loaded),
    };
    const nextSpecialty = normalizeSpecialtyKits(specialtyPayload, columnMap);
    setActivityLog(nl);
    setActivityOutput(no ?? {});
    setKitRows(nk.length ? nk : [{}]);
    setSpecialtyKits(nextSpecialty);
    setInitialSnapshot(snapshotState(nl, no ?? {}, nk.length ? nk : [{}], nextSpecialty));
  };

  const persist = async (closeAfter: boolean) => {
    setSaving(true);
    setError(null);
    try {
      const { data } = await updateLoggingHistoryDetail(actiLogId, {
        activity_log_updates: activityLog,
        activity_output_updates: activityOutput,
        kit_rows: kitRows,
        specialty_kits: specialtyKits.map((kit) => ({
          table: kit.table,
          logical: kit.logical,
          rows: kit.rows,
        })),
      });
      setDetail(data.data);
      await applyDetail(data.data);
      onChanged();
      if (closeAfter) {
        onClose();
      } else {
        showSaveToast();
      }
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setSaving(false);
    }
  };

  const onDeleteConfirmed = async () => {
    setDeleteConfirmOpen(false);
    setSaving(true);
    setError(null);
    try {
      await deleteLoggingHistory(actiLogId);
      onChanged();
      onClose();
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setSaving(false);
    }
  };

  const requestClose = () => {
    if (dirty) {
      setCloseConfirmOpen(true);
      return;
    }
    onClose();
  };

  const updateSpecialtyRow = (kitIdx: number, rowIdx: number, name: string, value: unknown) => {
    setSpecialtyKits((prev) =>
      prev.map((kit, i) =>
        i === kitIdx
          ? {
              ...kit,
              rows: kit.rows.map((row, j) => (j === rowIdx ? { ...row, [name]: value } : row)),
            }
          : kit,
      ),
    );
  };

  return (
    <>
      <div className="fixed inset-0 z-[130] flex items-center justify-center bg-black/35 p-4">
        <div className="max-h-[90vh] w-full max-w-4xl overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-surface-lowest)] shadow-[var(--shadow-ambient)]">
          <div className="sticky top-0 z-10 flex items-center justify-between border-b border-[color:var(--color-outline-variant)]/25 bg-[var(--color-surface-lowest)] px-5 py-4">
            <h3 className="text-title-md">History detail #{actiLogId}</h3>
            <Button variant="ghost" onClick={requestClose}>Close</Button>
          </div>
          <div className="max-h-[calc(90vh-4.25rem)] overflow-y-auto p-5">
            {error ? <Alert variant="error" className="mb-3">{error}</Alert> : null}
            {loading ? <p className="text-body-md">Loading detail…</p> : null}
            {!loading && detail && tables ? (
              <div className="space-y-6">
                <section>
                  <h4 className="mb-3 text-label-md text-[var(--color-on-surface-variant)]">ACTIVITY_LOG</h4>
                  <Card className="p-4 md:p-6">
                    <WizardFields
                      columns={colsLog}
                      values={activityLog}
                      onChange={(name, value) => setActivityLog((prev) => ({ ...prev, [name]: value }))}
                      omit={omitLog}
                      gridClassName="grid grid-cols-1 gap-y-6 gap-x-5 md:grid-cols-2"
                    />
                  </Card>
                </section>

                <section>
                  <h4 className="mb-3 text-label-md text-[var(--color-on-surface-variant)]">ACTIVITY_OUTPUT</h4>
                  <Card className="p-4 md:p-6">
                    <WizardFields
                      columns={colsOut}
                      values={activityOutput}
                      onChange={(name, value) => setActivityOutput((prev) => ({ ...prev, [name]: value }))}
                      omit={omitOut}
                    />
                  </Card>
                </section>

                <section>
                  <div className="mb-3 flex items-center justify-between">
                    <h4 className="text-label-md text-[var(--color-on-surface-variant)]">KIT_COUNT rows</h4>
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={() =>
                        setKitRows((prev) => [
                          ...prev,
                          activityOutput.AO_ID != null ? { AO_ID: activityOutput.AO_ID } : {},
                        ])
                      }
                    >
                      Add row
                    </Button>
                  </div>
                  <div className="space-y-4">
                    {kitRows.map((row, idx) => (
                      <div key={idx} className="rounded-[var(--radius-md)] border border-[color:var(--color-outline-variant)]/30 p-4">
                        <div className="mb-3 flex items-center justify-between">
                          <p className="text-label-md text-[var(--color-on-surface-variant)]">Row #{idx + 1}</p>
                          <Button variant="ghost" size="sm" onClick={() => setKitRows((prev) => prev.filter((_, i) => i !== idx))}>
                            Remove
                          </Button>
                        </div>
                        <WizardFields
                          columns={colsKit}
                          values={row}
                          onChange={(name, value) =>
                            setKitRows((prev) => prev.map((r, i) => (i === idx ? { ...r, [name]: value } : r)))
                          }
                          omit={omitKit}
                        />
                      </div>
                    ))}
                  </div>
                </section>

                {specialtyKits.map((kit, kitIdx) => (
                  <section key={kit.table}>
                    <div className="mb-3 flex items-center justify-between gap-3">
                      <h4 className="text-label-md text-[var(--color-on-surface-variant)]">
                        {kit.logical} rows
                        <span className="ml-2 font-normal text-[var(--color-on-surface-variant)]/80">
                          ({kit.label})
                        </span>
                      </h4>
                      <Button
                        variant="secondary"
                        size="sm"
                        onClick={() =>
                          setSpecialtyKits((prev) =>
                            prev.map((item, i) =>
                              i === kitIdx
                                ? {
                                    ...item,
                                    rows: [
                                      ...item.rows,
                                      activityOutput.AO_ID != null ? { AO_ID: activityOutput.AO_ID } : {},
                                    ],
                                  }
                                : item,
                            ),
                          )
                        }
                      >
                        Add row
                      </Button>
                    </div>
                    <div className="space-y-4">
                      {kit.rows.map((row, rowIdx) => (
                        <div
                          key={`${kit.table}-${rowIdx}`}
                          className="rounded-[var(--radius-md)] border border-[color:var(--color-outline-variant)]/30 p-4"
                        >
                          <div className="mb-3 flex items-center justify-between">
                            <p className="text-label-md text-[var(--color-on-surface-variant)]">
                              {kit.label} row #{rowIdx + 1}
                            </p>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() =>
                                setSpecialtyKits((prev) =>
                                  prev.map((item, i) =>
                                    i === kitIdx
                                      ? { ...item, rows: item.rows.filter((_, j) => j !== rowIdx) }
                                      : item,
                                  ),
                                )
                              }
                            >
                              Remove
                            </Button>
                          </div>
                          <WizardFields
                            columns={kit.columns}
                            values={row}
                            onChange={(name, value) => updateSpecialtyRow(kitIdx, rowIdx, name, value)}
                            omit={omitKit}
                          />
                        </div>
                      ))}
                    </div>
                  </section>
                ))}

                <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
                  <Button variant="danger" onClick={() => setDeleteConfirmOpen(true)} disabled={saving}>
                    Delete
                  </Button>
                  <Button onClick={() => void persist(false)} disabled={saving}>
                    Save
                  </Button>
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {closeConfirmOpen ? (
        <div className="fixed inset-0 z-[140] flex items-center justify-center bg-black/35 p-4">
          <div className="w-full max-w-md rounded-[var(--radius-lg)] bg-[var(--color-surface-lowest)] p-5 shadow-[var(--shadow-ambient)]">
            <h4 className="text-title-md">Unsaved changes</h4>
            <p className="mt-2 text-body-md text-[var(--color-on-surface-variant)]">
              You have unsaved edits. Save changes before closing?
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button variant="secondary" disabled={saving} onClick={() => setCloseConfirmOpen(false)}>Cancel</Button>
              <Button
                variant="ghost"
                disabled={saving}
                onClick={() => {
                  setCloseConfirmOpen(false);
                  onClose();
                }}
              >
                Discard
              </Button>
              <Button
                disabled={saving}
                onClick={async () => {
                  setCloseConfirmOpen(false);
                  await persist(true);
                }}
              >
                Save changes
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {deleteConfirmOpen ? (
        <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/35 p-4">
          <div className="w-full max-w-md rounded-[var(--radius-lg)] border border-[color:var(--color-outline-variant)]/40 bg-[var(--color-surface-lowest)] p-5 shadow-[var(--shadow-ambient)]">
            <h4 className="text-title-md">Delete session</h4>
            <p className="mt-2 text-body-md text-[var(--color-on-surface-variant)]">
              Delete this logging session and all related output, kit count, and specialty kit records? This cannot be
              undone.
            </p>
            <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
              <Button type="button" variant="danger" onClick={() => void onDeleteConfirmed()} disabled={saving}>
                Delete
              </Button>
            </div>
          </div>
        </div>
      ) : null}

      {saveToast ? (
        <div className="pointer-events-none fixed bottom-4 left-4 z-[200] max-w-sm rounded-[var(--radius-md)] border border-[color:var(--color-outline-variant)]/35 bg-[var(--color-surface-container)] px-4 py-3 text-body-md text-[var(--color-on-surface)] shadow-[var(--shadow-ambient)]">
          Changes saved
        </div>
      ) : null}
    </>
  );
}
