export type WizardStep = 1 | 2 | 3 | 4;

export interface ImportDraftV1 {
  version: 1;
  step: WizardStep;
  actiLogId: number | null;
  aoId: number | null;
  logValues: Record<string, unknown>;
  outputValues: Record<string, unknown>;
  kitRows: Array<Record<string, unknown>>;
  /** Wizard-only toggle; never written to ACTIVITY_LOG. */
  includeReading: boolean;
  readingRows: Array<Record<string, unknown>>;
}
