/**
 * Frontmatter Generators
 *
 * Ergänzen die Parser. Wichtig für Roundtrips.
 */

import { normalizeLineEndings } from '../utils';

export function generateSimpleFrontmatter(data: Record<string, any>): string {
  let yaml = '---\n';
  for (const [key, val] of Object.entries(data || {})) {
    const safe = String(val ?? '').replace(/"/g, '\\"');
    yaml += `${key}: "${safe}"\n`;
  }
  yaml += '---\n';
  return yaml;
}

export function generateContentWithBody(data: Record<string, any>, body?: string): string {
  let md = generateSimpleFrontmatter(data);
  if (body && body.trim()) {
    const normalized = normalizeLineEndings(body).trim();
    md += '\n' + normalized + '\n';
  }
  return md;
}
