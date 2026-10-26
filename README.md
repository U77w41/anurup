<p align="center"><img src="anurup_logo.svg" alt="ANURUP logo" width="96" height="96"></p>

# ANURUP: free photo and PDF tools for online form uploads

**A fast, privacy-first photo & PDF toolkit that runs entirely in the browser, no login or sign-up required.** Resize a photo to an exact KB limit, make a passport size photo, clean up a signature, convert JPG to PDF, compress a PDF to 100 KB, merge PDFs or remove a PDF password, all without uploading your files anywhere.

**Open the app:** https://u77w41.github.io/anurup/ · **Guides:** [Wiki](https://github.com/U77w41/anurup/wiki)

Government exam, job, visa and KYC portals each want something slightly different: a 35×45 mm photo under 50 KB, a signature at 140×60 px, one merged PDF under 500 KB. ANURUP handles each of these on your device, and lets you pass a file from one tool to the next without downloading and re-uploading it.

---

## Photo and signature tools

| Tool | What it does |
| --- | --- |
| [Passport Size Photo Maker](https://u77w41.github.io/anurup/passport-photo/) | 35×45 mm, 2×2 inch, 33×48 mm, 50×70 mm or a custom size. Drag the photo into a face guide, set the background colour and DPI, and print several copies on a 4×6 inch or A4 sheet. |
| [Resize Image to KB & Pixels](https://u77w41.github.io/anurup/size-targeter/) | Resize to exact pixels, cm, mm or inches at any DPI and keep the file between a **minimum and maximum KB**, for example 200×230 px and 20-50 KB. The DPI is written into the JPG. |
| [Compress Image to KB](https://u77w41.github.io/anurup/image-compressor/) | Compress JPG, PNG or WebP to a target like 100 KB or 50 KB, or by quality. Works on many images at once and downloads as a ZIP. |
| [Crop, Rotate & Flip Image](https://u77w41.github.io/anurup/crop-rotate/) | Free crop or fixed ratios (1:1, 35×45 mm, 3:4, 4:3, 16:9, custom), 90° rotation and mirroring. Mouse and touch. |
| [Remove Image Background](https://u77w41.github.io/anurup/background-removal/) | On-device AI removes the background. Replace it with white, light blue, red, any colour or transparency, and switch colours without running the model again. |
| [Signature Cleaner](https://u77w41.github.io/anurup/signature-cleaner/) | Turns a phone photo of a signature into clean black or blue ink on white or transparent. Evens out shadows, picks a threshold and trims the margin. |
| [JPG, PNG & WebP Converter](https://u77w41.github.io/anurup/format-converter/) | Convert PNG to JPG, JPG to PNG or WebP and back, in batches, with a quality setting. |

## PDF tools

| Tool | What it does |
| --- | --- |
| [PDF Viewer](https://u77w41.github.io/anurup/pdf-viewer/) | Read a PDF page by page with zoom and full screen before you submit it. |
| [JPG to PDF Converter](https://u77w41.github.io/anurup/image-to-pdf/) | Combine photos or scans into one PDF. A4, Letter, Legal or fit-to-image pages, orientation, margins and a small-file option. |
| [Merge PDF](https://u77w41.github.io/anurup/pdf-merger/) | Join PDFs in any order, with a preview of each file and of the result. |
| [Split PDF](https://u77w41.github.io/anurup/pdf-splitter/) | Pick pages from thumbnails (Shift+click for a run) or type ranges like `1-3, 5, 8-`. Or split into single pages, every N pages, or custom groups. |
| [Organize PDF Pages](https://u77w41.github.io/anurup/pdf-page-manager/) | Drag page thumbnails to reorder, rotate one page or all of them, delete and restore pages. |
| [Compress PDF to KB](https://u77w41.github.io/anurup/pdf-compressor/) | Lossless clean-up, *Balanced* and *Strong* presets, or a **target size in KB** (for example 100 KB or 500 KB). Optional grayscale. |
| [PDF to JPG / PNG](https://u77w41.github.io/anurup/pdf-to-images/) | Save chosen pages as JPG or PNG at 72-300 DPI, one by one or as a ZIP. |
| [Add Page Numbers & Watermark](https://u77w41.github.io/anurup/pdf-stamp/) | Page numbers in six positions and four formats, with a start number and an option to skip the cover. Diagonal or horizontal text watermark. Rotated pages come out the right way up. |
| [Sign & Fill PDF](https://u77w41.github.io/anurup/pdf-sign/) | Place a signature or photo and type text or today's date anywhere on a page. Drag to move, resize from the corner. |
| [Remove PDF Password](https://u77w41.github.io/anurup/pdf-unlock/) | Unlock a bank statement, payslip or e-Aadhaar PDF with its password, or remove print and copy restrictions. QPDF removes the encryption itself, so text, links, bookmarks and form fields are kept, unlike *Print → Save as PDF*. Supports RC4 40/128-bit and AES 128/256-bit. |

## Works across tools

- **Continue with** - every result has buttons to open it in the next tool, for example *Crop → Compress* or *JPG to PDF → Compress PDF*. Suggested next steps come first.
- **Workspace** - a shared file tray (in the sidebar, or the tray icon on mobile). Files you save or pass along stay here after a page refresh (IndexedDB) and open in any tool that accepts them. Select several to send them together to JPG to PDF or Merge PDF.
- **Choose from workspace** - every upload area can pick files from the workspace instead of the disk.
- **Previews** - every result has an image or PDF preview, and every input file has an eye button.
- **Paste to upload** - image tools accept Ctrl/⌘+V from the clipboard.
- **Protected PDFs are flagged** - PDF tools mark encrypted files with a *Protected · Unlock* badge and unlock them in place.
- **Search and categories** - find a tool by name or task ("50 KB", "signature", "password"), or filter to Photo & Signature or PDF tools.
- **Dark mode** - follows your system setting until you switch it with *Dark Mode* in the sidebar (sun/moon icon on mobile). The choice is remembered.

## Install as an app and use it offline

ANURUP is a Progressive Web App. Install it and it opens in its own window from the dock, Start menu or home screen. After the first visit every tool works without internet, installed or not.

| Where | How |
| --- | --- |
| Chrome or Edge on a computer | Click **Install app** in the sidebar, or the install icon in the address bar. |
| Android (Chrome) | Tap the download icon in the top bar, or **Install app** in the menu. |
| iPhone and iPad (Safari) | Share → **Add to Home Screen**. |
| Safari on a Mac | **File → Add to Dock**. |

The app files (about 6 MB) are cached on first visit. Remove Image Background downloads its AI model on first use and keeps it for offline use after that. When a new version is deployed, a **Reload** prompt appears, and nothing changes until you click it. Full steps are on the [Install as an app](https://github.com/U77w41/anurup/wiki/Install-as-an-App) wiki page.

## Common questions

**Are my files uploaded to a server?**
No. Every tool runs in your browser with Canvas, [pdf-lib](https://pdf-lib.js.org/), [PDF.js](https://mozilla.github.io/pdf.js/) and [QPDF](https://qpdf.sourceforge.io/) compiled to WebAssembly. Files and PDF passwords stay on your device.

**How do I resize a photo to 20 KB for an exam form?**
Open [Resize Image to KB & Pixels](https://u77w41.github.io/anurup/size-targeter/), enter the pixel size the form asks for and set Max size to 20. If the form also has a minimum, fill in Min size.

**How do I compress a PDF to 100 KB?**
Open [Compress PDF to KB](https://u77w41.github.io/anurup/pdf-compressor/), choose Target size and type 100. Turn on Grayscale for long scans.

**Does it work offline?**
Yes. After the first visit every tool works without internet, and you can [install it as an app](#install-as-an-app-and-use-it-offline). Remove Image Background needs a connection the first time to download its model.

**Can it unlock a PDF without the password?**
No. You need the password that opens the file. PDFs that only block printing or copying unlock without one.

More step-by-step guides are in the [wiki](https://github.com/U77w41/anurup/wiki).

## Privacy

Workspace files are stored in the browser's IndexedDB and can be cleared from the Workspace panel. A service worker caches the app's own files so it runs offline; it never stores or sends your files. The only other network requests are:

- the background-removal model, downloaded from IMG.LY's CDN the first time you use **Remove Image Background** (cached after that);
- web fonts from Google Fonts.

## Getting started

Requires Node.js 18+ (CI uses Node 20).

```bash
git clone https://github.com/U77w41/anurup.git
cd anurup
npm ci
npm run dev          # http://localhost:8080
```

### Scripts

| Command | Description |
| --- | --- |
| `npm run dev` | Start the Vite dev server on port 8080. |
| `npm run build` | Production build into `dist/`, including one prerendered page per tool, `sitemap.xml`, `404.html`, the web app manifest and the service worker. |
| `npm run preview` | Serve the production build at http://localhost:4173/anurup/. |
| `npm test` | Run unit tests (Vitest). |
| `npm run lint` | ESLint. |
| `npm run typecheck` | TypeScript type check without emitting. |

## Deployment (GitHub Pages)

`.github/workflows/deploy.yml` builds and publishes `dist/` on every push to `main`.

1. In the repository, open **Settings → Pages** and set **Source** to **GitHub Actions**.
2. Push to `main`, or run the workflow from the **Actions** tab.

Each tool has its own URL, such as `/anurup/pdf-merger/`. At build time a small Vite plugin (`src/seo/prerender.ts`) writes a static HTML page for every tool with its own title, description, canonical link, Open Graph tags, structured data and page text, so search engines and link previews see real content. React takes over once the page loads. Old `#/` links still work and are redirected.

The web app manifest and service worker come from [vite-plugin-pwa](https://vite-pwa-org.netlify.app/) with the settings in `src/seo/pwa.ts`. The service worker precaches the app shell and every tool page, and caches Google Fonts and the background-removal model the first time they load. It only exists in production builds, so test install and offline use with `npm run build && npm run preview`.

**Custom domain or different repo name:** change `SITE.url` in `src/seo/content.ts` and build with `BASE_PATH` set to the new path, for example `BASE_PATH=/ npm run build` for a domain root.

## Project structure

```
src/
├── App.tsx                    # Routes (each tool is lazy-loaded)
├── main.tsx                   # Entry; redirects old #/ links
├── pages/
│   ├── Index.tsx              # Home: search and tool grid
│   └── tools/                 # One file per tool
├── seo/
│   ├── content.ts             # Tool names, page titles, descriptions, how-to steps and FAQ
│   ├── prerender.ts           # Build plugin: per-tool HTML, sitemap.xml, 404.html
│   ├── pwa.ts                 # Web app manifest, app shortcuts and service worker caching rules
│   └── head.ts                # Updates <head> tags on client-side navigation
├── components/
│   ├── Layout.tsx             # Sidebar, page header, footer
│   ├── ToolGuide.tsx          # How-to steps and questions under each tool
│   ├── FileDropZone.tsx       # Upload: drag & drop, paste, pick from workspace, preview, re-order
│   ├── ResultPanel.tsx        # Output: preview, download, save, "Continue with"
│   ├── WorkspaceDrawer.tsx    # Shared file tray
│   ├── ThemeToggle.tsx        # Dark mode switch, title bar colour
│   ├── PwaPrompt.tsx          # Registers the service worker, "new version" and "works offline" messages
│   ├── pdf/                   # PdfViewer, PdfThumbnail, PageSelectGrid
│   └── ui/                    # shadcn/ui primitives
├── hooks/use-tool-io.ts       # useIncomingFiles / useSendToTool - file hand-off between tools
└── lib/
    ├── tools.ts               # Tool registry: icons, inputs, suggested next steps
    ├── install.ts             # "Install app" button (beforeinstallprompt)
    ├── workspace.tsx          # Workspace context + IndexedDB persistence
    ├── image.ts               # Canvas helpers, quality search, compress-to-target
    ├── jpeg.ts                # JFIF DPI writing, lossless padding to a minimum size
    ├── pdf.ts / pdfRender.ts  # pdf-lib editing helpers / PDF.js rendering helpers
    ├── pdfCompress.ts         # Lossless, preset and target-size PDF compression
    ├── qpdf.ts                # PDF decryption (QPDF/WASM) and encrypted-file detection
    ├── signature.ts           # Signature clean-up (lighting correction + Otsu)
    └── pageRange.ts           # "1-3, 5, 8-" parsing
public/pwa-*.png               # App icons (192, 512 and maskable 512)
wiki/                          # Source of the GitHub wiki pages
```

## Adding a tool

1. **Write its copy** in `src/seo/content.ts`: id, name, category, what it accepts, card text, page title, meta description, H1, intro, how-to steps and FAQ.
2. **Add its icon** to the `ICONS` map in `src/lib/tools.ts`, and optionally to `SUGGESTED_NEXT`.
3. **Create the page** in `src/pages/tools/YourTool.tsx`:
   - wrap it in `<Layout>`;
   - take input with `<FileDropZone onFiles={handleFiles} …/>` and call `useIncomingFiles(handleFiles)` so other tools can hand files to it;
   - show output with `<ResultPanel toolId="your-tool" items={[{ blob, name }]} />`. Preview, download, workspace and "Continue with" come with it.
4. **Add the route** in the `pages` map in `src/App.tsx`.

The home page, menus, prerendered page and sitemap pick up the new tool from these files. `npm test` checks that every tool has complete copy within search-result length limits.

## Tech stack

React 18 · TypeScript · Vite · Tailwind CSS · shadcn/ui (Radix) · pdf-lib · PDF.js (`pdfjs-dist`, legacy build for older mobile browsers) · QPDF (`@neslinesli93/qpdf-wasm`) · `@imgly/background-removal` · JSZip · next-themes · vite-plugin-pwa (Workbox) · Vitest

## Limitations

- **Password-protected PDFs** need to be unlocked with the password before other tools can edit them. Use **Remove PDF Password** or the *Unlock* badge on the file. Certificate-encrypted PDFs (public-key security) are not supported.
- **Balanced, Strong and Target-size PDF compression** re-render pages as images, so text is no longer selectable and form fields are flattened. Use *Lossless* when that matters.
- **Stamped and typed PDF text** uses the built-in Helvetica font and supports Latin characters only.
- **WebP export** depends on the browser's encoder. Older Safari versions fall back to JPG.
- Very large PDFs (hundreds of pages) are limited by the device's memory, because everything runs in the tab.

## License

Copyright © 2026 Ujjwal Chowdhury. All rights reserved - see [LICENSE](LICENSE). The source is public for demonstration, portfolio and testing purposes only.
