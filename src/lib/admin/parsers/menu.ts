/**
 * Menu Parser (Lunch / Dinner)
 *
 * Robuster, line-basierter Parser für die spezielle Menü-YAML-Struktur:
 *
 * title: ...
 * subtitle: ...
 * time: ...
 * pdf: ...
 * categories:
 *   - title: "VORSPEISE"
 *     items:
 *       - name: "..."
 *         description: "..."
 *         price: "..."
 */

import type { MenuData, Category, Dish } from '../types';

export function parseMenu(yaml: string): MenuData {
  const match = yaml.match(/^---\s*([\s\S]*?)\s*---/);
  if (!match) throw new Error('Kein gültiger Frontmatter gefunden');

  const frontmatter = match[1];
  const data: MenuData = {
    title: '',
    subtitle: '',
    time: '',
    pdf: '',
    categories: [],
  };

  const lines = frontmatter.split('\n').map((l) => l.trim());
  let currentCat: Category | null = null;
  let currentItem: Dish | null = null;

  for (let line of lines) {
    if (!line || line.startsWith('#')) continue;

    if (line.startsWith('title:')) {
      data.title = line.split(':')[1].trim().replace(/^["']|["']$/g, '');
    } else if (line.startsWith('subtitle:')) {
      data.subtitle = line.split(':')[1].trim().replace(/^["']|["']$/g, '');
    } else if (line.startsWith('time:')) {
      data.time = line.split(':')[1].trim().replace(/^["']|["']$/g, '');
    } else if (line.startsWith('pdf:')) {
      data.pdf = line.split(':')[1].trim().replace(/^["']|["']$/g, '');
    } else if (line.startsWith('- title:')) {
      if (currentCat) data.categories.push(currentCat);
      const title = line.split(':')[1].trim().replace(/^["']|["']$/g, '');
      currentCat = { title, items: [] };
      currentItem = null;
    } else if (line.startsWith('- name:') && currentCat) {
      const name = line.split(':')[1].trim().replace(/^["']|["']$/g, '');
      currentItem = { name, description: '', price: '' };
      currentCat.items.push(currentItem);
    } else if (line.startsWith('description:') && currentItem) {
      currentItem.description = line.split(':')[1].trim().replace(/^["']|["']$/g, '');
    } else if (line.startsWith('price:') && currentItem) {
      currentItem.price = line.split(':')[1].trim().replace(/^["']|["']$/g, '');
    }
  }

  if (currentCat) data.categories.push(currentCat);

  return data;
}
