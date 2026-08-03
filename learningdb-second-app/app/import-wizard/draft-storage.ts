import type { ImportDraftV1 } from "./types";
import { normalizeImportDraft } from "./draft-normalize";
import { deleteImportWizardDraft, getImportWizardDraft, putImportWizardDraft } from "~/services/api";

export { normalizeImportDraft };

/** Load persisted draft for the signed-in user (server). */
export async function loadServerDraft(): Promise<ImportDraftV1 | null> {
  const { data } = await getImportWizardDraft();
  const d = data.data;
  if (!d || d.version !== 1) return null;
  return normalizeImportDraft(d);
}

/** Save draft to the server (per user). */
export async function saveServerDraft(draft: ImportDraftV1): Promise<void> {
  await putImportWizardDraft(normalizeImportDraft(draft));
}

/** Remove server draft (after discard or successful import). */
export async function clearServerDraft(): Promise<void> {
  await deleteImportWizardDraft();
}
