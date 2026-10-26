import { useCallback, useRef, useState } from "react";
import { Eye, EyeOff, Info, Loader2, LockKeyhole, LockOpen, ShieldCheck } from "lucide-react";
import Layout from "@/components/Layout";
import FileDropZone from "@/components/FileDropZone";
import ResultPanel, { type ResultItem } from "@/components/ResultPanel";
import { ErrorNote, Field, Panel } from "@/components/Controls";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useIncomingFiles } from "@/hooks/use-tool-io";
import { inspectLock, unlockPdf, WrongPasswordError, type LockState } from "@/lib/qpdf";
import { baseName } from "@/lib/format";
import { toast } from "sonner";

type Status = "idle" | "checking" | LockState | "error";

const PdfUnlock = () => {
  const [file, setFile] = useState<File | null>(null);
  const [status, setStatus] = useState<Status>("idle");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ResultItem | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const outName = (f: File) => `${baseName(f.name).replace(/-(locked|protected|encrypted)$/i, "")}-unlocked.pdf`;

  const handleFiles = useCallback(async (files: File[]) => {
    const f = files[0];
    setFile(f);
    setResult(null);
    setError(null);
    setPassword("");
    setStatus("checking");
    try {
      const { state, unlocked } = await inspectLock(f);
      setStatus(state);
      if (state === "restricted" && unlocked) {
        setResult({ blob: unlocked, name: outName(f), note: "restrictions removed" });
        toast.success("No open password — print/copy/edit restrictions removed.");
      }
      if (state === "password") setTimeout(() => inputRef.current?.focus(), 50);
    } catch (e) {
      setStatus("error");
      setError((e as Error).message);
    }
  }, []);
  useIncomingFiles(handleFiles);

  const unlock = useCallback(async () => {
    if (!file || !password) return;
    setBusy(true);
    setError(null);
    try {
      const blob = await unlockPdf(file, password);
      setResult({ blob, name: outName(file), note: "password removed" });
      setPassword("");
    } catch (e) {
      setError(e instanceof WrongPasswordError ? "Incorrect password — check Caps Lock and try again. The owner password works too." : (e as Error).message);
      inputRef.current?.select();
    } finally {
      setBusy(false);
    }
  }, [file, password]);

  return (
    <Layout
      title="Unlock PDF"
      description="Remove the open password or the print / copy / edit restrictions from a PDF you have access to. The file is decrypted in your browser — neither the file nor the password is uploaded."
    >
      <FileDropZone
        accept=".pdf,application/pdf"
        onFiles={handleFiles}
        label="Upload a protected PDF"
        sublabel="Bank statements, e-Aadhaar, payslips, certificates…"
        files={file ? [file] : []}
        onRemoveFile={() => {
          setFile(null);
          setStatus("idle");
          setResult(null);
          setError(null);
        }}
      />

      {status === "checking" && (
        <Panel>
          <p className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Checking protection…
          </p>
        </Panel>
      )}

      {status === "none" && file && (
        <Panel>
          <p className="flex items-start gap-2 text-sm text-muted-foreground">
            <Info className="mt-0.5 h-4 w-4 shrink-0" /> This PDF isn’t password-protected or restricted — there’s nothing to remove. You can use it in any PDF tool as it is.
          </p>
        </Panel>
      )}

      {status === "password" && !result && (
        <Panel>
          <div className="flex items-center gap-2 text-sm font-medium text-foreground">
            <LockKeyhole className="h-4 w-4 text-primary" /> This PDF needs a password to open.
          </div>
          <form
            className="space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              void unlock();
            }}
          >
            <Field label="Password" hint="Enter the password you use to open this file. Nothing is sent anywhere.">
              <div className="relative">
                <Input
                  ref={inputRef}
                  type={show ? "text" : "password"}
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    setError(null);
                  }}
                  autoComplete="off"
                  spellCheck={false}
                  className="pr-10"
                  aria-label="PDF password"
                  data-testid="pdf-password"
                />
                <button
                  type="button"
                  onClick={() => setShow((s) => !s)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-muted-foreground hover:text-foreground"
                  aria-label={show ? "Hide password" : "Show password"}
                >
                  {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </Field>
            <ErrorNote>{error}</ErrorNote>
            <Button type="submit" disabled={busy || !password} className="w-full gap-2">
              {busy ? <Loader2 className="animate-spin" /> : <LockOpen />}
              {busy ? "Unlocking…" : "Remove password"}
            </Button>
          </form>
        </Panel>
      )}

      {status === "error" && <ErrorNote>{error}</ErrorNote>}

      {result && (
        <ResultPanel
          toolId="pdf-unlock"
          items={[result]}
          summary={
            <span className="inline-flex items-center gap-1.5 font-medium text-success">
              <ShieldCheck className="h-4 w-4" /> Unlocked — opens without a password
            </span>
          }
        />
      )}

      <p className="text-xs text-muted-foreground">
        Unlike “Print → Save as PDF”, this removes the encryption itself, so text stays selectable and links, bookmarks, form fields and image quality are kept. Only unlock files you own or are allowed to use.
      </p>
    </Layout>
  );
};

export default PdfUnlock;
