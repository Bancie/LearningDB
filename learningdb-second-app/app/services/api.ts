import axios from "axios";
import type { ImportDraftV1 } from "~/import-wizard/types";
import { resolveBackendApiBaseUrl } from "./resolveApiBaseUrl";

const API_BASE_URL = resolveBackendApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

export const getHealth = () => api.get<{ status: string }>("/health");

export interface Column {
  name: string;
  type: string;
  nullable: boolean;
  is_primary_key: boolean;
  autoincrement: boolean;
  enums?: string[];
}

export interface ActivityData {
  ACTIVITY_ID: number;
  ACT_NAME: string;
  ACT_STATUS?: string;
  Total?: number;
  Learning?: number;
  Overview?: number;
  Practice?: number;
}

export interface ActivityLog {
  ACTIVITY_ID: number;
  ACTI_LOG_ID: number;
  ACT_NAME: string;
  START_TIME: string;
}

export interface ActivityOutput {
  AO_ID: number;
  ACT_NAME: string;
  START_TIME: string;
  FINISH_TIME: string;
}

export interface BayesResult {
  ACTIVITY_ID: number;
  ACT_NAME: string;
  Total: number;
  Learning: number;
  Overview: number;
  Practice: number;
}

export const getTables = () => api.get<{ tables: string[] }>("/tables");

export const getTableColumns = (tableName: string) =>
  api.get<{ columns: Column[] }>(`/tables/${tableName}/columns`);

export interface InsertRecordResponse {
  success: boolean;
  message: string;
  /** Present when the DB returns keys for the inserted row (e.g. auto-increment PK). */
  primary_key?: Record<string, unknown>;
}

export const insertRecord = (tableName: string, data: Record<string, unknown>) =>
  api.post<InsertRecordResponse>("/tables/insert", {
    /** MySQL `lower_case_table_names=1`: reflect/insert must use lowercase names (matches `GET /tables`). */
    table_name: tableName.trim().toLowerCase(),
    data,
  });

export interface TableRowsResponse {
  rows: Record<string, unknown>[];
  total: number;
}

export interface ListTableRowsParams {
  limit?: number;
  offset?: number;
  sort_by?: string | null;
  sort_dir?: "asc" | "desc";
  filters?: Record<string, unknown>;
}

export const listTableRows = (tableName: string, params: ListTableRowsParams = {}) => {
  const { limit, offset, sort_by, sort_dir, filters } = params;
  return api.get<TableRowsResponse>(`/tables/${encodeURIComponent(tableName)}/rows`, {
    params: {
      limit,
      offset,
      sort_by: sort_by ?? undefined,
      sort_dir: sort_dir ?? undefined,
      filters:
        filters && Object.keys(filters).length > 0 ? JSON.stringify(filters) : undefined,
    },
  });
};

export const updateTableRow = (
  tableName: string,
  primaryKey: Record<string, unknown>,
  updates: Record<string, unknown>,
) =>
  api.patch(`/tables/${encodeURIComponent(tableName)}/rows`, {
    primary_key: primaryKey,
    updates,
  });

export const deleteTableRow = (tableName: string, primaryKey: Record<string, unknown>) =>
  api.delete(`/tables/${encodeURIComponent(tableName)}/rows`, {
    data: { primary_key: primaryKey },
  });

export const getActivityIds = (status?: string) =>
  api.get<{ activity_ids: number[] }>("/activities", { params: { status } });

export const getActivityList = (userId: number) =>
  api.get<{ data: ActivityData[] }>(`/activities/list/${userId}`);

export const getActivityView = (userId: number) =>
  api.get<{ data: ActivityData[] }>(`/activities/view/${userId}`);

export const getCurrentActivityLog = (userId: number) =>
  api.get<{ data: ActivityLog[] }>(`/activities/current-log/${userId}`);

export const getCurrentActivityOutput = (userId: number) =>
  api.get<{ data: ActivityOutput[] }>(`/activities/current-output/${userId}`);

export const updatePrior = (activityId: number, prob: number) =>
  api.post("/update/prior", { activity_id: activityId, prob });

export const updatePosterior = (activityId: number, columnChoice: number, prob: number) =>
  api.post("/update/posterior", { activity_id: activityId, column_choice: columnChoice, prob });

export const updateStatus = (activityId: number, status: string) =>
  api.post("/update/status", { activity_id: activityId, status });

export const updateZero = () => api.post("/update/zero");

export const checkPrior = () =>
  api.get<{ valid: boolean; total: number; message: string }>("/bayes/check-prior");

export const runBayes = (totalMinute?: number) =>
  api.get<{ data: BayesResult[] }>("/bayes/run", { params: { total_minute: totalMinute } });

export interface UserProfile {
  user_id: number;
  user_location: string;
}

export const getUserProfile = (userId: number) =>
  api.get<{ data: UserProfile }>(`/users/${userId}/profile`);

export interface AuthUser {
  user_id: number;
  username: string;
  email: string;
  user_location: string;
}

export interface AuthRegisterRequest {
  username: string;
  email: string;
  password: string;
  fullname?: string;
  birth?: string;
  gender?: "male" | "female" | "other";
  major?: string;
  user_location?: string;
}

export interface AuthLoginRequest {
  login: string;
  password: string;
}

export interface AuthAccount {
  user_id: number;
  username: string;
  email: string;
  fullname: string;
  birth: string;
  gender: "male" | "female" | "other";
  major: string;
  user_location: string;
}

export interface AuthAccountUpdateRequest {
  username: string;
  email: string;
  fullname: string;
  birth: string;
  gender: "male" | "female" | "other";
  major: string;
  user_location: string;
}

export interface AuthPasswordChangeRequest {
  current_password: string;
  new_password: string;
}

export interface LoggingHistorySummaryItem {
  acti_log_id: number;
  activity_id: number | null;
  activity_name: string | null;
  start_time: string | null;
  ao_id: number | null;
  finish_time: string | null;
  kit_summary: string;
  total_count: number;
  logged_at: string | null;
  duration_minutes: number | null;
}

export interface LoggingHistoryDetail {
  summary: LoggingHistorySummaryItem;
  activity_log: Record<string, unknown>;
  activity_output: Record<string, unknown> | null;
  kit_rows: Array<Record<string, unknown>>;
}

export interface LoggingHistoryUpdateRequest {
  activity_log_updates: Record<string, unknown>;
  activity_output_updates: Record<string, unknown>;
  kit_rows: Array<Record<string, unknown>>;
}

export const registerAuth = (payload: AuthRegisterRequest) =>
  api.post<{ data: AuthUser }>("/auth/register", payload);

export const loginAuth = (payload: AuthLoginRequest) =>
  api.post<{ data: AuthUser }>("/auth/login", payload);

export const logoutAuth = () => api.post<{ success: boolean }>("/auth/logout");

export const getAuthMe = () => api.get<{ data: AuthUser }>("/auth/me");

export const getAuthAccount = () => api.get<{ data: AuthAccount }>("/auth/account");

export const updateAuthAccount = (payload: AuthAccountUpdateRequest) =>
  api.put<{ data: AuthAccount }>("/auth/account", payload);

export const updateAuthPassword = (payload: AuthPasswordChangeRequest) =>
  api.put<{ success: boolean }>("/auth/account/password", payload);

export const getLoggingHistory = () =>
  api.get<{ data: LoggingHistorySummaryItem[] }>("/history/logging");

export const getLoggingHistoryDetail = (actiLogId: number) =>
  api.get<{ data: LoggingHistoryDetail }>(`/history/logging/${actiLogId}`);

export const updateLoggingHistoryDetail = (actiLogId: number, payload: LoggingHistoryUpdateRequest) =>
  api.put<{ data: LoggingHistoryDetail }>(`/history/logging/${actiLogId}`, payload);

export const deleteLoggingHistory = (actiLogId: number) =>
  api.delete<{ data: { success: boolean } }>(`/history/logging/${actiLogId}`);

export const getImportWizardDraft = () =>
  api.get<{ data: ImportDraftV1 | null }>("/import-wizard/draft");

export const putImportWizardDraft = (payload: ImportDraftV1) =>
  api.put<{ data: ImportDraftV1 }>("/import-wizard/draft", payload);

export const deleteImportWizardDraft = () => api.delete<{ success: boolean }>("/import-wizard/draft");

export default api;
