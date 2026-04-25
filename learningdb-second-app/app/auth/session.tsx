import * as React from "react";

import type { AuthLoginRequest, AuthRegisterRequest, AuthUser } from "~/services/api";
import { getAuthMe, loginAuth, logoutAuth, registerAuth } from "~/services/api";

type AuthContextValue = {
  user: AuthUser | null;
  loading: boolean;
  login: (payload: AuthLoginRequest) => Promise<void>;
  register: (payload: AuthRegisterRequest) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AuthContext = React.createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = React.useState<AuthUser | null>(null);
  const [loading, setLoading] = React.useState(true);

  const refresh = React.useCallback(async () => {
    try {
      const { data } = await getAuthMe();
      setUser(data.data);
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = React.useCallback(async (payload: AuthLoginRequest) => {
    const { data } = await loginAuth(payload);
    setUser(data.data);
  }, []);

  const register = React.useCallback(async (payload: AuthRegisterRequest) => {
    const { data } = await registerAuth(payload);
    setUser(data.data);
  }, []);

  const logout = React.useCallback(async () => {
    await logoutAuth();
    setUser(null);
  }, []);

  const value = React.useMemo<AuthContextValue>(
    () => ({ user, loading, login, register, logout, refresh }),
    [user, loading, login, register, logout, refresh],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = React.useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}
