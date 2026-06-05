import { describe, it, expect } from 'vitest';
import { readFileSync } from 'fs';
import { resolve } from 'path';
import { parseMenu } from './menu';
import { generateYaml as generateMenuYaml } from '../generators/menu';

const lunchPath = resolve(__dirname, '../../../../src/content/lunch/lunch.md');
const lunchContent = readFileSync(lunchPath, 'utf8');

describe('menu parser/generator roundtrip (Phase 1)', () => {
  it('parses real lunch.md without error', () => {
    const data = parseMenu(lunchContent);
    expect(data.title).toBeTruthy();
    expect(data.categories.length).toBeGreaterThan(0);
    expect(data.categories[0].items.length).toBeGreaterThan(0);
  });

  it('roundtrips lunch menu (parse -> generate -> parse)', () => {
    const parsed = parseMenu(lunchContent);
    const generated = generateMenuYaml(parsed);
    const reparsed = parseMenu(generated);

    expect(reparsed.title).toBe(parsed.title);
    expect(reparsed.categories.length).toBe(parsed.categories.length);
    if (reparsed.categories.length > 0) {
      expect(reparsed.categories[0].title).toBe(parsed.categories[0].title);
    }
  });
});
