import { PDFDocument } from "pdf-lib";
import { canvasToBlob } from "./image";
import { loadPdfDocument, openPdf, pdfDocToBlob, renderPageToCanvas } from "./pdf";

export interface RasterOptions {
  dpi: number;
  quality: number;
  grayscale: boolean;
}

type Progress = (msg: string) => void;

/** Lossless: rewrite the file with object streams and drop unused objects. */
export async function compressLossless(file: Blob): Promise<Blob> {
  const src = await loadPdfDocument(file);
  const out = await PDFDocument.create();
  const pages = await out.copyPages(src, src.getPageIndices());
  pages.forEach((p) => out.addPage(p));
  const title = src.getTitle();
  if (title) out.setTitle(title);
  return pdfDocToBlob(out);
}

function toGray(canvas: HTMLCanvasElement) {
  const ctx = canvas.getContext("2d")!;
  const img = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const d = img.data;
  for (let i = 0; i < d.length; i += 4) {
    const v = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    d[i] = d[i + 1] = d[i + 2] = v;
  }
  ctx.putImageData(img, 0, 0);
}

interface RenderedPage {
  canvas: HTMLCanvasElement;
  /** Page size in points as displayed. */
  width: number;
  height: number;
}

async function renderAll(file: Blob, dpi: number, grayscale: boolean, progress?: Progress): Promise<RenderedPage[]> {
  const doc = await openPdf(file);
  try {
    const out: RenderedPage[] = [];
    for (let i = 1; i <= doc.numPages; i++) {
      progress?.(`Rendering page ${i} of ${doc.numPages} at ${dpi} DPI…`);
      const page = await doc.getPage(i);
      const vp = page.getViewport({ scale: 1 });
      const canvas = await renderPageToCanvas(doc, i, dpi / 72);
      if (grayscale) toGray(canvas);
      out.push({ canvas, width: vp.width, height: vp.height });
    }
    return out;
  } finally {
    void doc.destroy();
  }
}

async function encodeAll(pages: RenderedPage[], quality: number): Promise<Blob[]> {
  return Promise.all(pages.map((p) => canvasToBlob(p.canvas, "image/jpeg", quality)));
}

async function buildPdf(pages: RenderedPage[], jpegs: Blob[]): Promise<Blob> {
  const out = await PDFDocument.create();
  for (let i = 0; i < pages.length; i++) {
    const img = await out.embedJpg(await jpegs[i].arrayBuffer());
    const page = out.addPage([pages[i].width, pages[i].height]);
    page.drawImage(img, { x: 0, y: 0, width: pages[i].width, height: pages[i].height });
  }
  out.setCreator("ANURUP");
  return pdfDocToBlob(out);
}

/** Rasterise every page to a JPEG at the given DPI/quality. Text stops being selectable. */
export async function compressRaster(file: Blob, opts: RasterOptions, progress?: Progress): Promise<Blob> {
  const pages = await renderAll(file, opts.dpi, opts.grayscale, progress);
  progress?.("Encoding…");
  return buildPdf(pages, await encodeAll(pages, opts.quality));
}

const DPI_LADDER = [150, 120, 100, 85, 72, 60, 50, 40];

/**
 * Find the sharpest rasterisation (highest DPI, then highest JPEG quality) that fits
 * under `maxBytes`. Returns the best effort plus whether the target was reached.
 */
export async function compressToSize(
  file: Blob,
  maxBytes: number,
  grayscale: boolean,
  progress?: Progress,
): Promise<{ blob: Blob; dpi: number; quality: number; reached: boolean }> {
  let fallback: { blob: Blob; dpi: number; quality: number } | null = null;

  for (const dpi of DPI_LADDER) {
    const pages = await renderAll(file, dpi, grayscale, progress);
    const overhead = 1500 + pages.length * 600;
    const fits = async (q: number) => {
      const jpegs = await encodeAll(pages, q);
      return { jpegs, total: jpegs.reduce((n, b) => n + b.size, 0) + overhead };
    };

    progress?.(`Trying ${dpi} DPI…`);
    const low = await fits(0.3);
    if (low.total > maxBytes) {
      const blob = await buildPdf(pages, low.jpegs);
      if (!fallback || blob.size < fallback.blob.size) fallback = { blob, dpi, quality: 0.3 };
      continue; // too big even at low quality → fewer pixels
    }

    // Binary search the highest quality that still fits.
    let lo = 0.3;
    let hi = 0.85;
    let best = low;
    let bestQ = 0.3;
    const top = await fits(hi);
    if (top.total <= maxBytes) {
      best = top;
      bestQ = hi;
    } else {
      for (let i = 0; i < 5; i++) {
        const mid = (lo + hi) / 2;
        const r = await fits(mid);
        if (r.total <= maxBytes) {
          best = r;
          bestQ = mid;
          lo = mid;
        } else hi = mid;
      }
    }
    progress?.("Building PDF…");
    let blob = await buildPdf(pages, best.jpegs);
    // Overhead estimate was optimistic: step quality down until it fits.
    let q = bestQ;
    while (blob.size > maxBytes && q > 0.3) {
      q = Math.max(0.3, q - 0.08);
      blob = await buildPdf(pages, await encodeAll(pages, q));
    }
    if (blob.size <= maxBytes) return { blob, dpi, quality: q, reached: true };
    if (!fallback || blob.size < fallback.blob.size) fallback = { blob, dpi, quality: q };
  }
  return { ...fallback!, reached: false };
}
