import * as React from "react";

import type { Column } from "~/services/api";
import { getTableColumns } from "~/services/api";
import { formatApiError } from "~/utils/formatApiError";
import { resolveImportTables, type ResolvedTables } from "./table-utils";

type Options = {
  /** When false, KIT_READING columns are not fetched (history edit does not need them). */
  includeReading?: boolean;
};

type ImportSchemaState = {
  tables: ResolvedTables | null;
  colsLog: Column[];
  colsOut: Column[];
  colsKit: Column[];
  colsReading: Column[];
  loading: boolean;
  error: string | null;
};

const emptyState: ImportSchemaState = {
  tables: null,
  colsLog: [],
  colsOut: [],
  colsKit: [],
  colsReading: [],
  loading: false,
  error: null,
};

/**
 * Loads resolved table names and column metadata for the import wizard domain.
 * Centralizes schema bootstrap that was duplicated in import-wizard route and history detail.
 */
export function useImportSchema(
  enabled: boolean,
  { includeReading = true }: Options = {},
): ImportSchemaState {
  const [state, setState] = React.useState<ImportSchemaState>(emptyState);

  React.useEffect(() => {
    if (!enabled) {
      setState(emptyState);
      return;
    }

    let cancelled = false;
    setState((prev) => ({ ...prev, loading: true, error: null }));

    (async () => {
      try {
        const tables = await resolveImportTables();
        if (cancelled) return;

        const columnRequests = [
          getTableColumns(tables.log),
          getTableColumns(tables.output),
          getTableColumns(tables.kit),
          ...(includeReading ? [getTableColumns(tables.reading)] : []),
        ];
        const responses = await Promise.all(columnRequests);
        if (cancelled) return;

        const [log, out, kit, reading] = responses;
        setState({
          tables,
          colsLog: log.data.columns,
          colsOut: out.data.columns,
          colsKit: kit.data.columns,
          colsReading: includeReading && reading ? reading.data.columns : [],
          loading: false,
          error: null,
        });
      } catch (e) {
        if (!cancelled) {
          setState({
            ...emptyState,
            loading: false,
            error: formatApiError(e) || "Failed to load schema",
          });
        }
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [enabled, includeReading]);

  return state;
}
