import * as React from "react";

export type ColorSchemePreference = "light" | "dark" | "system";

export type ResolvedColorMode = "light" | "dark";

export const COLOR_MODE_STORAGE_KEY = "learningdb-second-color-mode";

export type ColorModeContextValue = {
  preference: ColorSchemePreference;
  setPreference: (preference: ColorSchemePreference) => void;
  resolvedMode: ResolvedColorMode;
};

export const ColorModeContext = React.createContext<ColorModeContextValue | null>(null);

export function useColorMode(): ColorModeContextValue {
  const ctx = React.useContext(ColorModeContext);
  if (!ctx) {
    throw new Error("useColorMode must be used within ColorModeContext.Provider");
  }
  return ctx;
}
