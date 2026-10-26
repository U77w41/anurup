import { useEffect, useState } from "react";
import { Link, useLocation, useSearchParams } from "react-router-dom";
import { ArrowLeft, FileText, Github, Globe, Image, Layers, LayoutGrid, Menu } from "lucide-react";
import { motion } from "framer-motion";
import WorkspaceDrawer from "@/components/WorkspaceDrawer";
import { ThemeIconButton, ThemeToggle } from "@/components/ThemeToggle";
import { Sheet, SheetContent, SheetTitle } from "@/components/ui/sheet";
import { BADGE_CLASS, TOOLS } from "@/lib/tools";
import { useWorkspace } from "@/lib/workspace";
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
const REPO_URL = "https://github.com/U77w41/anurup";
const PORTFOLIO_URL = "https://u77w41.github.io/";

/** Which sidebar entry is active for the current route. */
function useSection(): "all" | "photo" | "pdf" | null {
  const { pathname } = useLocation();
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

  const items = [
    { key: "all", label: "All tools", to: "/", icon: LayoutGrid },
    { key: "photo", label: "Photo & Signature", to: "/?c=photo", icon: Image },
    { key: "pdf", label: "PDF tools", to: "/?c=pdf", icon: FileText },
  ] as const;

  const row = "flex items-center gap-6 py-2.5 text-sm transition-colors";

  return (
    <div className="flex h-full flex-col">
      <header className="space-y-4">
        <Link to="/" onClick={onNavigate} className="block w-fit" aria-label="ANURUP home">
          <figure className="flex h-[100px] w-[100px] items-center justify-center rounded-full bg-card p-5 shadow-card">
            <img src={logo} alt="ANURUP logo" className="h-full w-full dark:invert" width={60} height={60} />
          </figure>
        </Link>
        <div>
          <h1 className="text-xl font-bold tracking-wide text-primary">
            <Link to="/" onClick={onNavigate}>
              ANURUP
            </Link>
          </h1>
          <p className="mt-1 text-sm leading-snug text-muted-foreground">Photo &amp; PDF toolkit for online forms — runs 100% in your browser</p>
        </div>
        <ul className="flex gap-4 text-muted-foreground">
          <li>
            <a href={REPO_URL} target="_blank" rel="noreferrer" title="Source on GitHub" className="hover:text-foreground">
              <Github className="h-6 w-6" strokeWidth={1.5} />
            </a>
          </li>
          <li>
            <a href={PORTFOLIO_URL} target="_blank" rel="noreferrer" title="Ujjwal Chowdhury — portfolio & blog" className="hover:text-foreground">
              <Globe className="h-6 w-6" strokeWidth={1.5} />
            </a>
          </li>
        </ul>
      </header>

      <nav className="mt-8" aria-label="Main">
        <ol>
          {items.map((it) => (
            <li key={it.key}>
              <Link
                to={it.to}
                onClick={onNavigate}
                className={cn(row, section === it.key ? "font-bold text-primary" : "text-muted-foreground hover:text-foreground")}
                aria-current={section === it.key ? "page" : undefined}
              >
                <it.icon className="h-6 w-6 shrink-0" strokeWidth={1.5} />
                {it.label}
              </Link>
            </li>
          ))}
          <li>
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
          </li>
        </ol>
      </nav>

      <div className="mt-auto pt-8">
        <ThemeToggle />
      </div>
    </div>
  );
}

const Layout = ({ children, title, description, width = "md" }: LayoutProps) => {
  const { pathname } = useLocation();
  const { files } = useWorkspace();
  const [menuOpen, setMenuOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const tool = TOOLS.find((t) => `/${t.id}` === pathname);

  useEffect(() => {
    document.title = title ? `${title} · ANURUP` : "ANURUP — photo & PDF toolkit for online forms";
  }, [title]);

  const openWorkspace = () => setWorkspaceOpen(true);

  return (
    <div className="min-h-screen bg-background">
      {/* Mobile top bar */}
      <header className="sticky top-0 z-40 flex h-14 items-center gap-2 border-b border-border/60 bg-background/90 px-3 backdrop-blur-xl lg:hidden">
        <button type="button" onClick={() => setMenuOpen(true)} className="flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </button>
        <Link to="/" className="flex items-center gap-2 font-bold tracking-wide text-primary">
          <img src={logo} alt="" className="h-7 w-7 dark:invert" width={28} height={28} />
          ANURUP
        </Link>
        <div className="ml-auto flex items-center">
          <button type="button" onClick={openWorkspace} className="relative flex h-10 w-10 items-center justify-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground" aria-label="Open workspace">
            <Layers className="h-5 w-5" />
            {files.length > 0 && (
              <span className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] font-bold text-primary-foreground">{files.length}</span>
            )}
          </button>
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
            {title ? (
              <div className={cn("mx-auto space-y-6", WIDTH[width])}>
                <motion.header initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="rounded-lg bg-card p-6 shadow-card sm:p-8">
                  <div className="mb-4 flex items-center gap-3">
                    <Link to={tool ? `/?c=${tool.category}` : "/"} className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground">
                      <ArrowLeft className="h-4 w-4" /> All tools
                    </Link>
                    {tool && <span className={cn("rounded px-2.5 py-1 text-xs", BADGE_CLASS[tool.badge])}>{tool.badge}</span>}
                  </div>
                  <h1 className="text-2xl font-bold text-card-foreground sm:text-3xl">{title}</h1>
                  {description && <p className="mt-2 text-base leading-relaxed text-muted-foreground sm:text-lg">{description}</p>}
                </motion.header>
                {children}
              </div>
            ) : (
              children
            )}
          </main>

          <footer className="mt-12 space-y-1 border-t border-border/70 pt-6 text-center text-sm text-muted-foreground lg:text-left">
            <p>
              © {new Date().getFullYear()}{" "}
              <a href={PORTFOLIO_URL} target="_blank" rel="noreferrer" className="font-bold text-primary hover:underline">
                Ujjwal Chowdhury
              </a>{" "}
              · ANURUP
            </p>
            <p>100% client-side — your files never leave your browser.</p>
          </footer>
        </div>
      </div>
    </div>
  );
};

export default Layout;
