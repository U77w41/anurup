import { Link, useLocation } from "react-router-dom";
import { ArrowLeft, Github } from "lucide-react";
import { motion } from "framer-motion";
import WorkspaceDrawer from "@/components/WorkspaceDrawer";
import logo from "@/assets/anurup_logo.svg";
import { useEffect } from "react";

interface LayoutProps {
  children: React.ReactNode;
  title?: string;
  description?: string;
  /** Max content width for tool pages. */
  width?: "md" | "lg" | "xl";
}

const WIDTH = { md: "max-w-2xl", lg: "max-w-4xl", xl: "max-w-6xl" };

const Layout = ({ children, title, description, width = "md" }: LayoutProps) => {
  const location = useLocation();
  const isHome = location.pathname === "/";

  useEffect(() => {
    document.title = title ? `${title} · ANURUP` : "ANURUP — photo & PDF toolkit for online forms";
  }, [title]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-40 border-b border-border/50 bg-background/80 backdrop-blur-xl">
        <div className="container flex h-16 items-center justify-between gap-3">
          <Link to="/" className="flex items-center gap-2.5 font-display text-xl font-bold tracking-wide text-foreground" aria-label="ANURUP home">
            <img src={logo} alt="" className="h-9 w-9" width={36} height={36} />
            ANURUP
          </Link>
          <div className="flex items-center gap-2 sm:gap-4">
            {!isHome && (
              <Link to="/" className="flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground">
                <ArrowLeft className="h-4 w-4" />
                <span className="hidden sm:inline">All tools</span>
              </Link>
            )}
            <WorkspaceDrawer />
          </div>
        </div>
      </header>

      {title && (
        <div className="border-b border-border/50 bg-muted/30">
          <div className="container py-8">
            <motion.h1 initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="font-display text-3xl font-bold text-foreground">
              {title}
            </motion.h1>
            {description && (
              <motion.p initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="mt-2 max-w-3xl text-muted-foreground">
                {description}
              </motion.p>
            )}
          </div>
        </div>
      )}

      <main className="container flex-1 py-8">{title ? <div className={`mx-auto ${WIDTH[width]} space-y-6`}>{children}</div> : children}</main>

      <footer className="border-t border-border/50 bg-muted/30">
        <div className="container flex flex-col items-center justify-between gap-2 py-6 text-sm text-muted-foreground sm:flex-row">
          <span>100% client-side. Your files never leave your browser.</span>
          <a href="https://github.com/U77w41/anurup" target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 hover:text-foreground">
            <Github className="h-4 w-4" /> Source on GitHub
          </a>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
