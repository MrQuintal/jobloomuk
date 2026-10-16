// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { loadEnv } from "vite";
import { fileURLToPath } from "node:url";

export default defineConfig({
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
  vite: {
    plugins: [{
      name: "jobloom-server-env",
      config: (_config, { mode }) => {
        Object.assign(process.env, loadEnv(mode, process.cwd(), ""));
      },
    }],
    resolve: {
      alias: {
        "entities/lib/decode.js": fileURLToPath(new URL("./node_modules/entities/lib/decode.js", import.meta.url)),
        "entities/lib/encode.js": fileURLToPath(new URL("./node_modules/entities/lib/encode.js", import.meta.url)),
        "entities": fileURLToPath(new URL("./node_modules/entities", import.meta.url)),
      },
    },
    // Pre-bundle UI libs at startup so a lazily discovered dep can't be optimized
    // later against a second React copy ("Cannot read properties of null (reading 'useContext')").
    optimizeDeps: {
      include: [
        "@radix-ui/react-tabs",
        "@radix-ui/react-dialog",
        "@radix-ui/react-select",
        "@radix-ui/react-dropdown-menu",
        "@radix-ui/react-popover",
        "@radix-ui/react-tooltip",
        "@radix-ui/react-checkbox",
        "@radix-ui/react-switch",
        "@radix-ui/react-label",
        "@radix-ui/react-slot",
        "@radix-ui/react-radio-group",
        "@radix-ui/react-accordion",
        "@radix-ui/react-alert-dialog",
        "@radix-ui/react-avatar",
        "@radix-ui/react-separator",
        "@radix-ui/react-scroll-area",
      ],
    },
  },
});
