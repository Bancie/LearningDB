import * as React from "react";
import {
  isRouteErrorResponse,
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
} from "react-router";

import type { Route } from "./+types/root";
import "./app.css";
import {
  COLOR_MODE_STORAGE_KEY,
  ColorModeContext,
  type ColorSchemePreference,
} from "./color-mode";
import { AuthProvider } from "./auth/session";

function resolveColorMode(
  preference: ColorSchemePreference,
  prefersDark: boolean,
): "light" | "dark" {
  if (preference === "system") {
    return prefersDark ? "dark" : "light";
  }
  return preference;
}

const publicUrl = (file: string) => `${import.meta.env.BASE_URL}${file}`.replace(/\/{2,}/g, "/");

export const links: Route.LinksFunction = () => [
  { rel: "icon", href: publicUrl("favicon.ico"), sizes: "any" },
  { rel: "icon", type: "image/png", href: publicUrl("learningdblogo.png") },
  { rel: "shortcut icon", href: publicUrl("favicon.ico") },
  { rel: "apple-touch-icon", href: publicUrl("learningdblogo.png") },
  { rel: "preconnect", href: "https://fonts.googleapis.com" },
  {
    rel: "preconnect",
    href: "https://fonts.gstatic.com",
    crossOrigin: "anonymous",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Inter:wght@100..900&display=swap",
  },
  {
    rel: "stylesheet",
    href: "https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap",
  },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <Links />
        <Meta />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

function AppThemeShell() {
  const [preference, setPreference] = React.useState<ColorSchemePreference>("light");
  const [storageReady, setStorageReady] = React.useState(false);
  const [prefersDark, setPrefersDark] = React.useState(false);

  React.useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const sync = () => setPrefersDark(media.matches);
    sync();
    media.addEventListener("change", sync);
    return () => media.removeEventListener("change", sync);
  }, []);

  React.useEffect(() => {
    try {
      const stored = localStorage.getItem(COLOR_MODE_STORAGE_KEY);
      if (stored === "light" || stored === "dark" || stored === "system") {
        setPreference(stored);
      }
    } catch {
      /* ignore */
    }
    setStorageReady(true);
  }, []);

  const resolvedMode = resolveColorMode(preference, prefersDark);

  React.useEffect(() => {
    document.documentElement.setAttribute("data-theme", resolvedMode);
    if (!storageReady) {
      return;
    }
    try {
      localStorage.setItem(COLOR_MODE_STORAGE_KEY, preference);
    } catch {
      /* ignore */
    }
  }, [preference, resolvedMode, storageReady]);

  const colorModeValue = React.useMemo(
    () => ({
      preference,
      setPreference,
      resolvedMode,
    }),
    [preference, resolvedMode],
  );

  return (
    <ColorModeContext.Provider value={colorModeValue}>
      <AuthProvider>
        <div className="stitch-shell min-h-screen">
          <Outlet />
        </div>
      </AuthProvider>
    </ColorModeContext.Provider>
  );
}

export default function App() {
  return <AppThemeShell />;
}

export function ErrorBoundary({ error }: Route.ErrorBoundaryProps) {
  let message = "Oops!";
  let details = "An unexpected error occurred.";
  let stack: string | undefined;

  if (isRouteErrorResponse(error)) {
    message = error.status === 404 ? "404" : "Error";
    details =
      error.status === 404
        ? "The requested page could not be found."
        : error.statusText || details;
  } else if (import.meta.env.DEV && error && error instanceof Error) {
    details = error.message;
    stack = error.stack;
  }

  return (
    <main className="pt-16 p-4 container mx-auto">
      <h1>{message}</h1>
      <p>{details}</p>
      {stack && (
        <pre className="w-full p-4 overflow-x-auto">
          <code>{stack}</code>
        </pre>
      )}
    </main>
  );
}
