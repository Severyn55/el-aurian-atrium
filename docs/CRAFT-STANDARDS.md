# Craft Standards – The Sanctum Atrium

**Version:** 0.2 (Mai 2026)  
**Zweck:** Definieren, was bei diesem Projekt als exzellentes Craft gilt.

---

## Gold-Akzent-Logik (verbindlich)

**Gold ist ein Privileg, keine Dekoration.**

Gold (#C5A46E / kk-gold) darf **ausschließlich** in den folgenden vier Rollen verwendet werden. Jede andere Verwendung ist verboten.

### 1. Signature Accent (stärkste Nutzung)
- Wird nur für die wichtigsten interaktiven Highlights und Marken-Signaturen verwendet.
- Beispiele: Der kleine Gold-Punkt + Unterstrich beim Mobile-Menu-Hover, primäre Call-to-Action Highlights.
- Deckkraft: 100%
- Darf nur sehr bewusst und sparsam eingesetzt werden (max. 1–2 pro sichtbarem Bildschirmbereich).

### 2. Architectural Lines
- Sehr feine strukturelle Trennlinien.
- Deckkraft: 25–45%
- Strichstärke: 1px
- Oft mit weichem Verlauf an den Enden (Gradient).
- Beispiele: Obere Akzentlinie im Mobile Menu, feine Trennlinie vor dem CTA.

### 3. Subtle Frames
- Zurückhaltende Rahmen für Karten und Container.
- Deckkraft: 15–25%
- Beispiele: `.gold-frame`, Kartenränder im Interieur-Grid.

### 4. Category / Meta Labels
- Für Sektions- und Kategorielabels (z. B. "KÜCHE & WEIN", "HÖHEPUNKTE").
- Deckkraft: 85–100%
- Darf nur für echte Kategorien verwendet werden, nie für Fließtext.

---

## Verbotene Gold-Nutzungen

- Gold als reiner Dekorationsrand ohne Funktion
- Gold bei zu vielen Elementen gleichzeitig (visuelle Überladung)
- Gold bei sehr kleinen Elementen (unter 4–5 px Strichstärke)
- Gold bei normalen Hover-States von sekundären Links (außer es handelt sich um primäre Aktionen)
- Gold in Body-Text auf Hover (außer bei primären interaktiven Elementen)

---

## Aktuelle Probleme (Audit Mai 2026)

- Zu viele unterschiedliche Deckkraft-Werte für Gold-Ränder (/20, /18, /40, /60, /45, /28…)
- Gold wird bei vielen Labels und Datenpunkten inflationär verwendet (z.B. Zeiten in Events, Preise)
- Hover-Text-Farbe auf Gold ist bei sekundären Links (Footer, etc.) nicht konsistent mit der Gold-Logik
- Die `.goldFrame` Utility wird uneinheitlich eingesetzt

---

## Nächste Schritte (empfohlen)

1. Alle Gold-Ränder auf maximal 3 erlaubte Deckkraft-Werte reduzieren:
   - Signature: 100%
   - Architectural Lines: 35%
   - Subtle Frames: 20%

2. Gold-Text bei Labels auf die 4. Rolle beschränken (Category/Meta).

3. Hover-Text auf Gold nur bei primären Aktionen erlauben.

4. Bestehende Komponenten nach und nach auf die neue Logik migrieren (beginnend mit MobileMenu, Hero, Cards).

---

**Dokument wird kontinuierlich erweitert.**