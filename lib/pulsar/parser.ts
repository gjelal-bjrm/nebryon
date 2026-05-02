/* ── Pulsar — universal file parser ──────────────────────────────────────── */

export type PulsarFormat = "csv" | "json" | "xml" | "excel";

export interface ParsedData {
  headers:  string[];
  rows:     Record<string, string>[];
  fileName: string;
  format:   PulsarFormat;
  rowCount: number;
}

/* ── CSV ─────────────────────────────────────────────────────────────────── */
async function parseCsv(text: string, fileName: string): Promise<ParsedData> {
  const Papa = (await import("papaparse")).default;
  return new Promise((resolve, reject) => {
    Papa.parse<Record<string, string>>(text, {
      header: true,
      skipEmptyLines: true,
      complete: (r) => {
        const headers = r.meta.fields ?? [];
        resolve({ headers, rows: r.data, fileName, format: "csv", rowCount: r.data.length });
      },
      error: reject,
    });
  });
}

/* ── JSON ────────────────────────────────────────────────────────────────── */
function parseJson(text: string, fileName: string): ParsedData {
  const raw = JSON.parse(text);
  // Accept array-of-objects or { data: [...] } wrapper
  const arr: unknown[] = Array.isArray(raw)
    ? raw
    : Array.isArray(raw.data)
    ? raw.data
    : Object.values(raw).find((v) => Array.isArray(v)) as unknown[] ?? [raw];

  if (arr.length === 0) return { headers: [], rows: [], fileName, format: "json", rowCount: 0 };

  const headers = Array.from(
    arr.reduce<Set<string>>((s, item) => {
      if (typeof item === "object" && item !== null)
        Object.keys(item as object).forEach((k) => s.add(k));
      return s;
    }, new Set<string>())
  );

  const rows = arr.map((item) => {
    const rec: Record<string, string> = {};
    headers.forEach((h) => {
      const v = (item as Record<string, unknown>)[h];
      rec[h] = v == null ? "" : typeof v === "object" ? JSON.stringify(v) : String(v);
    });
    return rec;
  });

  return { headers, rows, fileName, format: "json", rowCount: rows.length };
}

/* ── XML ─────────────────────────────────────────────────────────────────── */
function parseXml(text: string, fileName: string): ParsedData {
  const doc = new DOMParser().parseFromString(text, "application/xml");
  const root = doc.documentElement;
  // Find the repeating element (first child's tagName repeated most)
  const childTags = Array.from(root.children).map((c) => c.tagName);
  const dominant = childTags.sort(
    (a, b) => childTags.filter((t) => t === b).length - childTags.filter((t) => t === a).length
  )[0];
  const items = dominant ? Array.from(root.querySelectorAll(dominant)) : Array.from(root.children);

  const headers = Array.from(
    items.reduce<Set<string>>((s, el) => {
      Array.from(el.children).forEach((c) => s.add(c.tagName));
      return s;
    }, new Set<string>())
  );

  const rows = items.map((el) => {
    const rec: Record<string, string> = {};
    headers.forEach((h) => {
      rec[h] = el.querySelector(h)?.textContent?.trim() ?? "";
    });
    return rec;
  });

  return { headers, rows, fileName, format: "xml", rowCount: rows.length };
}

/* ── Excel ───────────────────────────────────────────────────────────────── */
async function parseExcel(buf: ArrayBuffer, fileName: string): Promise<ParsedData> {
  const XLSX = await import("xlsx");
  const wb = XLSX.read(buf, { type: "array" });
  const ws = wb.Sheets[wb.SheetNames[0]];
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws, { defval: "" });

  if (raw.length === 0) return { headers: [], rows: [], fileName, format: "excel", rowCount: 0 };

  const headers = Object.keys(raw[0]);
  const rows = raw.map((item) => {
    const rec: Record<string, string> = {};
    headers.forEach((h) => { rec[h] = String(item[h] ?? ""); });
    return rec;
  });

  return { headers, rows, fileName, format: "excel", rowCount: rows.length };
}

/* ── Public entry-point ──────────────────────────────────────────────────── */
export async function parseFile(file: File): Promise<ParsedData> {
  const name = file.name.toLowerCase();

  if (name.endsWith(".csv")) {
    return parseCsv(await file.text(), file.name);
  }
  if (name.endsWith(".json")) {
    return parseJson(await file.text(), file.name);
  }
  if (name.endsWith(".xml")) {
    return parseXml(await file.text(), file.name);
  }
  if (name.endsWith(".xlsx") || name.endsWith(".xls") || name.endsWith(".ods")) {
    return parseExcel(await file.arrayBuffer(), file.name);
  }

  // Fallback: try CSV
  return parseCsv(await file.text(), file.name);
}
