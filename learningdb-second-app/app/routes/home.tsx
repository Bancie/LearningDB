import CheckCircleOutlineIcon from "@mui/icons-material/CheckCircleOutline";
import ErrorOutlineIcon from "@mui/icons-material/ErrorOutline";
import { Alert, Card, CardContent, Stack, Typography } from "@mui/material";
import { Link } from "react-router";

import type { Route } from "./+types/home";
import { getHealth } from "~/services/api";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "LearningDB — CRUD app" },
    { name: "description", content: "Second LearningDB web app (FastAPI CRUD only)" },
  ];
}

export async function loader() {
  try {
    const { data } = await getHealth();
    return { ok: data.status === "healthy", message: null as string | null };
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Could not reach API";
    return { ok: false, message: msg };
  }
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { ok, message } = loaderData;

  return (
    <Stack spacing={3}>
      <Typography variant="h4" component="h1">
        CRUD workspace
      </Typography>
      <Typography color="text.secondary">
        This app talks to the same FastAPI backend on port <strong>8000</strong> (no orchestrator). Dev server
        runs on port <strong>3001</strong> so it does not conflict with the main app on 3000.
      </Typography>
      <Card>
        <CardContent>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            {ok ? (
              <CheckCircleOutlineIcon color="success" fontSize="large" />
            ) : (
              <ErrorOutlineIcon color="error" fontSize="large" />
            )}
            <Typography variant="h6">API health</Typography>
          </Stack>
          {ok ? (
            <Alert severity="success">GET /api/health returned healthy.</Alert>
          ) : (
            <Alert severity="error">
              {message ?? "Backend unreachable. Start the API (e.g. docker compose service api) and reload."}
            </Alert>
          )}
        </CardContent>
      </Card>
      <Typography>
        Next: open the <Link to="/data-entry">data entry</Link> screen (placeholder for Stitch-driven layout).
      </Typography>
    </Stack>
  );
}
