import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Search } from "lucide-react";
import ToolCard from "@/components/ToolCard";
import Layout from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { TOOLS } from "@/lib/tools";

const SECTIONS = [
  { key: "photo", title: "Photo & Signature Tools" },
  { key: "pdf", title: "PDF Tools" },
] as const;

const Index = () => {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return TOOLS;
    return TOOLS.filter((t) => `${t.title} ${t.description} ${t.keywords ?? ""}`.toLowerCase().includes(q));
  }, [query]);

  return (
    <Layout>
      <div className="mb-10 text-center">
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          className="font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl"
        >
          The Ultimate <span className="text-gradient-primary">Form Fill-Up</span> Utility
        </motion.h1>
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mx-auto mt-4 max-w-2xl text-lg text-muted-foreground"
        >
          Resize photos, clean signatures, merge and compress PDFs — everything government and exam portals ask for. 100% in your browser.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mx-auto mt-6 flex max-w-xl flex-wrap items-center justify-center gap-x-2 gap-y-1 text-sm text-muted-foreground"
        >
          <span className="font-medium text-foreground">Chain tools:</span>
          <span>Crop</span>
          <ArrowRight className="h-3.5 w-3.5" />
          <span>Remove background</span>
          <ArrowRight className="h-3.5 w-3.5" />
          <span>Resize to 50 KB</span>
          <span className="w-full text-xs sm:w-auto">— every result has “Continue with”, no re-uploading.</span>
        </motion.div>

        <div className="relative mx-auto mt-8 max-w-md">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tools — e.g. “50 KB”, “signature”, “merge”"
            className="h-11 rounded-xl pl-9"
            aria-label="Search tools"
          />
        </div>
      </div>

      {SECTIONS.map((section) => {
        const list = filtered.filter((t) => t.category === section.key);
        if (!list.length) return null;
        return (
          <section key={section.key} className="mb-10">
            <h2 className="mb-5 font-display text-sm font-semibold uppercase tracking-widest text-muted-foreground">{section.title}</h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((tool, i) => (
                <ToolCard key={tool.id} tool={tool} index={i} />
              ))}
            </div>
          </section>
        );
      })}
      {!filtered.length && <p className="py-12 text-center text-muted-foreground">No tool matches “{query}”.</p>}
    </Layout>
  );
};

export default Index;
