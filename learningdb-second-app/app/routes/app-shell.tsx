import * as React from "react";
import { NavLink, Outlet, useLocation, useNavigate } from "react-router";

import { useAuth } from "~/auth/session";
import { useColorMode } from "~/color-mode";

export default function AppShell() {
  const { preference, setPreference } = useColorMode();
  const { user, loading, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [desktopCollapsed, setDesktopCollapsed] = React.useState(false);
  const [mobileDrawerOpen, setMobileDrawerOpen] = React.useState(false);

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

  const drawerNavClass = ({ isActive }: { isActive: boolean }) =>
    [
      "mx-2 flex items-center rounded-lg px-4 py-3 text-label-md normal-case tracking-normal transition-all",
      desktopCollapsed ? "justify-center gap-0" : "gap-3",
      isActive
        ? "bg-[var(--color-secondary-container)] text-[var(--color-on-surface)]"
        : "text-[var(--color-on-surface-variant)] hover:bg-[var(--color-surface-low)]",
    ].join(" ");

  return (
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
          <span className="text-headline-sm font-light">LearningDB</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-label-md text-[var(--color-on-surface-variant)] md:inline">
            {user.username}
          </span>
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
        <div className={desktopCollapsed ? "mt-auto px-2" : "mt-auto px-3"}>
          <button
            type="button"
            className={drawerNavClass({ isActive: false })}
            onClick={() => {
              setMobileDrawerOpen(false);
              void logout();
            }}
            title="Logout"
          >
            <span className="material-symbols-outlined text-[18px]">logout</span>
            <span className={desktopCollapsed ? "hidden" : ""}>Logout</span>
          </button>
        </div>
      </aside>

      <main className={["min-h-screen pt-16 transition-[margin] duration-200", desktopMainOffsetClass].join(" ")}>
        <div className="mx-auto w-full max-w-6xl p-4 md:p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
