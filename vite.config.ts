import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(() => ({
  server: {
    host: "::",
    port: 8080,
  },
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    rollupOptions: {
      output: {
        // Split rarely-changing, heavy dependencies into their own chunks so
        // the browser can cache them across deploys, and so a landing-page
        // visit isn't forced to parse code for features (charts, forms,
        // Supabase) it never touches. Landing.tsx itself stays in the main
        // entry chunk (see App.tsx) — this only splits its transitive deps.
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          // react/react-dom are left in the default vendor bucket deliberately:
          // splitting them into their own chunk creates a circular chunk
          // dependency with everything else that imports them at the top
          // level (Rollup warns and the split buys nothing, since the shared
          // vendor chunk still has to load before either can run).
          if (id.includes("node_modules/framer-motion")) return "vendor-motion";
          if (id.includes("node_modules/@supabase")) return "vendor-supabase";
          if (id.includes("node_modules/@tanstack")) return "vendor-query";
          if (id.includes("node_modules/recharts") || id.includes("node_modules/d3-")) {
            return "vendor-charts";
          }
          if (
            id.includes("node_modules/@radix-ui") ||
            id.includes("node_modules/cmdk") ||
            id.includes("node_modules/vaul") ||
            id.includes("node_modules/embla-carousel") ||
            id.includes("node_modules/react-day-picker") ||
            id.includes("node_modules/input-otp") ||
            id.includes("node_modules/react-resizable-panels")
          ) {
            return "vendor-radix";
          }
          if (
            id.includes("node_modules/react-hook-form") ||
            id.includes("node_modules/@hookform") ||
            id.includes("node_modules/zod")
          ) {
            return "vendor-forms";
          }
          return "vendor";
        },
      },
    },
  },
}));
