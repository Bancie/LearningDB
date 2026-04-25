import * as React from "react";
import { Navigate, useLocation } from "react-router";

import { useAuth } from "~/auth/session";
import { Alert } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { formatApiError } from "~/utils/formatApiError";

type Mode = "login" | "register";

export default function LoginRoute() {
  const { user, login, register } = useAuth();
  const location = useLocation();
  const from = ((location.state as { from?: string } | null)?.from ?? "/import-wizard") as string;

  const [mode, setMode] = React.useState<Mode>("login");
  const [busy, setBusy] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [loginForm, setLoginForm] = React.useState({ login: "", password: "" });
  const [registerForm, setRegisterForm] = React.useState({
    username: "",
    email: "",
    password: "",
    fullname: "",
    major: "General",
    user_location: "Asia/Ho_Chi_Minh",
  });

  if (user) {
    return <Navigate to={from} replace />;
  }

  return (
    <div className="mx-auto mt-10 max-w-xl">
      <Card className="p-2">
        <CardHeader>
          <CardTitle className="text-headline-sm">LearningDB Account</CardTitle>
          <p className="text-body-md text-[var(--color-on-surface-variant)]">
            Sign in or create an account to start import workflow.
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="inline-flex rounded-[var(--radius-md)] bg-[var(--color-surface-low)] p-1">
            <button
              type="button"
              className={mode === "login" ? "stitch-button-primary h-9 px-4 text-label-md" : "h-9 px-4 text-label-md"}
              onClick={() => setMode("login")}
            >
              Login
            </button>
            <button
              type="button"
              className={mode === "register" ? "stitch-button-primary h-9 px-4 text-label-md" : "h-9 px-4 text-label-md"}
              onClick={() => setMode("register")}
            >
              Register
            </button>
          </div>

          {error ? <Alert variant="error">{error}</Alert> : null}
          {success ? <Alert variant="success">{success}</Alert> : null}

          {mode === "login" ? (
            <form
              className="space-y-3"
              onSubmit={async (e) => {
                e.preventDefault();
                setError(null);
                setSuccess(null);
                setBusy(true);
                try {
                  await login(loginForm);
                } catch (err) {
                  setError(formatApiError(err));
                } finally {
                  setBusy(false);
                }
              }}
            >
              <div className="space-y-1">
                <Label>Username or email</Label>
                <Input
                  value={loginForm.login}
                  onChange={(e) => setLoginForm((p) => ({ ...p, login: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>Password</Label>
                <Input
                  type="password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm((p) => ({ ...p, password: e.target.value }))}
                  required
                />
              </div>
              <Button type="submit" disabled={busy} className="w-full">
                {busy ? "Signing in..." : "Sign in"}
              </Button>
            </form>
          ) : (
            <form
              className="space-y-3"
              onSubmit={async (e) => {
                e.preventDefault();
                setError(null);
                setSuccess(null);
                setBusy(true);
                try {
                  await register(registerForm);
                  setSuccess("Account created and signed in.");
                } catch (err) {
                  setError(formatApiError(err));
                } finally {
                  setBusy(false);
                }
              }}
            >
              <div className="space-y-1">
                <Label>Username</Label>
                <Input
                  value={registerForm.username}
                  onChange={(e) => setRegisterForm((p) => ({ ...p, username: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={registerForm.email}
                  onChange={(e) => setRegisterForm((p) => ({ ...p, email: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>Password</Label>
                <Input
                  type="password"
                  value={registerForm.password}
                  onChange={(e) => setRegisterForm((p) => ({ ...p, password: e.target.value }))}
                  required
                />
              </div>
              <div className="space-y-1">
                <Label>Full name (optional)</Label>
                <Input
                  value={registerForm.fullname}
                  onChange={(e) => setRegisterForm((p) => ({ ...p, fullname: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Major</Label>
                <Input
                  value={registerForm.major}
                  onChange={(e) => setRegisterForm((p) => ({ ...p, major: e.target.value }))}
                />
              </div>
              <div className="space-y-1">
                <Label>Timezone</Label>
                <Input
                  value={registerForm.user_location}
                  onChange={(e) => setRegisterForm((p) => ({ ...p, user_location: e.target.value }))}
                />
              </div>
              <Button type="submit" disabled={busy} className="w-full">
                {busy ? "Creating..." : "Create account"}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
