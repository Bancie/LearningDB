import * as React from "react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router";

import { useAuth } from "~/auth/session";
import { useColorMode } from "~/color-mode";
import { Button } from "~/components/ui/button";
import { HistoryRefreshProvider } from "~/history/history-refresh-context";
import { HistorySidebar } from "~/history/HistorySidebar";

export default function AppShell() {
  const { preference, setPreference } = useColorMode();
  const { user, loading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [desktopCollapsed, setDesktopCollapsed] = React.useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = React.useState(false);
  const [historyOpen, setHistoryOpen] = React.useState(false);
  const [logoutConfirmOpen, setLogoutConfirmOpen] = React.useState(false);

  React.useEffect(() => {
    if (loading || user) {
      return;
    }
    navigate("/login", { replace: true, state: { from: location.pathname } });
  }, [loading, user, navigate, location.pathname]);

  if (loading) {
    return <div className="p-6 text-body-md">Checking session…</div>;
  }

  if (!user) {
    return <div className="p-6 text-body-md">Redirecting to login…</div>;
  }

  const cyclePreference = () => {
    const next = preference === "light" ? "dark" : preference === "dark" ? "system" : "light";
    setPreference(next);
  };

  const preferenceIcon =
    preference === "system"
      ? "brightness_auto"
      : preference === "dark"
        ? "dark_mode"
        : "light_mode";

  const drawerWidthClass = desktopCollapsed ? "md:w-20" : "md:w-64";
  const desktopMainOffsetClass = desktopCollapsed ? "md:ml-20" : "md:ml-64";
  const historyMainOffsetClass = historyOpen ? "lg:mr-[360px]" : "lg:mr-0";

  /** Below Tailwind `lg` (1024px): used so header actions match mobile history sidebar only. */
  const closeHistoryIfMobile = React.useCallback(() => {
    if (typeof window !== "undefined" && window.matchMedia("(max-width: 1023px)").matches) {
      setHistoryOpen(false);
    }
  }, []);

  const drawerNavClass = ({ isActive }: { isActive: boolean }) =>
    [
      "mx-2 flex items-center rounded-lg px-4 py-3 text-label-md normal-case tracking-normal transition-all",
      desktopCollapsed ? "justify-center gap-0" : "gap-3",
      isActive
        ? "bg-[var(--color-secondary-container)] text-[var(--color-on-surface)]"
        : "text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-low)]",
    ].join(" ");

  return (
    <HistoryRefreshProvider>
    <div className="stitch-shell min-h-screen">
      <header className="stitch-liquid-header fixed left-0 right-0 top-0 z-50 flex h-16 items-center justify-between px-6">
        <div className="flex items-center gap-8">
          <button
            type="button"
            aria-label="toggle drawer on mobile"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)] md:hidden"
            onClick={() => setMobileDrawerOpen((prev) => !prev)}
          >
            <span className="material-symbols-outlined text-[20px]">{mobileDrawerOpen ? "close" : "menu"}</span>
          </button>
          <button
            type="button"
            aria-label="collapse drawer"
            className="hidden h-9 w-9 items-center justify-center rounded-md text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)] md:inline-flex"
            onClick={() => setDesktopCollapsed((prev) => !prev)}
          >
            <span className="material-symbols-outlined text-[20px]">
              {desktopCollapsed ? "right_panel_open" : "left_panel_close"}
            </span>
          </button>
          <Link
            to="/"
            onClick={closeHistoryIfMobile}
            className="flex items-center gap-2 text-headline-sm font-light text-[var(--color-on-surface)] no-underline outline-none hover:opacity-80 focus-visible:rounded-md focus-visible:ring-2 focus-visible:ring-[var(--color-primary)] focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-surface-lowest)]"
          >
            <img
              src="/favicon.ico"
              alt=""
              width={28}
              height={28}
              className="h-7 w-7 shrink-0 object-contain"
            />
            LearningDB
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-label-md text-[var(--color-on-surface-variant)] md:inline">
            {user.username}
          </span>
          <button
            type="button"
            aria-label="toggle history sidebar"
            className="rounded-full p-2 text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)]"
            onClick={() => setHistoryOpen((prev) => !prev)}
          >
            <span className="material-symbols-outlined text-[20px]">history</span>
          </button>
          <button
            type="button"
            aria-label="toggle color mode"
            className="rounded-full p-2 text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-container)]"
            onClick={cyclePreference}
          >
            <span className="material-symbols-outlined text-[20px]">{preferenceIcon}</span>
          </button>
        </div>
      </header>

      {mobileDrawerOpen ? (
        <button
          type="button"
          aria-label="close drawer overlay"
          className="fixed inset-0 top-16 z-40 bg-black/35 md:hidden"
          onClick={() => setMobileDrawerOpen(false)}
        />
      ) : null}

      <aside
        className={[
          "fixed left-0 top-16 z-50 h-[calc(100vh-4rem)] transform flex-col bg-[var(--color-surface-container)] py-6 transition-transform duration-200",
          "w-64 md:flex",
          drawerWidthClass,
          mobileDrawerOpen ? "flex translate-x-0" : "-translate-x-full md:translate-x-0",
        ].join(" ")}
      >
        <nav className="flex flex-1 flex-col gap-1">
          <NavLink
            to="/import-wizard"
            className={drawerNavClass}
            onClick={() => setMobileDrawerOpen(false)}
            title="Import Wizard"
          >
            <span className="material-symbols-outlined text-[18px]">upload_file</span>
            <span className={desktopCollapsed ? "hidden" : ""}>Import Wizard</span>
          </NavLink>
          <NavLink
            to="/settings/account"
            className={drawerNavClass}
            onClick={() => setMobileDrawerOpen(false)}
            title="Account Settings"
          >
            <span className="material-symbols-outlined text-[18px]">manage_accounts</span>
            <span className={desktopCollapsed ? "hidden" : ""}>Account Settings</span>
          </NavLink>
        </nav>
        <div className="mt-auto w-full min-w-0">
          <button
            type="button"
            className={[
              drawerNavClass({ isActive: false }),
              // Match `NavLink` width in the `nav` above: full row minus `mx-2` (0.5rem each side)
              "w-[calc(100%-1rem)]",
            ].join(" ")}
            onClick={() => {
              setMobileDrawerOpen(false);
              setLogoutConfirmOpen(true);
            }}
            title="Logout"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span className={desktopCollapsed ? "hidden" : ""}>Logout</span>
          </button>
        </div>
      </aside>

      <main
        className={[
          "min-h-screen pt-16 transition-[margin] duration-200",
          desktopMainOffsetClass,
          historyMainOffsetClass,
        ].join(" ")}
      >
        <div className="mx-auto w-full max-w-6xl p-4 md:p-8">
          <Outlet />
        </div>
      </main>
      <HistorySidebar open={historyOpen} onClose={() => setHistoryOpen(false)} />

      {logoutConfirmOpen ? (
        <div className="fixed inset-0 z-[160] flex items-center justify-center bg-black/35 p-4">
          <div className="w-full max-w-md rounded-[var(--radius-lg)] border border-[color:var(--color-outline-variant)]/40 bg-[var(--color-surface-lowest)] p-5 shadow-[var(--shadow-ambient)]">
            <h3 className="mb-2 text-title-md">Log out</h3>
            <p className="mb-5 text-body-md text-[var(--color-on-surface-variant)]">Are you sure you want to sign out?</p>
            <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
              <Button type="button" variant="secondary" onClick={() => setLogoutConfirmOpen(false)}>
                Cancel
              </Button>
              <Button
                type="button"
                variant="danger"
                onClick={() => {
                  setLogoutConfirmOpen(false);
                  void logout();
                }}
              >
                Log out
              </Button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
    </HistoryRefreshProvider>
  );
}
