import type { ImportDraftV1 } from "./types";

const KEY = "learningdb-second-import-wizard-draft-v1";

export function loadDraft(): ImportDraftV1 | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    const raw = sessionStorage.getItem(KEY);
    if (!raw) {
      return null;
    }
    const parsed = JSON.parse(raw) as ImportDraftV1;
    if (parsed?.version !== 1) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveDraft(draft: ImportDraftV1): void {
  if (typeof window === "undefined") {
    return;
  }
  sessionStorage.setItem(KEY, JSON.stringify(draft));
}

export function clearDraft(): void {
  if (typeof window === "undefined") {
    return;
  }
  sessionStorage.removeItem(KEY);
}
