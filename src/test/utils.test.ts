import { describe, expect, it } from "vitest";
import { chunkPages, formatPageRange, parsePageRange } from "@/lib/pageRange";
import { padJpeg, readJpegDpi, setJpegDpi } from "@/lib/jpeg";
import { deriveName, formatBytes, kindOf, toPixels } from "@/lib/format";
import { TOOLS, rankedTargets, toolsFor } from "@/lib/tools";
import { otsu } from "@/lib/signature";

// Minimal JPEG: SOI + JFIF APP0 (72 dpi) + EOI. Enough for header manipulation tests.
const JFIF = new Uint8Array([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01, 0x00, 0x48, 0x00, 0x48, 0x00, 0x00, 0xff, 0xd9,
]);
const NO_APP0 = new Uint8Array([0xff, 0xd8, 0xff, 0xdb, 0x00, 0x02, 0xff, 0xd9]);

describe("page ranges", () => {
  it("parses lists, ranges and open ends", () => {
    expect(parsePageRange("1-3, 5, 8-", 10)).toEqual([1, 2, 3, 5, 8, 9, 10]);
    expect(parsePageRange("-2", 5)).toEqual([1, 2]);
    expect(parsePageRange("4-2", 5)).toEqual([2, 3, 4]);
  });
  it("ignores junk and out-of-range pages", () => {
    expect(parsePageRange("0, 11, abc, 3", 10)).toEqual([3]);
    expect(parsePageRange("", 10)).toEqual([]);
  });
  it("round-trips through formatPageRange", () => {
    expect(formatPageRange([7, 1, 2, 3, 5, 8])).toBe("1-3, 5, 7-8");
    expect(parsePageRange(formatPageRange([1, 2, 4, 9]), 9)).toEqual([1, 2, 4, 9]);
  });
  it("chunks pages", () => {
    expect(chunkPages(5, 2)).toEqual([[1, 2], [3, 4], [5]]);
    expect(chunkPages(3, 1)).toEqual([[1], [2], [3]]);
  });
});

describe("jpeg helpers", () => {
  it("reads and writes DPI in an existing JFIF header", () => {
    expect(readJpegDpi(JFIF)).toBe(72);
    const out = setJpegDpi(JFIF, 300);
    expect(readJpegDpi(out)).toBe(300);
    expect(out.length).toBe(JFIF.length);
  });
  it("inserts a JFIF header when missing", () => {
    expect(readJpegDpi(NO_APP0)).toBeNull();
    const out = setJpegDpi(NO_APP0, 200);
    expect(readJpegDpi(out)).toBe(200);
    expect(out.length).toBe(NO_APP0.length + 18);
    expect([...out.slice(-6)]).toEqual([0xff, 0xdb, 0x00, 0x02, 0xff, 0xd9]);
  });
  it("pads to an exact byte size with valid COM segments", () => {
    for (const target of [100, 5000, 70_000, 200_003]) {
      const out = padJpeg(JFIF, target);
      expect(out.length).toBe(target);
      expect(readJpegDpi(out)).toBe(72); // APP0 untouched
      // Walk segments after APP0: each must be a COM marker with a consistent length.
      let i = 20;
      while (out[i] === 0xff && out[i + 1] === 0xfe) i += 2 + ((out[i + 2] << 8) | out[i + 3]);
      expect([...out.slice(i)]).toEqual([0xff, 0xd9]);
    }
  });
  it("leaves files that are already big enough alone", () => {
    expect(padJpeg(JFIF, 10)).toBe(JFIF);
  });
});

describe("format helpers", () => {
  it("converts physical sizes to pixels", () => {
    expect(toPixels(35, "mm", 300)).toBe(413);
    expect(toPixels(45, "mm", 300)).toBe(531);
    expect(toPixels(2, "in", 300)).toBe(600);
    expect(toPixels(3.5, "cm", 200)).toBe(276);
  });
  it("detects file kinds", () => {
    expect(kindOf("application/pdf")).toBe("pdf");
    expect(kindOf("", "scan.PDF")).toBe("pdf");
    expect(kindOf("image/webp")).toBe("image");
    expect(kindOf("text/plain", "notes.txt")).toBe("other");
  });
  it("derives output names without stacking suffixes", () => {
    expect(deriveName("photo.png", "cropped", "jpg")).toBe("photo-cropped.jpg");
    expect(deriveName("photo-cropped.jpg", "compressed", "jpg")).toBe("photo-compressed.jpg");
    expect(deriveName("signature.jpg", "signature", "jpg")).toBe("signature.jpg");
    expect(deriveName("sign-signature-140x60.jpg", "200x100", "jpg")).toBe("sign-200x100.jpg");
  });
  it("formats sizes", () => {
    expect(formatBytes(1536)).toBe("1.5 KB");
    expect(formatBytes(3 * 1024 * 1024)).toBe("3.00 MB");
  });
});

describe("tool registry", () => {
  it("has unique ids", () => {
    expect(new Set(TOOLS.map((t) => t.id)).size).toBe(TOOLS.length);
  });
  it("routes images to image tools and PDFs to PDF tools", () => {
    expect(toolsFor("image").every((t) => t.accepts === "image")).toBe(true);
    expect(toolsFor("pdf").map((t) => t.id)).toContain("pdf-compressor");
  });
  it("puts suggested next steps first and excludes the source tool", () => {
    const next = rankedTargets("image", "crop-rotate");
    expect(next[0].id).toBe("image-compressor");
    expect(next.map((t) => t.id)).not.toContain("crop-rotate");
  });
  it("only offers multi-file tools for several files", () => {
    expect(rankedTargets("image", undefined, 3).every((t) => t.multiple)).toBe(true);
  });
});

describe("signature threshold", () => {
  it("splits a bimodal histogram between the peaks", () => {
    const hist = new Array(256).fill(0);
    hist[40] = 500;
    hist[245] = 5000;
    const t = otsu(hist);
    expect(t).toBeGreaterThanOrEqual(40);
    expect(t).toBeLessThan(245);
  });
});
