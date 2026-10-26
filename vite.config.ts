import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { seoPrerender } from "./src/seo/prerender";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => ({
  // Real URLs (/anurup/pdf-merger/) need an absolute base. Override with BASE_PATH=/ for a custom domain.
  base: mode === "development" ? "/" : process.env.BASE_PATH || "/anurup/",
  server: {
    host: "::",
    port: 8080,
    hmr: {
      overlay: false,
    },
  },
  plugins: [react(), mode === "development" && componentTagger(), seoPrerender()].filter(Boolean),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  build: {
    // PDF.js worker and the background-removal runtime are large by nature and load on demand.
    chunkSizeWarningLimit: 1600,
  },
  optimizeDeps: {
    include: ["@imgly/background-removal"],
  },
}));
