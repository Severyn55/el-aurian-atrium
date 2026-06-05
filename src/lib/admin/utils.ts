/**
 * Admin Utilities
 *
 * Kleine, reine Hilfsfunktionen ohne Side-Effects (außer readFileAsText).
 * Werden von Parsern, Validierern, GitHub-Client und UI-Controllern verwendet.
 */

import { PORTRAIT_DATE_PREFIX } from './constants';

/**
 * Escapes HTML special characters. Used for status messages that contain user input.
 */
export function escapeHtml(str: string | null | undefined): string {
  return String(str || '').replace(/[&<>"']/g, (m) => {
    return ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' } as Record<string, string>)[m] || m;
  });
}

/**
 * Reads a File object as text (used for PDF metadata or future YAML uploads).
 */
export function readFileAsText(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => resolve(e.target?.result as string);
    reader.onerror = reject;
    reader.readAsText(file);
  });
}

/**
 * Base64 <-> UTF8 helpers (robust gegen Umlaute und Sonderzeichen).
 * Wichtig für GitHub Contents API (base64 kodiert).
 */
export function base64ToUtf8(base64: string): string {
  try {
    return decodeURIComponent(escape(atob(base64)));
  } catch (e) {
    return atob(base64); // fallback
  }
}

export function utf8ToBase64(str: string): string {
  return btoa(unescape(encodeURIComponent(str)));
}

/**
 * Erzeugt einen sicheren Slug aus einem Titel (für Dateinamen).
 * Entfernt Umlaute, Sonderzeichen, begrenzt Länge.
 */
export function slugify(input: string, maxLength = 60): string {
  return (input || 'item')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // diakritische Zeichen entfernen
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, maxLength);
}

/**
 * Generiert einen sicheren Dateinamen für Begegnungen-Portraits.
 * Schema: 20260604-mein-titel.jpg (oder aktuelles Datum als Fallback).
 * Wird im Portrait-Upload-Flow verwendet.
 */
export function generateSafePortraitFilename(title: string): string {
  const slug = slugify(title || 'portrait');
  // Behalte das bestehende 20260604- Präfix bei, falls gewünscht, sonst echtes Datum
  const datePart = PORTRAIT_DATE_PREFIX.replace(/-$/, ''); // "20260604"
  return `${datePart}-${slug}.jpg`;
}

/**
 * Generiert einen sicheren Dateinamen für hochgeladene PDFs (Speisekarten).
 * Verwendet vollen Timestamp für Eindeutigkeit (auch bei schnellen Uploads).
 */
export function generateSafePdfFilename(type: 'lunch' | 'dinner'): string {
  const now = new Date();
  const timestamp = now.toISOString().replace(/[-:.TZ]/g, '').slice(0, 17);
  return `Speisekarte_${timestamp}_${type.toUpperCase()}.pdf`;
}

/**
 * Normalisiert Zeilenumbrüche (CRLF -> LF). Nützlich vor YAML-Generierung.
 */
export function normalizeLineEndings(text: string): string {
  return text.replace(/\r\n/g, '\n');
}
