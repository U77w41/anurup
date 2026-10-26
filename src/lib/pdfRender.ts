import type { PDFDocumentProxy } from "pdfjs-dist/legacy/build/pdf.mjs";

/* ------------------------------------------------------------------ */
/* pdf.js (rendering) — loaded lazily so the home page stays light.    */
/* The legacy build keeps older mobile browsers working.               */
/* ------------------------------------------------------------------ */

type PdfJs = typeof import("pdfjs-dist/legacy/build/pdf.mjs");
let pdfjsPromise: Promise<PdfJs> | null = null;

export function getPdfJs(): Promise<PdfJs> {
  if (!pdfjsPromise) {
    pdfjsPromise = Promise.all([
      import("pdfjs-dist/legacy/build/pdf.mjs"),
      import("pdfjs-dist/legacy/build/pdf.worker.min.mjs?url"),
    ]).then(([pdfjs, worker]) => {
      pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
      return pdfjs;
    });
  }
  return pdfjsPromise;
}

export type { PDFDocumentProxy };

/** Open a PDF for rendering. Caller should `destroy()` the proxy when done. */
export async function openPdf(blob: Blob): Promise<PDFDocumentProxy> {
  const pdfjs = await getPdfJs();
  // pdf.js transfers the buffer to its worker, so always hand it a fresh copy.
  const data = new Uint8Array(await blob.arrayBuffer());
  return pdfjs.getDocument({ data, isEvalSupported: false }).promise;
}

/** Render one page (1-based) into a new canvas at `scale` (1 = 72 DPI). */
export async function renderPageToCanvas(doc: PDFDocumentProxy, pageNumber: number, scale: number): Promise<HTMLCanvasElement> {
  const page = await doc.getPage(pageNumber);
  const viewport = page.getViewport({ scale });
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.floor(viewport.width));
  canvas.height = Math.max(1, Math.floor(viewport.height));
  const ctx = canvas.getContext("2d")!;
  await page.render({ canvasContext: ctx, viewport }).promise;
  page.cleanup();
  return canvas;
}

/* ------------------------------------------------------------------ */
/* Thumbnail cache — keyed by Blob identity so lists re-render cheaply. */
/* ------------------------------------------------------------------ */

const thumbCache = new WeakMap<Blob, Map<string, string>>();

export async function renderThumbnail(blob: Blob, pageNumber = 1, width = 160, doc?: PDFDocumentProxy): Promise<string> {
  const key = `${pageNumber}@${width}`;
  let map = thumbCache.get(blob);
  const hit = map?.get(key);
  if (hit) return hit;

  const ownDoc = !doc;
  const pdf = doc ?? (await openPdf(blob));
  try {
    const page = await pdf.getPage(pageNumber);
    const base = page.getViewport({ scale: 1 });
    const scale = (width * Math.min(2, window.devicePixelRatio || 1)) / base.width;
    const canvas = await renderPageToCanvas(pdf, pageNumber, scale);
    const url = canvas.toDataURL("image/jpeg", 0.8);
    if (!map) {
      map = new Map();
      thumbCache.set(blob, map);
    }
    map.set(key, url);
    return url;
  } finally {
    if (ownDoc) void pdf.destroy();
  }
}


export function describePdfError(e: unknown): string {
  const msg = e instanceof Error ? e.message : String(e);
  if (/encrypt|password/i.test(msg)) return "This PDF is password-protected or restricted. Remove the protection with the Unlock PDF tool, then try again.";
  if (/Invalid PDF|No PDF header|parse/i.test(msg)) return "This file doesn't look like a valid PDF.";
  return msg || "Could not read this PDF.";
}
