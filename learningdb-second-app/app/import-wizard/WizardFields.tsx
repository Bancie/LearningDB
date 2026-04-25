import { Button } from "~/components/ui/button";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Select } from "~/components/ui/select";
import { Textarea } from "~/components/ui/textarea";
import type { Column } from "~/services/api";
import { isBoolTinyint, isMysqlTimeOnlyType, isNumericType, parseSetMembers } from "./table-utils";

type Props = {
  columns: Column[];
  values: Record<string, unknown>;
  onChange: (name: string, value: unknown) => void;
  omit: Set<string>;
  gridClassName?: string;
};

function FieldShell({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="w-full space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  );
}

export function WizardFields({ columns, values, onChange, omit, gridClassName }: Props) {
  const renderField = (col: Column) => {
    if (omit.has(col.name)) {
      return null;
    }
    if (col.is_primary_key && col.autoincrement) {
      return null;
    }

    const value = values[col.name];
    const label = col.name.replace(/_/g, " ");
    const required = !col.nullable;
    const upperType = col.type.toUpperCase();

    if (col.enums?.length) {
      return (
        <FieldShell label={label}>
          <Select
            value={typeof value === "string" || typeof value === "number" ? String(value) : ""}
            onChange={(e) => onChange(col.name, e.target.value)}
            required={required}
          >
            <option value="">{required ? "Select..." : "None"}</option>
            {col.enums.map((opt) => (
              <option key={opt} value={opt}>
                {opt}
              </option>
            ))}
          </Select>
        </FieldShell>
      );
    }

    const setMembers = parseSetMembers(col.type);
    if (setMembers) {
      const selected = Array.isArray(value) ? (value as string[]) : typeof value === "string" && value ? value.split(",") : [];
      return (
        <FieldShell label={label}>
          <div className="flex flex-wrap gap-2 rounded-[var(--radius-md)] bg-[var(--color-surface-low)] p-2">
            {setMembers.map((member) => {
              const active = selected.includes(member);
              return (
                <Button
                  key={member}
                  type="button"
                  size="sm"
                  variant={active ? "default" : "ghost"}
                  onClick={() => {
                    const next = active ? selected.filter((v) => v !== member) : [...selected, member];
                    onChange(col.name, next);
                  }}
                >
                  {member}
                </Button>
              );
            })}
          </div>
        </FieldShell>
      );
    }

    if (isBoolTinyint(col.type, col.name)) {
      const checked = value === true || value === 1 || value === "1";
      return (
        <FieldShell label={label}>
          <div className="inline-flex w-full overflow-hidden rounded-[var(--radius-md)] border border-[color:var(--color-outline-variant)]/30">
            <button
              type="button"
              className={[
                "h-10 flex-1 px-4 text-label-md",
                checked ? "bg-[var(--color-primary)] text-white" : "bg-[var(--color-surface-low)] text-[var(--color-on-surface-variant)]",
              ].join(" ")}
              onClick={() => onChange(col.name, 1)}
            >
              Yes
            </button>
            <button
              type="button"
              className={[
                "h-10 flex-1 px-4 text-label-md",
                !checked ? "bg-[var(--color-primary)] text-white" : "bg-[var(--color-surface-low)] text-[var(--color-on-surface-variant)]",
              ].join(" ")}
              onClick={() => onChange(col.name, 0)}
            >
              No
            </button>
          </div>
        </FieldShell>
      );
    }

    if (upperType.includes("DATETIME") || upperType.includes("TIMESTAMP")) {
      const current = typeof value === "string" ? value : "";
      const nowLocal = () => {
        const d = new Date();
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, "0");
        const day = String(d.getDate()).padStart(2, "0");
        const hh = String(d.getHours()).padStart(2, "0");
        const mm = String(d.getMinutes()).padStart(2, "0");
        return `${y}-${m}-${day}T${hh}:${mm}`;
      };
      return (
        <FieldShell label={label}>
          <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
            <Input
              type="datetime-local"
              className="min-w-0 flex-1"
              value={current}
              onChange={(e) => onChange(col.name, e.target.value)}
              required={required}
            />
            <Button
              type="button"
              variant="secondary"
              size="sm"
              className="w-full shrink-0 sm:w-auto"
              onClick={() => onChange(col.name, nowLocal())}
            >
              Now
            </Button>
          </div>
        </FieldShell>
      );
    }

    if (isMysqlTimeOnlyType(col.type)) {
      return (
        <FieldShell label={label}>
          <Input
            type="time"
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(col.name, e.target.value)}
            required={required}
          />
        </FieldShell>
      );
    }

    if (upperType.includes("DATE")) {
      return (
        <FieldShell label={label}>
          <Input
            type="date"
            value={typeof value === "string" ? value : ""}
            onChange={(e) => onChange(col.name, e.target.value)}
            required={required}
          />
        </FieldShell>
      );
    }

    if (isNumericType(col.type)) {
      return (
        <FieldShell label={label}>
          <Input
            type="number"
            value={value === undefined || value === null ? "" : String(value)}
            onChange={(e) => onChange(col.name, e.target.value === "" ? "" : Number(e.target.value))}
            required={required}
            step={upperType.includes("DECIMAL") || upperType.includes("FLOAT") ? "0.01" : "1"}
          />
        </FieldShell>
      );
    }

    if (upperType.includes("TEXT")) {
      return (
        <FieldShell label={label}>
          <Textarea
            value={typeof value === "string" || typeof value === "number" ? String(value) : ""}
            onChange={(e) => onChange(col.name, e.target.value)}
            required={required}
          />
        </FieldShell>
      );
    }

    return (
      <FieldShell label={label}>
        <Input
          value={typeof value === "string" || typeof value === "number" ? String(value) : ""}
          onChange={(e) => onChange(col.name, e.target.value)}
          required={required}
        />
      </FieldShell>
    );
  };

  const renderedFields = columns
    .map((col) => ({ name: col.name, node: renderField(col) }))
    .filter((item) => item.node !== null);

  return (
    <div className={gridClassName ?? "grid grid-cols-1 gap-5 md:grid-cols-2"}>
      {renderedFields.map((item) => (
        <div key={item.name}>{item.node}</div>
      ))}
      {columns.length === 0 ? <p className="text-body-md text-[var(--color-on-surface-variant)]">Loading columns…</p> : null}
    </div>
  );
}
