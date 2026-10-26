export function downloadBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

/** Bundle several files into a .zip (JSZip is loaded on demand). */
export async function downloadZip(items: { blob: Blob; name: string }[], zipName: string) {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  const used = new Map<string, number>();
  for (const item of items) {
    // De-duplicate names inside the archive.
    let name = item.name;
    const count = used.get(name) ?? 0;
    if (count) name = name.replace(/(\.[^.]+)?$/, `-${count + 1}$1`);
    used.set(item.name, count + 1);
    zip.file(name, item.blob);
  }
  const blob = await zip.generateAsync({ type: "blob" });
  downloadBlob(blob, zipName);
}
