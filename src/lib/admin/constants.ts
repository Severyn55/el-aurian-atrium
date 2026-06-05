/**
 * Admin Constants
 *
 * Zentrale Konstanten für den Admin-Bereich.
 * Diese Werte werden an mehreren Stellen verwendet (Validierung, UI, Safety).
 * Änderungen hier wirken sich überall aus.
 */

export const COOLDOWN_MS = 9000; // ~9 Sekunden (etwas toleranter als die 8-10s im UI-Text)
export const COOLDOWN_DISPLAY_SECONDS = 9;

export const MAX_PORTRAITS = 30;
export const MAX_UPLOAD_KB = 200;
export const MAX_UPLOAD_BYTES = MAX_UPLOAD_KB * 1024;

export const ALLOWED_IMAGE_MIME = 'image/jpeg';
export const ALLOWED_IMAGE_EXTENSIONS = ['.jpg', '.jpeg'];

export const PORTRAIT_DATE_PREFIX = '20260604-'; // Aktuelles Naming-Schema (kann bei Bedarf angepasst werden)

export const GITHUB_USER_AGENT = 'Portfolio-Admin/1.0';

export const ADMIN_STATUS_COLORS = {
  success: '#4ade80',
  error: '#f87171',
  info: '#A89F90',
  gold: '#C5A46E',
} as const;
