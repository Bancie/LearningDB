import type { Route } from "./+types/home";
import { Welcome } from "../welcome/welcome";
import { Nhap, CardDemo, SignUp, DrawerDemo } from "~/components/FrontEnd";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Bus Smart 1.0 Web App" },
    { name: "description", content: "Welcome to LearningDB!" },
  ];
}

export default function Home() {
  return (
    <div>
    {/* <Nhap />
    <CardDemo />
    <SignUp /> */}
    <DrawerDemo />
    </div>
  );
}
