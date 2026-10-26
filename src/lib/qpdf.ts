/**
 * PDF decryption via QPDF compiled to WebAssembly (@neslinesli93/qpdf-wasm).
 *
 * Unlike "Print → Save as PDF", which re-renders every page, QPDF removes the
 * encryption layer itself: text, links, bookmarks, form fields and image quality
 * are kept exactly as they were. Supports RC4 40/128-bit and AES 128/256-bit.
 * Everything runs in the browser; the file and password never leave the device.
 */
import { PDFDocument } from "pdf-lib";

export class WrongPasswordError extends Error {
  constructor() {
    super("Incorrect password.");
    this.name = "WrongPasswordError";
  }
}

interface QpdfRun {
  code: number;
  stderr: string[];
  output: Uint8Array | null;
}

/** Run one qpdf command on `input` (a fresh WASM instance per run: qpdf's main() exits). */
async function runQpdf(input: Uint8Array, args: string[]): Promise<QpdfRun> {
  const [{ default: createModule }, { default: wasmUrl }] = await Promise.all([
    import("@neslinesli93/qpdf-wasm"),
    import("@neslinesli93/qpdf-wasm/dist/qpdf.wasm?url"),
  ]);

  // This build binds stdout/stderr to console.log/error when the module is created,
  // so swap them briefly to capture qpdf's messages (e.g. "invalid password").
  const stderr: string[] = [];
  const { log, error } = console;
  console.log = () => undefined;
  console.error = (...a: unknown[]) => stderr.push(a.map(String).join(" "));
  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const qpdf: any = await (createModule as any)({ locateFile: () => wasmUrl, noInitialRun: true });
    qpdf.FS.writeFile("/in.pdf", input);
    let code: number;
    try {
      code = qpdf.callMain([...args, "/in.pdf", "/out.pdf"]);
    } catch (e) {
      // Emscripten signals exit() by throwing an ExitStatus.
      code = typeof (e as { status?: number })?.status === "number" ? (e as { status: number }).status : 2;
      if (code === 2 && !stderr.length) stderr.push(String(e));
    }
    let output: Uint8Array | null = null;
    try {
      output = qpdf.FS.readFile("/out.pdf");
    } catch {
      output = null;
    }
    return { code, stderr, output };
  } finally {
    console.log = log;
    console.error = error;
  }
}

export type LockState = "none" | "restricted" | "password";

/** Is the PDF encrypted at all? (Reads the trailer without decrypting.) */
export async function isPdfEncrypted(file: Blob): Promise<boolean> {
  try {
    const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true, updateMetadata: false });
    return doc.isEncrypted;
  } catch {
    throw new Error("This file doesn't look like a valid PDF.");
  }
}

/**
 * Decrypt `file`. An empty password works for PDFs that only carry permission
 * restrictions (no open password). Either the user or the owner password works.
 */
export async function unlockPdf(file: Blob, password: string): Promise<Blob> {
  const input = new Uint8Array(await file.arrayBuffer());
  const r = await runQpdf(input, ["--decrypt", `--password=${password}`]);
  // 0 = success, 3 = success with warnings (output is still valid).
  if ((r.code === 0 || r.code === 3) && r.output?.length) {
    return new Blob([r.output as BlobPart], { type: "application/pdf" });
  }
  const msg = r.stderr.join("\n");
  if (/invalid password/i.test(msg)) throw new WrongPasswordError();
  const last = msg.split("\n").filter(Boolean).pop()?.replace(/^[^:]*:\s*\/in\.pdf:\s*/, "");
  throw new Error(last ? `Couldn't unlock this PDF: ${last}` : "Couldn't unlock this PDF.");
}

/**
 * Work out what kind of protection a PDF has. For restriction-only PDFs the
 * unlocked file is returned straight away, since no password is needed.
 */
export async function inspectLock(file: Blob): Promise<{ state: LockState; unlocked?: Blob }> {
  if (!(await isPdfEncrypted(file))) return { state: "none" };
  try {
    const unlocked = await unlockPdf(file, "");
    return { state: "restricted", unlocked };
  } catch (e) {
    if (e instanceof WrongPasswordError) return { state: "password" };
    throw e;
  }
}

/**
 * Cheap check (no parsing) for an /Encrypt entry in the trailer, used to flag
 * protected PDFs in upload lists. Looks at the head, the tail and the last
 * cross-reference section that `startxref` points to.
 */
export async function looksEncrypted(file: Blob): Promise<boolean> {
  const read = async (start: number, end: number) => {
    const buf = new Uint8Array(await file.slice(Math.max(0, start), Math.min(file.size, end)).arrayBuffer());
    let s = "";
    for (let i = 0; i < buf.length; i++) s += String.fromCharCode(buf[i]);
    return s;
  };
  const hasEncrypt = (s: string) => /\/Encrypt\s*(\d+\s+\d+\s+R|<<)/.test(s);
  const tail = await read(file.size - 8192, file.size);
  if (hasEncrypt(tail)) return true;
  if (hasEncrypt(await read(0, 4096))) return true;
  const m = tail.match(/startxref\s+(\d+)\s+%%EOF\s*$/);
  if (m) {
    const offset = parseInt(m[1], 10);
    if (offset < file.size) return hasEncrypt(await read(offset, offset + 4096));
  }
  return false;
}
