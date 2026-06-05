# Design System – Kleines Kameel by Shiyas
**Version:** 0.3 (Mai 2026)  
**Ziel:** Ein einheitliches, wartbares und erweiterbares Komponenten-System für die aktuelle Website und alle zukünftigen Unterseiten.

---

## 1. Philosophie

Das Design System folgt drei Prinzipien:

1. **Zurückhaltung als Luxus**  
   Weniger Klassen, mehr Intent. Jede Komponente muss einen klaren Zweck haben.

2. **Craft über Convenience**  
   Micro-Interactions, Gold-Akzente und Typografie sind nicht optional. Sie sind Marken-DNA.

3. **Zukunftssicherheit**  
   Alles muss auch auf zukünftigen Unterseiten (`/events`, `/konzept`, `/mitgliedschaft` etc.) ohne Copy-Paste-Style funktionieren.

---

## 2. Tokens (Single Source of Truth)

### 2.1 Farben (tailwind.config.js)

```js
'kk-bg': '#0F0D0A',
'kk-surface': '#1A1714',
'kk-surface-2': '#25221E',
'kk-text': '#F4EDE3',
'kk-text-muted': '#A89F90',
'kk-gold': '#C5A46E',
'kk-gold-dark': '#A68A5F',
'kk-border': '#3A3630',
```

### 2.2 Motion Tokens (Layout.astro)

```css
--duration-fast: 120ms;
--duration-base: 220ms;
--duration-slow: 380ms;
--duration-lux: 650ms;

--ease-standard, --ease-emphasized, --ease-decelerate, --ease-exit
```

### 2.3 Hero Heights (neu seit 0.3)

```css
--hero-height-mobile: 54dvh;
--hero-height-tablet: 58dvh;
--hero-height-desktop: 620px;
```

---

## 3. Typografie

| Klasse              | Verwendung                          | Größe     | Tracking     | Line-Height |
|---------------------|-------------------------------------|-----------|--------------|-------------|
| `.heading-lcp`      | Nur das große H1 "Kleines Kameel"   | 62–96px   | -2.8 bis -4.5px | 0.92        |
| `.text-display`     | Große Headlines                     | 62–96px   | -2.8 bis -4.5px | 0.92        |
| `.text-heading`     | Section Headlines                   | 40–48px   | -1.25 bis -1.5px | 0.95      |
| `.text-subhead`     | Sub-Headlines / Card Titles         | 28–32px   | -0.25 bis -0.5px | 1.0–1.05   |
| `.label`            | Kategorie-Labels (uppercase)        | 12px      | 3.5px        | -           |
| `.label-tight`      | Engere Variante                     | 12px      | 2.5px        | -           |

**Empfehlung für neue Seiten:** Immer über Tailwind-Klassen `text-display`, `text-heading`, `text-subhead` + die zwei Label-Klassen arbeiten.

---

## 4. Komponenten-Bibliothek (Stand 0.3)

### 4.1 Buttons

**Basis:** `.btn`

**Varianten:**
- `.btn-primary` → Gold Button (Reservieren)
- `.btn-secondary` → Outline Button
- `.btn-ghost` → Text-Only Button

**Zukünftige Erweiterungen (vorgeschlagen):**
- `.btn-primary:disabled`
- `.btn-small` / `.btn-large`
- `.btn-icon` (nur Icon)

### 4.2 Cards & Frames

- `.gold-frame-hover` → Standard Card mit Gold-Rand-Effekt
- `.subtle-lift` → Leichte Hebung + Schatten
- Kombination empfohlen: `gold-frame-hover subtle-lift`

**Neue empfohlene Komponente (noch nicht implementiert):**
```html
<div class="card">
  ...
</div>
```

### 4.3 Labels & Section Header

```html
<div class="label text-[#C5A46E]">KÜCHE & WEIN</div>
<h2 class="serif text-heading">Speisekarte.</h2>
```

**Vorschlag für zukünftige Standardisierung:**
```html
<div class="section-header">
  <div class="label text-kk-gold">KÜCHE & WEIN</div>
  <h2 class="serif text-heading">Speisekarte.</h2>
</div>
```

### 4.4 Divider

Aktuell: `<SectionDivider />`

**Zukünftige Varianten:**
- `section-divider` (Standard)
- `section-divider-gold` (mit feiner Goldlinie)

### 4.5 Formulare & Inputs (aktuell schwach)

Derzeit fast keine standardisierten Formular-Styles. Das ist eine der größten Lücken für zukünftige Unterseiten (Reservierungs-Formular, Member-Anmeldung).

**Dringend benötigt:**
- `.input`
- `.input:focus`
- `.textarea`
- `.select`
- Error States mit Gold

### 4.6 Mobile Menu (seit Mai 2026 hochcraftig)

- Corner Trigger (`MobileCornerTrigger`)
- Zweischichtiges Overlay (`MobileMenu`)
- Gold Whisper Hover Language

Diese Komponenten gelten als **referenzreif** für das gesamte System.

---

## 5. Empfohlene Struktur für neue Unterseiten

```astro
---
import Layout from '../layouts/Layout.astro';
import SectionHeader from '../components/SectionHeader.astro';
import Card from '../components/Card.astro';
---
<Layout title="...">
  <SectionHeader label="EVENTS" title="Besondere Abende." />

  <div class="grid md:grid-cols-3 gap-6">
    <Card goldFrame subtleLift>
      ...
    </Card>
  </div>
</Layout>
```

---

## 6. Nächste Schritte (Priorisiert)

1. **Sofort** – Neue Komponenten extrahieren:
   - `SectionHeader.astro`
   - `Card.astro` (Wrapper für gold-frame + subtle-lift)
   - Standardisierte Form-Elemente

2. **Kurzfristig** – `components/ui/` erweitern:
   - Button.astro (mit Varianten als Props)
   - Input.astro
   - Modal.astro (besser als aktueller ReservationModal)

3. **Mittelfristig** – Storybook oder einfache Preview-Seite (`/design-system`) anlegen, damit man Komponenten isoliert sehen kann.

---

## 7. Regeln für Entwickler

- **Nie** inline `style="..."` für Design-Entscheidungen (außer Hero Tokens).
- Neue Komponenten immer zuerst in `docs/DESIGN-SYSTEM.md` dokumentieren.
- Jede neue Komponente muss `focus-visible` States haben.
- Alle Hover-Effekte müssen mit den Motion Tokens arbeiten.

---

**Dokument erstellt:** Mai 2026  
**Nächstes Major-Update:** Sobald `SectionHeader` + `Card` als echte Astro-Komponenten extrahiert sind.

---

*Dieses Dokument ist der Startpunkt für eine professionelle Komponenten-Bibliothek. Es wird aktiv weiterentwickelt.*