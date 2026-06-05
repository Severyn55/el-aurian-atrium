# Video Compression Guide – Kleines Kameel

**Ziel:** Die beiden Hauptvideos (Lunch + Dinner Karten) von aktuell 4,22 MB und 2,80 MB auf ca. 1,3 – 1,7 MB pro Video reduzieren, ohne spürbaren Qualitätsverlust für die Nutzung als dezente Hintergrundschleife.

---

## 1. Allgemeine Empfehlungen (2026)

### Technische Ziele pro Video (Karten-Hintergrund)

- **Maximale Dateigröße:** 1,3 – 1,7 MB (idealerweise unter 1,6 MB)
- **Maximale Auflösung:** 1280×720 (besser 960×540 oder 1080×608 für Mobile-first)
- **Bitrate:** 1.2 – 1.8 Mbps (für 720p/24fps)
- **Framerate:** 24 fps (25 fps ist auch ok)
- **Codec-Strategie (empfohlen):**
  - **Primär:** WebM (VP9 oder AV1)
  - **Fallback:** MP4 (H.264)
- **Länge:** 6–10 Sekunden reicht völlig aus (gute Schleife)
- **Audio:** Entfernen (die Videos sind stumm)

### Warum das realistisch ist

Ein dezentes, leicht unscharfes Hintergrundvideo in einem Restaurant-Design muss nicht in 4K oder hoher Bitrate vorliegen. Die aktuelle Qualität ist deutlich übertrieben für den Verwendungszweck.

---

## 2. Empfohlene Tools

| Tool                  | Empfehlung für          | Vorteil                          | Nachteil                     |
|-----------------------|-------------------------|----------------------------------|------------------------------|
| **Shutter Encoder**   | Beste Wahl              | Sehr gute WebM + MP4 Unterstützung, einfach zu bedienen | -                            |
| **HandBrake**         | Gute MP4-Komprimierung  | Sehr ausgereift                  | WebM nur begrenzt            |
| **FFmpeg**            | Power-User / Batch      | Maximale Kontrolle               | Kommandozeile                |

**Empfehlung:** Nimm **Shutter Encoder** – damit kannst du beide Formate (WebM + MP4) in einem Durchgang erzeugen.

---

## 3. Konkrete Einstellungen (Shutter Encoder)

### Für beide Videos empfohlene Preset-Werte:

**Allgemein:**
- Function: `VP9` (für WebM) + danach nochmal für `H.264` (MP4)
- Container: `WebM` bzw. `MP4`

**Video-Einstellungen (VP9 / WebM):**
- Preset: `good` oder `best` (je nach Zeit)
- Quality / CRF: **28 – 32** (32 ist aggressiver/kleiner)
- Resolution: 
  - Max Width: `1280` (oder sogar `960`)
  - Max Height: `720` (oder `540`)
- Framerate: `24` oder `23.976`
- Bitrate (optional): `1200k` – `1600k` (CRF ist meist besser)
- Remove audio: **Ja**

**Für H.264 Fallback (MP4):**
- Codec: `H.264`
- Preset: `fast` oder `medium`
- CRF / Quality: `23 – 26`
- Profile: `High`
- Level: `4.1` oder `4.2`

**Zusätzliche Tipps:**
- "Two-Pass" aktivieren (bessere Qualität bei gleicher Dateigröße)
- "Deinterlace" nur aktivieren, wenn das Original interlaced ist (bei deinen Clips wahrscheinlich nicht nötig)
- Crop & Scale erst nach dem ersten Test anpassen

---

## 4. Empfohlene Reihenfolge (praktisch)

1. **Zuerst nur die beiden Hauptvideos** neu encodieren (food-crudo-motion-01.mp4 und food-motion-02.mp4).
2. Als **WebM + MP4** Paar speichern.
3. Die neuen Dateien in einen neuen Ordner legen, z.B.:
   ```
   public/assets/videos/
   ```
4. Nach dem ersten Test in Speisekarten.astro die Quellen anpassen (siehe Code-Plan).
5. Danach die Modal-Videos ebenfalls optimieren (können etwas kleiner sein, da sie nur bei geöffnetem Modal sichtbar sind).

---

## 5. Realistische Erwartungen

| Aktuell          | Nach guter Komprimierung | Einsparung     |
|------------------|---------------------------|----------------|
| 4,22 MB          | 1,4 – 1,7 MB              | ~60–65%        |
| 2,80 MB          | 1,1 – 1,5 MB              | ~50–60%        |

Bei zwei Videos → realistisch **3,0 – 3,5 MB** statt aktuell ~7 MB für die Karten-Videos.

Zusammen mit den Modal-Videos und besserer Lade-Logik kommst du insgesamt leicht unter 4–4,5 MB Video-Payload.

---

## 6. Nächste praktische Schritte

1. Lade dir **Shutter Encoder** herunter (kostenlos).
2. Nimm zuerst `food-motion-02.mp4` (das schwerere) und teste die oben genannten Einstellungen.
3. Vergleiche die Qualität im Browser (nicht nur lokal im Player!).
4. Wenn du zufrieden bist → die zweite Datei gleich mit denselben Einstellungen.
5. Danach melde dich, damit wir die Code-Seite anpassen (WebM-Support + besseres Laden).

---

**Möchtest du, dass ich dir zusätzlich noch ein kleines FFmpeg-Befehlsbeispiel gebe**, falls du lieber per Kommandozeile arbeiten möchtest? Oder reicht dir der Shutter Encoder Guide erstmal?