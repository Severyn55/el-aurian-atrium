# Admin-Code-Architektur Refactoring Plan

**Projekt:** The El-Aurian Atrium (kleines-kameel-website)  
**Datum:** 2026  
**Status:** Projekt eingestellt. Proxy-, Cloudflare-Worker- und ADMIN_SECRET-Code (langes Passwort) wurden vollständig entfernt. Dieses Dokument dient nur noch der historischen Referenz. Keine weitere Entwicklung.  
**Zielgruppe:** Entwickler (historisch)

---

## 1. Zielsetzung & Leitprinzipien

### Kernziele
- Den monolithischen Admin (`src/pages/admin/speisekarten.astro`, aktuell ~2.503 Zeilen / ~116 KB Quelltext) in **saubere, wartbare Einheiten** zerlegen.
- Langfristige **Wartbarkeit** und **Developer Experience (DX)** signifikant verbessern.
- Hohes **handwerkliches Niveau** des Admin-Interfaces selbst beibehalten (Gold-Design-System, Lesbarkeit der Eingabefelder, ruhige Premium-Ästhetik).
- Realistischer Aufwand: Keine Over-Engineering. Kein neues Framework (bleibt Vanilla + Astro).
- **Eindeutige Positionierung:** Der Admin wird entweder **wirklich produktionsreif** gemacht **oder** klar und prominent als **"Technische Studie / Studio-Demonstrator"** gekennzeichnet. Ein halbgares Mittelding wird vermieden.

### Leitprinzipien für alle Entscheidungen
1. **Pragmatismus vor Perfektion** — Besser ein guter, verständlicher Schnitt als ein eleganter, aber komplexer.
2. **Reine Funktionen zuerst** — Parsers, Generators, Validators sind der größte Risikofaktor und am einfachsten zu isolieren/testen.
3. **Verhalten für den Betreiber darf sich nicht verschlechtern** — Gleiche Workflows (Token eingeben, "Daten laden", Cooldown + Confirm, Gold-Cards, Freitext für Höhepunkte etc.). Keine neuen Wartezeiten oder komplizierteren UI-Flows.
4. **Ehrlichkeit schützt** — Die fundamentale Architektur (Browser schreibt per PAT direkt in GitHub) hat inhärente Limits (Sicherheit, ToS, Hosting, Skalierbarkeit). Das wird transparent kommuniziert.
5. **Craft over Hype** — Keine "Architecture Astronautics". Die vorhandenen Craft-Standards (Gold-Nutzung, Spacing, Typografie) gelten auch für den refaktorierten Admin-Code und die Dokumentation.

---

## 2. Ehrliche Bestandsaufnahme (aktueller Zustand)

### Was gut läuft
- Funktional sehr mächtig für den Betreiber (vollständige Pflege von Lunch/Dinner inkl. PDF, Hero, Labels, Konzept, Höhepunkte-Freitext, Begegnungen-Portraits mit Bild-Upload + automatischer Benennung).
- Keine zusätzlichen Hosting-Kosten (reines GitHub Pages + Actions).
- Das Gold-Design-System im Admin ist inzwischen gut lesbar (dunkler Hintergrund, helle Schrift, Gold-Ränder, Fokus-States) — zuletzt für das Höhepunkte-Textarea optimiert.
- Viele harte Lektionen bereits eingebaut (Cooldowns, Bestätigungen, ToS-Warnungen, SHA-Handling, atomic Portrait-Commit via Git Data API).

### Die echten Probleme (keine Schönfärberei)
- **Monolith**: Eine einzige Datei mit allem — UI-Markup, riesiges `<style>`, 2.000+ Zeilen imperative JS, State, Parser, GitHub-Client, Event-Handler, IIFEs für Collapsibles, `window.*`-Exports für `onclick`, globale Variablen.
- **Mischung von Concerns**: Domain-Logik (Menu-Struktur), Infrastruktur (GitHub API, Base64, SHA), UI (Render-Funktionen, DOM-Manipulation), Safety (confirm/cooldown), Validierung (JPG, 200 KB) — alles ineinander.
- **Schwer testbar**: Praktisch null Automatisierung. Parser-Änderungen sind riskant (History zeigt sha- und Parse-Probleme).
- **Hohe Einstiegshürde**: Jemand, der den Code in 6 Monaten warten muss, braucht Stunden, um sich zurechtzufinden.
- **Fragile Custom Parser**: Line-basierte YAML-Parser (anstatt konsequente Nutzung von `gray-matter`, das als Dependency vorhanden ist). Gute Roundtrip-Eigenschaften sind nicht garantiert.
- **Positionierungs-Risiko**: Der Admin sieht aus wie ein "richtiges" Tool. In Kombination mit der Historie (Account-Suspension, viele manuelle Fixes für Base-Path, Jekyll vs. Actions, Video-404s, falsche Defaults) entsteht ein falscher Eindruck von Produktionsreife.
- **Tech-Debt-Signale**: `tinacms` liegt in `package.json`, wird aber nicht genutzt. Viele Experimente haben Spuren hinterlassen.

**Fazit:** Der Code erfüllt aktuell seinen Zweck für ein Portfolio/Studio-Demo-Projekt mit hohem Handwerksanspruch. Für langfristige Wartung oder echte Kundenprojekte ist er teuer und riskant.

---

## 3. Die vier zentralen Punkte — Klare Empfehlungen

### Punkt 1: Extraktion aus dem Monolithen in Komponenten und Module

**Empfehlung:**  
**Ja, extrahieren — aber in klar priorisierten Schichten und nicht auf einmal.** Reines Verhalten (Parser/Generator/Validator) zuerst, GitHub-Client als nächstes, UI-Komponenten danach. Das bestehende Verhalten für den Betreiber muss 1:1 erhalten bleiben (keine "Verbesserungen" der UX während des Refactors).

**Begründung:**  
- Die Logik in den Parsern und Generatoren ist der **größte Single Point of Failure**. Ein Bug dort betrifft reale Inhalte (Menüs, Portraits). Isolierung + Tests zahlt sich sofort aus.
- Ein monolithisches Script verhindert Wiederverwendung (z. B. könnte später ein kleines Node-Skript die gleichen Generatoren für Migrations nutzen).
- UI-Extraktion bringt DX-Vorteile (kleinere Dateien, bessere Editor-Unterstützung), ist aber aufwändiger, weil starke DOM-Kopplung besteht (IDs, `getElementById`, live `innerHTML` in manchen Stellen).
- Balance: Technische Eleganz (klare Schichten) vs. praktische Nutzbarkeit — der Betreiber soll nach dem Refactor exakt dieselben Buttons, Status-Meldungen und Workflows sehen.

**Optionale Umsetzungsschritte (Phase 1 zuerst):**
1. Identifiziere alle reinen Funktionen (siehe Analyse unten).
2. Extrahiere Types zuerst (TypeScript-Interfaces für `MenuData`, `Category`, `Dish`, `Portrait`, `TagesablaufData` etc.).
3. Extrahiere `parsers/` und `generators/` als Paare (jeder Parser hat idealerweise einen korrespondierenden Generator mit Roundtrip-Garantie).
4. Extrahiere `validators.ts` (Datei-Typ, Größe, Namens-Sanitizer, Portrait-Limit etc.).
5. Extrahiere `github-client.ts` (Klasse oder Namespace mit Methoden: `loadFile`, `commitFile`, `commitPortraitAtomic`, zentrale Fehlerbehandlung, User-Agent, Auth-Header-Logik).
6. Extrahiere Safety (`confirmCommit`, `checkCommitCooldown` etc.) in `safety.ts`.
7. Schrittweise die alten Funktionen im `speisekarten.astro` durch Imports ersetzen und manuell testen.
8. Am Ende des Extraktions-Schritts: Die `.astro`-Datei sollte primär Markup + minimale Bootstrapping-Logik + Imports enthalten.

**Wichtige reine / gut extrahierbare Kandidaten (Beispiele aus aktuellem Code):**
- `parseMenu`, `parseSimpleFrontmatter`, `parsePortraitsFromYaml`
- `generateYaml`, `generateSimpleFrontmatter`, `generateContentWithBody`, `generateTagesablaufFrontmatter`, `generatePortraitsYaml`
- `utf8ToBase64` / `base64ToUtf8`, `escapeHtml`, `readFileAsText`
- `checkCommitCooldown`, `recordCommitAction`, `confirmCommit`
- Validierungslogik aus `handlePortraitFileSelect` und Upload-Flow (JPG-Check, 200 KB, Filename-Generierung)

### Punkt 2: Grundlegende Strukturvorschläge (Ordner & Dateien)

**Empfehlung (pragmatisch & zukunftsorientiert):**

```
src/
├── lib/
│   └── admin/                    # Reine Logik + Infrastruktur (kein DOM)
│       ├── index.ts              # Barrel-Export (wichtige DX-Verbesserung)
│       ├── types.ts              # Alle Interfaces + Zod-ähnliche Runtime-Checks falls gewünscht
│       ├── constants.ts          # COOLDOWN_MS, MAX_PORTRAITS = 30, MAX_UPLOAD_KB = 200, etc.
│       ├── utils.ts              # Kleine Helfer (escapeHtml, base64, slugify, formatDateForFilename)
│       ├── validators.ts         # isValidImageFile(file), isUnderSizeLimit, sanitizePortraitFilename, etc.
│       ├── parsers/
│       │   ├── index.ts
│       │   ├── menu.ts           # parseMenu + evtl. parseMenuItem
│       │   ├── frontmatter.ts    # parseSimpleFrontmatter (wiederverwendbar für Hero/Labels/Konzept/Tagesablauf)
│       │   └── portraits.ts
│       ├── generators/
│       │   ├── index.ts
│       │   ├── menu.ts
│       │   ├── frontmatter.ts
│       │   └── portraits.ts
│       └── github-client.ts      # GitHubClient class (oder Funktions-Set). Enthält alle fetch-Logik, SHA-Handling, atomic Commits.
│
├── components/
│   └── admin/                    # Präsentations-Schicht (Markup + minimale client:load Scripts)
│       ├── GitHubConnectionCard.astro   # Token + Repo + "Daten laden" + ToS-Warnung
│       ├── MenuEditor.astro             # Lunch + Dinner (kann intern zwei Instanzen sein oder Props)
│       ├── HeroEditor.astro
│       ├── LabelsEditor.astro
│       ├── KonzeptEditor.astro
│       ├── TagesablaufEditor.astro      # Das aktuelle Freitext-Textarea (bereits vereinfacht)
│       ├── PortraitsManager.astro       # Liste + Upload-Form + Count
│       ├── AdminCard.astro              # Basis-Komponente für einheitliche Cards + Header (DRY)
│       └── AdminStatus.astro            # Wiederverwendbare Status-Meldung (Farbe, HTML-Support für Links)
│
├── scripts/
│   └── admin/
│       └── speisekarten-admin.ts        # Zentrale Client-Logik / "App Controller"
│                                        # Imports aus lib/admin, holt globale State (token/repo),
│                                        # initialisiert Collapsibles, wired die Cards, exposed window.* falls nötig.
│
├── styles/
│   └── admin.css                        # Extrahiertes Admin-Design-System (CSS-Variablen + .admin-* Klassen)
│                                        # Kann später scoped oder als Utility-Layer genutzt werden.
│
└── pages/
    └── admin/
        └── speisekarten.astro           # Wird schlank: Layout + Komponenten + ein <script type="module"> das den Controller imported
```

**Zusätzliche Dateien (empfohlen):**
- `docs/ADMIN-ARCHITECTURE.md` (kurze Übersicht der Schichten — nach dem Refactor pflegen).
- `src/lib/admin/README.md` (warum wir bestimmte Parser selbst geschrieben haben, ToS-Hinweise etc.).

**Begründung für diese Struktur:**
- `lib/admin/` ist unabhängig von Astro und DOM → kann in Node-Skripten oder (hypothetisch) serverseitig genutzt werden.
- `components/admin/` hält die Präsentation nah an der bestehenden Card-basierten UI (gute DX beim Weiterentwickeln einzelner Bereiche).
- Ein zentraler Controller in `scripts/admin/` vermeidet Chaos bei State (token, current repo, loaded data). Einfacher Event-Bus oder einfaches Modul-State ist ausreichend (kein Signals-Framework nötig).
- Barrel-Exports (`index.ts`) sind kleine Investition mit großem DX-Gewinn.
- Die bestehende `src/data/` und `src/scripts/`-Konvention wird respektiert und erweitert.

**Alternative (wenn man noch simpler bleiben will):** Alles unter `src/admin/` (monolithischer Ordner) statt `lib/` + `components/admin/`. Weniger "richtig", aber für ein Studio-Projekt manchmal verständlicher.

**Empfehlung:** Die lib + components/admin-Variante wählen — sie skaliert besser, wenn später mehr Admin-Bereiche (z. B. echte Buchungen, Analytics-Placeholder) hinzukommen.

### Punkt 3: Einfache Testing-Strategien

**Empfehlung:**  
**Vitest + jsdom (oder happy-dom)** als leichtgewichtiges Setup. Keine Playwright/Cypress am Anfang. Tests nur für die `lib/admin/`-Schicht (pure + leicht mockbare Logik). Keine Tests für die imperativen DOM-Teile in Phase 1.

**Konkrete Test-Bereiche (Priorität hoch → niedrig):**
1. **Parser ↔ Generator Roundtrips** (höchste Priorität)
   - Lade echte Inhalte aus `src/content/lunch/lunch.md`, `dinner/dinner.md`, `tagesablauf/tagesablauf.md`, `labels/main.md`, `portraits.yaml`.
   - `parseX(generateX(data)) === data` (oder normalisierte Variante).
   - Edge Cases: leere Listen, fehlende optionale Felder, mehrzeilige `text: |-` Blöcke, Sonderzeichen in Namen.

2. **Validators** (sehr hoher Nutzen, niedriger Aufwand)
   - `isValidJPEG(file)` (MIME + ggf. Magic-Byte-Check)
   - `isUnderSizeLimit(file, 200 * 1024)`
   - `sanitizeFilename("Mein Bild.jpg")` → `20260604-mein-bild.jpg` (oder das aktuelle Schema)
   - Portrait-Limit-Checks

3. **Safety / Cooldown** (kleine aber wichtige Unit-Tests)
   - Mock `Date.now`, teste dass nach `recordCommitAction()` der Cooldown korrekt blockt.

4. **GitHub Client (mit MSW-Mocks)**
   - Smoke-Test: "Menu speichern ruft korrekten PUT mit korrektem YAML auf".
   - Fehlerfälle (403, 422 sha mismatch, Netzwerkfehler) → korrekte Fehlermeldungen.

**Setup-Empfehlung (minimal):**
- `npm install -D vitest jsdom`
- `vitest.config.ts` (einfach, mit `environment: 'jsdom'`)
- `package.json` `"test": "vitest"`, `"test:run": "vitest run"`
- `src/lib/admin/__tests__/` oder `src/lib/admin/*.test.ts` (co-located ist bei kleinen Modulen oft besser).

**Begründung:**
- Parser-Bugs sind in der Vergangenheit schon produktiv aufgetreten (sha-Fehler, falsche Strukturen).
- Reine Funktionen sind extrem billig zu testen und geben enormes Vertrauen bei jedem Refactor-Schritt.
- Der Betreiber profitiert indirekt (weniger "irgendwas stimmt nicht nach dem Speichern").
- Kein Overkill: Wir bauen kein volles E2E-Framework für ein Studio-Demo-Projekt auf.

**Hinweis:** Da das Projekt eingestellt wurde, wurden keine produktionsreifen Erweiterungen (inkl. Proxy) umgesetzt. Der aktuelle Stand verwendet direkte GitHub-Commits (PAT im Browser) und ist als Studie markiert.

### Punkt 4: Positionierung (Produktionsreife vs. Studie) + Balance für den Betreiber

**Empfehlung (klar & nicht verhandelbar):**  
Nach (oder parallel zum) Refactoring wird der Admin **explizit und dauerhaft als "Technische Studie / Studio-Demonstrator"** positioniert.

**Konkrete Maßnahmen:**
- Prominentes Banner direkt unter dem Admin-Header (bleibt auch nach Login/Token-Eingabe sichtbar oder klappt nur leicht zu):
  > **Studio Admin – Technische Demonstration**  
  > Dieses Tool zeigt einen vollständig browserbasierten Content-Workflow mit direkter GitHub-Integration. Es dient als Referenz und für den internen Gebrauch des Studios. Siehe README → "Responsible Use".

- README "Responsible Use & GitHub ToS Compliance" Sektion deutlich ausbauen (bestehender Text ist schon gut — erweitern um "Nach dem Refactoring 2026 ist die interne Struktur sauberer, die grundsätzlichen Risiken (Browser-Write-PAT, Rate-Limits, kein Preview) bleiben jedoch bestehen.").

- Keine Werbe-Claims wie "einfach für jeden Betreiber ohne technisches Wissen".

**Warum diese klare Entscheidung?**
- Die Architektur (kein Server, PAT im Browser, direkte Commits, reines Static Hosting) ist **nicht** production-grade für sensible oder hochfrequent geänderte Inhalte. Das zu kaschieren wäre unehrlich und gefährlich (ToS, Datenintegrität, Support-Aufwand).
- Ein "halbgares" sauberes Monolith wäre der teuerste Weg: Viel Aufwand, aber immer noch die alten Risiken.
- Ehrlichkeit erhöht langfristig den Wert des Projekts als Referenz (andere Entwickler sehen: "so sieht eine ehrliche Studie aus").

**Balance zwischen technischer Eleganz und praktischer Nutzbarkeit für den Betreiber:**
- **Eleganz:** Klare Schichten, gute Namen, Barrel-Exports, Tests, kleine Dateien, TypeScript-Interfaces.
- **Praktische Nutzbarkeit:** 
  - Das UI bleibt exakt gleich (gleiche goldene Cards, gleiche "Daten laden"-Buttons, gleicher Freitext-Editor für Höhepunkte, gleiche Cooldown-Bestätigungen).
  - Keine neuen Abhängigkeiten im Browser-Bundle für den Betreiber.
  - Status-Meldungen und Fehlermeldungen können sogar besser werden (bessere Fehlertypen im GitHub-Client).
  - Der Betreiber muss nach dem Refactor **nichts Neues lernen**.

**Hinweis zur Produktionsreife:**  
Da das Projekt eingestellt ist ("stop"), wurden alle Proxy-Überlegungen (Cloudflare Worker, Commit-Proxy, ADMIN_SECRET / langes 40-Wörter-Passwort) verworfen und der Code entfernt. Der Admin bleibt als reine browserbasierte technische Studie mit direkten GitHub-Commits bestehen. Die `lib/admin/`-Schicht ist für direkte Nutzung optimiert.

---

## 5. Entscheidungsmatrix & Priorisierung (Aufwand vs. Nutzen vs. Wartbarkeit)

| Refactor-Maßnahme                          | Geschätzter Aufwand* | Wartbarkeits-Nutzen | DX / Verständlichkeit | Testbarkeit / Risiko-Reduktion | Betreiber-Nutzen (direkt) | Empfohlene Priorität | Phase |
|--------------------------------------------|----------------------|---------------------|-------------------------|--------------------------------|---------------------------|----------------------|-------|
| Types + Constants + Utils extrahieren      | Niedrig (2-4h)      | Hoch               | Hoch                   | Hoch                          | Keiner (unsichtbar)      | **P0 — Sofort**     | 1     |
| Parsers + Generators in lib/admin          | Mittel (4-8h)       | Sehr hoch          | Hoch                   | Sehr hoch                     | Mittel (weniger Bugs)    | **P0 — Sofort**     | 1     |
| Validators + Safety-Logik                  | Niedrig-Mittel      | Hoch               | Hoch                   | Hoch                          | Hoch (weniger Fehlbedienung) | P0                  | 1     |
| GitHub-Client als eigene Schicht           | Mittel (4-6h)       | Hoch               | Mittel-Hoch            | Hoch                          | Mittel                   | P1                  | 1-2   |
| Admin-spezifische Styles nach admin.css    | Niedrig             | Mittel             | Hoch                   | —                             | Hoch (konsistenter)      | P1                  | 1     |
| Aufteilung in components/admin/*.astro     | Mittel-Hoch (6-10h) | Mittel             | Sehr hoch              | Niedrig                       | Hoch (bessere Wartung einzelner Cards) | P2             | 2     |
| Zentraler Controller in scripts/admin/*.ts | Mittel              | Hoch               | Hoch                   | Mittel                        | Mittel                   | P1                  | 1-2   |
| Vitest-Setup + erste Roundtrip-Tests       | Mittel (inkl. Setup + 3-5 Tests) | Sehr hoch | Hoch                   | Sehr hoch                     | Hoch (Vertrauen)         | **P0**              | 1     |
| "Technische Studie"-Banner + README-Update | Sehr niedrig (1h)   | — (Risiko-Reduktion) | —                     | —                             | Hoch (klare Erwartungen) | **P0**              | 1     |
| Vollständige Entkopplung von State (z.B. kleiner Store) | Mittel-Hoch     | Hoch               | Hoch                   | Hoch                          | Niedrig                    | P2 (nice to have)   | 2     |

*Aufwands-Schätzungen gelten für einen erfahrenen Astro/TS-Entwickler, der den bestehenden Code bereits kennt. Realer Aufwand kann höher sein, wenn gleichzeitig Dokumentation und manuelle Regression-Tests gemacht werden.

**Priorisierungs-Regel:** Alles mit "P0" sollte in einem zusammenhängenden Sprint / einer zusammenhängenden Arbeitseinheit erledigt werden. Danach kann Phase 2 (stärkere UI-Aufteilung) in kleineren Happen erfolgen.

---

## 6. Phasenbasierte Umsetzungs-Roadmap (direkt als Ticket-Grundlage nutzbar)

### Phase 1 — Fundament (Ziel: Der Code ist nicht mehr monolithisch in der Logik, Tests laufen, Positionierung ist ehrlich)
**Dauer-Schätzung:** 12–20 Stunden (kann auf mehrere Sessions verteilt werden).

1. Vorbereitung
   - Branch `refactor/admin-architecture-2026` anlegen.
   - Vitest + jsdom installieren + minimale Config + Test-Skript.
   - `docs/ADMIN-REFACTOR-PLAN.md` (diese Datei) als Referenz im Repo lassen.

2. lib/admin/ anlegen (Types → Utils → Validators → Constants)
3. Parsers & Generators extrahieren + erste Roundtrip-Tests (gegen reale Content-Dateien).
4. GitHub-Client-Klasse skizzieren (zuerst nur als Namespace von Funktionen, später Klasse).
5. Bestehende Inline-Funktionen im `speisekarten.astro` schrittweise durch Imports ersetzen. Nach jeder größeren Extraktion: `npm run build` + manueller Smoke-Test des Admin-Flows (im Browser).
6. Admin-Styles in `src/styles/admin.css` extrahieren und in der Page importieren (Design-System bleibt identisch).
7. "Technische Studie"-Banner + README-Update.
8. Phase-1-Abschluss: `npm test` ist grün, `npm run build` ist clean, Admin verhält sich für den Betreiber exakt gleich.

**Deliverable:** Ein PR, der die Logik sauber trennt, ohne das Erscheinungsbild oder die Bedienung zu ändern.

### Phase 2 — Präsentations-Schicht & DX (optional, aber empfohlen)
- Jede Admin-Card als eigene `.astro`-Komponente.
- Collapsible-Logik in ein kleines wiederverwendbares Modul (aktuell viele fast identische IIFEs).
- Bessere Fehler-Typen und Status-Komponente.
- Event-basierte Kommunikation zwischen Cards und Controller (z. B. "token-changed", "save-requested").

### Phase 3 — (entfallen)
Projekt wurde eingestellt. Alle Proxy- und Cloudflare-Worker-Pläne (inkl. ADMIN_SECRET / langes Passwort) wurden verworfen und aus dem Code entfernt. Es gibt keine weitere Entwicklung in Richtung Produktion.

---

## 7. Risiken, Trade-offs & Offene Fragen

**Risiken**
- Astro `<script type="module">` Import-Verhalten bei vielen kleinen Modulen kann Stacktraces etwas unübersichtlicher machen (akzeptabler Trade-off).
- Wenn der Betreiber sehr häufig Änderungen macht, bleiben die Rate-Limit- und ToS-Risiken bestehen (unabhängig vom Refactor).
- Zeitaufwand für gründliches Testen der Parser gegen alle realen Inhalte.

**Trade-offs**
- Mehr Dateien = mehr mentale Last beim ersten Lesen, aber **deutlich weniger** beim zweiten und dritten Lesen + bei Änderungen.
- Kein "schönes" State-Management (kein Zustand, kein Redux, kein Signals). Ein einfaches Modul mit exported State + CustomEvents reicht vollkommen und bleibt dem aktuellen Vanilla-Stil treu.

**Offene Fragen (müssen vor Phase 2 geklärt werden)**
- Sollen wir `gray-matter` konsequenter nutzen und die Custom-Parser nur für die wirklich speziellen Menu-Strukturen behalten?
- Wollen wir Zod für die Types + Runtime-Validation einführen? (kleine Dependency, große DX-Gewinne bei komplexen Daten).
- Wie stark soll der zentrale Controller State kapseln (einfaches Objekt vs. kleine Klasse mit Events)?

---

## 8. Nächste konkrete Schritte (nach Plan-Freigabe)

1. Plan in `docs/ADMIN-REFACTOR-PLAN.md` reviewen und ggf. anpassen (Prioritäten, Aufwands-Schätzungen).
2. Branch anlegen + Phase-1-Setup (Vitest + Ordnerstruktur).
3. Mit der Extraktion der Parser/Generators + ersten Tests beginnen (höchster Hebel).
4. Nach jedem Teil-Schritt: manueller Test + Build + kurzer Commit.
5. Am Ende von Phase 1: Review des PRs mit Fokus auf "Verhält sich der Admin für den Betreiber exakt gleich?"

Dieser Plan ist bewusst so detailliert geschrieben, dass er direkt in Aufgaben (Issues / Subtasks) zerlegt oder als Grundlage für ein Umsetzungs-Skript / Agenten-Instruktionen dienen kann.

---

**Anhang: Schnell-Referenz — Wichtige Funktionen, die extrahiert werden sollten (Stand Mai/Juni 2026)**

- Parser: `parseMenu`, `parseSimpleFrontmatter`, `parsePortraitsFromYaml`
- Generatoren: alle `generate*`
- GitHub: `commitFile`, `loadMenuLikeFile`, `getFileSha*`, `createGitBlob`, `commitPortraitAtomic`
- Utils/Validation/Safety: `escapeHtml`, `utf8ToBase64`..., die 200 KB / JPG-Logik, `checkCommitCooldown`, `confirmCommit`, Filename-Sanitizer
- State & Controller: `currentData`, `currentBegegnungen*`, die großen `load*Area` / `save*Area` Funktionen (werden zu Orchestrierung im Controller)

---

*Ende des Plans. Craft over templates. Ehrlichkeit über Illusion.*