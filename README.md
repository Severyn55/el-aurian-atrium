# Portfolio Restaurant – Premium Portfolio Website

**Technische Studie / Studio-Demonstrator**

Dieses Projekt ist eine **offene Technische Studie** und dient als Portfolio-Referenz für einen modernen, browserbasierten Content-Workflow mit Astro und direkter GitHub-Integration (kein eigener Server, keine Secrets im Code).

Der Name „Portfolio Restaurant“, alle Texte, Bilder, Videos und das gesamte Szenario sind **rein fiktiv** und ausschließlich für Demonstrationszwecke erstellt. Struktur, Design-System, Performance und das Admin-Tool sollen echte Produktionsqualität widerspiegeln.

**Ziel der Studie:**  
Zeigen, wie man ein vollständiges, eigenständig pflegbares Admin-Interface für eine statische Website bauen kann – komplett client-seitig, mit direkten GitHub-Commits aus dem Browser und ohne eigene Backend-Infrastruktur.

**Wichtig:** Dies ist kein fertiges Produkt und keine Vorlage für den produktiven Betrieb eines Restaurants oder einer vergleichbaren Website. Es handelt sich um eine Lern- und Demonstrationsressource.

---

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

**Dieses Projekt und alle Forks unterliegen denselben Regeln.**

Das Admin-Tool (`/admin/speisekarten`) führt **direkte** GitHub Contents & Git Data API Calls aus dem Browser aus. Das ist für eine Technische Studie bewusst so gewählt, birgt aber Risiken.

### Klare Regeln (gelten für den Betreiber und jeden Fork)

- **Keine hochfrequente oder automatisierte Nutzung**  
  Keine massenhaften, schnellen oder skriptgesteuerten Commits über die Browser-Oberfläche. Solches Verhalten wird von GitHub als Abuse gewertet und hat in der Vergangenheit bereits zu Account-Sperrungen geführt.

- **Keine Reviews, Benchmarks oder Rankings**  
  Es dürfen **weder** in diesem Repository noch in Forks Reviews, Marktwert-Schätzungen, Rankings oder vergleichbare Bewertungstexte abgelegt werden. Diese Regel gilt dauerhaft.

- **Persönliche Access Tokens (PATs)**  
  Verwende ausschließlich feingranulare Personal Access Tokens mit den minimal notwendigen Rechten (Contents: Read & Write nur für das jeweilige Repo). Tokens niemals teilen oder öffentlich machen.

- **Empfohlener Workflow**  
  1. Änderungen lokal testen (`npm run build`)  
  2. Manuell committen  
  3. Bei Bedarf manuell über den Admin nachziehen

- **GitHub Richtlinien**  
  Halte dich strikt an die [GitHub API Terms of Service](https://docs.github.com/en/site-policy/github-terms/github-terms-of-service) und die [Acceptable Use Policy](https://docs.github.com/en/site-policy/acceptable-use-policies). Dieses Projekt ist als **Lern- und Portfolio-Referenz** (Technische Studie) gedacht – keine Produktions-High-Volume-Nutzung.

**Verstoß gegen diese Regeln kann zur Sperrung deines GitHub-Accounts führen – auch bei Forks.**

Der Admin-Code ist bewusst als **Technische Studie** konzipiert (siehe Banner auf `/admin/speisekarten`). Für echte Kundenprojekte empfehlen wir zusätzliche Absicherungen (z. B. CI/CD, Review-Prozesse, dedizierte Service-Accounts).

---

## Forking, Wiederverwendung & Attribution

Da dies eine **offene Technische Studie** ist, ist der Code bewusst als Lernressource und für Wiederverwendung gedacht.

**Lizenz:** Der gesamte Code steht unter der [MIT License](LICENSE). Du darfst ihn frei forken, anpassen, in eigenen Projekten (auch kommerziell) nutzen und weiterverbreiten.

### Wichtiger Hinweis für alle Forks und Weiterverwendungen

**Die Regeln aus dem Abschnitt „Responsible Use & GitHub ToS Compliance“ gelten uneingeschränkt auch für jeden, der diesen Code oder das Admin-System verwendet oder weiterentwickelt.**

Insbesondere:
- Keine hochfrequente, automatisierte oder massenhafte Nutzung des Admin-Tools über den Browser.
- Keine Reviews, Benchmarks, Rankings oder vergleichbare Inhalte.
- Strenge Einhaltung der GitHub API Terms of Service und Acceptable Use Policy.

Wer diese Regeln missachtet, riskiert eine Sperrung des eigenen GitHub-Accounts – unabhängig davon, ob der Code geforkt wurde oder nicht.

**Gewünschte Attribution (freiwillig, aber höflich):**
- Kurzer Hinweis im README oder Impressum, z. B.:  
  „Admin-System und Architektur inspiriert von der Technischen Studie *el-aurian-atrium* von Severyn55“
- Link zum Original-Repository

**Inhalte:**  
Die fiktiven Texte, Bilder, Videos und die gesamte Restaurant-Story sind Demonstrationsmaterial. Sie sollten nicht 1:1 übernommen werden, ohne sie als eigenes Werk zu kennzeichnen.

Falls du etwas Spannendes damit baust oder Fragen zur Studie hast: Ich freue mich über eine kurze Nachricht oder einen Link zu deinem Fork.

---

## Lizenz & Nutzung

Der gesamte Code steht unter der [MIT License](LICENSE).

Dieses Repository dient als offene **Technische Studie** und Portfolio-Referenz. Die Wiederverwendung von Code, Admin-Architektur und Design-Patterns ist ausdrücklich erwünscht – bitte beachte dabei die Responsible-Use-Regeln und gib bei Möglichkeit eine Attribution.

**Craft over Templates.** Entwickelt mit viel Liebe zum Detail.

Bei Fragen oder spannenden Forks: einfach eine kurze Nachricht.

