import { useState } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Check, ChevronDown, Download, Eye, FolderPlus, MoreHorizontal, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileThumb, InlinePreview, PreviewDialog, useImageSize } from "@/components/FilePreview";
import PdfViewer from "@/components/pdf/PdfViewer";
import { useSendToTool } from "@/hooks/use-tool-io";
import { downloadBlob, downloadZip } from "@/lib/download";
import { formatBytes, kindOf } from "@/lib/format";
import { rankedTargets, type ToolDef, type ToolId } from "@/lib/tools";
import { toast } from "sonner";

export interface ResultItem {
  blob: Blob;
  name: string;
  /** Extra detail shown under the file name. */
  note?: string;
}

interface ResultPanelProps {
  toolId: ToolId;
  items: ResultItem[];
  /** Extra info row (e.g. "Saved 62%"). */
  summary?: React.ReactNode;
  previewHeight?: string;
  zipName?: string;
  /** Heading for single results (default "Result"). */
  title?: string;
}

/**
 * Standard output block for every tool: preview, download, save to workspace and
 * "continue in another tool" without downloading and re-uploading.
 */
const ResultPanel = ({ toolId, items, summary, previewHeight = "65vh", zipName = "anurup-files.zip", title = "Result" }: ResultPanelProps) => {
  if (!items.length) return null;
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-4 rounded-2xl border border-border/70 bg-card p-4 shadow-card sm:p-5"
      aria-label="Result"
    >
      {items.length === 1 ? (
        <SingleResult toolId={toolId} item={items[0]} summary={summary} previewHeight={previewHeight} title={title} />
      ) : (
        <MultiResult toolId={toolId} items={items} summary={summary} zipName={zipName} />
      )}
    </motion.section>
  );
};

function ContinueMenu({ targets, onPick, label = "More tools", compact = false }: { targets: ToolDef[]; onPick: (t: ToolDef) => void; label?: string; compact?: boolean }) {
  if (!targets.length) return null;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {compact ? (
          <Button size="icon" variant="ghost" className="h-8 w-8" aria-label="More actions">
            <MoreHorizontal />
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="gap-1">
            {label} <ChevronDown />
          </Button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="max-h-80 w-60 overflow-y-auto">
        <DropdownMenuLabel className="text-xs text-muted-foreground">Open in…</DropdownMenuLabel>
        {targets.map((t) => (
          <DropdownMenuItem key={t.id} onSelect={() => onPick(t)} className="gap-2">
            <t.icon className="h-4 w-4 text-muted-foreground" />
            {t.title}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

function SingleResult({ toolId, item, summary, previewHeight, title }: { toolId: ToolId; item: ResultItem; summary?: React.ReactNode; previewHeight: string; title: string }) {
  const kind = kindOf(item.blob.type, item.name);
  const { send, save, isSaved } = useSendToTool(toolId);
  const [, force] = useState(0);
  const [pages, setPages] = useState<number | null>(null);
  const dims = useImageSize(kind === "image" ? item.blob : null);
  const targets = kind === "other" ? [] : rankedTargets(kind, toolId);
  const quick = targets.slice(0, 3);
  const rest = targets.slice(3);
  const saved = isSaved(item.blob);

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <h2 className="font-display text-lg font-semibold text-foreground">{title}</h2>
          <p className="truncate text-sm text-muted-foreground">
            {item.name} · {formatBytes(item.blob.size)}
            {dims && ` · ${dims.width}×${dims.height}px`}
            {pages != null && ` · ${pages} page${pages === 1 ? "" : "s"}`}
            {item.note && ` · ${item.note}`}
          </p>
        </div>
        {summary && <div className="text-sm">{summary}</div>}
      </div>

      {kind === "pdf" ? (
        <PdfViewer file={item.blob} name={item.name} height={previewHeight} onLoaded={setPages} />
      ) : (
        <InlinePreview blob={item.blob} name={item.name} />
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Button onClick={() => downloadBlob(item.blob, item.name)} className="gap-2 sm:w-auto">
          <Download /> Download
        </Button>
        <Button
          variant="outline"
          className="gap-2"
          disabled={saved}
          onClick={() => {
            save(item.blob, item.name);
            force((n) => n + 1);
            toast.success("Saved to workspace");
          }}
        >
          {saved ? <Check /> : <FolderPlus />}
          {saved ? "In workspace" : "Save to workspace"}
        </Button>
      </div>

      {targets.length > 0 && (
        <div className="rounded-xl bg-muted/50 p-3">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Continue with this file</p>
          <div className="flex flex-wrap items-center gap-2">
            {quick.map((t) => (
              <Button key={t.id} size="sm" variant="secondary" className="gap-1.5 bg-background shadow-sm hover:bg-background hover:text-primary" onClick={() => send([item], t.id)}>
                <t.icon className="text-muted-foreground" />
                {t.short}
                <ArrowRight className="opacity-60" />
              </Button>
            ))}
            <ContinueMenu targets={rest} onPick={(t) => send([item], t.id)} />
          </div>
        </div>
      )}
    </>
  );
}

function MultiResult({ toolId, items, summary, zipName }: { toolId: ToolId; items: ResultItem[]; summary?: React.ReactNode; zipName: string }) {
  const { send, save } = useSendToTool(toolId);
  const [preview, setPreview] = useState<ResultItem | null>(null);
  const [zipping, setZipping] = useState(false);
  const kinds = new Set(items.map((i) => kindOf(i.blob.type, i.name)));
  const kind = kinds.size === 1 ? [...kinds][0] : "other";
  const multiTargets = kind === "other" ? [] : rankedTargets(kind, toolId, items.length);
  const total = items.reduce((n, i) => n + i.blob.size, 0);

  return (
    <>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-lg font-semibold text-foreground">{items.length} files ready</h2>
          <p className="text-sm text-muted-foreground">Total {formatBytes(total)}</p>
          {summary && <div className="mt-1 text-sm">{summary}</div>}
        </div>
        <div className="flex flex-wrap gap-2">
          <Button
            className="gap-2"
            disabled={zipping}
            onClick={async () => {
              setZipping(true);
              try {
                await downloadZip(items, zipName);
              } finally {
                setZipping(false);
              }
            }}
          >
            <Package /> {zipping ? "Zipping…" : "Download all (.zip)"}
          </Button>
          <Button
            variant="outline"
            className="gap-2"
            onClick={() => {
              items.forEach((i) => save(i.blob, i.name));
              toast.success(`Saved ${items.length} files to workspace`);
            }}
          >
            <FolderPlus /> Save all
          </Button>
          <ContinueMenu targets={multiTargets} onPick={(t) => send(items, t.id)} label="Send all to" />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {items.map((item, i) => {
          const k = kindOf(item.blob.type, item.name);
          const targets = k === "other" ? [] : rankedTargets(k, toolId);
          return (
            <div key={`${item.name}-${i}`} className="group overflow-hidden rounded-xl border border-border bg-background">
              <button className="block w-full" onClick={() => setPreview(item)} aria-label={`Preview ${item.name}`}>
                <FileThumb blob={item.blob} name={item.name} fit="contain" className="aspect-[4/3] h-auto w-full rounded-none border-0" />
              </button>
              <div className="flex items-center gap-1 p-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-xs font-medium text-foreground" title={item.name}>
                    {item.name}
                  </p>
                  <p className="truncate text-[11px] text-muted-foreground" title={item.note}>
                    {formatBytes(item.blob.size)}
                    {item.note && ` · ${item.note}`}
                  </p>
                </div>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => setPreview(item)} aria-label="Preview">
                  <Eye />
                </Button>
                <Button size="icon" variant="ghost" className="h-8 w-8" onClick={() => downloadBlob(item.blob, item.name)} aria-label="Download">
                  <Download />
                </Button>
                <ContinueMenu targets={targets} onPick={(t) => send([item], t.id)} compact />
              </div>
            </div>
          );
        })}
      </div>
      <PreviewDialog blob={preview?.blob ?? null} name={preview?.name ?? ""} open={!!preview} onOpenChange={(o) => !o && setPreview(null)} />
    </>
  );
}

export default ResultPanel;
