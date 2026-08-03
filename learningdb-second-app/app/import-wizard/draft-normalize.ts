import type { ImportDraftV1 } from "./types";

/** Normalize older drafts that used includeReading / readingRows. */
export function normalizeImportDraft(raw: ImportDraftV1): ImportDraftV1 {
  const kitRows = Array.isArray(raw.kitRows) && raw.kitRows.length ? raw.kitRows : [{}];

  let workType: string | null =
    typeof raw.workType === "string" && raw.workType.trim()
      ? raw.workType.trim().toUpperCase()
      : null;
  if (!workType && raw.includeReading === true) {
    workType = "KIT_READING";
  }

  const specialtySource =
    Array.isArray(raw.specialtyRows) && raw.specialtyRows.length
      ? raw.specialtyRows
      : Array.isArray(raw.readingRows) && raw.readingRows.length
        ? raw.readingRows
        : [{}];

  return {
    version: 1,
    step: raw.step,
    actiLogId: raw.actiLogId ?? null,
    aoId: raw.aoId ?? null,
    logValues: raw.logValues ?? {},
    outputValues: raw.outputValues ?? {},
    kitRows,
    workType,
    specialtyRows: specialtySource,
  };
}
