import { padJpeg, setJpegDpi } from "./jpeg";

export interface LoadedImage {
  img: HTMLImageElement;
  width: number;
  height: number;
}

/** Decode a Blob into an <img>. EXIF orientation is honoured by modern browsers. */
export async function loadImage(blob: Blob): Promise<LoadedImage> {
  const url = URL.createObjectURL(blob);
  try {
    const img = new Image();
    img.decoding = "async";
    img.src = url;
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("Could not read this image. Try a JPG, PNG or WebP file."));
    });
    return { img, width: img.naturalWidth, height: img.naturalHeight };
  } finally {
    // Safe to revoke after load: the decoded bitmap stays attached to the element.
    URL.revokeObjectURL(url);
  }
}

export function createCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(width));
  canvas.height = Math.max(1, Math.round(height));
  return canvas;
}

export function get2d(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas is not supported in this browser.");
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";
  return ctx;
}

export function canvasToBlob(canvas: HTMLCanvasElement, mime: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) =>
    canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("Encoding failed"))), mime, quality),
  );
}

/** Draw a canvas onto a solid background (needed before JPEG export of transparent images). */
export function flatten(canvas: HTMLCanvasElement, color = "#ffffff"): HTMLCanvasElement {
  const out = createCanvas(canvas.width, canvas.height);
  const ctx = get2d(out);
  ctx.fillStyle = color;
  ctx.fillRect(0, 0, out.width, out.height);
  ctx.drawImage(canvas, 0, 0);
  return out;
}

/**
 * Multi-step downscale: halves repeatedly before the final resize, which avoids the
 * aliasing a single large drawImage() produces in some browsers.
 */
export function resizeCanvas(source: CanvasImageSource & { width: number; height: number }, width: number, height: number): HTMLCanvasElement {
  let current: HTMLCanvasElement | (CanvasImageSource & { width: number; height: number }) = source;
  let cw = source.width;
  let ch = source.height;
  while (cw / 2 > width && ch / 2 > height) {
    const step = createCanvas(Math.round(cw / 2), Math.round(ch / 2));
    get2d(step).drawImage(current, 0, 0, step.width, step.height);
    current = step;
    cw = step.width;
    ch = step.height;
  }
  const out = createCanvas(width, height);
  get2d(out).drawImage(current, 0, 0, out.width, out.height);
  return out;
}

export function imageToCanvas(img: HTMLImageElement): HTMLCanvasElement {
  const c = createCanvas(img.naturalWidth, img.naturalHeight);
  get2d(c).drawImage(img, 0, 0);
  return c;
}

export interface EncodeOptions {
  mime: "image/jpeg" | "image/webp" | "image/png";
  /** Upper size bound in bytes. */
  maxBytes?: number;
  /** Lower size bound in bytes (JPEG only — met by lossless padding). */
  minBytes?: number;
  /** Fixed quality when no bounds are given. */
  quality?: number;
  /** Write this DPI into the JPEG header. */
  dpi?: number;
}

export interface EncodeResult {
  blob: Blob;
  quality: number | null;
  /** True when every requested bound was met. */
  withinLimits: boolean;
}

async function finalizeJpeg(blob: Blob, opts: EncodeOptions): Promise<Blob> {
  if (blob.type !== "image/jpeg" || (!opts.dpi && !opts.minBytes)) return blob;
  let bytes: Uint8Array = new Uint8Array(await blob.arrayBuffer());
  if (opts.dpi) bytes = setJpegDpi(bytes, opts.dpi);
  if (opts.minBytes && bytes.length < opts.minBytes) bytes = padJpeg(bytes, opts.minBytes);
  return new Blob([bytes as BlobPart], { type: "image/jpeg" });
}

/**
 * Encode a canvas, binary-searching JPEG/WebP quality so the file lands under `maxBytes`
 * with the best quality possible. PNG is lossless, so it is encoded once.
 */
export async function encodeCanvas(canvas: HTMLCanvasElement, opts: EncodeOptions): Promise<EncodeResult> {
  const source = opts.mime === "image/jpeg" ? flatten(canvas) : canvas;

  if (opts.mime === "image/png") {
    const blob = await canvasToBlob(source, "image/png");
    return { blob, quality: null, withinLimits: !opts.maxBytes || blob.size <= opts.maxBytes };
  }

  // DPI header + padding add a few bytes; reserve room for them.
  const headerReserve = opts.dpi ? 32 : 0;

  if (!opts.maxBytes) {
    const q = opts.quality ?? 0.92;
    const blob = await finalizeJpeg(await canvasToBlob(source, opts.mime, q), opts);
    return { blob, quality: q, withinLimits: true };
  }

  const limit = opts.maxBytes - headerReserve;
  const top = opts.quality ?? 0.95;
  const first = await canvasToBlob(source, opts.mime, top);
  if (first.size <= limit) {
    const blob = await finalizeJpeg(first, opts);
    return { blob, quality: top, withinLimits: true };
  }

  let lo = 0.02;
  let hi = top;
  let best: { blob: Blob; q: number } | null = null;
  for (let i = 0; i < 10; i++) {
    const mid = (lo + hi) / 2;
    const b = await canvasToBlob(source, opts.mime, mid);
    if (b.size <= limit) {
      best = { blob: b, q: mid };
      lo = mid;
    } else {
      hi = mid;
    }
    if (hi - lo < 0.01) break;
  }

  if (!best) {
    const b = await canvasToBlob(source, opts.mime, 0.02);
    const blob = await finalizeJpeg(b, opts);
    return { blob, quality: 0.02, withinLimits: blob.size <= opts.maxBytes };
  }
  const blob = await finalizeJpeg(best.blob, opts);
  return { blob, quality: best.q, withinLimits: blob.size <= opts.maxBytes };
}

/**
 * Compress to a size target, shrinking dimensions in 10% steps if quality alone can't get
 * there. Returns the encoded blob plus the final dimensions.
 */
export async function compressToTarget(
  canvas: HTMLCanvasElement,
  opts: EncodeOptions & { allowDownscale: boolean; minSide?: number },
): Promise<EncodeResult & { width: number; height: number }> {
  let current = canvas;
  let result = await encodeCanvas(current, opts);
  const minSide = opts.minSide ?? 64;
  while (!result.withinLimits && opts.allowDownscale && Math.min(current.width, current.height) * 0.9 >= minSide) {
    current = resizeCanvas(canvas, Math.round(current.width * 0.9), Math.round(current.height * 0.9));
    result = await encodeCanvas(current, opts);
  }
  return { ...result, width: current.width, height: current.height };
}

export function mimeSupported(mime: string): boolean {
  try {
    return createCanvas(1, 1).toDataURL(mime).startsWith(`data:${mime}`);
  } catch {
    return false;
  }
}
