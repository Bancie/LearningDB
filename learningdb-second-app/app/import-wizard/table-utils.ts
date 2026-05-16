import type { Column } from "~/services/api";
import { getTables } from "~/services/api";

const LOGICAL = {
  log: "ACTIVITY_LOG",
  output: "ACTIVITY_OUTPUT",
  kit: "KIT_COUNT",
  reading: "KIT_READING",
} as const;

export type ResolvedTables = { log: string; output: string; kit: string; reading: string };

export async function resolveImportTables(): Promise<ResolvedTables> {
  const { data } = await getTables();
  const names = data.tables;
  const pick = (logical: string) => {
    const found = names.find((t) => t.toLowerCase() === logical.toLowerCase());
    if (!found) {
      throw new Error(`Table "${logical}" not found in database.`);
    }
    return found;
  };
  return {
    log: pick(LOGICAL.log),
    output: pick(LOGICAL.output),
    kit: pick(LOGICAL.kit),
    reading: pick(LOGICAL.reading),
  };
}

/** Parse MySQL SET('a','b') style literals from reflected type string. */
export function parseSetMembers(typeStr: string): string[] | null {
  if (!typeStr.toUpperCase().includes("SET")) {
    return null;
  }
  const out: string[] = [];
  const re = /'([^']*)'/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(typeStr)) !== null) {
    out.push(m[1]);
  }
  return out.length ? out : null;
}

export function isNumericType(typeStr: string): boolean {
  const u = typeStr.toUpperCase();
  return (
    u.includes("INT") ||
    u.includes("DECIMAL") ||
    u.includes("FLOAT") ||
    u.includes("DOUBLE") ||
    u.includes("BIGINT")
  );
}

export function isBoolTinyint(typeStr: string, colName: string): boolean {
  const u = typeStr.toUpperCase();
  return u.includes("TINYINT") || colName === "AC_ON" || colName === "TARGET_MET";
}

/** True for MySQL `TIME` only — not `DATETIME` / `TIMESTAMP` (those substrings contain "TIME"). */
export function isMysqlTimeOnlyType(typeStr: string): boolean {
  const u = typeStr.toUpperCase();
  if (u.includes("DATETIME") || u.includes("TIMESTAMP") || u.includes("DATE")) {
    return false;
  }
  return /\bTIME\b/.test(u);
}

export function isSqlDatetimeLike(typeStr: string): boolean {
  const u = typeStr.toUpperCase();
  return u.includes("DATETIME") || u.includes("TIMESTAMP");
}

/** `datetime-local` → `YYYY-MM-DD HH:MM:SS`; time-only legacy values → today's date + time (MySQL DATETIME). */
export function normalizeSqlDatetimeString(s: string): string {
  if (s.includes("T")) {
    const [d, t0] = s.split("T");
    let t = (t0 || "").slice(0, 8);
    if (t.length === 5) {
      t = `${t}:00`;
    }
    return `${d} ${t}`.trim();
  }
  if (/^\d{2}:\d{2}(:\d{2})?$/.test(s)) {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const day = String(now.getDate()).padStart(2, "0");
    const tp = s.length === 5 ? `${s}:00` : s;
    return `${y}-${m}-${day} ${tp}`;
  }
  return s;
}

/**
 * True when every column shown in `WizardFields` (except omitted + auto-increment PK) has a non-empty value.
 * Used for ActivityLog, ActivityOutput, and KitCount rows; mirrors field render/omit rules in `WizardFields`.
 */
export function isWizardMetadataComplete(
  columns: Column[],
  values: Record<string, unknown>,
  omit: Set<string>,
): boolean {
  for (const col of columns) {
    if (omit.has(col.name)) {
      continue;
    }
    if (col.is_primary_key && col.autoincrement) {
      continue;
    }
    const raw = values[col.name];
    const upperType = col.type.toUpperCase();

    if (col.enums?.length) {
      if (typeof raw !== "string" || raw === "") {
        return false;
      }
      continue;
    }

    const setMembers = parseSetMembers(col.type);
    if (setMembers) {
      if (Array.isArray(raw)) {
        if (raw.length === 0) {
          return false;
        }
      } else if (typeof raw === "string" && raw.length > 0) {
        /* ok */
      } else {
        return false;
      }
      continue;
    }

    if (isBoolTinyint(col.type, col.name)) {
      if (raw === undefined || raw === null) {
        return false;
      }
      continue;
    }

    if (upperType.includes("DATETIME") || upperType.includes("TIMESTAMP")) {
      if (typeof raw !== "string" || raw.trim() === "") {
        return false;
      }
      continue;
    }

    if (isMysqlTimeOnlyType(col.type)) {
      if (typeof raw !== "string" || raw.trim() === "") {
        return false;
      }
      continue;
    }

    if (/\bDATE\b/.test(upperType) && !isSqlDatetimeLike(col.type)) {
      if (typeof raw !== "string" || raw.trim() === "") {
        return false;
      }
      continue;
    }

    if (isNumericType(col.type)) {
      if (raw === undefined || raw === null || raw === "") {
        return false;
      }
      if (typeof raw === "number" && !Number.isFinite(raw)) {
        return false;
      }
      if (typeof raw === "string" && raw.trim() === "") {
        return false;
      }
      continue;
    }

    if (upperType.includes("TEXT")) {
      if (typeof raw !== "string" || raw.trim() === "") {
        return false;
      }
      continue;
    }

    if (raw === undefined || raw === null) {
      return false;
    }
    if (typeof raw === "string" && raw.trim() === "") {
      return false;
    }
  }
  return true;
}

export function buildInsertPayload(
  columns: Column[],
  values: Record<string, unknown>,
  inject?: Record<string, unknown>,
): Record<string, unknown> {
  const payload: Record<string, unknown> = { ...inject };
  for (const col of columns) {
    if (col.is_primary_key && col.autoincrement) {
      continue;
    }
    if (inject && Object.prototype.hasOwnProperty.call(inject, col.name)) {
      continue;
    }
    const raw = values[col.name];
    if (raw === undefined || raw === "" || (Array.isArray(raw) && raw.length === 0)) {
      if (!col.nullable && !(col.is_primary_key && col.autoincrement)) {
        throw new Error(`Missing required field: ${col.name}`);
      }
      continue;
    }
    if (typeof raw === "string" && col.enums?.length && !col.enums.includes(raw)) {
      throw new Error(`Invalid enum for ${col.name}`);
    }
    if (isNumericType(col.type)) {
      const n = Number(raw);
      if (Number.isNaN(n)) {
        throw new Error(`Invalid number for ${col.name}`);
      }
      payload[col.name] = n;
      continue;
    }
    if (isBoolTinyint(col.type, col.name)) {
      payload[col.name] = raw === true || raw === 1 || raw === "1" ? 1 : 0;
      continue;
    }
    const setOpts = parseSetMembers(col.type);
    if (setOpts && Array.isArray(raw)) {
      payload[col.name] = (raw as string[]).join(",");
      continue;
    }
    if (isSqlDatetimeLike(col.type) && typeof raw === "string" && raw !== "") {
      payload[col.name] = normalizeSqlDatetimeString(raw);
      continue;
    }
    payload[col.name] = raw;
  }
  return payload;
}

export function extractPkInt(
  primaryKey: Record<string, unknown> | undefined,
  candidates: string[],
): number | null {
  if (!primaryKey) {
    return null;
  }
  const entries = Object.entries(primaryKey);
  for (const want of candidates) {
    const w = want.toLowerCase();
    for (const [k, v] of entries) {
      if (k.toLowerCase() !== w) {
        continue;
      }
      if (typeof v === "number" && Number.isFinite(v)) {
        return v;
      }
      if (typeof v === "string" && /^\d+$/.test(v)) {
        return Number(v);
      }
    }
  }
  for (const [, v] of entries) {
    if (typeof v === "number" && Number.isFinite(v)) {
      return v;
    }
  }
  return null;
}
