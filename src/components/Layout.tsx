import { useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { ArrowLeft, Download, FileText, Github, Image, Layers, LayoutGrid, Menu } from "lucide-react";
import { motion } from "framer-motion";
import WorkspaceDrawer from "@/components/WorkspaceDrawer";
import ToolGuide from "@/components/ToolGuide";
import { Tip } from "@/components/Tip";
import { BlogIcon, SupportIcon } from "@/components/BrandIcons";
import { HOME, SITE, toolUrl } from "@/seo/content";
import { applyHead } from "@/seo/head";
import { ThemeIconButton, ThemeToggle } from "@/components/ThemeToggle";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { BADGE_CLASS, BADGE_HINT, TOOLS } from "@/lib/tools";
import { useWorkspace } from "@/lib/workspace";
import { useInstallPrompt } from "@/lib/install";
import { cn } from "@/lib/utils";
import logo from "@/assets/anurup_logo.svg";

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  /** Max content width for tool pages. */
  width?: "md" | "lg" | "xl";
}

const WIDTH = { md: "max-w-2xl", lg: "max-w-4xl", xl: "max-w-6xl" };
const ICON_BTN = "flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground";
const REPO_URL = SITE.repo;
const PORTFOLIO_URL = SITE.authorUrl;
const SUPPORT_URL = SITE.supportUrl;

/** Hover text for links and icons, so first-time visitors know what each one does. */
const HINT = {
  home: "ANURUP home",
  repo: "Source code on GitHub",
  blog: "Ujjwal Chowdhury's portfolio and blog",
  all: `Browse all ${TOOLS.length} tools`,
  photo: "Passport photos, resize or compress to KB, crop, background and signature tools",
  pdf: "Merge, split, compress, sign, watermark and unlock PDFs",
  workspace: "Your saved files. Open any of them in another tool without uploading again.",
  support: "Support my work: send a small tip over UPI",
  install: "Install ANURUP as an app. It also works offline.",
  menu: "Open menu",
};

/** Router path without a trailing slash ("/pdf-merger/" → "/pdf-merger"). */
export function normalizePath(pathname: string) {
  return pathname.length > 1 ? pathname.replace(/\/+$/, "") : pathname;
}

/** Which sidebar entry is active for the current route. */
function useSection(): "all" | "photo" | "pdf" | null {
  const pathname = normalizePath(useLocation().pathname);
  const [params] = useSearchParams();
  if (pathname === "/") {
    const c = params.get("c");
    return c === "photo" || c === "pdf" ? c : "all";
  }
  const tool = TOOLS.find((t) => `/${t.id}` === pathname);
  return tool ? tool.category : null;
}

function SidebarContent({ onNavigate, onOpenWorkspace }: { onNavigate?: () => void; onOpenWorkspace: () => void }) {
  const section = useSection();
  const { files } = useWorkspace();
  const { canInstall, install } = useInstallPrompt();

  const items = [
    { key: "all", label: "All tools", to: "/", icon: LayoutGrid, hint: HINT.all },
    { key: "photo", label: "Photo & Signature", to: "/?c=photo", icon: Image, hint: HINT.photo },
    { key: "pdf", label: "PDF tools", to: "/?c=pdf", icon: FileText, hint: HINT.pdf },
  ] as const;

  const row = "flex items-center gap-6 py-2.5 text-sm transition-colors";

  return (
    <div className="flex h-full flex-col">
      <header className="space-y-4">
        <Tip label={HINT.home} side="right">
          <Link to="/" onClick={onNavigate} className="block w-fit" aria-label="ANURUP home">
            <figure className="flex h-[100px] w-[100px] items-center justify-center rounded-full bg-card p-5 shadow-card">
              <img src={logo} alt="ANURUP logo" className="h-full w-full dark:invert" width={60} height={60} />
            </figure>
          </Link>
        </Tip>
        <div>
          <h1 className="text-xl font-bold tracking-wide text-primary">
            <Tip label={HINT.home} side="right">
              <Link to="/" onClick={onNavigate}>
                ANURUP
              </Link>
            </Tip>
          </h1>
          <p className="mt-1 text-sm leading-snug text-muted-foreground">Photo &amp; PDF tools for online forms. Runs entirely in your browser.</p>
        </div>
        <ul className="flex gap-4 text-muted-foreground">
          <li>
            <Tip label={HINT.repo}>
              <a href={REPO_URL} target="_blank" rel="noreferrer" aria-label={HINT.repo} className="hover:text-foreground">
                <Github className="h-6 w-6" strokeWidth={1.5} />
              </a>
            </Tip>
          </li>
          <li>
            <Tip label={HINT.blog}>
              <a href={PORTFOLIO_URL} target="_blank" rel="noreferrer" aria-label={HINT.blog} className="hover:text-foreground" data-testid="blog-link">
                <BlogIcon />
              </a>
            </Tip>
          </li>
        </ul>
      </header>

      <nav className="mt-8" aria-label="Main">
        <ol>
          {items.map((it) => (
            <li key={it.key}>
              <Tip label={it.hint} side="right">
                <Link
                  to={it.to}
                  onClick={onNavigate}
                  className={cn(row, section === it.key ? "font-bold text-primary" : "text-muted-foreground hover:text-foreground")}
                  aria-current={section === it.key ? "page" : undefined}
                >
                  <it.icon className="h-6 w-6 shrink-0" strokeWidth={1.5} />
                  {it.label}
                </Link>
              </Tip>
            </li>
          ))}
          <li>
            <Tip label={HINT.workspace} side="right">
              <button
                type="button"
                onClick={() => {
                  onNavigate?.();
                  onOpenWorkspace();
                }}
                className={cn(row, "w-full text-muted-foreground hover:text-foreground")}
                data-testid="workspace-button"
              >
                <Layers className="h-6 w-6 shrink-0" strokeWidth={1.5} />
                Workspace
                {files.length > 0 && (
                  <span className="ml-auto rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-primary-foreground">{files.length}</span>
                )}
              </button>
            </Tip>
          </li>
          <li>
            <Tip label={HINT.support} side="right">
              <a href={SUPPORT_URL} target="_blank" rel="noreferrer" onClick={onNavigate} className={cn(row, "group text-muted-foreground hover:text-foreground")} data-testid="support-link">
                <SupportIcon className="shrink-0" />
                Support my work
              </a>
            </Tip>
          </li>
        </ol>
      </nav>

      <div className="mt-auto space-y-5 pt-8">
        {canInstall && (
          <Tip label={HINT.install} side="right">
            <button
              type="button"
              onClick={() => {
                onNavigate?.();
                void install();
              }}
              className="flex w-full items-center gap-6 text-sm text-muted-foreground transition-colors hover:text-foreground"
              data-testid="install-app"
            >
              <Download className="h-6 w-6 shrink-0" strokeWidth={1.5} />
              Install app
            </button>
          </Tip>
        )}
        <ThemeToggle />
      </div>
    </div>
  );
}

const Layout = ({ children, title, description, width = "md" }: LayoutProps) => {
  const pathname = normalizePath(useLocation().pathname);
  const { files } = useWorkspace();
  const { canInstall, install } = useInstallPrompt();
  const [menuOpen, setMenuOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const tool = TOOLS.find((t) => `/${t.id}` === pathname);

  // Tool pages take their heading and intro from the shared SEO copy.
  const heading = tool?.content.h1 ?? title;
  const intro = tool?.content.intro ?? description;

  useEffect(() => {
    if (tool) applyHead({ title: `${tool.content.title} | ${SITE.name}`, description: tool.content.description, url: toolUrl(tool.id) });
    else if (pathname === "/") applyHead({ title: HOME.title, description: HOME.description, url: SITE.url });
    else document.title = title ? `${title} | ${SITE.name}` : HOME.title;
  }, [tool, pathname, title]);

  const openWorkspace = () => setWorkspaceOpen(true);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-border/60 bg-background/90 px-3 backdrop-blur-xl lg:hidden">
        <Tip label={HINT.menu} side="bottom">
          <button type="button" onClick={() => setMenuOpen(true)} className={ICON_BTN} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>
        </Tip>
        <Tip label={HINT.home} side="bottom">
          <Link to="/" className="flex items-center gap-2 font-bold tracking-wide text-primary">
            <img src={logo} alt="" className="h-7 w-7 dark:invert" width={28} height={28} />
            ANURUP
          </Link>
        </Tip>
        <div className="ml-auto flex items-center">
          {canInstall && (
            <Tip label={HINT.install} side="bottom">
              <button type="button" onClick={() => void install()} className={ICON_BTN} aria-label="Install ANURUP as an app">
                <Download className="h-5 w-5" />
              </button>
            </Tip>
          )}
          <Tip label={HINT.support} side="bottom">
            <a href={SUPPORT_URL} target="_blank" rel="noreferrer" className={cn(ICON_BTN, "group")} aria-label="Support my work" data-testid="support-link-mobile">
              <SupportIcon className="h-5 w-5" />
            </a>
          </Tip>
          <Tip label={HINT.workspace} side="bottom">
            <button type="button" onClick={openWorkspace} className={cn(ICON_BTN, "relative")} aria-label="Open workspace">
              <Layers className="h-5 w-5" />
              {files.length > 0 && (
                <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">{files.length}</span>
              )}
            </button>
          </Tip>
          <ThemeIconButton />
        </div>
      </header>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="w-[280px] bg-background p-8 sm:max-w-[280px]">
          <SheetTitle className="sr-only">Menu</SheetTitle>
          <SidebarContent onNavigate={() => setMenuOpen(false)} onOpenWorkspace={openWorkspace} />
        </SheetContent>
      </Sheet>

      <WorkspaceDrawer open={workspaceOpen} onOpenChange={setWorkspaceOpen} />

      <div className="mx-auto flex max-w-[1400px] gap-10 px-4 sm:px-6 lg:px-8">
        {/* Desktop sidebar */}
        <aside className="sticky top-0 hidden h-screen w-[210px] shrink-0 py-12 lg:block">
          <SidebarContent onOpenWorkspace={openWorkspace} />
        </aside>

        <div className="flex min-h-screen min-w-0 flex-1 flex-col py-6 lg:py-12">
          <main className="flex-1">
            {heading ? (
              <div className={cn("mx-auto space-y-6", WIDTH[width])}>
                <motion.header initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg bg-card p-6 shadow-card sm:p-8">
                  <div className="mb-4 flex items-center gap-3">
                    <Tip label={tool ? `Back to ${tool.category === "photo" ? "Photo & Signature" : "PDF"} tools` : "Back to all tools"} side="bottom">
                      <Link to={tool ? `/?c=${tool.category}` : "/"} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
                        <ArrowLeft className="h-4 w-4" /> All tools
                      </Link>
                    </Tip>
                    {tool && (
                      <Tip label={BADGE_HINT[tool.badge]} side="bottom">
                        <span className={cn("rounded px-2.5 py-1 text-xs", BADGE_CLASS[tool.badge])}>{tool.badge}</span>
                      </Tip>
                    )}
                  </div>
                  <h1 className="text-2xl font-bold text-card-foreground sm:text-3xl">{heading}</h1>
                  {intro && <p className="mt-2 text-base leading-relaxed text-muted-foreground sm:text-lg">{intro}</p>}
                </motion.header>
                {children}
                {tool && <ToolGuide content={tool.content} />}
              </div>
            ) : (
              children
            )}
          </main>

          <footer className="mt-12 space-y-1 border-t border-border/70 pt-6 text-center text-sm text-muted-foreground lg:text-left">
            <p>
              © {new Date().getFullYear()}{" "}
              <Tip label={HINT.blog}>
                <a href={PORTFOLIO_URL} target="_blank" rel="noreferrer" className="font-bold text-primary hover:underline">
                  Ujjwal Chowdhury
                </a>
              </Tip>{" "}
              · ANURUP
            </p>
            <p>Everything runs in your browser. Your files are never uploaded.</p>
            <p className="pt-2">
              <Tip label={HINT.support}>
                <a href={SUPPORT_URL} target="_blank" rel="noreferrer" className="group inline-flex items-center gap-2 font-bold text-primary hover:underline" data-testid="support-link-footer">
                  <SupportIcon className="h-5 w-5" />
                  Support my work
                </a>
              </Tip>
            </p>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Layout;
