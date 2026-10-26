import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from "vite-plugin-pwa";
import { seoPrerender } from "./src/seo/prerender";
import { pwaOptions } from "./src/seo/pwa";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Real URLs (/anurup/pdf-merger/) need an absolute base. Override with BASE_PATH=/ for a custom domain.
  const base = mode === "development" ? "/" : process.env.BASE_PATH || "/anurup/";
  return {
    base,
    server: {
      host: "::",
      port: 8080,
      hmr: {
        overlay: false,
      },
    },
    // seoPrerender writes the tool pages before VitePWA lists the files to keep offline.
    plugins: [react(), mode === "development" && componentTagger(), seoPrerender(), VitePWA(pwaOptions(base))].filter(Boolean),
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
  };
});
