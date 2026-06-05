/**
 * Portraits Parser (Begegnungen)
 *
 * Parser für die portraits.yaml Struktur.
 * Wird auch im atomic Commit-Flow verwendet.
 */

import type { Portrait } from '../types';

export function parsePortraitsFromYaml(text: string): Portrait[] {
  const list: Portrait[] = [];

  // Strip document markers if present
  text = text.replace(/^---\s*\n?/, '').replace(/\n?---\s*$/, '').trim();

  const lines = text.split('\n');
  let current: Partial<Portrait> | null = null;

  for (let line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;

    if (trimmed.startsWith('- title:')) {
      if (current) list.push(current as Portrait);
      current = {};
      const match = trimmed.match(/- title:\s*"([^"]*)"/);
      if (match) current.title = match[1];
    } else if (current && trimmed.startsWith('alt:')) {
      const match = trimmed.match(/alt:\s*"([^"]*)"/);
      if (match) current.alt = match[1];
    } else if (current && trimmed.startsWith('caption:')) {
      const match = trimmed.match(/caption:\s*"([^"]*)"/);
      if (match) current.caption = match[1];
    } else if (current && trimmed.startsWith('subcaption:')) {
      const match = trimmed.match(/subcaption:\s*"([^"]*)"/);
      if (match) current.subcaption = match[1];
    } else if (current && trimmed.startsWith('year:')) {
      const match = trimmed.match(/year:\s*"([^"]*)"/);
      if (match) current.year = match[1];
    } else if (current && trimmed.startsWith('image:')) {
      const match = trimmed.match(/image:\s*"([^"]*)"/);
      if (match) current.image = match[1];
    }
  }

  if (current) list.push(current as Portrait);

  return list;
}
