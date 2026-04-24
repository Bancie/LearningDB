# Stitch / design system drop zone

Place exported assets from Google Stitch here, for example:

- Color and typography tokens (JSON, CSS variables, or platform-specific exports)
- Component specs or reference screenshots
- Any `tokens.*` or `theme.*` files your workflow produces

The app imports bridge constants from [`app/design-tokens.ts`](../app/design-tokens.ts). After you add files, update that module (or MUI `theme.ts`) to map real token names to the running UI.
