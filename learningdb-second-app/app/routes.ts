import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  route("login", "routes/login.tsx"),
  layout("routes/app-shell.tsx", [
    index("routes/home.tsx"),
    route("data-entry", "routes/data-entry.tsx"),
    route("import-wizard", "routes/import-wizard.tsx"),
    route("settings/account", "routes/account-settings.tsx"),
  ]),
] satisfies RouteConfig;
