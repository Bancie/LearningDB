import {
  Button,
  FormControl,
  FormHelperText,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from '@mui/material';
import type { Column } from '~/services/api';

export function columnTypeFlags(sqlType: string) {
  const typeLower = sqlType.toLowerCase();
  const isDateTime = typeLower.includes('datetime') || typeLower.includes('timestamp');
  const isDate = typeLower.includes('date') && !isDateTime;
  return { isDateTime, isDate, typeLower };
}

/** Value for `datetime-local` (minute precision). */
export function nowLocalDateTimeString(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  const h = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return `${y}-${m}-${d}T${h}:${min}`;
}

/** Value for `date` input. */
export function todayLocalDateString(): string {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, '0');
  const d = String(today.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Map API/DB cell value to controlled string for form inputs.
 */
export function valueToFormString(column: Column, raw: unknown): string {
  if (raw === null || raw === undefined) return '';
  if (typeof raw === 'object' && !(raw instanceof Date)) {
    return JSON.stringify(raw);
  }

  const { isDateTime, isDate } = columnTypeFlags(column.type);
  const s = raw instanceof Date ? raw.toISOString() : String(raw);

  if (isDateTime) {
    if (s.includes('T')) {
      const datePart = s.split('T')[0];
      const timePart = s.split('T')[1] ?? '';
      const hm = timePart.replace(/Z.*/, '').slice(0, 5);
      if (/^\d{4}-\d{2}-\d{2}$/.test(datePart) && /^\d{2}:\d{2}$/.test(hm)) {
        return `${datePart}T${hm}`;
      }
    }
    const m = s.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}):(\d{2})/);
    if (m) {
      return `${m[1]}T${m[2]}:${m[3]}`;
    }
  }

  if (isDate) {
    const m = s.match(/^(\d{4}-\d{2}-\d{2})/);
    if (m) return m[1];
  }

  return String(raw);
}

/**
 * Convert form field string to API/DB value.
 * - insert: empty -> undefined (omit column)
 * - patch: empty -> null (set NULL)
 */
export function formStringToSubmitValue(
  column: Column,
  raw: string,
  mode: 'insert' | 'patch',
): unknown | undefined {
  const trimmed = raw.trim();
  if (!trimmed) {
    return mode === 'patch' ? null : undefined;
  }

  const { isDateTime, isDate } = columnTypeFlags(column.type);
  const t = column.type.toLowerCase();

  if (isDateTime && trimmed.includes('T')) {
    return trimmed.replace('T', ' ') + ':00';
  }
  if (isDateTime && /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}/.test(trimmed)) {
    return trimmed.endsWith(':00') || trimmed.match(/:\d{2}:\d{2}$/)
      ? trimmed
      : `${trimmed}:00`;
  }

  if (mode === 'patch') {
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
  }

  if (isDate) return trimmed;

  return trimmed;
}

export function buildInsertRecordPayload(
  columns: Column[],
  formData: Record<string, string>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const col of columns) {
    if (col.is_primary_key && col.autoincrement) continue;
    const v = formStringToSubmitValue(col, formData[col.name] ?? '', 'insert');
    if (v !== undefined) out[col.name] = v;
  }
  return out;
}

export type TableColumnFormFieldProps = {
  column: Column;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  size?: 'small' | 'medium';
  isMobile: boolean;
  labelSuffix?: string;
};

export function TableColumnFormField({
  column,
  value,
  onChange,
  disabled = false,
  size = 'medium',
  isMobile,
  labelSuffix = '',
}: TableColumnFormFieldProps) {
  const { isDateTime, isDate } = columnTypeFlags(column.type);
  const hasEnums = column.enums && column.enums.length > 0;
  const label = `${column.name}${labelSuffix}`;

  return (
    <Stack
      direction={isMobile ? 'column' : 'row'}
      spacing={1}
      alignItems={isMobile ? 'stretch' : 'flex-start'}
    >
      {hasEnums ? (
        <FormControl fullWidth size={size}>
          <InputLabel>{label}</InputLabel>
          <Select
            value={value}
            label={label}
            onChange={(e) => onChange(e.target.value)}
            disabled={disabled}
          >
            {column.nullable ? (
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
            ) : null}
            {column.enums!.map((enumVal) => (
              <MenuItem key={enumVal} value={enumVal}>
                {enumVal}
              </MenuItem>
            ))}
          </Select>
          <FormHelperText>{column.type}</FormHelperText>
        </FormControl>
      ) : (
        <TextField
          fullWidth
          size={size}
          label={label}
          type={isDateTime ? 'datetime-local' : isDate ? 'date' : 'text'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          InputLabelProps={isDateTime || isDate ? { shrink: true } : undefined}
          helperText={column.type}
        />
      )}
      {isDateTime && !disabled && (
        <Button
          variant="outlined"
          onClick={() => onChange(nowLocalDateTimeString())}
          sx={{ minWidth: 80, height: size === 'small' ? 40 : 40, width: isMobile ? '100%' : 'auto' }}
        >
          Now
        </Button>
      )}
      {isDate && !isDateTime && !disabled && (
        <Button
          variant="outlined"
          onClick={() => onChange(todayLocalDateString())}
          sx={{ minWidth: 80, height: 40, width: isMobile ? '100%' : 'auto' }}
        >
          Today
        </Button>
      )}
    </Stack>
  );
}
