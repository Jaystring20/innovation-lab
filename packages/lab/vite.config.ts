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
        manualChunks: (id) => {
          // Route-based code splitting
          if (id.includes('/pages/Landing')) return 'route-landing'
          if (id.includes('/pages/Store')) return 'route-store'
          if (id.includes('/pages/Login')) return 'route-auth'
          if (id.includes('/pages/Lab')) return 'route-lab'
          if (id.includes('/pages/Organizer')) return 'route-organizer'
          if (id.includes('/pages/Judge')) return 'route-judge'

          // Library splitting
          if (id.includes('node_modules/recharts')) return 'vendor-charts'
          if (id.includes('node_modules/@radix-ui')) return 'vendor-radix'
          if (id.includes('node_modules/framer-motion')) return 'vendor-motion'
          if (id.includes('node_modules/@tanstack/react-query')) return 'vendor-query'

          // Shared package
          if (id.includes('@steam-foundry/shared')) return 'shared'
        }
      }
    },
    chunkSizeWarningLimit: 500,
  }
}));
