import axios from "axios";

/** Prefer FastAPI `detail` over generic axios message (e.g. actual MySQL error text). */
export function formatApiError(e: unknown): string {
  if (axios.isAxiosError(e)) {
    const d = e.response?.data;
    if (typeof d === "string") {
      return d;
    }
    if (d && typeof d === "object") {
      const detail = (d as { detail?: unknown }).detail;
      if (typeof detail === "string") {
        return detail;
      }
      if (Array.isArray(detail)) {
        return JSON.stringify(detail);
      }
      if (detail != null) {
        return String(detail);
      }
    }
    return e.message;
  }
  return e instanceof Error ? e.message : String(e);
}
