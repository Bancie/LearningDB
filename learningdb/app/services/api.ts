import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:8000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Types
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

// API Functions

// Table Operations
export const getTables = () => api.get<{ tables: string[] }>('/tables');

export const getTableColumns = (tableName: string) => 
  api.get<{ columns: Column[] }>(`/tables/${tableName}/columns`);

export const insertRecord = (tableName: string, data: Record<string, unknown>) =>
  api.post('/tables/insert', { table_name: tableName, data });

// Activity Operations
export const getActivityIds = (status?: string) =>
  api.get<{ activity_ids: number[] }>('/activities', { params: { status } });

export const getActivityList = (userId: number) =>
  api.get<{ data: ActivityData[] }>(`/activities/list/${userId}`);

export const getActivityView = (userId: number) =>
  api.get<{ data: ActivityData[] }>(`/activities/view/${userId}`);

export const getCurrentActivityLog = (userId: number) =>
  api.get<{ data: ActivityLog[] }>(`/activities/current-log/${userId}`);

export const getCurrentActivityOutput = (userId: number) =>
  api.get<{ data: ActivityOutput[] }>(`/activities/current-output/${userId}`);

// Update Operations
export const updatePrior = (activityId: number, prob: number) =>
  api.post('/update/prior', { activity_id: activityId, prob });

export const updatePosterior = (activityId: number, columnChoice: number, prob: number) =>
  api.post('/update/posterior', { activity_id: activityId, column_choice: columnChoice, prob });

export const updateStatus = (activityId: number, status: string) =>
  api.post('/update/status', { activity_id: activityId, status });

export const updateZero = () => api.post('/update/zero');

// Bayes Operations
export const checkPrior = () =>
  api.get<{ valid: boolean; total: number; message: string }>('/bayes/check-prior');

export const runBayes = (totalMinute?: number) =>
  api.get<{ data: BayesResult[] }>('/bayes/run', { params: { total_minute: totalMinute } });

export default api;
