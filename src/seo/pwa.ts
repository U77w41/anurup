/**
 * Web app manifest and service worker settings (used by vite-plugin-pwa in vite.config.ts).
 *
 * With these, Chrome, Edge and Android show an "Install" option, iPhone and iPad
 * can "Add to Home Screen", and the installed app keeps working offline.
 */
import type { VitePWAOptions } from "vite-plugin-pwa";
import { HOME, SITE, TOOL_CONTENT_BY_ID, type ToolId } from "./content";

/** Tools offered when you right-click (desktop) or long-press (Android) the app icon. */
const SHORTCUTS: ToolId[] = ["size-targeter", "passport-photo", "pdf-compressor", "pdf-merger"];

const BACKGROUND = "#f5f5fa";

export function pwaOptions(base: string): Partial<VitePWAOptions> {
  return {
    // A new version waits until the user clicks "Reload" (see src/components/PwaPrompt.tsx).
    registerType: "prompt",
    injectRegister: false,
    manifest: {
      id: base,
      name: `${SITE.name}: Photo & PDF tools for forms`,
      short_name: SITE.name,
      description: HOME.description,
      lang: "en-IN",
      dir: "ltr",
      start_url: base,
      scope: base,
      display: "standalone",
      background_color: BACKGROUND,
      theme_color: BACKGROUND,
      categories: ["utilities", "productivity", "photo"],
      icons: [
        { src: "pwa-192.png", sizes: "192x192", type: "image/png", purpose: "any" },
        { src: "pwa-512.png", sizes: "512x512", type: "image/png", purpose: "any" },
        { src: "pwa-maskable-512.png", sizes: "512x512", type: "image/png", purpose: "maskable" },
      ],
      shortcuts: SHORTCUTS.map((id) => ({
        name: TOOL_CONTENT_BY_ID[id].name,
        short_name: TOOL_CONTENT_BY_ID[id].short,
        url: `${base}${id}/`,
        icons: [{ src: "pwa-192.png", sizes: "192x192", type: "image/png" }],
      })),
    },
    workbox: {
      // App shell, every tool page (written by the prerender plugin), the PDF.js worker, the QPDF engine and the Lato font.
      globPatterns: ["**/*.{js,mjs,css,html,svg,png,ico,wasm,woff2}"],
      // 404.html and the social preview image are not needed offline. The bundled ONNX
      // runtime (~23 MB) is not used: background removal loads its own copy (see below).
      globIgnores: ["404.html", "og-image.png", "placeholder.svg", "**/ort-wasm*.wasm"],
      maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
      navigateFallback: "index.html",
      navigateFallbackDenylist: [/\/[^/?]+\.[^/]+$/],
      cleanupOutdatedCaches: true,
      // Lato is bundled with the app (its woff2 files are precached above), so the model is the only runtime cache.
      runtimeCaching: [
        {
          // Background removal model and runtime. Downloaded on first use, then kept for offline use.
          // The URLs include the library version, so cached files never go stale.
          urlPattern: /^https:\/\/staticimgly\.com\/.*/i,
          handler: "CacheFirst",
          options: {
            cacheName: "background-removal-model",
            expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 365 },
            cacheableResponse: { statuses: [0, 200] },
          },
        },
      ],
    },
  };
}
