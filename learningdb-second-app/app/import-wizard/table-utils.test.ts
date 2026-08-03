import { describe, expect, test } from "bun:test";

import {
  formatKitWorkTypeLabel,
  isSpecialtyKitTableName,
  listSpecialtyKitOptions,
  resolveSpecialtyTable,
  type ResolvedTables,
} from "./table-utils";
import { normalizeImportDraft } from "./draft-normalize";
import type { ImportDraftV1 } from "./types";

describe("formatKitWorkTypeLabel", () => {
  test("formats reading and IELTS kit names", () => {
    expect(formatKitWorkTypeLabel("KIT_READING")).toBe("Reading");
    expect(formatKitWorkTypeLabel("KIT_IELTS_LISTENING")).toBe("IELTS Listening");
    expect(formatKitWorkTypeLabel("KIT_IELTS_WRITING_TASK1")).toBe("IELTS Writing Task 1");
    expect(formatKitWorkTypeLabel("KIT_HOUSEWORK")).toBe("Housework");
  });
});

describe("listSpecialtyKitOptions", () => {
  test("excludes KIT_COUNT and non-kit tables", () => {
    const options = listSpecialtyKitOptions([
      "activity_log",
      "kit_count",
      "kit_reading",
      "kit_ielts_listening",
      "kit_writing",
    ]);
    expect(options.map((o) => o.logical)).toEqual([
      "KIT_IELTS_LISTENING",
      "KIT_READING",
      "KIT_WRITING",
    ]);
    expect(options.every((o) => isSpecialtyKitTableName(o.physical))).toBe(true);
  });
});

describe("resolveSpecialtyTable", () => {
  const tables: ResolvedTables = {
    log: "activity_log",
    output: "activity_output",
    kit: "kit_count",
    specialtyKits: listSpecialtyKitOptions(["kit_reading", "kit_exercises"]),
  };

  test("resolves selected work type and ignores missing", () => {
    expect(resolveSpecialtyTable(tables, "KIT_READING")?.physical).toBe("kit_reading");
    expect(resolveSpecialtyTable(tables, "kit_exercises")?.logical).toBe("KIT_EXERCISES");
    expect(resolveSpecialtyTable(tables, null)).toBeNull();
    expect(resolveSpecialtyTable(tables, "KIT_HOUSEWORK")).toBeNull();
  });
});

describe("normalizeImportDraft", () => {
  test("migrates includeReading drafts to workType KIT_READING", () => {
    const legacy = {
      version: 1 as const,
      step: 2 as const,
      actiLogId: 1,
      aoId: null,
      logValues: {},
      outputValues: {},
      kitRows: [{}],
      workType: null,
      specialtyRows: [],
      includeReading: true,
      readingRows: [{ TRANSLATION: "none" }],
    } satisfies ImportDraftV1;

    const normalized = normalizeImportDraft(legacy);
    expect(normalized.workType).toBe("KIT_READING");
    expect(normalized.specialtyRows).toEqual([{ TRANSLATION: "none" }]);
  });
});
