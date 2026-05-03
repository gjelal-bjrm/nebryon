"use client";
/**
 * Lumen — Data Parsers
 * Parses Excel, CSV, JSON, XML files into an array of DataRow objects.
 */

import type { DataRow } from "./templateEngine";

export async function parseFile(file: File): Promise<DataRow[]> {
  const ext = file.name.split(".").pop()?.toLowerCase();
  if (ext === "csv")                return parseCsv(file);
  if (ext === "xlsx" || ext === "xls") return parseExcel(file);
  if (ext === "json")               return parseJson(file);
  if (ext === "xml")                return parseXml(file);
  throw new Error(`Format non supporté : .${ext}`);
}

async function parseCsv(file: File): Promise<DataRow[]> {
  const Papa = (await import("papaparse")).default;
  return new Promise((resolve, reject) => {
    Papa.parse<DataRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete: (r) => resolve(r.data),
      error:    (e) => reject(e),
    });
  });
}

async function parseExcel(file: File): Promise<DataRow[]> {
  const XLSX = await import("xlsx");
  const buf  = await file.arrayBuffer();
  const wb   = XLSX.read(buf, { type: "array" });
  const ws   = wb.Sheets[wb.SheetNames[0]];
  return XLSX.utils.sheet_to_json<DataRow>(ws, { defval: "" });
}

async function parseJson(file: File): Promise<DataRow[]> {
  const raw = (await file.text()).trim();

  // Try direct parse first
  try {
    const data = JSON.parse(raw);
    if (Array.isArray(data)) return data as DataRow[];
    return [data as DataRow];
  } catch (_) {
    // Fall-through: the file might be a sequence of objects without wrapping []
  }

  // Auto-fix: wrap in [] and retry (handles files like { … },\n{ … })
  try {
    const wrapped = `[${raw.replace(/,?\s*$/, "")}]`;
    const data = JSON.parse(wrapped);
    if (Array.isArray(data)) return data as DataRow[];
    return [data as DataRow];
  } catch (e) {
    throw new Error(`JSON invalide : ${String(e)}`);
  }
}

async function parseXml(file: File): Promise<DataRow[]> {
  const text = await file.text();
  const doc  = new DOMParser().parseFromString(text, "application/xml");
  const rows: DataRow[] = [];

  // Support <root><item>...</item></root> and <items><item>...</item></items>
  const root     = doc.documentElement;
  const children = Array.from(root.children);

  for (const child of children) {
    const row: DataRow = {};
    for (const node of Array.from(child.children)) {
      row[node.tagName] = node.textContent ?? "";
    }
    if (Object.keys(row).length > 0) rows.push(row);
  }

  return rows;
}
