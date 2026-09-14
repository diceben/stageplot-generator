# Live-Look: verbindliche Referenz

Die dunkle Bühnenansicht („Live“ in der Werkzeugleiste) verwendet den gemeinsamen SVG-Renderer in `stageplot-studio.html` und die Gestaltungsregeln in `stageplot-look-v1.js`. Sie gilt im Editor, in PNGs, PDF-Vorschau und schreibgeschützten Ansichten. Bestehende helle Projekte bleiben hell; die vorhandene `stage.surface`-Eigenschaft, Undo und lokale Speicherung werden weiterverwendet.

## Gestaltung

- Arbeitsfläche `#1c2226`, Bühne `#282f33`, Modulraster `#485155`.
- Instrumente: lokale Originalgrafiken, im SVG sanft in warme Grautöne und Creme getönt. Instrumentgeometrie und Hitflächen werden nicht verändert.
- Namen: kräftige System-Grotesk; Anschlüsse: kleinere System-Monospace. Die tatsächliche Schrift wird vor der Platzierung vermessen.
- Labels: `#191f23`, feine Kante, Lime `#d4f15b`; Riser: `#b5a0e3`; Publikum: `#ee9285`.
- PDF und Bild verwenden dieselben A4-Querformatseiten mit Kopf- und Fußzeile. Bühne und Instrumente behalten ihre echten Maßverhältnisse. Die KI-Vorlage ist eine Stilreferenz, keine Quelle für Maße oder Signalwege.
- Mobile Ansicht: kompaktere Labels, kein dekorativer Titel unter den Werkzeugen; Details über Zoom bearbeiten.
- Der Bildhintergrund kann weiß oder transparent sein; die dunkle Bühne wird über die Darstellung gewählt. PDF bleibt A4 quer und kann unabhängig vom gespeicherten Projekt hell ausgegeben werden.

## Vergleich reproduzieren

`node scripts/live-design-reference.cjs > /tmp/stageplot-live-reference.json` erzeugt synthetische Referenzdaten ohne Kontaktdaten. Auf einem lokalen Testserver über den normalen Import laden. Die JSON-Ausgabe und Browserentwürfe gehören nicht ins Repository.

Bei weiteren Designänderungen denselben Aufbau mit 8 × 5 m, zwei Risern, zwei Treppen und den vorgegebenen Instrumenten verwenden. Erst die tatsächliche Browseransicht vergleichen, dann die Datei aus dem echten PNG-Export und die A4-Vorschau kontrollieren. Daten oder Maßverhältnisse nicht zur optischen Annäherung verfälschen.

Prüffälle: Desktop (1536 × 1109), Mobil (390 × 844), mehrzeilige Namen, Auswahl, Drehung/Undo, Zoom/Einpassen, Dante-Audiokanäle, lokales Neuladen, helle Ausgabe, weißer/transparenter Hintergrund und PDF-Vorschau. Der Renderer muss bei geänderten Bühnenmaßen und außenliegenden Objekten alles einpassen, während die Kamera bei normalen Objektbewegungen stabil bleibt.

Nach Implementierungsänderungen `npm run build` und `npm test` ausführen. Die automatisch eingebetteten Modulblöcke und `index.html` werden nicht von Hand editiert.
