import * as React from "react";

import { Alert } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { getLoggingHistory, type LoggingHistorySummaryItem } from "~/services/api";
import { formatApiError } from "~/utils/formatApiError";
import { useHistoryRefresh } from "./history-refresh-context";
import { HistoryDetailDialog } from "./HistoryDetailDialog";

type Props = {
  open: boolean;
  onClose: () => void;
};

function parseTs(value: string | null): Date | null {
  if (!value) return null;
  const normalized = value.includes("T") ? value : value.replace(" ", "T");
  const dt = new Date(normalized);
  return Number.isNaN(dt.getTime()) ? null : dt;
}

function relativeTime(value: string | null): string {
  const dt = parseTs(value);
  if (!dt) return "-";
  const diffMs = Date.now() - dt.getTime();
  const mins = Math.max(0, Math.floor(diffMs / 60000));
  if (mins < 1) return "just now";
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

function formatDurationMins(value: number | null): string {
  if (value == null || value < 0) return "-";
  const hours = Math.floor(value / 60);
  const mins = value % 60;
  if (hours <= 0) return `${mins}m`;
  return `${hours}h ${mins}m`;
}

function activityColor(activityId: number | null): string {
  const palette = [
    "#0a84ff",
    "#34c759",
    "#ff9f0a",
    "#af52de",
    "#ff375f",
    "#64d2ff",
    "#ffd60a",
    "#30d158",
    "#5e5ce6",
    "#bf5af2",
  ];
  const seed = activityId ?? 0;
  return palette[Math.abs(seed) % palette.length];
}

export function HistorySidebar({ open, onClose }: Props) {
  const { version: historyRefreshVersion } = useHistoryRefresh();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [items, setItems] = React.useState<LoggingHistorySummaryItem[]>([]);
  const [selectedActiLogId, setSelectedActiLogId] = React.useState<number | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data } = await getLoggingHistory();
      setItems(data.data);
    } catch (e) {
      setError(formatApiError(e));
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    if (!open) return;
    void load();
  }, [open, load, historyRefreshVersion]);

  return (
    <>
      <aside
        className={[
          "fixed right-0 top-16 z-[100] h-[calc(100vh-4rem)] transform bg-[var(--color-surface-lowest)] transition-transform duration-200",
          "w-full max-w-none border-0 lg:h-[calc(100vh-4rem)] lg:w-[360px] lg:max-w-[90vw] lg:border-l lg:border-[color:var(--color-outline-variant)]/30",
          open ? "translate-x-0" : "translate-x-full",
        ].join(" ")}
      >
        <div className="flex h-full flex-col">
          <header className="flex items-center justify-between border-b border-[color:var(--color-outline-variant)]/25 px-4 py-3">
            <div>
              <h3 className="text-title-md">Logging history</h3>
              <p className="text-label-md text-[var(--color-on-surface-variant)]">Recent logging sessions</p>
            </div>
            <Button variant="ghost" size="sm" onClick={onClose}>Close</Button>
          </header>
          <div className="flex-1 overflow-y-auto p-3">
            {loading ? <p className="text-body-md">Loading history…</p> : null}
            {error ? <Alert variant="error">{error}</Alert> : null}
            {!loading && !error && items.length === 0 ? (
              <p className="text-body-md text-[var(--color-on-surface-variant)]">No history yet.</p>
            ) : null}
            <div className="space-y-4">
              {items.map((item, idx) => (
                <button
                  key={item.acti_log_id}
                  type="button"
                  className="relative w-full rounded-[var(--radius-md)] p-3 pl-8 text-left hover:bg-[var(--color-surface-low)]"
                  onClick={() => setSelectedActiLogId(item.acti_log_id)}
                >
                  {idx < items.length - 1 ? (
                    <span className="absolute left-[15px] top-7 bottom-[-20px] w-[2px] bg-[color:var(--color-outline-variant)]/20" />
                  ) : null}
                  <span
                    className="absolute left-3 top-5 h-3 w-3 rounded-full"
                    style={{ backgroundColor: activityColor(item.activity_id) }}
                  />
                  <p className="text-body-md font-semibold">{item.activity_name || `Activity #${item.activity_id ?? "-"}`}</p>
                  <p className="text-label-md text-[var(--color-on-surface-variant)]">{formatDurationMins(item.duration_minutes)}</p>
                  <p className="text-label-md text-[var(--color-primary)]">{item.kit_summary || "-"}</p>
                  <p className="text-label-md text-[var(--color-on-surface-variant)]">{relativeTime(item.logged_at)}</p>
                </button>
              ))}
            </div>
          </div>
        </div>
      </aside>
      <HistoryDetailDialog
        actiLogId={selectedActiLogId}
        open={selectedActiLogId != null}
        onClose={() => setSelectedActiLogId(null)}
        onChanged={() => void load()}
      />
    </>
  );
}

