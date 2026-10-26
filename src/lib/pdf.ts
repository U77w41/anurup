import { PDFDocument, PDFPage } from "pdf-lib";
import { describePdfError } from "./pdfRender";

// Rendering helpers live in pdfRender.ts (no pdf-lib) so previews stay out of the main bundle.
export { getPdfJs, openPdf, renderPageToCanvas, renderThumbnail, describePdfError } from "./pdfRender";
export type { PDFDocumentProxy } from "./pdfRender";

/* ------------------------------------------------------------------ */
/* pdf-lib (editing)                                                    */
/* ------------------------------------------------------------------ */

export async function loadPdfDocument(blob: Blob): Promise<PDFDocument> {
  const bytes = await blob.arrayBuffer();
  try {
    return await PDFDocument.load(bytes);
  } catch (e) {
    throw new Error(describePdfError(e));
  }
}

export async function pdfDocToBlob(doc: PDFDocument): Promise<Blob> {
  const bytes = await doc.save({ useObjectStreams: true });
  return new Blob([bytes as BlobPart], { type: "application/pdf" });
}

export async function getPageCount(blob: Blob): Promise<number> {
  const doc = await loadPdfDocument(blob);
  return doc.getPageCount();
}


/** Normalised page rotation in degrees (0/90/180/270). */
export function pageRotation(page: PDFPage): number {
  return (((page.getRotation().angle % 360) + 360) % 360) as number;
}

/** The visible area of the page (CropBox, falling back to MediaBox) — what viewers show. */
function viewBox(page: PDFPage) {
  try {
    return page.getCropBox();
  } catch {
    const { width, height } = page.getSize();
    return { x: 0, y: 0, width, height };
  }
}

/** Size of the page as it is displayed (i.e. after /Rotate is applied). */
export function visualSize(page: PDFPage): { width: number; height: number } {
  const { width, height } = viewBox(page);
  const r = pageRotation(page);
  return r === 90 || r === 270 ? { width: height, height: width } : { width, height };
}

/**
 * Map a point measured on the *displayed* page (origin bottom-left, y up) into the
 * page's unrotated user space, plus the rotation to apply to drawn content so it
 * appears upright. Lets stamps/signatures land correctly on rotated or cropped pages.
 */
export function visualToPage(page: PDFPage, vx: number, vy: number): { x: number; y: number; rotate: number } {
  const { x: ox, y: oy, width: W, height: H } = viewBox(page);
  switch (pageRotation(page)) {
    case 90:
      return { x: ox + W - vy, y: oy + vx, rotate: 90 };
    case 180:
      return { x: ox + W - vx, y: oy + H - vy, rotate: 180 };
    case 270:
      return { x: ox + vy, y: oy + H - vx, rotate: 270 };
    default:
      return { x: ox + vx, y: oy + vy, rotate: 0 };
  }
}
