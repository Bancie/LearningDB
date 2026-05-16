import type { ImportDraftV1 } from "./types";
import { deleteImportWizardDraft, getImportWizardDraft, putImportWizardDraft } from "~/services/api";

/** Load persisted draft for the signed-in user (server). */
export async function loadServerDraft(): Promise<ImportDraftV1 | null> {
  const { data } = await getImportWizardDraft();
  const d = data.data;
  if (!d || d.version !== 1) return null;
  const kitRows = Array.isArray(d.kitRows) && d.kitRows.length ? d.kitRows : [{}];
  const includeReading = typeof d.includeReading === "boolean" ? d.includeReading : false;
  const readingRows =
    Array.isArray(d.readingRows) && d.readingRows.length ? d.readingRows : [{}];
  return {
    ...d,
    kitRows,
    includeReading,
    readingRows,
  };
}

/** Save draft to the server (per user). */
export async function saveServerDraft(draft: ImportDraftV1): Promise<void> {
  await putImportWizardDraft(draft);
}

/** Remove server draft (after discard or successful import). */
export async function clearServerDraft(): Promise<void> {
  await deleteImportWizardDraft();
}
