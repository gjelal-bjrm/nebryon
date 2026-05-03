/**
 * Returns a compact, sortable timestamp string for export filenames.
 * Format: YYYYMMDD_HHmmss  (e.g. "20240503_143022")
 */
export function exportTimestamp(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return (
    `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}` +
    `_${p(d.getHours())}${p(d.getMinutes())}${p(d.getSeconds())}`
  );
}
