import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";
import { DrawerDemo, Nut, TemporaryDrawer } from "~/components/FrontEnd";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "LearningDB" },
    { name: "description", content: "Welcome to LearningDB!" },
  ];
}

export default function Home() {
  return (
    <div>
    <TemporaryDrawer />
    </div>
  );
}
