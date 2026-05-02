/* ── Pulsar — per-column statistics ─────────────────────────────────────── */

import type { ColType } from "./typeDetector";

export interface FreqItem {
  value: string;
  count: number;
  pct:   number;  // 0-100
}

export interface ColStats {
  header:    string;
  type:      ColType;
  total:     number;   // total rows
  filled:    number;   // non-empty rows
  empty:     number;
  emptyPct:  number;   // 0-100

  // numeric / score
  min?:      number;
  max?:      number;
  avg?:      number;
  median?:   number;
  stddev?:   number;

  // categorical / boolean / multichoice / score
  frequencies?: FreqItem[];
  uniqueCount?: number;
}

/* ── helpers ─────────────────────────────────────────────────────────────── */
function median(sorted: number[]): number {
  const m = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[m] : (sorted[m - 1] + sorted[m]) / 2;
}
function stddev(nums: number[], avg: number): number {
  const variance = nums.reduce((s, n) => s + (n - avg) ** 2, 0) / nums.length;
  return Math.sqrt(variance);
}
function round2(n: number) { return Math.round(n * 100) / 100; }

/* ── per-column ──────────────────────────────────────────────────────────── */
export function computeColStats(
  header:  string,
  type:    ColType,
  values:  string[]
): ColStats {
  const total  = values.length;
  const filled = values.filter((v) => v.trim() !== "").length;
  const empty  = total - filled;
  const base   = { header, type, total, filled, empty, emptyPct: round2((empty / total) * 100) };

  /* ── numeric / score ── */
  if (type === "numeric" || type === "score") {
    const nums = values
      .map((v) => parseFloat(v.replace(",", ".")))
      .filter((n) => !isNaN(n))
      .sort((a, b) => a - b);
    if (nums.length === 0) return base;
    const avg = nums.reduce((s, n) => s + n, 0) / nums.length;
    const freqMap = new Map<string, number>();
    nums.forEach((n) => {
      const k = String(n);
      freqMap.set(k, (freqMap.get(k) ?? 0) + 1);
    });
    const frequencies: FreqItem[] = Array.from(freqMap.entries())
      .sort((a, b) => Number(a[0]) - Number(b[0]))
      .map(([value, count]) => ({ value, count, pct: round2((count / filled) * 100) }));
    return {
      ...base,
      min: round2(nums[0]),
      max: round2(nums[nums.length - 1]),
      avg: round2(avg),
      median: round2(median(nums)),
      stddev: round2(stddev(nums, avg)),
      frequencies,
      uniqueCount: freqMap.size,
    };
  }

  /* ── multichoice ── */
  if (type === "multichoice") {
    const freqMap = new Map<string, number>();
    values.forEach((v) => {
      if (!v.trim()) return;
      v.split(";").map((s) => s.trim()).filter(Boolean).forEach((opt) => {
        freqMap.set(opt, (freqMap.get(opt) ?? 0) + 1);
      });
    });
    const frequencies = Array.from(freqMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([value, count]) => ({ value, count, pct: round2((count / filled) * 100) }));
    return { ...base, frequencies, uniqueCount: freqMap.size };
  }

  /* ── categorical / boolean ── */
  if (type === "categorical" || type === "boolean") {
    const freqMap = new Map<string, number>();
    values.forEach((v) => {
      if (!v.trim()) return;
      freqMap.set(v.trim(), (freqMap.get(v.trim()) ?? 0) + 1);
    });
    const frequencies = Array.from(freqMap.entries())
      .sort((a, b) => b[1] - a[1])
      .map(([value, count]) => ({ value, count, pct: round2((count / filled) * 100) }));
    return { ...base, frequencies, uniqueCount: freqMap.size };
  }

  /* ── text / date ── */
  const freqMap = new Map<string, number>();
  values.forEach((v) => {
    if (v.trim()) freqMap.set(v.trim(), (freqMap.get(v.trim()) ?? 0) + 1);
  });
  return { ...base, uniqueCount: freqMap.size };
}

export function computeStats(
  headers: string[],
  rows:    Record<string, string>[],
  types:   Record<string, ColType>
): ColStats[] {
  return headers.map((h) =>
    computeColStats(h, types[h] ?? "text", rows.map((r) => r[h] ?? ""))
  );
}
