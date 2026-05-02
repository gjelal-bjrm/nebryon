/* ── Pulsar — field → template-tag mapper (reused by module 3) ───────────── */

/**
 * Converts a column header to a camelCase {{tag}}.
 * e.g. "Prénom Client"   → "{{prenomClient}}"
 *      "1. Depuis combien..." → "{{q1DepuisCombien}}"
 *      "email"           → "{{email}}"
 */
export function headerToTag(header: string): string {
  const slug = header
    .normalize("NFD")                        // decompose accents
    .replace(/[̀-ͯ]/g, "")         // strip accent marks
    .replace(/[^a-zA-Z0-9\s]/g, " ")        // non-alphanum → space
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .map((word, i) =>
      i === 0
        ? word.toLowerCase()
        : word.charAt(0).toUpperCase() + word.slice(1).toLowerCase()
    )
    .join("");
  return `{{${slug || "col"}}}`;
}

/**
 * Returns a map of header → {{tag}} for ALL columns.
 * Used by module 3 to build the tag picker.
 */
export function headersToTags(headers: string[]): Record<string, string> {
  const map: Record<string, string> = {};
  // Deduplicate tags by appending index if collision
  const seen = new Map<string, number>();
  headers.forEach((h) => {
    let tag = headerToTag(h);
    const base = tag.replace(/}}$/, "");
    const count = seen.get(base) ?? 0;
    if (count > 0) tag = `${base}${count}}}`;
    seen.set(base, count + 1);
    map[h] = tag;
  });
  return map;
}

/**
 * Given a template string and a data row, replaces all {{tag}} occurrences.
 * Used by module 3 for document generation.
 */
export function renderTemplate(template: string, row: Record<string, string>, tagMap: Record<string, string>): string {
  let result = template;
  for (const [header, tag] of Object.entries(tagMap)) {
    // Replace both {{tag}} and the literal tag
    result = result.replaceAll(tag, row[header] ?? "");
  }
  return result;
}
