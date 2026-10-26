/**
 * Byte-level JPEG helpers. Browsers' canvas encoders write 72 DPI (or none) into the
 * JFIF header, and many upload portals check DPI or a minimum file size — these
 * helpers fix both without re-encoding the image.
 */

const SOI_0 = 0xff;
const SOI_1 = 0xd8;

export function isJpeg(bytes: Uint8Array): boolean {
  return bytes.length > 3 && bytes[0] === SOI_0 && bytes[1] === SOI_1;
}

function hasJfifApp0(bytes: Uint8Array): boolean {
  return (
    bytes.length > 18 &&
    bytes[2] === 0xff &&
    bytes[3] === 0xe0 &&
    bytes[6] === 0x4a && // J
    bytes[7] === 0x46 && // F
    bytes[8] === 0x49 && // I
    bytes[9] === 0x46 && // F
    bytes[10] === 0x00
  );
}

/** Return the DPI stored in the JFIF header, or null if absent / not in dots-per-inch. */
export function readJpegDpi(bytes: Uint8Array): number | null {
  if (!isJpeg(bytes) || !hasJfifApp0(bytes)) return null;
  const units = bytes[13];
  const x = (bytes[14] << 8) | bytes[15];
  if (units === 1) return x;
  if (units === 2) return Math.round(x * 2.54);
  return null;
}

/** Write `dpi` into the JFIF APP0 header, inserting one if the encoder omitted it. */
export function setJpegDpi(bytes: Uint8Array, dpi: number): Uint8Array {
  if (!isJpeg(bytes)) return bytes;
  const d = Math.max(1, Math.min(65535, Math.round(dpi)));
  if (hasJfifApp0(bytes)) {
    const out = bytes.slice();
    out[13] = 1;
    out[14] = d >> 8;
    out[15] = d & 0xff;
    out[16] = d >> 8;
    out[17] = d & 0xff;
    return out;
  }
  // FFE0, len=16, "JFIF\0", v1.01, units=1, Xdensity, Ydensity, no thumbnail
  const app0 = new Uint8Array([
    0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, d >> 8, d & 0xff, d >> 8, d & 0xff, 0x00, 0x00,
  ]);
  const out = new Uint8Array(bytes.length + app0.length);
  out.set(bytes.subarray(0, 2), 0);
  out.set(app0, 2);
  out.set(bytes.subarray(2), 2 + app0.length);
  return out;
}

/**
 * Grow a JPEG to exactly `targetSize` bytes by inserting comment (COM) segments.
 * Image data is untouched; decoders ignore COM segments. Used to satisfy portals that
 * enforce a *minimum* file size. Returns the input unchanged if it is already big enough.
 */
export function padJpeg(bytes: Uint8Array, targetSize: number): Uint8Array {
  if (!isJpeg(bytes)) return bytes;
  let extra = Math.floor(targetSize) - bytes.length;
  if (extra < 4) return bytes;

  // Insert after APP0 if present, else right after SOI.
  const insertAt = hasJfifApp0(bytes) ? 4 + ((bytes[4] << 8) | bytes[5]) : 2;

  const segments: Uint8Array[] = [];
  const MAX_PAYLOAD = 65533;
  while (extra >= 4) {
    // Avoid leaving a 1–3 byte remainder that cannot form a segment.
    let payload = Math.min(MAX_PAYLOAD, extra - 4);
    const remainder = extra - (payload + 4);
    if (remainder > 0 && remainder < 4) payload -= 4 - remainder;
    const seg = new Uint8Array(payload + 4);
    seg[0] = 0xff;
    seg[1] = 0xfe;
    seg[2] = (payload + 2) >> 8;
    seg[3] = (payload + 2) & 0xff;
    seg.fill(0x20, 4); // spaces
    segments.push(seg);
    extra -= seg.length;
  }

  const total = bytes.length + segments.reduce((n, s) => n + s.length, 0);
  const out = new Uint8Array(total);
  out.set(bytes.subarray(0, insertAt), 0);
  let offset = insertAt;
  for (const s of segments) {
    out.set(s, offset);
    offset += s.length;
  }
  out.set(bytes.subarray(insertAt), offset);
  return out;
}
