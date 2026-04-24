/**
 * Browser: FastAPI on same host as the page, port 8000, path prefix /api.
 * SSR / no window: fall back to VITE_API_BASE_URL (build-time default).
 */
export function resolveBackendApiBaseUrl(): string {
  const fallback = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";
  if (typeof window === "undefined") {
    return fallback;
  }
  const { protocol, hostname } = window.location;
  return `${protocol}//${hostname}:8000/api`;
}
