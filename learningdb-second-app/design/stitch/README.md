# Stitch / design system drop zone

**API + contract context for Stitch / design agents** (OpenAPI, brief, examples, Postman) lives in **[`../stitch-context/README.md`](../stitch-context/README.md)** — use that folder when feeding backend context. **Stitch 5-file upload limit:** flattened bundle in [`../stitch-google-5files/`](../stitch-google-5files/). This folder (`stitch/`) is for **visual** exports from Stitch.

Place exported assets from Google Stitch here, for example:

- Color and typography tokens (JSON, CSS variables, or platform-specific exports)
- Component specs or reference screenshots
- Any `tokens.*` or `theme.*` files your workflow produces

The app imports bridge constants from [`app/design-tokens.ts`](../app/design-tokens.ts). After you add files, update that module (or MUI `theme.ts`) to map real token names to the running UI.
