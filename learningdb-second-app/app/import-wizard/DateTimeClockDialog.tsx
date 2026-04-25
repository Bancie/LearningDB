import * as React from "react";

import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";

type Mode = "datetime" | "time";

function nowLocalDatetime(): string {
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${y}-${m}-${day}T${hh}:${mm}`;
}

function nowLocalTime(): string {
  const d = new Date();
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

function handAnglesFromDatetime(s: string): { hourDeg: number; minDeg: number } {
  if (!s) return { hourDeg: 0, minDeg: 0 };
  const t = s.includes("T") ? s.split("T")[1] || "" : s;
  const [hh, mm] = t.split(":").map((v) => Number(v));
  const h = Number.isFinite(hh) ? hh! : 0;
  const m = Number.isFinite(mm) ? mm! : 0;
  return { hourDeg: 30 * (h % 12) + 0.5 * m, minDeg: 6 * m };
}

function handAnglesFromTime(s: string): { hourDeg: number; minDeg: number } {
  if (!s) return { hourDeg: 0, minDeg: 0 };
  const [a, b] = s.split(":").map((v) => Number(v));
  const h = Number.isFinite(a) ? a! : 0;
  const m = Number.isFinite(b) ? b! : 0;
  return { hourDeg: 30 * (h % 12) + 0.5 * m, minDeg: 6 * m };
}

function formatDatetimeButtonLabel(s: string): string {
  if (!s) return "Select date and time";
  if (!s.includes("T")) return s;
  const d = new Date(s);
  if (Number.isNaN(d.getTime())) return s;
  return d.toLocaleString(undefined, {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatTimeButtonLabel(s: string): string {
  if (!s) return "Select time";
  const m = s.match(/^(\d{1,2}):(\d{2})/);
  if (m) return `${m[1].padStart(2, "0")}:${m[2]}`;
  return s;
}

function ClockFace({ hourDeg, minDeg }: { hourDeg: number; minDeg: number }) {
  return (
    <div className="mx-auto w-[200px] max-w-full text-[var(--color-on-surface)]">
      <svg viewBox="0 0 200 200" className="h-[200px] w-full" aria-hidden>
        <circle cx="100" cy="100" r="92" fill="var(--color-surface-container)" stroke="var(--color-outline-variant)" strokeWidth="1.5" opacity="0.6" />
        {Array.from({ length: 12 }, (_, i) => {
          const a = (i / 12) * Math.PI * 2 - Math.PI / 2;
          const x1 = 100 + 78 * Math.cos(a);
          const y1 = 100 + 78 * Math.sin(a);
          const x2 = 100 + 88 * Math.cos(a);
          const y2 = 100 + 88 * Math.sin(a);
          return <line key={i} x1={x1} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth="2" opacity="0.5" />;
        })}
        <g transform="translate(100 100)">
          <g transform={`rotate(${hourDeg})`}>
            <line x1="0" y1="0" x2="0" y2="-40" stroke="var(--color-primary)" strokeWidth="4" strokeLinecap="round" />
          </g>
          <g transform={`rotate(${minDeg})`}>
            <line x1="0" y1="0" x2="0" y2="-58" stroke="var(--color-on-surface-variant)" strokeWidth="2.5" strokeLinecap="round" />
          </g>
        </g>
        <circle cx="100" cy="100" r="5" fill="var(--color-primary)" />
      </svg>
    </div>
  );
}

type DialogProps = {
  open: boolean;
  mode: Mode;
  value: string;
  onClose: () => void;
  onApply: (value: string) => void;
};

export function DateTimeClockDialog({ open, mode, value, onClose, onApply }: DialogProps) {
  const [draft, setDraft] = React.useState(value);

  React.useEffect(() => {
    if (open) setDraft(value);
  }, [open, value]);

  if (!open) return null;

  const { hourDeg, minDeg } =
    mode === "datetime" ? handAnglesFromDatetime(draft) : handAnglesFromTime(draft);

  const setNow = () => {
    setDraft(mode === "datetime" ? nowLocalDatetime() : nowLocalTime());
  };

  return (
    <div className="fixed inset-0 z-[210] flex items-center justify-center bg-black/35 p-4" role="dialog" aria-modal>
      <div className="w-full max-w-md rounded-[var(--radius-lg)] border border-[color:var(--color-outline-variant)]/40 bg-[var(--color-surface-lowest)] p-5 shadow-[var(--shadow-ambient)]">
        <h3 className="text-title-md">{mode === "datetime" ? "Select date and time" : "Select time"}</h3>
        <p className="mt-1 text-body-md text-[var(--color-on-surface-variant)]">
          {mode === "datetime"
            ? "Date and time are shown in your browser's time zone."
            : "Time is shown in 24-hour format."}
        </p>
        <div className="mt-4">
          <ClockFace hourDeg={hourDeg} minDeg={minDeg} />
        </div>
        {mode === "datetime" ? (
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-2">
            <Input
              type="datetime-local"
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              className="!w-0 min-w-0 flex-1 max-w-full"
            />
            <Button type="button" variant="secondary" onClick={setNow} className="h-10 shrink-0 sm:w-[4.5rem]">
              Now
            </Button>
          </div>
        ) : (
          <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-stretch sm:gap-2">
            <Input
              type="time"
              value={draft ? draft.slice(0, 5) : ""}
              onChange={(e) => setDraft(e.target.value)}
              className="!w-0 min-w-0 flex-1 max-w-full"
              step={60}
            />
            <Button type="button" variant="secondary" onClick={setNow} className="h-10 shrink-0 sm:w-[4.5rem]">
              Now
            </Button>
          </div>
        )}
        <div className="mt-6 flex flex-col gap-2 sm:flex-row sm:justify-end">
          <Button type="button" variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button
            type="button"
            onClick={() => {
              onApply(draft);
              onClose();
            }}
          >
            Apply
          </Button>
        </div>
      </div>
    </div>
  );
}

type PickerFieldProps = {
  mode: Mode;
  value: string;
  onChange: (v: string) => void;
};

/** Button + clock dialog; pair with `FieldShell` in WizardFields. */
export function DateTimePickerField({ mode, value, onChange }: PickerFieldProps) {
  const [open, setOpen] = React.useState(false);
  const display = mode === "datetime" ? formatDatetimeButtonLabel(value) : formatTimeButtonLabel(value);
  return (
    <>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <Button
          type="button"
          variant="secondary"
          className="min-h-10 w-full min-w-0 max-w-full justify-start sm:flex-1"
          onClick={() => setOpen(true)}
        >
          {display}
        </Button>
      </div>
      <DateTimeClockDialog
        open={open}
        mode={mode}
        value={value}
        onClose={() => setOpen(false)}
        onApply={onChange}
      />
    </>
  );
}
