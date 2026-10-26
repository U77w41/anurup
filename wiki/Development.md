# Development

## Run locally

Requires Node.js 18+.

```bash
git clone https://github.com/U77w41/anurup.git
cd anurup
npm ci
npm run dev        # http://localhost:8080
npm test           # unit tests
npm run build      # production build into dist/
npm run preview    # serve dist/ at http://localhost:4173/anurup/
```

## How the code is organised

The [README](https://github.com/U77w41/anurup#project-structure) has the full folder map. The short version:

- `src/seo/content.ts` holds every tool's name, page title, meta description, heading, intro, how-to steps and FAQ.
- `src/lib/tools.ts` turns that into the tool registry and adds icons and suggested next steps.
- `src/pages/tools/` has one React page per tool. Each uses `FileDropZone` for input and `ResultPanel` for output.
- `src/seo/prerender.ts` is a Vite plugin. After the build it writes `dist/<tool-id>/index.html` for every tool, plus `sitemap.xml` and `404.html`.
- `src/seo/pwa.ts` has the web app manifest and service worker settings used by `vite-plugin-pwa`. `src/components/PwaPrompt.tsx` shows the "new version" message and `src/lib/install.ts` powers the Install app button.

The service worker is only built for production. To test install and offline use, run `npm run build && npm run preview` and open http://localhost:4173/anurup/. In Chrome DevTools, the **Application** tab shows the manifest, the service worker and an **Offline** switch.

## Add a tool

1. Add its copy to `src/seo/content.ts`.
2. Add its icon to `ICONS` in `src/lib/tools.ts`.
3. Create `src/pages/tools/YourTool.tsx` with `Layout`, `FileDropZone`, `useIncomingFiles` and `ResultPanel`.
4. Add the route to `pages` in `src/App.tsx`.
5. Run `npm test`. It checks that the new tool's titles and descriptions are complete and within length limits.

## Deploy

Pushing to `main` runs `.github/workflows/deploy.yml`, which builds the site and publishes it to GitHub Pages. In the repository settings, **Pages → Source** must be set to **GitHub Actions**.

For a custom domain or a different repo name, change `SITE.url` in `src/seo/content.ts` and set `BASE_PATH` for the build (for example `BASE_PATH=/` for a domain root).

## Edit this wiki

The wiki pages live in the `wiki/` folder of the main repository. A GitHub Action copies them to the GitHub wiki on every push to `main`, so edit the files there rather than on the wiki website. Changes made on the website are overwritten by the next sync.
