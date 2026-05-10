// @lovable.dev/vite-tanstack-config already includes the following for Lovable builds —
// do NOT add them manually there or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// Vercel needs Nitro output instead of Cloudflare output, so it gets a separate config branch.
import tailwindcss from "@tailwindcss/vite";
import { defineConfig as defineLovableConfig } from "@lovable.dev/vite-tanstack-config";
import { tanstackStart } from "@tanstack/react-start/plugin/vite";
import viteReact from "@vitejs/plugin-react";
import { nitro } from "nitro/vite";
import { defineConfig as defineViteConfig, loadEnv, type ConfigEnv } from "vite";
import tsConfigPaths from "vite-tsconfig-paths";

// Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
// @cloudflare/vite-plugin builds from this — wrangler.jsonc main alone is insufficient.
const tanstackStartOptions = {
  tanstackStart: {
    server: { entry: "server" },
  },
};

const dedupe = [
  "react",
  "react-dom",
  "react/jsx-runtime",
  "react/jsx-dev-runtime",
  "@tanstack/react-query",
  "@tanstack/query-core",
];

const vercelConfig = ({ mode }: ConfigEnv) => {
  const loadedEnv = loadEnv(mode, process.cwd(), "VITE_");
  const envDefine = Object.fromEntries(
    Object.entries(loadedEnv).map(([key, value]) => [
      `import.meta.env.${key}`,
      JSON.stringify(value),
    ]),
  );

  return defineViteConfig({
    define: envDefine,
    resolve: {
      alias: { "@": `${process.cwd()}/src` },
      dedupe,
    },
    plugins: [
      tailwindcss(),
      tsConfigPaths({ projects: ["./tsconfig.json"] }),
      tanstackStart(tanstackStartOptions.tanstackStart),
      nitro({ preset: "vercel" }),
      viteReact(),
    ],
  });
};

export default process.env.VERCEL === "1"
  ? vercelConfig
  : defineLovableConfig(tanstackStartOptions);
