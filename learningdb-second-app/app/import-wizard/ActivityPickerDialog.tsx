import * as React from "react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Select } from "~/components/ui/select";
import { listTableRows } from "~/services/api";
import { formatApiError } from "~/utils/formatApiError";

type ActivityRow = {
  ACTIVITY_ID: number;
  ACT_NAME?: string;
  ACT_STATUS?: string;
  [k: string]: unknown;
};

type SortMode = "id-asc" | "id-desc" | "name-asc" | "name-desc";

export function ActivityPickerDialog({
  open,
  onClose,
  onPick,
}: {
  open: boolean;
  onClose: () => void;
  onPick: (activity: ActivityRow) => void;
}) {
  const [rows, setRows] = React.useState<ActivityRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");
  const [statusFilter, setStatusFilter] = React.useState("all");
  const [sortMode, setSortMode] = React.useState<SortMode>("id-desc");

  React.useEffect(() => {
    if (!open) {
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const { data } = await listTableRows("activity", { limit: 500, sort_by: "ACTIVITY_ID", sort_dir: "desc" });
        if (cancelled) return;
        const mapped = (data.rows as ActivityRow[]).filter((r) => typeof r.ACTIVITY_ID === "number");
        setRows(mapped);
      } catch (e) {
        if (!cancelled) {
          setError(formatApiError(e));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [open]);

  const statuses = React.useMemo(() => {
    const set = new Set<string>();
    for (const row of rows) {
      const st = typeof row.ACT_STATUS === "string" ? row.ACT_STATUS : "";
      if (st) set.add(st);
    }
    return Array.from(set).sort();
  }, [rows]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = rows.filter((row) => {
      const statusOk = statusFilter === "all" || String(row.ACT_STATUS ?? "") === statusFilter;
      if (!statusOk) return false;
      if (!q) return true;
      const idMatch = String(row.ACTIVITY_ID).includes(q);
      const nameMatch = String(row.ACT_NAME ?? "").toLowerCase().includes(q);
      return idMatch || nameMatch;
    });
    list.sort((a, b) => {
      if (sortMode === "id-asc") return a.ACTIVITY_ID - b.ACTIVITY_ID;
      if (sortMode === "id-desc") return b.ACTIVITY_ID - a.ACTIVITY_ID;
      const an = String(a.ACT_NAME ?? "").toLowerCase();
      const bn = String(b.ACT_NAME ?? "").toLowerCase();
      if (sortMode === "name-asc") return an.localeCompare(bn);
      return bn.localeCompare(an);
    });
    return list;
  }, [rows, query, statusFilter, sortMode]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/30 p-4">
      <div className="flex max-h-[90vh] w-full max-w-3xl flex-col overflow-hidden rounded-[var(--radius-lg)] bg-[var(--color-surface-lowest)] shadow-[var(--shadow-ambient)]">
        <div className="shrink-0 space-y-4 border-b border-[color:var(--color-outline-variant)]/25 bg-[var(--color-surface-lowest)] p-5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <h3 className="text-title-md">Select activity</h3>
              <p className="text-body-md text-[var(--color-on-surface-variant)]">Search, filter and choose activity for ACTIVITY_LOG.</p>
            </div>
            <Button variant="ghost" onClick={onClose}>Close</Button>
          </div>

          <div className="grid gap-2 md:grid-cols-3">
            <Input placeholder="Search by ID or name..." value={query} onChange={(e) => setQuery(e.target.value)} />
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
              <option value="all">All status</option>
              {statuses.map((s) => (
                <option key={s} value={s}>{s}</option>
              ))}
            </Select>
            <Select value={sortMode} onChange={(e) => setSortMode(e.target.value as SortMode)}>
              <option value="id-desc">Sort: ID desc</option>
              <option value="id-asc">Sort: ID asc</option>
              <option value="name-asc">Sort: Name A-Z</option>
              <option value="name-desc">Sort: Name Z-A</option>
            </Select>
          </div>

          {error ? <p className="text-body-md text-[var(--color-error)]">{error}</p> : null}
        </div>

        <div className="min-h-0 flex-1 overflow-y-auto p-5 pt-0">
        <div className="mt-4 max-h-[min(50vh,360px)] overflow-auto rounded-[var(--radius-md)] border border-[color:var(--color-outline-variant)]/40">
          {loading ? (
            <div className="p-4 text-body-md">Loading activities...</div>
          ) : filtered.length === 0 ? (
            <div className="p-4 text-body-md">No activities match current filters.</div>
          ) : (
            <>
              <div className="space-y-2 p-2 md:hidden">
                {filtered.map((row) => {
                  const name = String(row.ACT_NAME ?? "") || "—";
                  return (
                    <div
                      key={row.ACTIVITY_ID}
                      className="rounded-[var(--radius-md)] border border-[color:var(--color-outline-variant)]/30 bg-[var(--color-surface-low)]/40 p-3"
                    >
                      <p className="line-clamp-2 break-words text-body-md font-semibold text-[var(--color-on-surface)]">
                        {name}
                      </p>
                      <p className="mt-2 text-label-md text-[var(--color-on-surface-variant)]">ID {row.ACTIVITY_ID}</p>
                      <Button
                        className="mt-3 w-full"
                        size="sm"
                        onClick={() => {
                          onPick(row);
                          onClose();
                        }}
                      >
                        Select
                      </Button>
                    </div>
                  );
                })}
              </div>
              <div className="hidden max-h-full overflow-auto md:block">
                <table className="w-full border-collapse text-left text-body-md">
                  <thead className="bg-[var(--color-surface-low)]">
                    <tr>
                      <th className="px-3 py-2">ID</th>
                      <th className="px-3 py-2">Name</th>
                      <th className="px-3 py-2">Status</th>
                      <th className="px-3 py-2">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((row) => (
                      <tr key={row.ACTIVITY_ID} className="border-t border-[color:var(--color-outline-variant)]/20">
                        <td className="px-3 py-2">{row.ACTIVITY_ID}</td>
                        <td className="px-3 py-2">{String(row.ACT_NAME ?? "") || "—"}</td>
                        <td className="px-3 py-2">{String(row.ACT_STATUS ?? "") || "—"}</td>
                        <td className="px-3 py-2">
                          <Button
                            size="sm"
                            onClick={() => {
                              onPick(row);
                              onClose();
                            }}
                          >
                            Select
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
        </div>
      </div>
    </div>
  );
}
