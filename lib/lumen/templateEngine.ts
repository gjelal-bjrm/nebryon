/**
 * Lumen — Template Engine
 * Handles {{ variable }} placeholder detection and replacement.
 */

export type DataRow = Record<string, string>;

/** Replaces every {{ var }} in the HTML template with the matching value. */
export function renderTemplate(template: string, data: DataRow): string {
  return template.replace(/\{\{\s*([\w]+)\s*\}\}/g, (_, key: string) => {
    return data[key] ?? `{{${key}}}`;
  });
}

/** Returns the unique variable names found in a template. */
export function detectVariables(template: string): string[] {
  const matches = [...template.matchAll(/\{\{\s*([\w]+)\s*\}\}/g)];
  return [...new Set(matches.map((m) => m[1]))];
}
