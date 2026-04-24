import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  layout("routes/app-shell.tsx", [
    index("routes/home.tsx"),
    route("data-entry", "routes/data-entry.tsx"),
  ]),
] satisfies RouteConfig;
