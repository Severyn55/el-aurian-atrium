/**
 * Menu Generator (Lunch/Dinner)
 *
 * Erzeugt den exakten YAML-Frontmatter-Stil, den der Parser erwartet.
 */

import type { MenuData } from '../types';

export function generateYaml(data: MenuData): string {
  let yaml = '---\n';
  yaml += `title: "${(data.title || '').replace(/"/g, '\\"')}"\n`;
  yaml += `subtitle: "${(data.subtitle || '').replace(/"/g, '\\"')}"\n`;
  yaml += `time: "${(data.time || '').replace(/"/g, '\\"')}"\n`;
  yaml += `pdf: "${(data.pdf || '').replace(/"/g, '\\"')}"\n`;
  yaml += 'categories:\n';

  (data.categories || []).forEach((cat) => {
    yaml += `  - title: "${(cat.title || '').replace(/"/g, '\\"')}"\n`;
    yaml += `    items:\n`;
    (cat.items || []).forEach((item) => {
      yaml += `      - name: "${(item.name || '').replace(/"/g, '\\"')}"\n`;
      if (item.description) {
        yaml += `        description: "${(item.description || '').replace(/"/g, '\\"')}"\n`;
      }
      yaml += `        price: "${(item.price || '').replace(/"/g, '\\"')}"\n`;
    });
  });

  yaml += '---\n';
  return yaml;
}
