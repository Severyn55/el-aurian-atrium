/**
 * Simple Frontmatter Parser
 *
 * Robust line-based Parser für unsere einfachen Frontmatter-Dateien
 * (Hero, Labels, Konzept, Tagesablauf).
 *
 * Unterstützt:
 * - Normale key: value
 * - Quoted values
 * - Literal Block Scalars (text: |-  ... )  ← wichtig für den aktuellen Tagesablauf-Freitext
 *
 * Nicht für komplexe Menu-Strukturen gedacht (siehe menu.ts).
 */

export function parseSimpleFrontmatter(yaml: string): Record<string, any> {
  // Remove possible BOM and normalize
  let input = String(yaml || '').replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').trim();

  // If wrapped in --- ---, extract the inner content
  const blockMatch = input.match(/^---\s*([\s\S]*?)\s*---\s*$/);
  if (blockMatch) {
    input = blockMatch[1].trim();
  } else if (input.startsWith('---')) {
    const cut = input.match(/^---\s*([\s\S]*?)\s*---/);
    if (cut) input = cut[1].trim();
  }

  const data: Record<string, any> = {};
  const lines = input.split('\n');
  let i = 0;

  while (i < lines.length) {
    let raw = lines[i];
    const line = raw.trim();

    if (!line || line.startsWith('#')) {
      i++;
      continue;
    }

    const colon = line.indexOf(':');
    if (colon === -1) {
      i++;
      continue;
    }

    const key = line.substring(0, colon).trim();
    let val = line.substring(colon + 1).trim();

    // Quoted strings
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }

    // Handle YAML literal/folded block scalars (text: |  or text: |- )
    if (val === '|' || val === '|-' || val === '|+' || val === '>' || val === '>-' || val === '>+') {
      const chomping = val.includes('-') ? 'strip' : (val.includes('+') ? 'keep' : 'clip');
      const blockLines: string[] = [];
      i++;

      while (i < lines.length) {
        const nextRaw = lines[i];
        const nextTrim = nextRaw.trim();

        if (!nextRaw.startsWith(' ') && !nextRaw.startsWith('\t') && nextTrim) {
          break; // new top-level key
        }
        if (!nextTrim || nextTrim.startsWith('#')) {
          blockLines.push('');
          i++;
          continue;
        }

        let content = nextRaw.replace(/^(\s{1,4})/, '');
        blockLines.push(content);
        i++;
      }

      let blockVal = blockLines.join('\n');
      if (chomping === 'strip') {
        blockVal = blockVal.replace(/\s+$/, '');
      } else if (chomping === 'clip') {
        blockVal = blockVal.replace(/\n+$/, '\n');
      }

      data[key] = blockVal;
      continue;
    }

    data[key] = val;
    i++;
  }

  return data;
}
