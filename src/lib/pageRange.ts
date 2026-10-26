/**
 * Parse a human page range like "1-3, 5, 8-" into sorted, unique 1-based page numbers.
 * Open-ended ranges ("8-") run to the last page; "-3" runs from page 1.
 */
export function parsePageRange(input: string, max: number): number[] {
  const pages = new Set<number>();
  for (const raw of input.split(",")) {
    const part = raw.trim();
    if (!part) continue;
    const m = part.match(/^(\d*)\s*-\s*(\d*)$/);
    if (m) {
      const start = m[1] ? parseInt(m[1], 10) : 1;
      const end = m[2] ? parseInt(m[2], 10) : max;
      const lo = Math.max(1, Math.min(start, end));
      const hi = Math.min(max, Math.max(start, end));
      for (let i = lo; i <= hi; i++) pages.add(i);
    } else if (/^\d+$/.test(part)) {
      const n = parseInt(part, 10);
      if (n >= 1 && n <= max) pages.add(n);
    }
  }
  return [...pages].sort((a, b) => a - b);
}

/** Inverse of parsePageRange: [1,2,3,5,7,8] -> "1-3, 5, 7-8" */
export function formatPageRange(pages: number[]): string {
  const sorted = [...new Set(pages)].sort((a, b) => a - b);
  const parts: string[] = [];
  let i = 0;
  while (i < sorted.length) {
    let j = i;
    while (j + 1 < sorted.length && sorted[j + 1] === sorted[j] + 1) j++;
    parts.push(i === j ? `${sorted[i]}` : `${sorted[i]}-${sorted[j]}`);
    i = j + 1;
  }
  return parts.join(", ");
}

/** Split [1..total] into consecutive chunks of `size` pages. */
export function chunkPages(total: number, size: number): number[][] {
  const chunks: number[][] = [];
  const step = Math.max(1, Math.floor(size));
  for (let start = 1; start <= total; start += step) {
    chunks.push(Array.from({ length: Math.min(step, total - start + 1) }, (_, k) => start + k));
  }
  return chunks;
}
