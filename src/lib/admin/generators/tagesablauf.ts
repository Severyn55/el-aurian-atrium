/**
 * Tagesablauf (Höhepunkte) Generator
 *
 * Erzeugt den block-scalar Stil für den Freitext-Editor.
 */

import type { TagesablaufData } from '../types';

export function generateTagesablaufFrontmatter(data: TagesablaufData): string {
  let yaml = '';
  if (data.text) {
    // | - = literal block, strip final newlines (wie im aktuellen Inhalt)
    yaml += 'text: |-\n';
    data.text.split('\n').forEach((line) => {
      yaml += `  ${line}\n`;
    });
  }
  return yaml.trim();
}
