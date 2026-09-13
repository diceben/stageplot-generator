# Illustrierte Objektbibliothek

40 illustrierte Objektgrafiken, umgesetzt in vier Etappen: 35 zusätzliche Bausteine und fünf aktualisierte Orchesterinstrumente (Violine, Viola, Cello, Harfe und Klarinette). Die fünf bestehenden Einträge behalten ihre Orchesterkonfiguration und Maße.

| Etappe | Objekte |
| --- | --- |
| 1 · Zubehör & Percussion | Notenständer, Musikerstuhl, Tablet-Halter, Stehhocker, Equipment-Tisch, Conga-Paar, Bongos, Djembe, Timbales, Percussion-Tisch |
| 2 · Tasten, DJ & Backline | Flügel, aufrechtes Klavier, Leslie, DJ-Controller, CDJ-Player, Plattenspieler, DJ-Mixer, Sampler, Drumcomputer, Pedalboard, Amp-Topteil, Gitarrenboxen 1×12 / 2×12 / 4×12 |
| 3 · PA & Orchester | PA-Box auf Stativ, Subwoofer, Sidefill, Drumfill, Violine, Viola, Cello, Harfe, Akkordeon, Klarinette, Waldhorn |
| 4 · Produktion & Video | Drumshield, Funkantenne auf Stativ, Kamera auf Stativ, LED-Wand, Leinwand |

Die Bilder wurden einzeln mit der eingebauten Bildgenerierung (`image_gen`) erzeugt. Stilvorgabe: senkrechte orthografische Draufsicht, feine Graphitkonturen, leicht gezeichnete graue Schattierung und transparente Hintergründe passend zum Schlagzeug. Bei Stativen liegt der senkrechte Mast verdeckt unter dem Gerät; bei aufrechten Wänden ist die Oberkante sichtbar. Handinstrumente sind schematische, flach liegende Plansymbole wie die bestehenden Gitarren.

Die verwendeten Grafiken liegen lokal in [`stageplot-assets/objects/`](stageplot-assets/objects/). [`manifest.json`](stageplot-assets/objects/manifest.json) dokumentiert Prompts, Etappen, Planmaße und I/O-Vorgaben. Die WebP-Dateien wurden ausschließlich durch Beschnitt transparenter Ränder, Verkleinerung auf maximal 768 Pixel und Komprimierung aus den generierten Bildern aufbereitet. Das Paket benötigt zur Laufzeit keinen Bilddienst.

## Verhalten

Alle Objekte sind in der vorhandenen Bibliothek suchbar und lassen sich platzieren, drehen, duplizieren, sperren und wieder entfernen. Inventarzuordnung, lokale Entwürfe und portable Projektdateien verwenden die bestehenden Datenwege. Es gibt keinen Import eigener Objektbilder.

Maße sind generische Planmaße beziehungsweise schematische Symbolgrößen und keine zugesicherten Herstellermaße. Abnahmen und Anschlüsse können über die bestehenden I/O-Eigenschaften angepasst werden. Neue akustische Einzelbausteine und Gitarrenboxen starten mit Mikrofonabnahmen; die fünf bestehenden Orchesterinstrumente behalten ihre akustischen Vorgaben ohne automatisch angelegte Audiokanäle. DJ-Geräte und Sampler starten mit Stereo-Ausgängen. Bei PA-Symbolen wird ein Line-Eingang angenommen. Möbel, Videoobjekte und das reine Amp-Topteil erzeugen keine Audiokanäle. Lautsprecher-Leistungsverkabelung wird nicht modelliert.

PNG übernimmt die lokalen Bilder über die bestehende Einbettung in den Export; Druckvorschau und PDF verwenden denselben Symbolrenderer.

Die 40 WebP-Dateien umfassen zusammen rund 3,5 MB. Der PNG-Export bettet ihre komprimierten Originaldaten ein, damit auch umfangreiche Pläne innerhalb des SVG-Größenlimits bleiben.

## Pflege und Prüfung

Die Laufzeitquellen bleiben der Katalog in `stageplot-studio.html` und die Renderer `stageplot-symbols-v3.js` sowie `stageplot-orchestra-v1.js`. Bei neuen Einträgen beide Quellen und das Manifest zusammen pflegen. Eingebettete Modulblöcke nicht von Hand ändern; danach `npm run build` und `npm test` ausführen. Bei späterem Austausch einer veröffentlichten Grafik einen neuen versionierten Dateinamen verwenden, damit Browser keine veraltete Datei aus dem Cache zeigen.

`stageplot-illustrated-objects.test.cjs` prüft lokale Assets, eindeutige Typen, Planmaße, I/O und Stereo, die Abgrenzung zum Drum-Designer sowie Projekt-Roundtrips mit bestehenden Instrumenten und bearbeiteten Abnahmen. Die visuelle Perspektive wird zusätzlich an den generierten Bildern und in der tatsächlichen App geprüft.

Browserprüfung am 14.09.2026 mit einem synthetischen Plan: alle 40 Bilder geladen und nach Neuladen wiederhergestellt; Suche nach „ipad“, Platzieren, Drehen, Duplizieren und Undo; echter PNG-Download, einseitige PDF-Ausgabe mit Vorschau sowie Mobilansicht bei 390 × 844 Pixeln. Keine fehlenden Assets oder JavaScript-Fehler. `npm test`: 40 Testgruppen erfolgreich. Zusätzlich wurden die zehn vorhandenen Browser-Prüfabläufe jeweils mit Chromium und WebKit gegen die aktuelle App erfolgreich ausgeführt.
