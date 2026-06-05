import { describe, it, expect } from 'vitest';
import {
  isValidJPEG,
  isUnderSizeLimit,
  validatePortraitFile,
  validatePortraitForm,
} from './validators';

describe('admin validators', () => {
  it('rejects non-jpeg by type', () => {
    const fake = { type: 'image/png', name: 'test.png' } as any;
    expect(isValidJPEG(fake)).toBe(false);
  });

  it('accepts jpeg', () => {
    const fake = { type: 'image/jpeg', name: 'test.jpg', size: 10000 } as any;
    expect(isValidJPEG(fake)).toBe(true);
  });

  it('enforces size limit', () => {
    const small = { size: 50 * 1024 } as File;
    const big = { size: 300 * 1024 } as File;
    expect(isUnderSizeLimit(small)).toBe(true);
    expect(isUnderSizeLimit(big)).toBe(false);
  });

  it('validatePortraitFile returns error messages for bad files', () => {
    const badType = { type: 'image/png', size: 10000 } as any;
    expect(validatePortraitFile(badType)).toMatch(/JPG/);

    const tooBig = { type: 'image/jpeg', size: 300 * 1024 } as any;
    expect(validatePortraitFile(tooBig)).toMatch(/zu groß/);
  });

  it('validatePortraitForm requires title and alt', () => {
    expect(validatePortraitForm('', 'alt')).toMatch(/Title/);
    expect(validatePortraitForm('Title', '')).toMatch(/Alt/);
    expect(validatePortraitForm('Title', 'Alt')).toBeNull();
  });
});
