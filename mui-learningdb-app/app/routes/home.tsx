import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";
import { Nut, TemporaryDrawer } from "~/components/FrontEnd";
import { MiniDrawer } from "~/components/Drawer";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "LearningDB" },
    { name: "description", content: "Welcome to LearningDB!" },
  ];
}

export default function Home() {
  return (
    <div>
    <MiniDrawer />
    </div>
  );
}
