import { type RouteConfig, index, layout, route } from "@react-router/dev/routes";

export default [
  layout("routes/workspace.tsx", [
    index("routes/home.tsx"),
    route("import", "routes/import.tsx"),
    route("activity-log", "routes/activity-log.tsx"),
    route("activity-output", "routes/activity-output.tsx"),
    route("activity-list", "routes/activity-list.tsx"),
    route("update", "routes/update.tsx"),
    route("view", "routes/view.tsx"),
    route("data-browser", "routes/data-browser.tsx"),
    route("bayes", "routes/bayes.tsx"),
  ]),
] satisfies RouteConfig;
