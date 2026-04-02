/**
 * When the app is opened at http://localhost:* or http://127.0.0.1:*, use loopback
 * for API/Orchestrator so browser requests succeed (avoids LAN-IP hairpin to self).
 * When opened at a LAN IP (e.g. phone), keep VITE_* build-time URLs.
 */
export function resolveOrchestratorBaseUrl(): string {
  const env = import.meta.env.VITE_ORCH_API_BASE_URL ?? "http://localhost:8100";
  if (typeof window === "undefined") {
    return env;
  }
  const h = window.location.hostname;
  if (h === "localhost" || h === "127.0.0.1") {
    return `http://${h}:8100`;
  }
  return env;
}

export function resolveBackendApiBaseUrl(): string {
  const env = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000/api";
  if (typeof window === "undefined") {
    return env;
  }
  const h = window.location.hostname;
  if (h === "localhost" || h === "127.0.0.1") {
    return `http://${h}:8000/api`;
  }
  return env;
}
