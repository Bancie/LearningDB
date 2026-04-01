import { createTheme, responsiveFontSizes } from "@mui/material/styles";
import type { ThemeOptions } from "@mui/material/styles";

const sharedTypography: ThemeOptions["typography"] = {
  fontFamily: "Roboto, sans-serif",
  h4: {
    fontWeight: 700,
    letterSpacing: "-0.02em",
  },
  h5: {
    fontWeight: 700,
    letterSpacing: "-0.015em",
  },
  h6: {
    fontWeight: 700,
  },
  subtitle1: {
    fontWeight: 500,
  },
  button: {
    textTransform: "none",
    fontWeight: 600,
  },
};

function componentsForMode(mode: "light" | "dark"): ThemeOptions["components"] {
  const paperShadow =
    mode === "light"
      ? "0 10px 28px rgba(15, 23, 42, 0.06)"
      : "0 10px 28px rgba(0, 0, 0, 0.45)";
  const cardShadow =
    mode === "light"
      ? "0 10px 30px rgba(11, 110, 230, 0.08)"
      : "0 10px 30px rgba(0, 0, 0, 0.5)";

  return {
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: cardShadow,
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 16,
          boxShadow: paperShadow,
        },
      },
    },
    MuiButton: {
      defaultProps: {
        size: "large",
      },
      styleOverrides: {
        root: {
          borderRadius: 12,
          minHeight: 44,
          paddingInline: 16,
        },
      },
    },
    MuiTextField: {
      defaultProps: {
        size: "small",
      },
    },
    MuiOutlinedInput: {
      styleOverrides: {
        root: {
          boxSizing: "border-box",
        },
      },
    },
    MuiFormControl: {
      defaultProps: {
        size: "small",
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          fontWeight: 700,
        },
      },
    },
  };
}

const lightPalette: ThemeOptions["palette"] = {
  mode: "light",
  primary: {
    main: "#0b6ee6",
    light: "#4f93ff",
    dark: "#0048b3",
  },
  secondary: {
    main: "#6f42c1",
  },
  background: {
    default: "#f3f6fb",
    paper: "#ffffff",
  },
  success: {
    main: "#1b8a4b",
  },
  warning: {
    main: "#d17a00",
  },
  error: {
    main: "#c62828",
  },
};

const darkPalette: ThemeOptions["palette"] = {
  mode: "dark",
  primary: {
    main: "#5b9fff",
    light: "#82b4ff",
    dark: "#2f6fcc",
  },
  secondary: {
    main: "#b794f6",
  },
  background: {
    default: "#0f1419",
    paper: "#1a2332",
  },
  success: {
    main: "#4caf50",
  },
  warning: {
    main: "#ffb74d",
  },
  error: {
    main: "#ef5350",
  },
};

export function createAppTheme(mode: "light" | "dark") {
  const palette = mode === "light" ? lightPalette : darkPalette;
  const base = createTheme({
    palette,
    shape: {
      borderRadius: 14,
    },
    spacing: 8,
    typography: sharedTypography,
    components: componentsForMode(mode),
  });
  return responsiveFontSizes(base);
}

/** Default theme for any code that still expects a static import (e.g. tests). */
export const appTheme = createAppTheme("light");
