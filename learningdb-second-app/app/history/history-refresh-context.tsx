import * as React from "react";

type Ctx = {
  version: number;
  bump: () => void;
};

const HistoryRefreshContext = React.createContext<Ctx | null>(null);

export function HistoryRefreshProvider({ children }: { children: React.ReactNode }) {
  const [version, setVersion] = React.useState(0);
  const bump = React.useCallback(() => {
    setVersion((v) => v + 1);
  }, []);
  const value = React.useMemo(() => ({ version, bump }), [version, bump]);
  return <HistoryRefreshContext.Provider value={value}>{children}</HistoryRefreshContext.Provider>;
}

export function useHistoryRefresh() {
  const ctx = React.useContext(HistoryRefreshContext);
  if (!ctx) {
    throw new Error("useHistoryRefresh must be used within HistoryRefreshProvider");
  }
  return ctx;
}
