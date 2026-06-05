import { describe, it, expect } from 'vitest';
import { parseSimpleFrontmatter } from './frontmatter';
import { generateTagesablaufFrontmatter } from '../generators/tagesablauf';

const tagesablaufFixture = `text: |-
  12:30 – 20:30 Kitchen
  17:30 – 22:30 Fine Dine + Beats
  22:30 – 01:00 Cocktails, Beats & Party

  Mit täglich wechselnden Tagesgerichten nach Aushang
`;

describe('frontmatter parser (Phase 1)', () => {
  it('parses block scalar (text: |-) correctly', () => {
    const data = parseSimpleFrontmatter(tagesablaufFixture);
    expect(data.text).toContain('12:30 – 20:30 Kitchen');
    expect(data.text).toContain('Mit täglich wechselnden');
  });

  it('roundtrips tagesablauf free text', () => {
    const parsed = parseSimpleFrontmatter(tagesablaufFixture);
    const regenerated = generateTagesablaufFrontmatter({ text: parsed.text });
    const reparsed = parseSimpleFrontmatter(regenerated);

    // Normalize for comparison
    const normalize = (t: string) => (t || '').replace(/\s+/g, ' ').trim();
    expect(normalize(reparsed.text)).toBe(normalize(parsed.text));
  });
});
