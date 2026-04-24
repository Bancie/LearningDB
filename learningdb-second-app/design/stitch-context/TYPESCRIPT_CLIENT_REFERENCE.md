# TypeScript shapes (mirror of runtime client)

**Source of truth:** [`app/services/api.ts`](../../app/services/api.ts) — when in doubt, match that file after edits.

Below is a copy of the **exported interfaces** as of this bundle (for agents that do not read the repo).

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

Axios instance uses `resolveBackendApiBaseUrl()` from [`app/services/resolveApiBaseUrl.ts`](../../app/services/resolveApiBaseUrl.ts) as `baseURL`.
