/**
 * Signature clean-up: flatten uneven lighting, separate ink from paper with a threshold,
 * recolour the ink and optionally trim the empty margins.
 */

export interface SignatureOptions {
  /** 0–255 on the lighting-corrected image; null = automatic (Otsu). */
  threshold: number | null;
  /** Ink colour as [r,g,b], or null to keep the original pixel colour. */
  ink: [number, number, number] | null;
  transparent: boolean;
  trim: boolean;
  padding: number;
}

/** Otsu's method on a 256-bin histogram. */
export function otsu(hist: ArrayLike<number>): number {
  let total = 0;
  let sum = 0;
  for (let i = 0; i < 256; i++) {
    total += hist[i];
    sum += i * hist[i];
  }
  let sumB = 0;
  let wB = 0;
  let best = 0;
  let threshold = 127;
  for (let t = 0; t < 256; t++) {
    wB += hist[t];
    if (!wB) continue;
    const wF = total - wB;
    if (!wF) break;
    sumB += t * hist[t];
    const mB = sumB / wB;
    const mF = (sum - sumB) / wF;
    const between = wB * wF * (mB - mF) * (mB - mF);
    if (between > best) {
      best = between;
      threshold = t;
    }
  }
  return threshold;
}

/** Process `source` and return a new canvas plus the threshold that was used. */
export function cleanSignature(source: HTMLCanvasElement, opts: SignatureOptions): { canvas: HTMLCanvasElement; threshold: number } {
  const W = source.width;
  const H = source.height;
  const sctx = source.getContext("2d")!;
  const src = sctx.getImageData(0, 0, W, H);

  // Background estimate: shrink heavily (averages out thin ink strokes), then scale back up.
  const small = document.createElement("canvas");
  small.width = Math.max(4, Math.round(W / 24));
  small.height = Math.max(4, Math.round(H / 24));
  const smctx = small.getContext("2d")!;
  smctx.imageSmoothingQuality = "high";
  smctx.drawImage(source, 0, 0, small.width, small.height);
  const big = document.createElement("canvas");
  big.width = W;
  big.height = H;
  const bctx = big.getContext("2d")!;
  bctx.imageSmoothingQuality = "high";
  bctx.drawImage(small, 0, 0, W, H);
  const bg = bctx.getImageData(0, 0, W, H).data;

  const d = src.data;
  const norm = new Uint8ClampedArray(W * H);
  const hist = new Uint32Array(256);
  for (let i = 0, p = 0; p < norm.length; i += 4, p++) {
    const lum = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
    const bl = Math.max(32, 0.299 * bg[i] + 0.587 * bg[i + 1] + 0.114 * bg[i + 2]);
    const v = Math.min(255, (lum / bl) * 255);
    norm[p] = v;
    hist[norm[p]]++;
  }

  // Otsu drifts towards the (much larger) paper class, so keep it in a sane band.
  const t = opts.threshold ?? Math.max(90, Math.min(210, otsu(hist)));
  const soft = 18; // anti-aliased edge width
  const out = new ImageData(W, H);
  const o = out.data;
  let minX = W;
  let minY = H;
  let maxX = -1;
  let maxY = -1;
  for (let p = 0, i = 0; p < norm.length; p++, i += 4) {
    const a = Math.max(0, Math.min(1, (t + soft / 2 - norm[p]) / soft));
    if (a > 0.15) {
      const x = p % W;
      const y = (p / W) | 0;
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
    const [r, g, b] = opts.ink ?? [d[i], d[i + 1], d[i + 2]];
    if (opts.transparent) {
      o[i] = r;
      o[i + 1] = g;
      o[i + 2] = b;
      o[i + 3] = Math.round(a * 255);
    } else {
      o[i] = Math.round(255 - a * (255 - r));
      o[i + 1] = Math.round(255 - a * (255 - g));
      o[i + 2] = Math.round(255 - a * (255 - b));
      o[i + 3] = 255;
    }
  }

  const full = document.createElement("canvas");
  full.width = W;
  full.height = H;
  full.getContext("2d")!.putImageData(out, 0, 0);

  if (!opts.trim || maxX < 0) return { canvas: full, threshold: t };

  const pad = Math.max(0, Math.round(opts.padding));
  const x0 = Math.max(0, minX - pad);
  const y0 = Math.max(0, minY - pad);
  const x1 = Math.min(W, maxX + 1 + pad);
  const y1 = Math.min(H, maxY + 1 + pad);
  const trimmed = document.createElement("canvas");
  trimmed.width = x1 - x0;
  trimmed.height = y1 - y0;
  const tctx = trimmed.getContext("2d")!;
  if (!opts.transparent) {
    tctx.fillStyle = "#ffffff";
    tctx.fillRect(0, 0, trimmed.width, trimmed.height);
  }
  tctx.drawImage(full, x0, y0, trimmed.width, trimmed.height, 0, 0, trimmed.width, trimmed.height);
  return { canvas: trimmed, threshold: t };
}
