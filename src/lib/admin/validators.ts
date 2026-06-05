/**
 * Admin Validators
 *
 * Reine Validierungsfunktionen (kein DOM, keine Side Effects).
 * Werden im Upload-Flow und idealerweise auch in zukünftigen Server-Validierungen verwendet.
 */

import {
  ALLOWED_IMAGE_MIME,
  MAX_UPLOAD_BYTES,
  MAX_PORTRAITS,
} from './constants';
import type { Portrait } from './types';

/**
 * Prüft, ob die Datei ein gültiges JPEG ist (MIME-basiert — clientseitig).
 * Für höhere Sicherheit auf dem Server zusätzlich Magic-Bytes prüfen.
 */
export function isValidJPEG(file: File | { type?: string; name?: string }): boolean {
  if (!file) return false;
  // Client-seitig haben wir nur type und name
  if ('type' in file && file.type) {
    return file.type === ALLOWED_IMAGE_MIME;
  }
  // Fallback auf Extension
  const name = ('name' in file ? file.name : '') || '';
  return /\.(jpe?g)$/i.test(name);
}

/**
 * Prüft Dateigröße (in Bytes).
 */
export function isUnderSizeLimit(file: File, maxBytes = MAX_UPLOAD_BYTES): boolean {
  if (!file || typeof file.size !== 'number') return false;
  return file.size <= maxBytes;
}

/**
 * Prüft, ob ein Portrait die Pflichtfelder hat.
 */
export function isValidPortraitData(p: Partial<Portrait>): p is Portrait {
  return !!(p && p.title?.trim() && p.alt?.trim() && p.image);
}

/**
 * Prüft das Portrait-Limit (vor dem Hinzufügen prüfen).
 */
export function isUnderPortraitLimit(currentCount: number, max = MAX_PORTRAITS): boolean {
  return currentCount < max;
}

/**
 * Kombinierte Client-Validierung für Portrait-Datei (wie aktuell im UI).
 * Gibt Fehlermeldung zurück oder null wenn OK.
 */
export function validatePortraitFile(file: File): string | null {
  if (!file) return 'Keine Datei ausgewählt.';

  if (!isValidJPEG(file)) {
    return 'Nur JPG-Dateien (image/jpeg) sind erlaubt.';
  }
  if (!isUnderSizeLimit(file)) {
    const kb = (file.size / 1024).toFixed(0);
    return `Datei zu groß: ${kb} KB (Maximum: 200 KB).`;
  }
  return null;
}

/**
 * Validiert Pflichtangaben beim Portrait-Submit.
 */
export function validatePortraitForm(title: string, alt: string): string | null {
  if (!title?.trim()) return 'Title ist Pflicht.';
  if (!alt?.trim()) return 'Alt-Text ist Pflicht.';
  return null;
}
