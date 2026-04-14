import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, loadEnv } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import { mockApiPlugin } from "./dev/mockApiPlugin";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const useMockApi = env.VITE_DEV_MOCK_API === "true";

  return {
    plugins: [
      tailwindcss(),
      reactRouter(),
      tsconfigPaths(),
      ...(useMockApi ? [mockApiPlugin()] : []),
    ],
  };
});
