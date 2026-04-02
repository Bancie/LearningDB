/**
 * Browser: API and orchestrator run on the same host as the page (typical Docker compose).
 * - Laptop: http://localhost:3000 → calls http://localhost:8000 and :8100 (avoids LAN hairpin).
 * - Phone: http://192.168.x.x:3000 → calls the same host on :8000 / :8100 (no per-device VITE rebuild).
 * SSR / no window: fall back to VITE_* (build-time defaults).
 */
export function resolveOrchestratorBaseUrl(): string {
  const fallback = import.meta.env.VITE_ORCH_API_BASE_URL ?? "http://localhost:8100";
  if (typeof window === "undefined") {
    return fallback;
  }
  const { protocol, hostname } = window.location;
  return `${protocol}//${hostname}:8100`;
}

export function resolveBackendApiBaseUrl(): string {
  const fallback = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";
  if (typeof window === "undefined") {
    return fallback;
  }
  const { protocol, hostname } = window.location;
  return `${protocol}//${hostname}:8000/api`;
}
