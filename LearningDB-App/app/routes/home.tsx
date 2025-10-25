import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "LearningDB Web App" },
    { name: "LearningDB", content: "Welcome to LearningDB!" },
  ];
}

export default function Home() {
  return (
    <div>hi</div>
  );
}
