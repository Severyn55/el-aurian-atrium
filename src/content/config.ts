import { defineCollection, z } from 'astro:content';

const menuItemSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  price: z.string(),
});

const categorySchema = z.object({
  title: z.string(),
  items: z.array(menuItemSchema),
});

const menuSchema = z.object({
  title: z.string(),
  subtitle: z.string().optional(),
  time: z.string(),
  pdf: z.string().optional(),
  categories: z.array(categorySchema),
});

const lunchCollection = defineCollection({
  type: 'content',
  schema: menuSchema,
});

const dinnerCollection = defineCollection({
  type: 'content',
  schema: menuSchema,
});

// --- New editable content collections (for Hero, Labels, Konzept etc.) ---
const heroSchema = z.object({
  headline: z.string(),
  cta: z.string().default('TISCH RESERVIEREN'),
});

const labelsSchema = z.object({
  nav_karte: z.string(),
  nav_konzept: z.string(),
  nav_begegnungen: z.string(),
  nav_events: z.string(),
  nav_member: z.string(),
  nav_reservierung: z.string(),
  label_kueche: z.string(),
  label_speisekarte: z.string(),
  speisekarte_beschreibung: z.string().default('Saisonal, präzise und zum Teilen gedacht. Die Karten wechseln regelmäßig.'),
  label_konzept: z.string(),
  label_begegnungen: z.string(),
  begegnungen_beschreibung: z.string().default('Ausgewählte Momente aus den letzten Jahren. Der Gastgeber und Kurator hinter dem El-Aurian Atrium.'),
  label_hohepunkte: z.string(),
  label_exklusiv: z.string().default('CLUB'),
  label_reservierung: z.string(),
  label_tagesablauf: z.string(),
  label_jeden_samstag: z.string(),
  label_signature_drinks: z.string(),
  label_privat: z.string(),
  label_popup: z.string(),
  label_mittags: z.string().default('MITTAGS'),
  label_abends: z.string().default('ABENDS'),
  cta_tisch_reservieren: z.string(),
  cta_member_werden: z.string(),
  cta_platz_sichern: z.string(),
  cta_vollstaendige_karte: z.string(),
  cta_pdf_lunch: z.string().default('LUNCHKARTE ALS PDF'),
  cta_pdf_dinner: z.string().default('DINNERKARTE ALS PDF'),
  byline: z.string().default('EL-AURIAN ATRIUM'),
  menu_label: z.string().default('MENU'),
  reservation_url: z.string().default('#'),
  instagram_url: z.string().default('https://www.instagram.com/'),
});

const copySchema = z.object({
  label: z.string().optional(),
  headline: z.string().optional(),
});

const tagesablaufSchema = z.object({
  text: z.string().optional(),
});

const portraitSchema = z.object({
  title: z.string(),
  alt: z.string(),
  caption: z.string().optional(),
  subcaption: z.string().optional(),
  year: z.string().optional(),
  image: z.string(), // filename relative to portraits folder, e.g. "blick-in-das-restaurant.jpg"
});

const begegnungenSchema = z.object({
  portraits: z.array(portraitSchema),
});

const heroCollection = defineCollection({ type: 'content', schema: heroSchema });
const labelsCollection = defineCollection({ type: 'content', schema: labelsSchema });
const konzeptCollection = defineCollection({ type: 'content', schema: copySchema });
const tagesablaufCollection = defineCollection({ type: 'content', schema: tagesablaufSchema });
const begegnungenCollection = defineCollection({ type: 'data', schema: begegnungenSchema });

export const collections = {
  lunch: lunchCollection,
  dinner: dinnerCollection,
  hero: heroCollection,
  labels: labelsCollection,
  konzept: konzeptCollection,
  tagesablauf: tagesablaufCollection,
  begegnungen: begegnungenCollection,
};
