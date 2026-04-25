import { Navigate } from "react-router";

import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "LearningDB — Import Wizard" },
    { name: "description", content: "Redirect root route to Import Wizard" },
  ];
}

export default function Home() {
  return <Navigate to="/import-wizard" replace />;
}
