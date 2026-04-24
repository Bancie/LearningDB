import axios from "axios";
import { resolveBackendApiBaseUrl } from "./resolveApiBaseUrl";

const API_BASE_URL = resolveBackendApiBaseUrl();

const api = axios.create({
  baseURL: API_BASE_URL,
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

export const insertRecord = (tableName: string, data: Record<string, unknown>) =>
  api.post("/tables/insert", { table_name: tableName, data });

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

export default api;
