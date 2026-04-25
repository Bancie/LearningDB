import * as React from "react";

import { useAuth } from "~/auth/session";
import { Alert } from "~/components/ui/alert";
import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Select } from "~/components/ui/select";
import {
  getAuthAccount,
  updateAuthAccount,
  updateAuthPassword,
  type AuthAccountUpdateRequest,
} from "~/services/api";
import { formatApiError } from "~/utils/formatApiError";

export default function AccountSettingsRoute() {
  const { refresh } = useAuth();
  const [loading, setLoading] = React.useState(true);
  const [busyProfile, setBusyProfile] = React.useState(false);
  const [busyPassword, setBusyPassword] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [success, setSuccess] = React.useState<string | null>(null);
  const [profile, setProfile] = React.useState<AuthAccountUpdateRequest>({
    username: "",
    email: "",
    fullname: "",
    birth: "2000-01-01",
    gender: "other",
    major: "General",
    user_location: "Asia/Ho_Chi_Minh",
  });
  const [passwordForm, setPasswordForm] = React.useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const { data } = await getAuthAccount();
        if (cancelled) return;
        setProfile({
          username: data.data.username,
          email: data.data.email,
          fullname: data.data.fullname || "",
          birth: data.data.birth || "2000-01-01",
          gender: data.data.gender || "other",
          major: data.data.major || "General",
          user_location: data.data.user_location || "Asia/Ho_Chi_Minh",
        });
      } catch (e) {
        if (!cancelled) setError(formatApiError(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const onProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setBusyProfile(true);
    try {
      await updateAuthAccount(profile);
      await refresh();
      setSuccess("Account information updated.");
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusyProfile(false);
    }
  };

  const onPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("New password and confirm password do not match.");
      return;
    }
    setBusyPassword(true);
    try {
      await updateAuthPassword({
        current_password: passwordForm.currentPassword,
        new_password: passwordForm.newPassword,
      });
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      setSuccess("Password changed successfully.");
    } catch (err) {
      setError(formatApiError(err));
    } finally {
      setBusyPassword(false);
    }
  };

  if (loading) {
    return <div className="p-6 text-body-md">Loading account settings…</div>;
  }

  return (
    <div className="stitch-page-bg min-h-[70vh] rounded-lg p-4 md:p-8">
      <header className="mb-6 space-y-2">
        <h1 className="text-headline-sm">Account Settings</h1>
        <p className="text-body-md text-[var(--color-on-surface-variant)]">
          Update your profile, login identity, and password.
        </p>
      </header>

      {error ? <Alert variant="error" className="mb-4">{error}</Alert> : null}
      {success ? <Alert variant="success" className="mb-4">{success}</Alert> : null}

      <div className="grid gap-6 xl:grid-cols-2">
        <Card className="p-6">
          <h2 className="mb-4 text-title-md">Profile & Login</h2>
          <form className="space-y-4" onSubmit={onProfileSubmit}>
            <div className="space-y-1">
              <Label>Username</Label>
              <Input
                value={profile.username}
                onChange={(e) => setProfile((p) => ({ ...p, username: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input
                type="email"
                value={profile.email}
                onChange={(e) => setProfile((p) => ({ ...p, email: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Full name</Label>
              <Input
                value={profile.fullname}
                onChange={(e) => setProfile((p) => ({ ...p, fullname: e.target.value }))}
              />
            </div>
            <div className="space-y-1">
              <Label>Birth date</Label>
              <Input
                type="date"
                value={profile.birth}
                onChange={(e) => setProfile((p) => ({ ...p, birth: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Gender</Label>
              <Select
                value={profile.gender}
                onChange={(e) =>
                  setProfile((p) => ({ ...p, gender: e.target.value as "male" | "female" | "other" }))
                }
                required
              >
                <option value="male">male</option>
                <option value="female">female</option>
                <option value="other">other</option>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Major</Label>
              <Input
                value={profile.major}
                onChange={(e) => setProfile((p) => ({ ...p, major: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Timezone</Label>
              <Input
                value={profile.user_location}
                onChange={(e) => setProfile((p) => ({ ...p, user_location: e.target.value }))}
                required
              />
            </div>
            <Button type="submit" disabled={busyProfile}>
              {busyProfile ? "Saving..." : "Save profile"}
            </Button>
          </form>
        </Card>

        <Card className="p-6">
          <h2 className="mb-4 text-title-md">Change Password</h2>
          <form className="space-y-4" onSubmit={onPasswordSubmit}>
            <div className="space-y-1">
              <Label>Current password</Label>
              <Input
                type="password"
                value={passwordForm.currentPassword}
                onChange={(e) =>
                  setPasswordForm((p) => ({ ...p, currentPassword: e.target.value }))
                }
                required
              />
            </div>
            <div className="space-y-1">
              <Label>New password</Label>
              <Input
                type="password"
                value={passwordForm.newPassword}
                onChange={(e) =>
                  setPasswordForm((p) => ({ ...p, newPassword: e.target.value }))
                }
                minLength={6}
                required
              />
            </div>
            <div className="space-y-1">
              <Label>Confirm new password</Label>
              <Input
                type="password"
                value={passwordForm.confirmPassword}
                onChange={(e) =>
                  setPasswordForm((p) => ({ ...p, confirmPassword: e.target.value }))
                }
                minLength={6}
                required
              />
            </div>
            <Button type="submit" disabled={busyPassword}>
              {busyPassword ? "Updating..." : "Update password"}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
