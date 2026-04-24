# TypeScript shapes — `learningdb-second-app`

**Source of truth in repo:** `learningdb-second-app/app/services/api.ts`  
**Base URL resolver:** `learningdb-second-app/app/services/resolveApiBaseUrl.ts`

Exported interfaces (align generated UI types and form field names with these):

```ts
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

export interface UserProfile {
  user_id: number;
  user_location: string;
}
```

Axios `baseURL` = `resolveBackendApiBaseUrl()` (browser: same host, port **8000**, path `/api`).
