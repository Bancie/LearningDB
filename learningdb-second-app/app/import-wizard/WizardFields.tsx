import {
  Autocomplete,
  Checkbox,
  FormControl,
  FormControlLabel,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import type { Column } from "~/services/api";
import { isBoolTinyint, isMysqlTimeOnlyType, isNumericType, parseSetMembers } from "./table-utils";

type Props = {
  columns: Column[];
  values: Record<string, unknown>;
  onChange: (name: string, value: unknown) => void;
  omit: Set<string>;
};

export function WizardFields({ columns, values, onChange, omit }: Props) {
  return (
    <Stack spacing={2.5}>
      {columns.map((col) => {
        if (omit.has(col.name)) {
          return null;
        }
        if (col.is_primary_key && col.autoincrement) {
          return null;
        }
        const v = values[col.name];
        const label = col.name.replace(/_/g, " ");

        if (col.enums?.length) {
          return (
            <FormControl key={col.name} fullWidth size="small" required={!col.nullable}>
              <InputLabel id={`${col.name}-lbl`}>{label}</InputLabel>
              <Select
                labelId={`${col.name}-lbl`}
                label={label}
                value={typeof v === "string" || typeof v === "number" ? v : ""}
                onChange={(e) => onChange(col.name, e.target.value)}
              >
                {col.nullable ? (
                  <MenuItem value="">
                    <em>None</em>
                  </MenuItem>
                ) : null}
                {col.enums.map((opt) => (
                  <MenuItem key={opt} value={opt}>
                    {opt}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          );
        }

        const setMembers = parseSetMembers(col.type);
        if (setMembers) {
          const selected = Array.isArray(v) ? (v as string[]) : typeof v === "string" && v ? v.split(",") : [];
          return (
            <Autocomplete
              key={col.name}
              multiple
              options={setMembers}
              value={selected}
              onChange={(_, newVal) => onChange(col.name, newVal)}
              renderInput={(params) => (
                <TextField {...params} label={label} helperText="MySQL SET — pick one or more" size="small" />
              )}
            />
          );
        }

        if (isBoolTinyint(col.type, col.name)) {
          return (
            <FormControlLabel
              key={col.name}
              control={
                <Checkbox
                  checked={v === true || v === 1 || v === "1"}
                  onChange={(e) => onChange(col.name, e.target.checked ? 1 : 0)}
                />
              }
              label={label}
            />
          );
        }

        const colUpper = col.type.toUpperCase();
        if (colUpper.includes("DATETIME") || colUpper.includes("TIMESTAMP")) {
          return (
            <TextField
              key={col.name}
              label={label}
              type="datetime-local"
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={typeof v === "string" ? v : ""}
              onChange={(e) => onChange(col.name, e.target.value)}
              required={!col.nullable}
            />
          );
        }

        if (isMysqlTimeOnlyType(col.type)) {
          return (
            <TextField
              key={col.name}
              label={label}
              type="time"
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={typeof v === "string" ? v : ""}
              onChange={(e) => onChange(col.name, e.target.value)}
              required={!col.nullable}
            />
          );
        }

        if (col.type.toUpperCase().includes("DATE") && !col.type.toUpperCase().includes("DATETIME")) {
          return (
            <TextField
              key={col.name}
              label={label}
              type="date"
              size="small"
              fullWidth
              InputLabelProps={{ shrink: true }}
              value={typeof v === "string" ? v : ""}
              onChange={(e) => onChange(col.name, e.target.value)}
              required={!col.nullable}
            />
          );
        }

        if (isNumericType(col.type)) {
          return (
            <TextField
              key={col.name}
              label={label}
              type="number"
              size="small"
              fullWidth
              value={v === undefined || v === null ? "" : v}
              onChange={(e) => onChange(col.name, e.target.value === "" ? "" : Number(e.target.value))}
              required={!col.nullable}
              inputProps={{ step: col.type.includes("DECIMAL") || col.type.includes("FLOAT") ? "0.01" : "1" }}
            />
          );
        }

        return (
          <TextField
            key={col.name}
            label={label}
            size="small"
            fullWidth
            multiline={col.type.toUpperCase().includes("TEXT")}
            minRows={col.type.toUpperCase().includes("TEXT") ? 3 : 1}
            value={typeof v === "string" || typeof v === "number" ? v : ""}
            onChange={(e) => onChange(col.name, e.target.value)}
            required={!col.nullable}
            helperText={col.type}
          />
        );
      })}
      {columns.length === 0 ? <Typography color="text.secondary">Loading columns…</Typography> : null}
    </Stack>
  );
}
