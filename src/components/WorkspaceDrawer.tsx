import { useMemo, useRef, useState } from "react";
import { ChevronDown, Download, Eye, Inbox, MoreHorizontal, Trash2, Upload } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { FileThumb, PreviewDialog } from "@/components/FilePreview";
import { useOpenWorkspaceFiles } from "@/hooks/use-tool-io";
import { downloadBlob } from "@/lib/download";
import { formatBytes, kindOf } from "@/lib/format";
import { getTool, rankedTargets } from "@/lib/tools";
import { useWorkspace, type WorkFile } from "@/lib/workspace";
import { cn } from "@/lib/utils";

function timeAgo(ts: number) {
  const s = Math.round((Date.now() - ts) / 1000);
  if (s < 60) return "just now";
  if (s < 3600) return `${Math.floor(s / 60)} min ago`;
  if (s < 86400) return `${Math.floor(s / 3600)} h ago`;
  return new Date(ts).toLocaleDateString();
}

/** Slide-over listing every file in the shared workspace (opened from the sidebar / top bar). */
const WorkspaceDrawer = ({ open: isOpen, onOpenChange: setIsOpen }: { open: boolean; onOpenChange: (o: boolean) => void }) => {
  const { files, add, remove, clear } = useWorkspace();
  const open = useOpenWorkspaceFiles();
  const [selected, setSelected] = useState<string[]>([]);
  const [preview, setPreview] = useState<WorkFile | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const selection = useMemo(() => selected.map((id) => files.find((f) => f.id === id)).filter(Boolean) as WorkFile[], [selected, files]);
  const selKinds = new Set(selection.map((f) => f.kind));
  const selKind = selKinds.size === 1 ? [...selKinds][0] : null;
  const selTargets = selKind && selKind !== "other" ? rankedTargets(selKind, undefined, selection.length) : [];

  const go = (ids: string[], toolId: Parameters<typeof open>[1]) => {
    setIsOpen(false);
    setSelected([]);
    open(ids, toolId);
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetContent className="flex w-full flex-col gap-0 p-0 sm:max-w-md">
        <SheetHeader className="border-b border-border p-5 pb-4 text-left">
          <SheetTitle className="font-display">Workspace</SheetTitle>
          <SheetDescription>
            Results you save or pass between tools. They are stored only in this browser, and you can open any of them in another tool without downloading.
          </SheetDescription>
          <div className="flex gap-2 pt-1">
            <Button size="sm" variant="outline" className="gap-1.5 hover:bg-muted hover:text-foreground" onClick={() => inputRef.current?.click()}>
              <Upload /> Add files
            </Button>
            {files.length > 0 && (
              <Button
                size="sm"
                variant="ghost"
                className="gap-1.5 text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                onClick={() => {
                  clear();
                  setSelected([]);
                  toast.success("Workspace cleared");
                }}
              >
                <Trash2 /> Clear all
              </Button>
            )}
            <input
              ref={inputRef}
              type="file"
              multiple
              accept="image/*,.pdf,application/pdf"
              className="hidden"
              onChange={(e) => {
                const list = Array.from(e.target.files || []).filter((f) => kindOf(f.type, f.name) !== "other");
                list.forEach((f) => add(f, f.name));
                if (list.length) toast.success(`Added ${list.length} file${list.length > 1 ? "s" : ""}`);
                e.target.value = "";
              }}
            />
          </div>
        </SheetHeader>

        <div className="min-h-0 flex-1 overflow-y-auto p-3">
          {files.length === 0 ? (
            <div className="flex h-full flex-col items-center justify-center gap-2 p-8 text-center text-sm text-muted-foreground">
              <Inbox className="h-8 w-8" />
              <p>No files yet.</p>
              <p className="text-xs">Use “Save to workspace” or “Continue with” on any tool’s result.</p>
            </div>
          ) : (
            <ul className="space-y-1.5">
              {files.map((f) => {
                const checked = selected.includes(f.id);
                const targets = f.kind === "other" ? [] : rankedTargets(f.kind, f.source);
                return (
                  <li key={f.id} className={cn("flex items-center gap-2 rounded-lg border p-2 transition-colors", checked ? "border-primary bg-primary/5" : "border-transparent hover:bg-muted/60")}>
                    <input
                      type="checkbox"
                      aria-label={`Select ${f.name}`}
                      checked={checked}
                      onChange={() => setSelected((s) => (checked ? s.filter((x) => x !== f.id) : [...s, f.id]))}
                      className="h-4 w-4 accent-[hsl(var(--primary))]"
                    />
                    <button onClick={() => setPreview(f)} aria-label={`Preview ${f.name}`}>
                      <FileThumb blob={f.blob} name={f.name} className="h-11 w-11" />
                    </button>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground" title={f.name}>
                        {f.name}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {formatBytes(f.size)} · {f.source ? getTool(f.source).short : "uploaded"} · {timeAgo(f.createdAt)}
                      </p>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button size="icon" variant="ghost" className="h-8 w-8 hover:bg-muted hover:text-foreground" aria-label="File actions">
                          <MoreHorizontal />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="max-h-96 w-60 overflow-y-auto">
                        <DropdownMenuItem className="gap-2" onSelect={() => setPreview(f)}>
                          <Eye className="h-4 w-4" /> Preview
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2" onSelect={() => downloadBlob(f.blob, f.name)}>
                          <Download className="h-4 w-4" /> Download
                        </DropdownMenuItem>
                        <DropdownMenuItem className="gap-2 text-destructive focus:text-destructive" onSelect={() => remove(f.id)}>
                          <Trash2 className="h-4 w-4" /> Remove
                        </DropdownMenuItem>
                        {targets.length > 0 && (
                          <>
                            <DropdownMenuSeparator />
                            <DropdownMenuLabel className="text-xs text-muted-foreground">Open in…</DropdownMenuLabel>
                            {targets.map((t) => (
                              <DropdownMenuItem key={t.id} className="gap-2" onSelect={() => go([f.id], t.id)}>
                                <t.icon className="h-4 w-4 text-muted-foreground" /> {t.title}
                              </DropdownMenuItem>
                            ))}
                          </>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {selection.length > 0 && (
          <div className="flex items-center justify-between gap-2 border-t border-border bg-muted/40 p-3">
            <span className="text-sm text-muted-foreground">{selection.length} selected</span>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" className="gap-1" disabled={!selTargets.length}>
                  {selKind ? "Open selected in" : "Mixed file types"} <ChevronDown />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                {selTargets.map((t) => (
                  <DropdownMenuItem key={t.id} className="gap-2" onSelect={() => go(selected, t.id)}>
                    <t.icon className="h-4 w-4 text-muted-foreground" /> {t.title}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        )}
        <PreviewDialog blob={preview?.blob ?? null} name={preview?.name ?? ""} open={!!preview} onOpenChange={(o) => !o && setPreview(null)} />
      </SheetContent>
    </Sheet>
  );
};

export default WorkspaceDrawer;
