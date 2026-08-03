export type WizardStep = 1 | 2 | 3 | 4;

export interface ImportDraftV1 {
  version: 1;
  step: WizardStep;
  actiLogId: number | null;
  aoId: number | null;
  logValues: Record<string, unknown>;
  outputValues: Record<string, unknown>;
  kitRows: Array<Record<string, unknown>>;
  /**
   * Wizard-only work type: logical specialty kit table (e.g. KIT_READING).
   * Null means finish after KIT_COUNT. Never written to ACTIVITY_LOG.
   */
  workType: string | null;
  /** Rows for the selected specialty kit table (step 4). */
  specialtyRows: Array<Record<string, unknown>>;
  /** @deprecated Prefer workType; retained for older drafts. */
  includeReading?: boolean;
  /** @deprecated Prefer specialtyRows; retained for older drafts. */
  readingRows?: Array<Record<string, unknown>>;
}
