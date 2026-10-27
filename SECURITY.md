# Security

ANURUP is a static website. It has no backend, no accounts, no cookies and no analytics. Photos, PDFs and PDF passwords are processed inside your browser tab and are never uploaded.

## Reporting a vulnerability

Please report security problems privately: open the **Security** tab of this repository and choose **Report a vulnerability**. Don't open a public issue for anything that could put users at risk. Include the page URL, your browser and the steps to reproduce.

Only the live site at https://u77w41.github.io/anurup/ is supported. Fixes go live when they are merged into `main`.

## What the app sends over the network

| Request | When | What it contains |
|---|---|---|
| App files from GitHub Pages (`u77w41.github.io`) | First visit, then only when a new version is out | A normal request for the file. Nothing about your files. |
| Background-removal model from IMG.LY's CDN (`staticimgly.com`) | The first time you use **Remove Image Background** | A normal request for the model. Your photo is processed on your device. |

There are no other requests. The Lato font is bundled with the app, so pages don't call Google Fonts. To check this yourself, open your browser's developer tools, switch to the **Network** tab and use any tool: no request carries your file.

## Latest scan: 27 October 2026

Target: `https://u77w41.github.io/anurup/`, scanned with [HostedScan](https://hostedscan.com) (free trial):

- OpenVAS network vulnerability scan (148 results with quality of detection of 70% or higher)
- OWASP ZAP 2.17.0 passive web application scan
- Nmap 7.93 TCP port scan of all ports (0 to 65535)

| Report | File |
|---|---|
| Summary | [hostedscan-summary.pdf](security/reports/2026-10-27/hostedscan-summary.pdf) |
| OpenVAS network scan | [openvas-network-scan.pdf](security/reports/2026-10-27/openvas-network-scan.pdf) |
| OWASP ZAP passive scan | [zap-passive-web-scan.pdf](security/reports/2026-10-27/zap-passive-web-scan.pdf) |
| Nmap TCP port scan | [nmap-tcp-port-scan.pdf](security/reports/2026-10-27/nmap-tcp-port-scan.pdf) |

**Result: 0 critical, 0 high, 5 medium and 6 low.**

GitHub Pages serves ANURUP from the same host as the author's blog (`u77w41.github.io`), so the scanners crawled the blog as well. The table says which findings came from blog pages.

| Finding | Severity | Seen on | Status |
|---|---|---|---|
| Cross-domain misconfiguration (`Access-Control-Allow-Origin: *`) | Medium | Every GitHub Pages response | **Accepted.** GitHub Pages sends this header for all sites. Everything on the site is a public static file, with no cookies or logins, so another website can only read what anyone can already download. |
| Content Security Policy (CSP) header not set | Medium | ANURUP pages | **Open.** GitHub Pages doesn't allow custom response headers. A CSP can still be set in a `<meta>` tag, but that hasn't been done yet. |
| Missing anti-clickjacking header | Medium | ANURUP pages | **Accepted.** The fix is a response header (`X-Frame-Options` or CSP `frame-ancestors`). GitHub Pages doesn't allow it, and it can't be set from a `<meta>` tag. ANURUP has no login and no button that changes anything outside the page, so showing it inside another site's frame can't trick anyone into a harmful action. |
| Sub Resource Integrity attribute missing | Medium | Blog pages (Google Fonts link) | **Not in ANURUP.** ANURUP bundles its font and loads no scripts or stylesheets from other sites. |
| Absence of anti-CSRF tokens | Medium | Blog `/tags/` pages | **Not in ANURUP, false positive.** The form is a page-jump box (`method=dialog`) that never sends a request. |
| X-Content-Type-Options header missing | Low | Every GitHub Pages response | **Accepted.** Controlled by GitHub Pages. GitHub sends the correct `Content-Type` for every file, and the site never serves files uploaded by users. |
| Strict-Transport-Security header not set | Low | `sw.js`, on a `304 Not Modified` response only | **False positive.** Every `200` response includes `Strict-Transport-Security: max-age=31556952`. The scanner flagged a cache revalidation reply, which doesn't repeat the header. |
| ICMP timestamp reply | Low (CVSS 2.1) | GitHub's servers | **Accepted.** Network setting of GitHub's CDN. |
| TCP timestamps | Low (CVSS 2.6) | GitHub's servers | **Accepted.** Network setting of GitHub's CDN. |
| Open TCP ports 80 and 443 | Low | GitHub's servers | **Expected.** Port 443 serves HTTPS and port 80 redirects to it. The other 65,534 ports are filtered. |

Other results from the same scans:

- **TLS:** only TLS 1.2 and 1.3 are accepted, and no weak cipher suites were reported. The certificate is from Let's Encrypt.
- **Informational (ZAP):** the blog keeps its colour scheme in `localStorage`, and pages are served from GitHub's shared cache. ANURUP keeps only your light or dark choice in `localStorage` and your workspace files in IndexedDB. See [Privacy and security](https://github.com/U77w41/anurup/wiki/Privacy-and-Security).

## Dependency audit: 27 October 2026

`npm audit` reported 25 advisories. Patch and minor updates, with no major version changes, cleared 14 of them. The 11 left are:

| Package | Runs in the browser? | Why it doesn't put users at risk |
|---|---|---|
| `vite` 5, `esbuild` | No, build tool | The advisories are about the local development server. |
| `vitest`, `@vitest/mocker`, `tinypool` | No, test runner | Runs only on a developer machine and in CI. |
| `@tailwindcss/typography`, `postcss-selector-parser` | No, build tool | Only processes the repository's own CSS at build time. |
| `react-router`, `react-router-dom` 6.30.6 | Yes | One advisory affects links built from untrusted paths. ANURUP only links to its own fixed tool pages. The other affects server-side rendering, which ANURUP doesn't use. |
| `zod` 3, through `@imgly/background-removal` | Yes, with Remove Image Background | Zod checks the app's own settings for the background-removal model, never user input. |

Clearing these needs major upgrades (Vite 6 or later, Vitest 5, React Router 7). Those change APIs, so they'll come in a separate update with its own testing.

## Check it yourself

```bash
curl -sI https://u77w41.github.io/anurup/   # response headers
npm ci && npm audit                          # dependency advisories
```

Reports from later scans will go in `security/reports/<date>/`.
