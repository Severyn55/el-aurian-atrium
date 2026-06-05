/**
 * Portraits YAML Generator
 */

import type { Portrait } from '../types';

export function generatePortraitsYaml(list: Portrait[]): string {
  let out = 'portraits:\n';
  (list || []).forEach((p) => {
    out += `  - title: "${(p.title || '').replace(/"/g, '\\"')}"\n`;
    out += `    alt: "${(p.alt || p.title || '').replace(/"/g, '\\"')}"\n`;
    if (p.caption) out += `    caption: "${p.caption.replace(/"/g, '\\"')}"\n`;
    if (p.subcaption) out += `    subcaption: "${p.subcaption.replace(/"/g, '\\"')}"\n`;
    if (p.year) out += `    year: "${p.year.replace(/"/g, '\\"')}"\n`;
    out += `    image: "${p.image}"\n`;
  });
  return out;
}
