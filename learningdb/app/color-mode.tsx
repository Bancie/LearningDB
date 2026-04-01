import * as React from "react";

/** User choice stored in localStorage */
export type ColorSchemePreference = "light" | "dark" | "system";

/** Resolved appearance after applying system preference */
export type ResolvedColorMode = "light" | "dark";

export const COLOR_MODE_STORAGE_KEY = "learningdb-color-mode";

export type ColorModeContextValue = {
  preference: ColorSchemePreference;
  setPreference: (preference: ColorSchemePreference) => void;
  /** Effective light/dark for theme and `data-theme` */
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
