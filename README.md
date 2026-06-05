# Portfolio Restaurant – Premium Portfolio Website

Eine individuelle Restaurant-Website, die als funktionales Werkzeug für den Betrieb konzipiert ist. Der Fokus liegt auf guter Performance, klaren Interaktionen und einem vollständig integrierten Admin-System, mit dem Inhalte eigenständig gepflegt werden können.

Dieses Projekt dient als Portfolio-Referenz. Der Name "Portfolio Restaurant" und alle Inhalte sind für Demonstrationszwecke gewählt. Struktur, Design, Performance und das Admin-Tool spiegeln echte Produktionsqualität wider.

---

## Tech Stack
- **Astro 4+** (Static Site Generation + Islands)
- **Tailwind CSS** mit eigenem Design System & Tokens
- **Vanilla TypeScript**
- `astro:assets` für optimierte Bilder & Videos
- Keine schweren Frameworks

---

## 🚀 Kern-Feature: Vollständiges Admin-System für alle Inhalte (aktueller Stand 2026)

Das Admin-Interface (`/admin/speisekarten`) ermöglicht es dem Betreiber, die Inhalte der Website weitgehend eigenständig zu bearbeiten – ohne Code, mit GitHub-Integration.

### Bearbeitbare Bereiche

- **Speisekarten (Lunch & Dinner)**
  - Voll manuelle Bearbeitung: Kategorien, Gerichte (Name, Beschreibung, Preis)
  - PDF-Links direkt editierbar
  - **Drag & Drop für PDFs**: Neue Speisekarten-PDFs einfach in die entsprechenden Felder ziehen – werden beim Speichern committet und der Link aktualisiert
  - Kategorien und Gerichte hinzufügen, löschen, umordnen (↑↓)
  - Strukturierte Formulare mit modernen, goldgerahmten Eingabefeldern (hoher Kontrast, gute Schriftgröße)

- **Interface Texte (Labels, Navigation, CTAs, Byline etc.)**
  - Komplette Bearbeitung aller sichtbaren Texte der Website
  - Logisch gruppiert: Navigation, Labels, CTAs, Sonstiges
  - Klare Modul-Überschriften mit originalen Labels (z. B. „Nav: Karte“, „Label: KÜCHE & WEIN“, „CTA: TISCH RESERVIEREN“)
  - Premium-Design: Gold-Umrandete Inputs, 15px Schriftgröße, perfekter Kontrast – exakt wie im Speisekarten-Editor

- **Lange Texte & Beschreibungen (z. B. Das Konzept)**
  - Vollständige Markdown-Unterstützung für Fließtexte
  - Headline + Body (mehrere Absätze, **fett**, Listen etc.)
  - Goldgerahmte, hochkontrastige Felder mit guter Lesbarkeit

### Weitere Admin-Features
- Collapsible Editoren
- Direkter Upload von Markdown-Dateien mit Status-Feedback
- GitHub-basierte Speicherung und Veröffentlichung
- Klare, strukturierte Bearbeitungsoberflächen

### Zugang & Nutzung

1. `/admin/speisekarten` öffnen
2. GitHub PAT (mit Contents: Read & Write) + Repository eingeben
3. Gewünschten Bereich ausklappen oder „Aktuelle Daten laden“
4. Bearbeiten (auch per Drag & Drop bei PDFs)
5. „Speichern“ oder „Hochladen & committen“ → Änderungen live

Der Token wird ausschließlich browserseitig verwendet.

Dieses System ermöglicht es dem Betreiber, Inhalte weitgehend eigenständig zu pflegen.

---

## Besonderheiten

- **Mobile-First Navigation** mit permanentem „K + MENU“ Corner-Trigger und hochwertigem Frosted-Glass Mobile Menu
- Eigenes Design System (Farben, Typografie, Spacing, Motion Tokens)
- Statische Generierung mit Astro für gute Performance
- Vollständig editierbar über ein integriertes Admin-System (Speisekarten, Texte, Inhalte)
- Keine schweren Frameworks – reine Astro + Tailwind + Vanilla TypeScript

---

## Lizenz & Nutzung

Dieses Repository dient primär als Portfolio-Referenz und Demonstration eines funktionalen Ansatzes für Websites im Hospitality-Bereich.

Falls du Teile des Codes, das Admin-System, die Gold-Input-Styles, die Collapsible-Logik oder das Design als Inspiration nutzen möchtest, freue ich mich über eine kurze Nachricht.

Entwickelt mit viel Liebe zum Detail. **Craft over Templates.**

---

## Projektstruktur (vereinfacht)

```bash
src/
├── components/          
├── content/             # Astro Content Collections (lunch, dinner, hero, labels, konzept)
├── pages/
│   ├── admin/
│   │   └── speisekarten.astro   # ← Vollständiges Premium Admin-Interface
│   └── index.astro
├── styles/              # Design System + Tokens
└── scripts/             # Vanilla TS (u. a. mobile-menu, editor logic)
```

**Aktueller Stand**

- Funktionsfähiges Admin-System für Speisekarten, Labels, Texte und Inhalte
- Collapsible Editoren
- Strukturierte Formulare und Drag & Drop für PDFs
- GitHub-basierte Veröffentlichung (Commit → Deploy)
- Manuelle Deploy-Option im Admin
- Portrait-Upload mit Daten-Validierung (JPG, Größenlimit, Metadaten)

Weitere Details siehe die Commit-Historie und die Datei src/pages/admin/speisekarten.astro (mit ausführlichem Design-System und Editor-Logik).

---

## Responsible Use & GitHub ToS Compliance

**Wichtig für Betreiber, Forks und Weiterverwendung:**

Dieses Repository und das integrierte Admin-Tool (`/admin/speisekarten`) nutzen die GitHub Contents & Git Data API direkt aus dem Browser. 

- **Rate Limits & Volumen**: Verwende das Admin-Tool sparsam. Keine hochfrequenten, automatisierten oder massenhaften Commits / Tests über die Browser-Oberfläche oder Skripte. Solches Verhalten kann als Abuse erkannt werden und zum Account-Suspension führen (wie in der Vergangenheit passiert).
- **Keine Reviews / Benchmarks**: Es werden **keine** Reviews, Marktwert-Schätzungen, Rankings oder vergleichbare Bewertungstexte in die README.md oder als separate Textdateien im Repository abgelegt. Das gilt dauerhaft.
- **PAT & Berechtigungen**: Verwende feingranulare Personal Access Tokens (Contents: Read & Write nur für das benötigte Repo). Teile Tokens niemals öffentlich und nur mit absolut vertrauenswürdigen Personen.
- **Empfohlener Workflow**: Immer zuerst lokal testen (`npm run build`), dann manuell committen. Für echte Kundenprojekte ggf. zusätzliche Absicherungen in Betracht ziehen, um Rate-Limits und Auditierbarkeit zu verbessern.
- **GitHub Richtlinien**: Halte dich strikt an die GitHub API Terms of Service und die Acceptable Use Policy. Das Projekt ist als Lern- und Portfolio-Referenz gedacht – keine Produktions-High-Volume-Nutzung ohne zusätzliche Absicherung.

**2026 Refactor-Hinweis (Phase 1):** Der Admin-Code wurde aus dem Monolithen (`speisekarten.astro`) in `src/lib/admin/` (Parser, Generator, Validator, GitHub-Client, Safety) und `components/admin/` extrahiert. Es gibt nun Unit-Tests für kritische Logik (Roundtrips, Validierung). Das **Verhalten für den Betreiber bleibt identisch**. Der Admin ist und bleibt eine **Technische Studie** (siehe Banner auf `/admin/speisekarten`).

Bei Unsicherheiten: Änderungen lokal prüfen, Commits bewusst und in Maßen durchführen.

---

## Lizenz & Nutzung (aktualisiert)

Dieses Repository dient primär als Portfolio-Referenz und Demonstration eines funktionalen Ansatzes für Websites im Hospitality-Bereich.

Falls du Teile des Codes, das Admin-System, die Gold-Input-Styles, die Collapsible-Logik oder das Design als Inspiration nutzen möchtest, freue ich mich über eine kurze Nachricht.

Entwickelt mit viel Liebe zum Detail. **Craft over Templates.**

Bei Weiterverwendung oder Betrieb immer die Responsible-Use-Hinweise oben beachten.

