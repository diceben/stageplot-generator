# Maße und Maßstab

Stand: 10. September 2026, v0.1.0-beta.7.

Die Bühne und alle Gegenstände verwenden Meter. Die dargestellte Gerätekontur wird auf die hinterlegte Breite und Länge/Tiefe abgebildet. Leere Außenabstände einer SVG-Zeichnung zählen nicht mehr zur Gerätefläche. Beide Achsen sind kalibriert; beispielsweise bleibt ein 2 × 1,6 m großer Teppich rechteckig. Editor, Platzierungsvorschau, Projektkarte und Druck verwenden dieselbe Transformation. PDF und Bildexport entstehen weiterhin aus derselben Druckansicht.

## Geräte, Instrumente und Stellflächen

- Gerätemaße beschreiben die abgebildete Ansicht. Laptop, Pult oder Stagebox: Breite und Tiefe des Gehäuses; Stecker und freie Kabelbögen zusätzlich berücksichtigen.
- Streicher und einige Blasinstrumente sind zur Erkennbarkeit auf die Saiten bzw. entlang des Instruments dargestellt. Eine Violine ist etwa 59 cm lang; das ist länger als die Breite eines 16-Zoll-Laptops. Diese Ansicht ist keine Projektion der Spielhaltung und enthält keinen Platz für Musiker oder Bogenbewegung. Siehe [Orchester-Maße](ORCHESTER.md).
- Drumset, Percussion und Orchester bestehen aus metrisch platzierten Einzelteilen. Ihr Abstand, ihre Modellmaße und die bestehende Kalibrierung der Rasterbilder bleiben erhalten. Die gesamte Gruppe wird nicht auf die sichtbaren Pixel zusammengezogen.
- Riser, FOH, Treppen und Bühnenmodule beschreiben Flächen bzw. Aufbaugrößen. Stellfläche ist etwas anderes als die Größe eines Instruments.
- Generische Gegenstände wie Gitarren, Stative, Stühle, Verstärker, Lichtgeräte, Cases und IEM-Hörer besitzen anpassbare Referenzmaße. Modellbezeichnungen allein garantieren keine identischen Maße für jede Baureihe oder Ausstattung. Diese Werte wurden auf Plausibilität und konsistente Darstellung geprüft, nicht als universelle Herstellermaße bestätigt.
- Bibliothekskarten zeigen Geräte zur Auswahl vergrößert. Auf der Bühne gibt es keine künstliche Mindestgröße. Für kleine Geräte bleibt nur der unsichtbare Klickbereich größer (auf Touch 44 Bildpunkte).

## Eigene Maße

Objekt auswählen → **Eigenschaften → Maße im Plan**. Breite und Länge/Tiefe in Zentimetern eingeben. Änderungen erscheinen sofort und bleiben beim Speichern, Laden und Projekt-Export erhalten. **Standardmaße verwenden** setzt das Gerät zurück. Beides lässt sich rückgängig machen; gesperrte Objekte schützen auch ihre Maße. Ein Modellwechsel lädt die Maße des neuen Modells.

Drum-, Percussion- und Orchesterteile behalten ihre Maßfelder im jeweiligen Editor. Riser, FOH und Treppen behalten ihre bestehenden Flächenregler. Freier Text hat keine physische Gerätegröße.

## Geprüfte Referenzen

Die Quellen wurden am 10. September 2026 abgeglichen. Angaben hier sind Breite × Länge/Tiefe; die Höhe eines Geräts wird nicht als Bodentiefe verwendet.

| Gegenstand | Planmaß | Grundlage |
| --- | --- | --- |
| Playback-Laptop | 35,57 × 24,81 cm | [Apple MacBook Pro 16″ (2024)](https://support.apple.com/en-gb/121554), Referenz für den allgemeinen Laptop-Baustein. Ein Rack oder Tisch ist ein eigener Gegenstand. |
| Violine | 20,7 × 59 cm | 4/4-Referenz; [Metropolitan Museum, Gould-Violine](https://www.metmuseum.org/art/collection/search/503045) belegt 59 cm Gesamtlänge. Breite und individuelle Bauform bleiben anpassbar. |
| Shure SM57 | 15,7 × 3,2 cm | [Shure-Katalog](https://content-files.shure.com/Pubs2/files/260011.pdf). Die bisherige doppelte Symbolgröße entfällt. |
| Sennheiser EW-D SKM-S mit MMD 835 | 26,8 × 5 cm | [Sennheiser-Datenblatt](https://docs.cloud.sennheiser.com/en-us/ew-d/ew-d/specifications-ew-d-skm-s.html). Die bisherige doppelte Symbolgröße entfällt. |
| DI-Box | 12,7 × 8,4 cm | [Radial J48](https://www.radialeng.com/product/j48/specifications) als Referenz für den allgemeinen Baustein. |
| A&H AR84 / Stagebox 8 | 48,3 × 22 cm | [Allen & Heath, GLD User Guide, Maßzeichnung](https://www.allen-heath.com/content/uploads/2023/06/GLD-Chrome-User-Guide-AP9989_2.pdf), einschließlich Rackohren. |
| A&H DX168 / Stagebox 16 | 41 × 19 cm | [Allen & Heath, technische Daten](https://www.allen-heath.com/content/uploads/2023/06/DX168-Datasheet.pdf), Tabelle der Gerätemaße. |
| 2 × DX168 / Stagebox 32 | 82 × 19 cm | Zwei Geräte nebeneinander, ohne zusätzlichen Abstand; abgeleitet aus dem DX168-Maß. |
| A&H GX4816 / Stagebox 48 | 48,16 × 25,5 cm | [Allen & Heath, technische Daten](https://www.allen-heath.com/content/uploads/2023/06/GX4816-Datasheet.pdf), einschließlich Rackohren. |
| Nord Wave 2 | 99 × 29,5 cm | [Nord](https://www.nordkeyboards.com/products/nord-wave-2/specifications/), vorhandenes Maß bestätigt. |
| Nord Stage 4 88 | 128,2 × 34,9 cm | [Nord](https://www.nordkeyboards.com/products/nord-stage-4/specifications/), vorhandenes Maß bestätigt. |
| Nord Electro 6D 73 | 106,6 × 29,6 cm | [Nord](https://www.nordkeyboards.com/products/nord-electro-6/specifications/), vorhandenes Maß bestätigt. |
| Hammond XK-5 | 118,9 × 40,1 cm | [Hammond](https://hammondorganco.com/xk5-specs), gerundete Umrechnung von 46,8 × 15,8 Zoll. |
| Novation Bass Station II | 45,7 × 27,3 cm | [Novation](https://us.novationmusic.com/products/bass-station-ii), vorhandenes Maß bestätigt. |
| Moog Subsequent 37 | 68 × 37,5 cm | [Moog-Handbuch, metrische Angabe](https://api.moogmusic.com/sites/default/files/2017-09/Subsequent_37_Manual_0.pdf), vorhandenes Maß bestätigt. |
| Korg KRONOS 3 (61 / 73 / 88) | 106,4 × 36,3 / 124,5 × 37 / 145,7 × 37 cm | [Korg](https://www.korg.com/de/products/synthesizers/kronos3/specifications.php), vorhandene Maße bestätigt. |
| Korg SV-1 (73 / 88) | 114,3 × 34,7 / 135,6 × 34,7 cm | [Korg](https://www.korg.com/jp/products/synthesizers/sv_1_black/page_3.php), ohne Notenhalter. |

## Umsetzung und Prüfung

`objectArtGeometry()` ist die gemeinsame Abbildung vom SVG-Zeichenraum zum metrischen Plan. Statische Bilder verwenden ihre einmalig gemessenen Konturen; metrische Drum-, Percussion- und Orchestergruppen behalten ihren eigenen Koordinatenraum. Drehungen erfolgen weiterhin um den Objektmittelpunkt. Bestehende Positionen und Signalzuordnungen werden durch die Kalibrierung nicht verändert. Alte Entwürfe ohne eigene Maße erhalten die korrigierten Standardmaße; neue optionale `dimensions: {w, d}` werden validiert und beim Dokument-Roundtrip erhalten.

`stageplot-object-scale.test.cjs` prüft den gesamten statischen Katalog, beide Achsen, asymmetrische Bildränder, kleine Zoomstufen, erhaltene Gruppenkoordinaten, ungültige Maße und alte/neue Dokumente. Die bestehende `stageplot-scale.test.cjs` prüft weiterhin die sichtbaren Fell- und Beckendurchmesser sowie das gemeinsame SPD-SX-Maß.

Browserprüfung: 71 statische Katalogzeichnungen in Bühne und Druckansicht gegen ihre Meterwerte vermessen. Violine, Laptop, Mics, DI, Rack, Bass, Keyboard, Teppich, Treppe und Rampe zusätzlich in Chrome und WebKit geprüft. Eigene Maße, Standardwerte, Undo, ungültige Eingaben, lokales Neuladen und Projekt-Download auf Desktop und 390-px-Touch-Ansicht geprüft. Dies bestätigt den Darstellungsmaßstab; es ersetzt keine Messung eines individuellen, nicht spezifizierten Geräts.
