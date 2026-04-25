/**
 * Canonical mapping for Stitch export `design/stitch_learningdb (2)`.
 * UI code should use these semantic keys (or CSS vars in `app.css`) as source of truth.
 */
export const stitchDesignReadmePath = "design/stitch_learningdb (2)/DESIGN.md";

export const stitchTokens = {
  color: {
    primary: "#3d3d3d",
    primaryContainer: "#6a6a6a",
    secondaryContainer: "#d6d6d6",
    surface: "#f9f9f9",
    surfaceLow: "#f3f3f3",
    surfaceContainer: "#eeeeee",
    surfaceLowest: "#ffffff",
    outlineVariant: "#b8b8b8",
    onSurface: "#1a1a1a",
    onSurfaceVariant: "#444444",
    error: "#ba1a1a",
  },
  typography: {
    displaySm: "2.25rem",
    headlineSm: "1.5rem",
    titleMd: "1.125rem",
    bodyMd: "0.875rem",
    labelMd: "0.75rem",
  },
  radius: {
    md: "0.375rem",
    lg: "0.5rem",
    full: "9999px",
  },
  shadow: {
    ambient: "0px 8px 24px rgba(26, 28, 28, 0.06)",
  },
  spacing: {
    navItemY: "12px",
    sectionGap: "16px",
  },
} as const;
