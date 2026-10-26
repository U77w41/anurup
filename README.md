<p align="center"><img src="anurup_logo.svg" alt="ANURUP logo" width="96" height="96"></p>

# ANURUP

**A fast, privacy-first photo & PDF toolkit that runs entirely in the browser no login or signup required** - format, compress and prepare documents and images for form-submission portals.

Government exam and visa portals all want something slightly different: a 35×45 mm photo under 50 KB, a signature at 140×60 px, a single merged PDF under 500 KB. ANURUP does all of it in the browser - nothing is uploaded - and lets you pass a file from one tool to the next without downloading and re-uploading it.

**Live:** https://u77w41.github.io/anurup/

---

## Features

### Photo & signature tools

| Tool                               | What it does                                                                                                                                                                         |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| **Passport Photo Maker**     | Presets (35×45 mm, 2×2 in, 33×48 mm, 50×70 mm, custom), drag-to-position with a face guide, zoom, background fill, DPI written into the JPEG, optional 4×6 in / A4 print sheet. |
| **Exact Size & KB Targeter** | Resize to px / cm / mm / inches at any DPI, crop-to-fill / pad / stretch, and land between a **minimum and maximum KB** (quality search + lossless padding for minimums).      |
| **Image Compressor**         | Batch compress to a target KB or a quality level; optional downscaling and max side length; files already under the target are kept as-is.                                           |
| **Crop, Rotate & Flip**      | Drag-to-crop with handles, fixed ratios (1:1, 35×45 mm, 3:4, 4:3, 16:9, custom), 90° rotation, mirror/flip. Mouse and touch.                                                       |
| **Background Remover**       | On-device AI segmentation (`@imgly/background-removal`), then white / blue / red / custom / transparent fill - change the colour without re-running the model.                     |
| **Signature Cleaner**        | Turns a phone photo of a signature into clean black/blue ink on white or transparent. Corrects uneven lighting, auto threshold (Otsu), auto-trim.                                    |
| **Format Converter**         | JPG ⇄ PNG ⇄ WebP, batch, with quality control.                                                                                                                                     |

### PDF tools

| Tool                               | What it does                                                                                                                                                                                                                                                              |
| ---------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **PDF Viewer**               | Page-by-page preview with zoom and full-screen mode.                                                                                                                                                                                                                      |
| **Image to PDF**             | Images → one PDF. A4 / Letter / Legal / fit-to-image, orientation, margins, and an output-size preset. Re-order before building.                                                                                                                                         |
| **PDF Merger**               | Combine PDFs in any order, with a preview of each input and of the merged result.                                                                                                                                                                                         |
| **PDF Splitter**             | Pick pages from thumbnails (Shift+click for runs) or type ranges like `1-3, 5, 8-`; or split into single pages, every N pages, or custom groups.                                                                                                                        |
| **Organize Pages**           | Real page thumbnails - drag to reorder, rotate per page or all pages, delete/restore.                                                                                                                                                                                     |
| **PDF Compressor**           | Lossless clean-up, *Balanced* / *Strong* presets, or **target size in KB** (searches DPI and JPEG quality for the sharpest file that fits). Optional grayscale.                                                                                                 |
| **PDF to Images**            | Export selected pages as JPG/PNG at 72–300 DPI; download individually or as a ZIP.                                                                                                                                                                                       |
| **Page Numbers & Watermark** | Six positions, four formats, start number, skip cover page; diagonal or horizontal text watermark with opacity/colour. Handles rotated pages.                                                                                                                             |
| **Sign & Fill PDF**          | Place a signature or photo and type text or today’s date anywhere on any page; drag to move, resize from the corner.                                                                                                                                                     |
| **Unlock PDF**               | Remove the open password (you enter it once) or print/copy/edit restrictions. The encryption is stripped losslessly with QPDF - unlike *Print → Save as PDF*, text stays selectable and links, bookmarks and form fields are kept. RC4 40/128-bit and AES 128/256-bit. |

### Works across tools

- **Continue with…** - every result has one-click buttons to open it in the next tool (e.g. *Crop → Compress*, *Images → PDF → Compress PDF*). Suggested next steps are listed first.
- **Workspace** - a shared file tray (in the sidebar, or the tray icon on mobile). Results you save or pass along live here, survive a page refresh (IndexedDB), and can be opened in any compatible tool. Select several files to send them together to a multi-file tool such as Image to PDF or PDF Merger.
- **Choose from workspace** - every upload area can pick files from the workspace instead of the disk.
- **Previews everywhere** - inline image/PDF preview on every result, plus an eye button on every input file.
- **Paste to upload** - image tools accept Ctrl/⌘+V from the clipboard.
- **Protected PDFs are flagged** - any PDF tool marks encrypted inputs with a *Protected · Unlock* badge and unlocks them in place.
- **Search & categories** - find a tool by name or task (“50 KB”, “signature”, “password”), or filter to Photo & Signature / PDF tools.
- **Dark mode** - follows your system setting by default; switch it with *Dark Mode* in the sidebar (sun/moon icon on mobile). The choice is remembered.

## Privacy

All processing happens locally with Canvas, [pdf-lib](https://pdf-lib.js.org/), [PDF.js](https://mozilla.github.io/pdf.js/) and [QPDF](https://qpdf.sourceforge.io/) compiled to WebAssembly. Files - and PDF passwords - are never sent to a server. Workspace files are stored in the browser’s IndexedDB and can be cleared from the Workspace panel.

The only network requests after the page loads are:

- the background-removal model, downloaded from IMG.LY’s CDN the first time you use **Background Remover** (cached afterwards);
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

| Command               | Description                             |
| --------------------- | --------------------------------------- |
| `npm run dev`       | Start the Vite dev server on port 8080. |
| `npm run build`     | Production build into `dist/`.        |
| `npm run preview`   | Serve the production build locally.     |
| `npm test`          | Run unit tests (Vitest).                |
| `npm run lint`      | ESLint.                                 |
| `npm run typecheck` | TypeScript type check without emitting. |

## Deployment (GitHub Pages)

`.github/workflows/deploy.yml` builds and publishes `dist/` on every push to `main`.

1. In the repository, open **Settings → Pages** and set **Source** to **GitHub Actions**.
2. Push to `main` (or run the workflow manually from the **Actions** tab).

The app uses a relative base path (`base: "./"`) and hash-based routing (`/#/pdf-merger`), so it works from any sub-path or custom domain without extra configuration - no `404.html` workaround needed. Any static host (Netlify, Vercel, S3, a plain folder) works the same way: serve the contents of `dist/`.

## Project structure

```
src/
├── App.tsx                    # Routes (each tool is lazy-loaded)
├── pages/
│   ├── Index.tsx              # Home: searchable tool grid
│   └── tools/                 # One file per tool
├── components/
│   ├── Layout.tsx             # Header (with Workspace), page title, footer
│   ├── FileDropZone.tsx       # Upload: drag & drop, paste, pick from workspace, preview, re-order
│   ├── ResultPanel.tsx        # Output: preview, download, save, "Continue with…"
│   ├── WorkspaceDrawer.tsx    # Shared file tray
│   ├── FilePreview.tsx        # Thumbnails, inline + dialog previews
│   ├── Controls.tsx           # Segmented buttons, fields, panels
│   ├── pdf/                   # PdfViewer, PdfThumbnail, PageSelectGrid
│   └── ui/                    # shadcn/ui primitives
├── hooks/use-tool-io.ts       # useIncomingFiles / useSendToTool - file hand-off between tools
└── lib/
    ├── tools.ts               # Tool registry: ids, inputs, suggested next steps
    ├── workspace.tsx          # Workspace context + IndexedDB persistence
    ├── image.ts               # Canvas helpers, quality search, compress-to-target
    ├── jpeg.ts                # JFIF DPI writing, lossless padding to a minimum size
    ├── pdf.ts / pdfRender.ts  # pdf-lib editing helpers / PDF.js rendering helpers
    ├── pdfCompress.ts         # Lossless, preset and target-size PDF compression
    ├── qpdf.ts                # PDF decryption (QPDF/WASM) and encrypted-file detection
    ├── signature.ts           # Signature clean-up (lighting correction + Otsu)
    └── pageRange.ts           # "1-3, 5, 8-" parsing
```

## Adding a tool

1. **Register it** in `src/lib/tools.ts` - id, title, icon, category, the file kind it accepts (`image` / `pdf`) and whether it takes multiple files. Optionally add it to `SUGGESTED_NEXT`.
2. **Create the page** in `src/pages/tools/YourTool.tsx`:
   - wrap it in `<Layout title=… description=…>`;
   - take input with `<FileDropZone onFiles={handleFiles} …/>` and call `useIncomingFiles(handleFiles)` so other tools can hand files to it;
   - show output with `<ResultPanel toolId="your-tool" items={[{ blob, name }]} />` - preview, download, workspace and “Continue with…” come for free.
3. **Add the route** in the `pages` map in `src/App.tsx`.

The home page, workspace menus and “Continue with…” lists pick the new tool up automatically from the registry.

## Tech stack

React 18 · TypeScript · Vite · Tailwind CSS · shadcn/ui (Radix) · pdf-lib · PDF.js (`pdfjs-dist`, legacy build for older mobile browsers) · QPDF (`@neslinesli93/qpdf-wasm`) · `@imgly/background-removal` · JSZip · Vitest

## Limitations

- **Password-protected PDFs** must be unlocked (with the password) before other tools can edit them - use **Unlock PDF** or the *Unlock* badge on the file. Certificate-encrypted PDFs (public-key security) aren’t supported.
- **Balanced / Strong / Target-size PDF compression** re-renders pages as images: text is no longer selectable and form fields are flattened. Use *Lossless* when that matters.
- **Stamped and typed PDF text** uses the built-in Helvetica font, so it supports Latin characters only.
- **WebP export** depends on the browser’s encoder (older Safari versions fall back to JPG).
- Very large PDFs (hundreds of pages) are limited by the device’s memory, since everything runs in the tab.

## License

Copyright © 2026 Ujjwal Chowdhury. All rights reserved - see [LICENSE](LICENSE). The source is public for demonstration, portfolio and testing purposes only.
