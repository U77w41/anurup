import { describe, expect, it } from "vitest";
import { HOME, SITE, TOOL_CONTENT } from "@/seo/content";
import { renderPage } from "@/seo/prerender";
import { TOOLS } from "@/lib/tools";

const allText = (t: (typeof TOOL_CONTENT)[number]) => [t.card, t.title, t.description, t.h1, t.intro, t.howTo, ...t.steps, ...t.faq.flatMap((f) => [f.q, f.a])];

describe("SEO copy", () => {
  it("covers every tool in the registry", () => {
    expect(TOOL_CONTENT.map((t) => t.id).sort()).toEqual(TOOLS.map((t) => t.id).sort());
    expect(TOOLS.every((t) => t.icon)).toBe(true);
  });

  it("keeps titles and descriptions within search-result limits", () => {
    for (const t of TOOL_CONTENT) {
      expect(`${t.title} | ${SITE.name}`.length, t.id).toBeLessThanOrEqual(65);
      expect(t.description.length, t.id).toBeGreaterThanOrEqual(110);
      expect(t.description.length, t.id).toBeLessThanOrEqual(165);
    }
    expect(HOME.title.length).toBeLessThanOrEqual(65);
    expect(HOME.description.length).toBeLessThanOrEqual(165);
  });

  it("uses unique titles, descriptions and headings", () => {
    for (const key of ["title", "description", "h1"] as const) {
      expect(new Set(TOOL_CONTENT.map((t) => t[key])).size, key).toBe(TOOL_CONTENT.length);
    }
  });

  it("gives every tool a how-to with at least three steps", () => {
    for (const t of TOOL_CONTENT) expect(t.steps.length, t.id).toBeGreaterThanOrEqual(3);
  });

  it("avoids em dashes in user-facing copy", () => {
    for (const t of TOOL_CONTENT) for (const s of allText(t)) expect(s, t.id).not.toMatch(/—/);
    expect(HOME.intro).not.toMatch(/—/);
  });
});

describe("prerender", () => {
  const template = `<html><head><!--seo-head--><title>x</title><!--/seo-head--></head><body><div id="root"><!--seo-body--></div></body></html>`;
  it("replaces the head block and fills #root", () => {
    const out = renderPage(template, "<title>New</title>", "<h1>Hi</h1>");
    expect(out).toContain("<title>New</title>");
    expect(out).not.toContain("<title>x</title>");
    expect(out).toContain('<div id="root"><h1>Hi</h1></div>');
  });
  it("fails loudly if the markers are missing", () => {
    expect(() => renderPage("<html></html>", "", "")).toThrow();
  });
});
