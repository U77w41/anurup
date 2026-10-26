// @vitest-environment node
import { describe, expect, it } from "vitest";
import { looksEncrypted } from "@/lib/qpdf";

const pdf = (body: string) => new Blob([body], { type: "application/pdf" });

describe("looksEncrypted", () => {
  it("finds /Encrypt in a classic trailer", async () => {
    expect(await looksEncrypted(pdf("%PDF-1.7\n1 0 obj<<>>endobj\ntrailer\n<< /Size 5 /Root 1 0 R /Encrypt 4 0 R >>\nstartxref\n9\n%%EOF\n"))).toBe(true);
  });
  it("finds /Encrypt in an xref-stream dictionary far from the end of the file", async () => {
    const head = "%PDF-1.7\n";
    const xrefDict = "5 0 obj\n<< /Type /XRef /Size 6 /Encrypt 4 0 R /Length 20000 >>\nstream\n";
    const offset = head.length;
    const body = head + xrefDict + "x".repeat(20000) + "\nendstream\nendobj\n";
    expect(await looksEncrypted(pdf(`${body}startxref\n${offset}\n%%EOF\n`))).toBe(true);
  });
  it("is false for an ordinary PDF", async () => {
    expect(await looksEncrypted(pdf("%PDF-1.7\n1 0 obj<<>>endobj\ntrailer\n<< /Size 2 /Root 1 0 R >>\nstartxref\n9\n%%EOF\n"))).toBe(false);
  });
});
