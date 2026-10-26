import {
  Camera,
  Maximize,
  Minimize2,
  Eraser,
  RefreshCw,
  Crop,
  Signature,
  FileImage,
  Scissors,
  Merge,
  LayoutList,
  FileDown,
  FileSearch,
  Images,
  Stamp,
  PenLine,
  LockOpen,
  type LucideIcon,
} from "lucide-react";
import type { FileKind } from "./format";

export type ToolId =
  | "passport-photo"
  | "size-targeter"
  | "image-compressor"
  | "crop-rotate"
  | "background-removal"
  | "signature-cleaner"
  | "format-converter"
  | "pdf-viewer"
  | "image-to-pdf"
  | "pdf-merger"
  | "pdf-splitter"
  | "pdf-page-manager"
  | "pdf-compressor"
  | "pdf-to-images"
  | "pdf-stamp"
  | "pdf-sign"
  | "pdf-unlock";

export interface ToolDef {
  id: ToolId;
  title: string;
  /** Short label for menus ("Continue in …"). */
  short: string;
  description: string;
  icon: LucideIcon;
  category: "photo" | "pdf";
  badge: "Photo" | "PDF" | "Convert";
  /** What the tool takes as input. */
  accepts: FileKind;
  /** Whether the tool works on several files at once. */
  multiple: boolean;
  keywords?: string;
}

export const TOOLS: ToolDef[] = [
  {
    id: "passport-photo",
    title: "Passport Photo Maker",
    short: "Passport photo",
    description: "Frame a photo to passport/visa/exam presets, set background colour and DPI, and make a printable sheet.",
    icon: Camera,
    category: "photo",
    badge: "Photo",
    accepts: "image",
    multiple: false,
    keywords: "visa id photo 35x45 2x2 print sheet",
  },
  {
    id: "size-targeter",
    title: "Exact Size & KB Targeter",
    short: "Resize to exact size & KB",
    description: "Resize to exact px / cm / mm / inches at a DPI and land between a min and max KB limit.",
    icon: Maximize,
    category: "photo",
    badge: "Photo",
    accepts: "image",
    multiple: false,
    keywords: "resize dimensions kb limit dpi upload portal",
  },
  {
    id: "image-compressor",
    title: "Image Compressor",
    short: "Compress image",
    description: "Shrink images to a target size in KB or by quality, keeping dimensions where possible.",
    icon: Minimize2,
    category: "photo",
    badge: "Photo",
    accepts: "image",
    multiple: true,
    keywords: "reduce size kb mb optimize",
  },
  {
    id: "crop-rotate",
    title: "Crop, Rotate & Flip",
    short: "Crop / rotate",
    description: "Free or fixed-ratio cropping with drag handles, 90° rotation and mirroring.",
    icon: Crop,
    category: "photo",
    badge: "Photo",
    accepts: "image",
    multiple: false,
    keywords: "trim aspect ratio mirror",
  },
  {
    id: "background-removal",
    title: "Background Remover",
    short: "Remove background",
    description: "AI background removal in the browser, with white, blue, custom or transparent fill.",
    icon: Eraser,
    category: "photo",
    badge: "Photo",
    accepts: "image",
    multiple: false,
    keywords: "transparent cutout white background",
  },
  {
    id: "signature-cleaner",
    title: "Signature Cleaner",
    short: "Clean signature",
    description: "Turn a phone photo of a signature into crisp ink on white or transparent, auto-trimmed.",
    icon: Signature,
    category: "photo",
    badge: "Photo",
    accepts: "image",
    multiple: false,
    keywords: "sign scan threshold ink",
  },
  {
    id: "format-converter",
    title: "Format Converter",
    short: "Convert format",
    description: "Convert images between JPG, PNG and WebP — one or many at a time.",
    icon: RefreshCw,
    category: "photo",
    badge: "Convert",
    accepts: "image",
    multiple: true,
    keywords: "jpg png webp jpeg",
  },
  {
    id: "pdf-viewer",
    title: "PDF Viewer",
    short: "View PDF",
    description: "Preview any PDF page by page with zoom — nothing is uploaded.",
    icon: FileSearch,
    category: "pdf",
    badge: "PDF",
    accepts: "pdf",
    multiple: false,
    keywords: "preview read open",
  },
  {
    id: "image-to-pdf",
    title: "Image to PDF",
    short: "Images → PDF",
    description: "Combine images into one PDF with page size, orientation and margin options.",
    icon: FileImage,
    category: "pdf",
    badge: "Convert",
    accepts: "image",
    multiple: true,
    keywords: "jpg to pdf scan convert",
  },
  {
    id: "pdf-merger",
    title: "PDF Merger",
    short: "Merge PDFs",
    description: "Combine several PDFs into one, in the order you choose.",
    icon: Merge,
    category: "pdf",
    badge: "PDF",
    accepts: "pdf",
    multiple: true,
    keywords: "combine join",
  },
  {
    id: "pdf-splitter",
    title: "PDF Splitter",
    short: "Split PDF",
    description: "Extract pages by clicking thumbnails or typing ranges, or split into single pages / chunks.",
    icon: Scissors,
    category: "pdf",
    badge: "PDF",
    accepts: "pdf",
    multiple: false,
    keywords: "extract pages separate",
  },
  {
    id: "pdf-page-manager",
    title: "Organize Pages",
    short: "Organize pages",
    description: "Reorder, rotate and delete pages visually using real page thumbnails.",
    icon: LayoutList,
    category: "pdf",
    badge: "PDF",
    accepts: "pdf",
    multiple: false,
    keywords: "reorder rotate delete page manager arrange",
  },
  {
    id: "pdf-compressor",
    title: "PDF Compressor",
    short: "Compress PDF",
    description: "Lossless clean-up or strong compression down to a target size in KB.",
    icon: FileDown,
    category: "pdf",
    badge: "PDF",
    accepts: "pdf",
    multiple: false,
    keywords: "reduce size kb shrink",
  },
  {
    id: "pdf-to-images",
    title: "PDF to Images",
    short: "PDF → images",
    description: "Export pages as JPG or PNG at 72–300 DPI, individually or as a ZIP.",
    icon: Images,
    category: "pdf",
    badge: "Convert",
    accepts: "pdf",
    multiple: false,
    keywords: "jpg png export render",
  },
  {
    id: "pdf-stamp",
    title: "Page Numbers & Watermark",
    short: "Page numbers / watermark",
    description: "Add page numbers and a text watermark to every page.",
    icon: Stamp,
    category: "pdf",
    badge: "PDF",
    accepts: "pdf",
    multiple: false,
    keywords: "number footer confidential draft",
  },
  {
    id: "pdf-sign",
    title: "Sign & Fill PDF",
    short: "Sign / fill PDF",
    description: "Place a signature or photo and type text or dates anywhere on a page.",
    icon: PenLine,
    category: "pdf",
    badge: "PDF",
    accepts: "pdf",
    multiple: false,
    keywords: "signature text date fill form",
  },
  {
    id: "pdf-unlock",
    title: "Unlock PDF",
    short: "Unlock PDF",
    description: "Remove a PDF’s open password or print/copy restrictions — keeps text, links and quality intact.",
    icon: LockOpen,
    category: "pdf",
    badge: "PDF",
    accepts: "pdf",
    multiple: false,
    keywords: "password remove decrypt protected restrictions secured encrypted",
  },
];

export const BADGE_CLASS: Record<ToolDef["badge"], string> = {
  Photo: "tool-badge-photo",
  PDF: "tool-badge-pdf",
  Convert: "tool-badge-convert",
};

export function toolHref(id: ToolId): string {
  return `/${id}`;
}

export function getTool(id: ToolId): ToolDef {
  const t = TOOLS.find((x) => x.id === id);
  if (!t) throw new Error(`Unknown tool ${id}`);
  return t;
}

/**
 * Tools that can take a file of `kind` as input, best next steps first.
 * `count` > 1 limits the list to tools that accept several files.
 */
export function toolsFor(kind: FileKind, opts: { exclude?: ToolId; count?: number } = {}): ToolDef[] {
  const count = opts.count ?? 1;
  return TOOLS.filter((t) => t.accepts === kind && t.id !== opts.exclude && (count <= 1 || t.multiple));
}

/** Suggested follow-ups shown first in "Continue in" menus. */
export const SUGGESTED_NEXT: Partial<Record<ToolId, ToolId[]>> = {
  "passport-photo": ["size-targeter", "image-compressor", "image-to-pdf"],
  "crop-rotate": ["image-compressor", "size-targeter", "passport-photo"],
  "background-removal": ["passport-photo", "size-targeter", "format-converter"],
  "signature-cleaner": ["size-targeter", "pdf-sign", "image-compressor"],
  "size-targeter": ["image-to-pdf", "format-converter"],
  "image-compressor": ["image-to-pdf", "size-targeter"],
  "format-converter": ["image-compressor", "image-to-pdf"],
  "image-to-pdf": ["pdf-compressor", "pdf-merger", "pdf-sign"],
  "pdf-merger": ["pdf-compressor", "pdf-page-manager", "pdf-stamp"],
  "pdf-splitter": ["pdf-compressor", "pdf-merger"],
  "pdf-page-manager": ["pdf-compressor", "pdf-sign"],
  "pdf-compressor": ["pdf-viewer", "pdf-merger"],
  "pdf-to-images": ["image-compressor", "image-to-pdf"],
  "pdf-stamp": ["pdf-compressor", "pdf-sign"],
  "pdf-sign": ["pdf-compressor", "pdf-merger"],
  "pdf-viewer": ["pdf-compressor", "pdf-sign", "pdf-page-manager"],
  "pdf-unlock": ["pdf-compressor", "pdf-merger", "pdf-sign"],
};

export function rankedTargets(kind: FileKind, from?: ToolId, count = 1): ToolDef[] {
  const list = toolsFor(kind, { exclude: from, count });
  const pref = (from && SUGGESTED_NEXT[from]) || [];
  return [...list].sort((a, b) => {
    const ia = pref.indexOf(a.id);
    const ib = pref.indexOf(b.id);
    return (ia === -1 ? 99 : ia) - (ib === -1 ? 99 : ib);
  });
}
