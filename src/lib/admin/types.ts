/**
 * Admin Domain Types
 *
 * Zentrale Type-Definitionen für den Admin-Bereich.
 * Diese werden von Parsern, Generatoren, Validierern und dem GitHub-Client verwendet.
 * Ziel: Bessere DX, weniger "any", und Vorbereitung auf spätere serverseitige Nutzung.
 */

export interface Dish {
  name: string;
  description?: string;
  price: string;
}

export interface Category {
  title: string;
  items: Dish[];
}

export interface MenuData {
  title: string;
  subtitle: string;
  time: string;
  pdf: string;
  categories: Category[];
}

export interface HeroData {
  headline?: string;
  cta?: string;
}

export interface LabelsData {
  [key: string]: string | undefined;
  // Bekannte Keys (Beispiele, nicht vollständig):
  // label_mittag, label_abends, cta_tisch_reservieren, ...
}

export interface KonzeptData {
  headline?: string;
  body?: string; // Markdown
}

export interface TagesablaufData {
  text?: string; // Freitext mit Zeilenumbrüchen (seit der Vereinfachung)
}

export interface Portrait {
  title: string;
  alt: string;
  caption?: string;
  subcaption?: string;
  year?: string;
  image: string; // Dateiname (z.B. "20260604-der-gastgeber.jpg")
}

export interface GitHubFileMeta {
  data: any;
  body?: string;
  sha: string | null;
  raw: string;
}

/** Für den internen State im Admin-Controller */
export interface CurrentData {
  lunch: GitHubFileMeta | null;
  dinner: GitHubFileMeta | null;
  hero: GitHubFileMeta | null;
  labels: GitHubFileMeta | null;
  konzept: GitHubFileMeta | null;
  tagesablauf: GitHubFileMeta | null;
}

export type CommitResult = {
  commit?: { html_url?: string };
  content?: { sha?: string };
  [key: string]: any;
};