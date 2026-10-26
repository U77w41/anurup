/**
 * Build-time SEO for a single-page app on GitHub Pages.
 *
 * After `vite build`, this plugin writes one static HTML file per tool
 * (dist/<tool-id>/index.html) with its own <title>, meta description, canonical
 * URL, Open Graph tags, JSON-LD and readable page text. Search engines and link
 * previews get real content; in the browser, React replaces the static markup as
 * soon as the app starts. It also writes sitemap.xml and a 404.html fallback.
 */
import fs from "node:fs";
import path from "node:path";
import type { Plugin, ResolvedConfig } from "vite";
import { HOME, SITE, TOOL_CONTENT, toolUrl, type ToolContent } from "./content";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const BADGE: Record<ToolContent["badge"], string> = { Photo: "tool-badge-photo", PDF: "tool-badge-pdf", Convert: "tool-badge-convert" };
const CATEGORY_NAME = { photo: "Photo & Signature", pdf: "PDF tools" } as const;

interface HeadInput {
  title: string;
  description: string;
  url: string;
  jsonLd?: object;
  noindex?: boolean;
}

function headTags({ title, description, url, jsonLd, noindex }: HeadInput): string {
  const image = `${SITE.url}${SITE.ogImage}`;
  const tags = [
    `<title>${esc(title)}</title>`,
    `<meta name="description" content="${esc(description)}" />`,
    `<link rel="canonical" href="${url}" />`,
    `<meta name="robots" content="${noindex ? "noindex" : "index, follow, max-image-preview:large"}" />`,
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${SITE.name}" />`,
    `<meta property="og:locale" content="${SITE.locale}" />`,
    `<meta property="og:title" content="${esc(title)}" />`,
    `<meta property="og:description" content="${esc(description)}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${image}" />`,
    `<meta property="og:image:width" content="1200" />`,
    `<meta property="og:image:height" content="630" />`,
    `<meta property="og:image:alt" content="ANURUP: free photo and PDF tools for online forms" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${esc(title)}" />`,
    `<meta name="twitter:description" content="${esc(description)}" />`,
    `<meta name="twitter:image" content="${image}" />`,
  ];
  if (jsonLd) tags.push(`<script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>`);
  return tags.join("\n    ");
}

const author = { "@type": "Person", name: SITE.author, url: SITE.authorUrl };
const free = { "@type": "Offer", price: "0", priceCurrency: "INR" };

function homeJsonLd() {
  return {
    "@context": "https://schema.org",
    "@graph": [
      { "@type": "WebSite", name: SITE.name, url: SITE.url, description: HOME.description, inLanguage: "en", author },
      {
        "@type": "WebApplication",
        name: SITE.name,
        url: SITE.url,
        description: HOME.description,
        applicationCategory: "UtilitiesApplication",
        operatingSystem: "Any",
        browserRequirements: "Requires JavaScript and a modern web browser",
        isAccessibleForFree: true,
        offers: free,
        featureList: TOOL_CONTENT.map((t) => t.name),
        author,
      },
    ],
  };
}

function toolJsonLd(t: ToolContent) {
  return {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebApplication",
        name: t.name,
        url: toolUrl(t.id),
        description: t.description,
        applicationCategory: t.category === "photo" ? "MultimediaApplication" : "UtilitiesApplication",
        operatingSystem: "Any",
        isAccessibleForFree: true,
        offers: free,
        isPartOf: { "@type": "WebSite", name: SITE.name, url: SITE.url },
        author,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: SITE.name, item: SITE.url },
          { "@type": "ListItem", position: 2, name: CATEGORY_NAME[t.category], item: `${SITE.url}?c=${t.category}` },
          { "@type": "ListItem", position: 3, name: t.name, item: toolUrl(t.id) },
        ],
      },
    ],
  };
}

function toolLinks(base: string, list: ToolContent[]): string {
  return list
    .map(
      (t) =>
        `<li class="rounded-lg bg-card p-5 shadow-card"><a class="font-bold text-card-foreground hover:underline" href="${base}${t.id}/">${esc(t.name)}</a><p class="mt-1 text-muted-foreground">${esc(t.card)}</p></li>`,
    )
    .join("");
}

function homeBody(base: string): string {
  const sections = (["photo", "pdf"] as const)
    .map(
      (c) =>
        `<section class="mt-10"><h2 class="mb-4 text-sm font-bold uppercase tracking-widest text-muted-foreground">${CATEGORY_NAME[c]}</h2><ul class="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">${toolLinks(
          base,
          TOOL_CONTENT.filter((t) => t.category === c),
        )}</ul></section>`,
    )
    .join("");
  return `<div class="mx-auto max-w-6xl px-4 py-10 sm:px-6"><h1 class="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">${esc(HOME.h1)}</h1><p class="mt-3 max-w-3xl text-lg leading-relaxed text-muted-foreground">${esc(HOME.intro)}</p>${sections}</div>`;
}

function toolBody(base: string, t: ToolContent): string {
  const steps = t.steps.map((s) => `<li class="pl-1 leading-relaxed">${esc(s)}</li>`).join("");
  const faq = t.faq
    .map((f) => `<div><dt class="font-bold text-card-foreground">${esc(f.q)}</dt><dd class="mt-1 leading-relaxed text-muted-foreground">${esc(f.a)}</dd></div>`)
    .join("");
  const more = TOOL_CONTENT.filter((o) => o.category === t.category && o.id !== t.id);
  return `<div class="mx-auto max-w-4xl space-y-6 px-4 py-10 sm:px-6">
<nav class="text-sm text-muted-foreground" aria-label="Breadcrumb"><a href="${base}" class="hover:underline">${SITE.name}</a> › <a href="${base}?c=${t.category}" class="hover:underline">${CATEGORY_NAME[t.category]}</a></nav>
<header class="rounded-lg bg-card p-6 shadow-card sm:p-8"><span class="rounded px-2.5 py-1 text-xs ${BADGE[t.badge]}">${t.badge}</span><h1 class="mt-4 text-2xl font-bold text-card-foreground sm:text-3xl">${esc(t.h1)}</h1><p class="mt-2 text-base leading-relaxed text-muted-foreground sm:text-lg">${esc(t.intro)}</p></header>
<section class="rounded-lg bg-card p-6 shadow-card sm:p-8"><h2 class="text-xl font-bold text-card-foreground">${esc(t.howTo)}</h2><ol class="mt-4 list-decimal space-y-2 pl-5 text-muted-foreground">${steps}</ol>${
    faq ? `<h2 class="mt-8 text-xl font-bold text-card-foreground">Questions</h2><dl class="mt-4 space-y-4">${faq}</dl>` : ""
  }</section>
<section><h2 class="mb-4 text-sm font-bold uppercase tracking-widest text-muted-foreground">More ${CATEGORY_NAME[t.category]}</h2><ul class="grid gap-5 sm:grid-cols-2">${toolLinks(base, more)}</ul></section>
<noscript><p class="text-muted-foreground">${SITE.name} needs JavaScript to run the tools. Everything runs in your browser and nothing is uploaded.</p></noscript>
</div>`;
}

export function renderPage(template: string, head: string, body: string): string {
  const out = template
    .replace(/<!--seo-head-->[\s\S]*?<!--\/seo-head-->/, head)
    .replace('<div id="root"><!--seo-body--></div>', `<div id="root">${body}</div>`);
  if (out === template) throw new Error("seo-prerender: markers not found in index.html");
  return out;
}

export function seoPrerender(): Plugin {
  let config: ResolvedConfig;
  return {
    name: "anurup-seo-prerender",
    apply: "build",
    configResolved(c) {
      config = c;
    },
    closeBundle() {
      const outDir = path.resolve(config.root, config.build.outDir);
      const indexPath = path.join(outDir, "index.html");
      if (!fs.existsSync(indexPath)) return;
      const template = fs.readFileSync(indexPath, "utf8");
      const base = config.base.endsWith("/") ? config.base : `${config.base}/`;

      fs.writeFileSync(indexPath, renderPage(template, headTags({ title: HOME.title, description: HOME.description, url: SITE.url, jsonLd: homeJsonLd() }), homeBody(base)));

      for (const t of TOOL_CONTENT) {
        const dir = path.join(outDir, t.id);
        fs.mkdirSync(dir, { recursive: true });
        const head = headTags({ title: `${t.title} | ${SITE.name}`, description: t.description, url: toolUrl(t.id), jsonLd: toolJsonLd(t) });
        fs.writeFileSync(path.join(dir, "index.html"), renderPage(template, head, toolBody(base, t)));
      }

      // GitHub Pages serves 404.html for unknown paths; the app shows its own "not found" page.
      fs.writeFileSync(
        path.join(outDir, "404.html"),
        renderPage(template, headTags({ title: `Page not found | ${SITE.name}`, description: HOME.description, url: SITE.url, noindex: true }), ""),
      );

      const today = new Date().toISOString().slice(0, 10);
      const urls = [SITE.url, ...TOOL_CONTENT.map((t) => toolUrl(t.id))];
      const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((u) => `  <url><loc>${u}</loc><lastmod>${today}</lastmod></url>`).join("\n")}
</urlset>
`;
      fs.writeFileSync(path.join(outDir, "sitemap.xml"), sitemap);
      config.logger.info(`seo-prerender: wrote ${TOOL_CONTENT.length + 1} pages, 404.html and sitemap.xml`);
    },
  };
}
