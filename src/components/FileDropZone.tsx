import { useCallback, useEffect, useRef, useState } from "react";
import { ArrowDown, ArrowUp, Check, Eye, FolderOpen, LockKeyhole, Upload, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { FileThumb, PreviewDialog } from "@/components/FilePreview";
import { formatBytes, kindOf, type FileKind } from "@/lib/format";
import { getTool } from "@/lib/tools";
import { toFile, useWorkspace } from "@/lib/workspace";
import { cn } from "@/lib/utils";
import { useLocation } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { baseName } from "@/lib/format";

const lockCache = new WeakMap<Blob, Promise<boolean>>();

/**
 * Flags encrypted PDFs in the file list and unlocks them in place: restriction-only
 * files are unlocked straight away, otherwise a password is asked for.
 */
function LockBadge({ file, onUnlocked }: { file: File; onUnlocked: (f: File) => void }) {
  const [locked, setLocked] = useState(false);
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const onUnlockPage = useLocation().pathname === "/pdf-unlock";

  useEffect(() => {
    let alive = true;
    let p = lockCache.get(file);
    if (!p) {
      p = import("@/lib/qpdf").then((m) => m.looksEncrypted(file)).catch(() => false);
      lockCache.set(file, p);
    }
    p.then((v) => alive && setLocked(v));
    return () => {
      alive = false;
    };
  }, [file]);

  const finish = (blob: Blob) => {
    const unlocked = new File([blob], `${baseName(file.name)}-unlocked.pdf`, { type: "application/pdf" });
    lockCache.set(unlocked, Promise.resolve(false));
    setOpen(false);
    toast.success(`Unlocked ${file.name}`);
    onUnlocked(unlocked);
  };

  const start = async () => {
    setBusy(true);
    try {
      const q = await import("@/lib/qpdf");
      const { state, unlocked } = await q.inspectLock(file);
      if (state === "restricted" && unlocked) finish(unlocked);
      else if (state === "none") setLocked(false);
      else {
        setPassword("");
        setError(null);
        setOpen(true);
      }
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  const submit = async () => {
    setBusy(true);
    setError(null);
    try {
      const q = await import("@/lib/qpdf");
      finish(await q.unlockPdf(file, password));
    } catch (e) {
      setError((e as Error).name === "WrongPasswordError" ? "Incorrect password — try again." : (e as Error).message);
    } finally {
      setBusy(false);
    }
  };

  if (!locked || onUnlockPage) return null;
  return (
    <>
      <span className="flex shrink-0 items-center gap-1 rounded-md bg-amber-500/10 px-2 py-1 text-xs font-medium text-amber-700 dark:text-amber-400">
        <LockKeyhole className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Protected</span>
        <button type="button" disabled={busy} className="ml-1 underline underline-offset-2 hover:no-underline disabled:opacity-50" onClick={start}>
          {busy && !open ? "Checking…" : "Unlock"}
        </button>
      </span>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <LockKeyhole className="h-4 w-4 text-primary" /> Unlock PDF
            </DialogTitle>
            <DialogDescription className="break-all">Enter the password for {file.name}. It’s used only in this browser.</DialogDescription>
          </DialogHeader>
          <form
            className="space-y-3"
            onSubmit={(e) => {
              e.preventDefault();
              if (password) void submit();
            }}
          >
            <Input type="password" autoFocus autoComplete="off" value={password} onChange={(e) => setPassword(e.target.value)} aria-label="PDF password" />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <DialogFooter>
              <Button type="submit" disabled={busy || !password}>
                {busy ? "Unlocking…" : "Unlock"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}

interface FileDropZoneProps {
  accept: string;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  label?: string;
  sublabel?: string;
  files?: File[];
  onRemoveFile?: (index: number) => void;
  /** Enables up/down re-ordering in the file list. */
  onMoveFile?: (from: number, to: number) => void;
  /** Replace a file in place (used after unlocking a protected PDF). */
  onReplaceFile?: (index: number, file: File) => void;
  className?: string;
}

function kindFromAccept(accept: string): FileKind {
  if (/pdf/i.test(accept)) return "pdf";
  if (/image/i.test(accept)) return "image";
  return "other";
}

/**
 * Upload area used by every tool. Supports drag & drop, click-to-browse, pasting images
 * from the clipboard, and picking files from the shared workspace.
 */
const FileDropZone = ({
  accept,
  multiple = false,
  onFiles,
  label = "Drop files here or click to browse",
  sublabel,
  files = [],
  onRemoveFile,
  onMoveFile,
  onReplaceFile,
  className,
}: FileDropZoneProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [preview, setPreview] = useState<File | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const kind = kindFromAccept(accept);
  const { files: workspace } = useWorkspace();
  const available = workspace.filter((f) => f.kind === kind);

  const accepts = useCallback((f: File) => kind === "other" || kindOf(f.type, f.name) === kind, [kind]);

  const deliver = useCallback(
    (incoming: File[]) => {
      const ok = incoming.filter(accepts);
      const rejected = incoming.length - ok.length;
      if (rejected) toast.error(`${rejected} file${rejected > 1 ? "s" : ""} skipped — this tool takes ${kind === "pdf" ? "PDFs" : "images"} only.`);
      if (ok.length) onFiles(multiple ? ok : [ok[0]]);
    },
    [accepts, kind, multiple, onFiles],
  );

  // Paste images straight from the clipboard (screenshots, copied photos).
  useEffect(() => {
    if (kind !== "image") return;
    const onPaste = (e: ClipboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA" || target.isContentEditable)) return;
      const pasted = Array.from(e.clipboardData?.files ?? []).filter((f) => f.type.startsWith("image/"));
      if (!pasted.length) return;
      e.preventDefault();
      const named = pasted.map((f, i) => (f.name && f.name !== "image.png" ? f : new File([f], `pasted-${Date.now()}${i ? `-${i}` : ""}.png`, { type: f.type })));
      deliver(named);
    };
    window.addEventListener("paste", onPaste);
    return () => window.removeEventListener("paste", onPaste);
  }, [kind, deliver]);

  const compact = files.length > 0;

  return (
    <div className={className}>
      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setIsDragging(false);
          deliver(Array.from(e.dataTransfer.files));
        }}
        className={cn(
          "relative cursor-pointer rounded-2xl border-2 border-dashed text-center transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
          compact ? "p-5" : "p-10",
          isDragging ? "scale-[1.01] border-primary bg-primary/5" : "border-border hover:border-primary/50 hover:bg-muted/50",
        )}
      >
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          onChange={(e) => {
            deliver(Array.from(e.target.files || []));
            e.target.value = "";
          }}
          className="hidden"
          data-testid="file-input"
        />
        <Upload className={cn("mx-auto text-muted-foreground", compact ? "mb-1 h-5 w-5" : "mb-3 h-8 w-8")} />
        <p className="font-medium text-foreground">{compact ? (multiple ? "Add more files" : "Replace file") : label}</p>
        {!compact && (
          <p className="mt-1 text-sm text-muted-foreground">
            {sublabel}
            {kind === "image" && <span className="hidden sm:inline">{sublabel ? " · " : ""}or paste with Ctrl/⌘+V</span>}
          </p>
        )}
      </div>

      {available.length > 0 && (
        <div className="mt-2 flex justify-center">
          <Button variant="ghost" size="sm" className="gap-1.5 text-muted-foreground hover:bg-muted hover:text-foreground" onClick={() => setPickerOpen(true)}>
            <FolderOpen /> Choose from workspace ({available.length})
          </Button>
        </div>
      )}

      <AnimatePresence>
        {files.length > 0 && (
          <motion.ul initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="mt-3 space-y-2">
            {files.map((file, i) => (
              <li key={`${file.name}-${file.size}-${i}`} className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2 text-sm">
                <FileThumb blob={file} name={file.name} className="h-10 w-10" />
                <span className="min-w-0 flex-1 truncate text-foreground" title={file.name}>
                  {file.name}
                </span>
                {kind === "pdf" && (
                  <LockBadge
                    file={file}
                    onUnlocked={(f) => {
                      if (onReplaceFile) onReplaceFile(i, f);
                      else if (!multiple) onFiles([f]);
                      else {
                        onRemoveFile?.(i);
                        onFiles([f]);
                      }
                    }}
                  />
                )}
                <span className="shrink-0 text-xs text-muted-foreground">{formatBytes(file.size)}</span>
                <div className="flex shrink-0 items-center">
                  <IconBtn label="Preview" onClick={() => setPreview(file)}>
                    <Eye className="h-4 w-4" />
                  </IconBtn>
                  {onMoveFile && (
                    <>
                      <IconBtn label="Move up" disabled={i === 0} onClick={() => onMoveFile(i, i - 1)}>
                        <ArrowUp className="h-4 w-4" />
                      </IconBtn>
                      <IconBtn label="Move down" disabled={i === files.length - 1} onClick={() => onMoveFile(i, i + 1)}>
                        <ArrowDown className="h-4 w-4" />
                      </IconBtn>
                    </>
                  )}
                  {onRemoveFile && (
                    <IconBtn label="Remove" onClick={() => onRemoveFile(i)} danger>
                      <X className="h-4 w-4" />
                    </IconBtn>
                  )}
                </div>
              </li>
            ))}
          </motion.ul>
        )}
      </AnimatePresence>

      <WorkspacePicker
        open={pickerOpen}
        onOpenChange={setPickerOpen}
        kind={kind}
        multiple={multiple}
        onPick={(picked) => {
          deliver(picked);
          setPickerOpen(false);
        }}
      />
      <PreviewDialog blob={preview} name={preview?.name ?? ""} open={!!preview} onOpenChange={(o) => !o && setPreview(null)} />
    </div>
  );
};

function IconBtn({ children, label, onClick, disabled, danger }: { children: React.ReactNode; label: string; onClick: () => void; disabled?: boolean; danger?: boolean }) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onClick={onClick}
      className={cn(
        "rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-background disabled:opacity-30",
        danger ? "hover:text-destructive" : "hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function WorkspacePicker({
  open,
  onOpenChange,
  kind,
  multiple,
  onPick,
}: {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  kind: FileKind;
  multiple: boolean;
  onPick: (files: File[]) => void;
}) {
  const { files } = useWorkspace();
  const list = files.filter((f) => f.kind === kind);
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    if (open) setSelected([]);
  }, [open]);

  const toggle = (id: string) => {
    if (!multiple) {
      const f = list.find((x) => x.id === id);
      if (f) onPick([toFile(f)]);
      return;
    }
    setSelected((s) => (s.includes(id) ? s.filter((x) => x !== id) : [...s, id]));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Choose from workspace</DialogTitle>
          <DialogDescription>
            Files produced by other tools in this browser. {multiple ? "Selection order is kept." : "Click a file to use it."}
          </DialogDescription>
        </DialogHeader>
        <ul className="max-h-[50vh] space-y-1.5 overflow-y-auto">
          {list.map((f) => {
            const idx = selected.indexOf(f.id);
            return (
              <li key={f.id}>
                <button
                  onClick={() => toggle(f.id)}
                  className={cn(
                    "flex w-full items-center gap-3 rounded-lg border px-3 py-2 text-left text-sm transition-colors",
                    idx >= 0 ? "border-primary bg-primary/5" : "border-transparent bg-muted/50 hover:border-border",
                  )}
                >
                  <FileThumb blob={f.blob} name={f.name} className="h-10 w-10" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium text-foreground">{f.name}</span>
                    <span className="text-xs text-muted-foreground">
                      {formatBytes(f.size)}
                      {f.source && ` · from ${getTool(f.source).title}`}
                    </span>
                  </span>
                  {multiple && (
                    <span className={cn("flex h-6 w-6 items-center justify-center rounded-full border text-xs font-semibold", idx >= 0 ? "border-primary bg-primary text-primary-foreground" : "border-border")}>
                      {idx >= 0 ? idx + 1 : <Check className="h-3 w-3 opacity-0" />}
                    </span>
                  )}
                </button>
              </li>
            );
          })}
        </ul>
        {multiple && (
          <DialogFooter>
            <Button
              disabled={!selected.length}
              onClick={() => onPick(selected.map((id) => list.find((f) => f.id === id)!).filter(Boolean).map(toFile))}
            >
              Add {selected.length || ""} file{selected.length === 1 ? "" : "s"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

export default FileDropZone;
