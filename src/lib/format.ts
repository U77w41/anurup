/** Small, dependency-free helpers for names, sizes and file kinds. */

export type FileKind = "image" | "pdf" | "other";

const IMAGE_EXT = /\.(jpe?g|png|webp|gif|bmp|avif)$/i;

export function kindOf(type: string, name = ""): FileKind {
  if (type === "application/pdf" || /\.pdf$/i.test(name)) return "pdf";
  if (type.startsWith("image/") || IMAGE_EXT.test(name)) return "image";
  return "other";
}

export function formatBytes(bytes: number): string {
  if (!Number.isFinite(bytes) || bytes <= 0) return "0 KB";
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

export function baseName(name: string): string {
  const clean = name.replace(/\.[^./\\]+$/, "");
  return clean || "file";
}

const TOOL_SUFFIX = /-(cropped|compressed|resized|converted|passport[\w-]*|nobg|signature|clean|merged|split|organized|stamped|signed|unlocked|\d+x\d+)$/i;

/** `photo.png` + (`cropped`, `jpg`) -> `photo-cropped.jpg`; earlier tool suffixes are replaced, not stacked. */
export function deriveName(original: string, suffix: string, ext: string): string {
  let base = baseName(original);
  for (let i = 0; i < 3 && TOOL_SUFFIX.test(base); i++) base = base.replace(TOOL_SUFFIX, "");
  if (suffix && (base === suffix || base.endsWith(`-${suffix}`))) suffix = "";
  return `${base}${suffix ? `-${suffix}` : ""}.${ext}`;
}

export function extForMime(mime: string): string {
  switch (mime) {
    case "image/jpeg":
      return "jpg";
    case "image/png":
      return "png";
    case "image/webp":
      return "webp";
    case "application/pdf":
      return "pdf";
    default:
      return mime.split("/")[1] || "bin";
  }
}

/** Physical length → pixels at a given DPI. */
export function toPixels(value: number, unit: "px" | "cm" | "mm" | "in", dpi: number): number {
  switch (unit) {
    case "px":
      return Math.round(value);
    case "in":
      return Math.round(value * dpi);
    case "cm":
      return Math.round((value / 2.54) * dpi);
    case "mm":
      return Math.round((value / 25.4) * dpi);
  }
}

export function uid(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
