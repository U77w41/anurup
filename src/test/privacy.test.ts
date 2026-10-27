import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { describe, expect, it } from "vitest";
import { pwaOptions } from "@/seo/pwa";

const read = (rel: string) => readFileSync(fileURLToPath(new URL(rel, import.meta.url)), "utf8");

const GOOGLE_FONTS = /fonts\.(googleapis|gstatic)\.com/i;

describe("privacy: the page shell makes no third-party requests", () => {
  it("bundles the Lato font instead of loading it from Google Fonts", () => {
    const css = read("../index.css");
    expect(css).not.toMatch(GOOGLE_FONTS);
    expect(read("../../index.html")).not.toMatch(GOOGLE_FONTS);
    for (const weight of [300, 400, 700, 900]) {
      expect(css, `Lato ${weight}`).toContain(`@fontsource/lato/${weight}.css`);
    }
  });

  it("only caches the background-removal model at runtime", () => {
    const patterns = (pwaOptions("/anurup/").workbox?.runtimeCaching ?? []).map((r) => String(r.urlPattern));
    expect(patterns).toHaveLength(1);
    expect(patterns[0]).toContain("staticimgly");
  });
});
