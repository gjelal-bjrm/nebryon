/* ── Pulsar — column type detector ──────────────────────────────────────── */

/**
 * ColType hierarchy (most specific → least specific):
 *  date        – looks like a timestamp / ISO date
 *  boolean     – Oui/Non, Yes/No, true/false, 0/1
 *  score       – numeric, integer, values ∈ 1-10, ≤ 10 distinct values
 *  numeric     – all non-empty values parse as number
 *  multichoice – values contain ";" separator
 *  categorical – text with ≤ 20 distinct values (and ≤ 40 % cardinality)
 *  text        – everything else (free text)
 */
export type ColType =
  | "date"
  | "boolean"
  | "score"
  | "numeric"
  | "multichoice"
  | "categorical"
  | "text";

const BOOL_VALUES = new Set([
  "oui","non","yes","no","true","false","vrai","faux","1","0",
]);

const DATE_RE = /^\d{4}[/-]\d{2}[/-]\d{2}|^\d{2}[/-]\d{2}[/-]\d{4}|\d{4}\/\d{2}\/\d{2}\s\d/i;

export function detectType(values: string[]): ColType {
  const filled = values.map((v) => v.trim()).filter(Boolean);
  if (filled.length === 0) return "text";

  // date
  if (filled.every((v) => DATE_RE.test(v))) return "date";

  // boolean
  if (filled.every((v) => BOOL_VALUES.has(v.toLowerCase()))) return "boolean";

  // multichoice (at least 30 % of non-empty rows contain ";")
  const multiCount = filled.filter((v) => v.includes(";")).length;
  if (multiCount / filled.length >= 0.3) return "multichoice";

  // numeric
  const nums = filled.map((v) => v.replace(/\s/g, "").replace(",", ".")).map(Number);
  const allNum = nums.every((n) => !isNaN(n));
  if (allNum) {
    const allInt = nums.every((n) => Number.isInteger(n));
    const min = Math.min(...nums);
    const max = Math.max(...nums);
    const unique = new Set(nums).size;
    // score: integers in range ≤ 10 with ≤ 10 distinct values
    if (allInt && min >= 1 && max <= 10 && unique <= 10) return "score";
    return "numeric";
  }

  // categorical
  const unique = new Set(filled.map((v) => v.toLowerCase())).size;
  const ratio = unique / filled.length;
  if (unique <= 20 && ratio <= 0.5) return "categorical";

  return "text";
}

export function detectTypes(
  headers: string[],
  rows: Record<string, string>[]
): Record<string, ColType> {
  const result: Record<string, ColType> = {};
  for (const h of headers) {
    result[h] = detectType(rows.map((r) => r[h] ?? ""));
  }
  return result;
}
