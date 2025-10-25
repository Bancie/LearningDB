import MiniDrawer from "~/components/MiniDrawer";
import type { Route } from "./+types/home";
import Typography from '@mui/material/Typography';

export function meta({}: Route.MetaArgs) {
  return [
    { title: "LearningDB Web App" },
    { name: "LearningDB", content: "Welcome to LearningDB!" },
  ];
}

export default function Home() {
  return (
    <MiniDrawer />
  );
}
