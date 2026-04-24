/**
 * Bridge for a future Google Stitch / design-system export.
 * Replace or extend `stitchPlaceholderTokens` when token files land in `design/stitch/`.
 */
export const stitchDesignReadmePath = "design/stitch/README.md";

/** Sample keys to align MUI theme later; values mirror app 1 primary until Stitch overrides. */
export const stitchPlaceholderTokens = {
  primary: "#0b6ee6",
  surface: "#ffffff",
  radiusMd: "14px",
} as const;
