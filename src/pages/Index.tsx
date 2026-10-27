import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { ArrowRight, Search, X } from "lucide-react";
import ToolCard from "@/components/ToolCard";
import Layout from "@/components/Layout";
import { Input } from "@/components/ui/input";
import { TOOLS } from "@/lib/tools";
import { cn } from "@/lib/utils";
import { HOME } from "@/seo/content";
import { Tip } from "@/components/Tip";

const SECTIONS = [
  { key: "photo", title: "Photo & Signature" },
  { key: "pdf", title: "PDF tools" },
] as const;

const FILTERS = [
  { key: "all", label: "All" },
  { key: "photo", label: "Photo & Signature" },
  { key: "pdf", label: "PDF" },
] as const;

const Index = () => {
  const [query, setQuery] = useState("");
  const [params, setParams] = useSearchParams();
  const c = params.get("c");
  const category = c === "photo" || c === "pdf" ? c : "all";

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return TOOLS;
    return TOOLS.filter((t) => `${t.title} ${t.description} ${t.keywords ?? ""}`.toLowerCase().includes(q));
  }, [query]);

  return (
    <Layout>
      <section className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">{HOME.h1}</h1>
        <p className="mt-3 max-w-3xl text-lg leading-relaxed text-muted-foreground">{HOME.intro}</p>
        <p className="mt-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground">
          <span className="font-bold text-foreground">Chain tools:</span> Crop <ArrowRight className="h-3.5 w-3.5" /> Remove background
          <ArrowRight className="h-3.5 w-3.5" /> Resize to 50 KB <span className="text-xs">Every result has a Continue with button, so you never re-upload the file.</span>
        </p>
      </section>

      <div className="mb-8 rounded-lg bg-card p-4 shadow-card sm:p-5">
        <div className="relative">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search tools, for example 50 KB, signature or password"
            className="h-12 rounded-lg bg-background pl-12 pr-10 text-base"
            aria-label="Search tools"
          />
          {query && (
            <Tip label="Clear search">
              <button type="button" onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground" aria-label="Clear search">
                <X className="h-4 w-4" />
              </button>
            </Tip>
          )}
        </div>
        <div className="mt-4 flex flex-wrap gap-2" role="tablist" aria-label="Category">
          {FILTERS.map((f) => (
            <button
              key={f.key}
              type="button"
              role="tab"
              aria-selected={category === f.key}
              onClick={() => setParams(f.key === "all" ? {} : { c: f.key })}
              className={cn(
                "rounded-full border px-3.5 py-1.5 text-sm transition-colors",
                category === f.key ? "border-primary bg-primary font-bold text-primary-foreground" : "border-border text-muted-foreground hover:border-primary/50 hover:text-foreground",
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {SECTIONS.filter((s) => category === "all" || s.key === category).map((section) => {
        const list = filtered.filter((t) => t.category === section.key);
        if (!list.length) return null;
        return (
          <section key={section.key} className="mb-10">
            <h2 className="mb-4 text-sm font-bold uppercase tracking-widest text-muted-foreground">{section.title}</h2>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {list.map((tool, i) => (
                <ToolCard key={tool.id} tool={tool} index={i} />
              ))}
            </div>
          </section>
        );
      })}
      {!filtered.some((t) => category === "all" || t.category === category) && (
        <p className="rounded-lg bg-card py-12 text-center text-muted-foreground shadow-card">No tool matches “{query}”.</p>
      )}
    </Layout>
  );
};

export default Index;
