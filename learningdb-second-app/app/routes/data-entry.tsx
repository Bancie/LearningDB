import InfoOutlinedIcon from "@mui/icons-material/InfoOutlined";
import { Alert, Card, CardContent, Stack, Typography } from "@mui/material";

import type { Route } from "./+types/data-entry";
import { stitchDesignReadmePath, stitchPlaceholderTokens } from "~/design-tokens";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Data entry — LearningDB" },
    { name: "description", content: "Experimental data entry UI (Stitch-ready)" },
  ];
}

export default function DataEntryRoute() {
  return (
    <Stack spacing={3}>
      <Typography variant="h4" component="h1">
        Data entry
      </Typography>
      <Alert icon={<InfoOutlinedIcon fontSize="inherit" />} severity="info">
        Placeholder route for the new input screen. Drop Google Stitch exports under{" "}
        <code>{stitchDesignReadmePath}</code> and map tokens in{" "}
        <code>app/design-tokens.ts</code> (see <code>primary</code> sample: {stitchPlaceholderTokens.primary}).
      </Alert>
      <Card>
        <CardContent>
          <Typography variant="body1" color="text.secondary">
            Form fields and layout will follow your Stitch design system once assets are in the repo.
          </Typography>
        </CardContent>
      </Card>
    </Stack>
  );
}
