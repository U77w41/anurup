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

import { TOOL_CONTENT, type ToolContent, type ToolId } from "@/seo/content";

export type { ToolId };

export interface ToolDef {
  id: ToolId;
  /** Name shown on cards, menus and as the page heading fallback. */
  title: string;
  /** Short label for menus ("Continue in …"). */
  short: string;
  /** One-line card summary. */
  description: string;
  icon: LucideIcon;
  category: "photo" | "pdf";
  badge: "Photo" | "PDF" | "Convert";
  /** What the tool takes as input. */
  accepts: FileKind;
  /** Whether the tool works on several files at once. */
  multiple: boolean;
  keywords?: string;
  /** Full SEO/guide copy (H1, intro, steps, FAQ). */
  content: ToolContent;
}

const ICONS: Record<ToolId, LucideIcon> = {
  "passport-photo": Camera,
  "size-targeter": Maximize,
  "image-compressor": Minimize2,
  "crop-rotate": Crop,
  "background-removal": Eraser,
  "signature-cleaner": Signature,
  "format-converter": RefreshCw,
  "pdf-viewer": FileSearch,
  "image-to-pdf": FileImage,
  "pdf-merger": Merge,
  "pdf-splitter": Scissors,
  "pdf-page-manager": LayoutList,
  "pdf-compressor": FileDown,
  "pdf-to-images": Images,
  "pdf-stamp": Stamp,
  "pdf-sign": PenLine,
  "pdf-unlock": LockOpen,
};

/** Tool registry, built from the copy in src/seo/content.ts. */
export const TOOLS: ToolDef[] = TOOL_CONTENT.map((c) => ({
  id: c.id,
  title: c.name,
  short: c.short,
  description: c.card,
  icon: ICONS[c.id],
  category: c.category,
  badge: c.badge,
  accepts: c.accepts,
  multiple: c.multiple,
  keywords: c.keywords,
  content: c,
}));

export const BADGE_CLASS: Record<ToolDef["badge"], string> = {
  Photo: "tool-badge-photo",
  PDF: "tool-badge-pdf",
  Convert: "tool-badge-convert",
};

/** Hover text for the category tags. */
export const BADGE_HINT: Record<ToolDef["badge"], string> = {
  Photo: "Photo and image tool",
  PDF: "PDF tool",
  Convert: "Converts between formats",
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
