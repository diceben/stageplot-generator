# Maße und Maßstab

Stand: 10. September 2026, v0.1.0-beta.7.

Die Bühne und alle Gegenstände verwenden Meter. Flexible Flächen behalten ihre getrennt einstellbare Breite und Tiefe. Gerenderte Technikobjekte verwenden dagegen einen metrischen Referenzrahmen und werden gleichmäßig skaliert: runde Flächen bleiben rund, Mikrofonkörper werden nicht zu dünnen Stäben gestaucht. Generierte Bildkonturen können vom Referenzrahmen abweichen; freie Ränder gleichen das aus, ohne die Bilder zu verzerren. Editor, Projektkarte und Druck verwenden dieselbe Transformation. PDF und Bildexport entstehen aus derselben Druckansicht.

## Geräte, Instrumente und Stellflächen

- Gerätemaße beschreiben die abgebildete Ansicht. Laptop, Pult oder Stagebox: Breite und Tiefe des Gehäuses; Stecker und freie Kabelbögen zusätzlich berücksichtigen.
- Streicher und einige Blasinstrumente sind zur Erkennbarkeit auf die Saiten bzw. entlang des Instruments dargestellt. Eine Violine ist etwa 59 cm lang; das ist länger als die Breite eines 16-Zoll-Laptops. Diese Ansicht ist keine Projektion der Spielhaltung und enthält keinen Platz für Musiker oder Bogenbewegung. Siehe [Orchester-Maße](ORCHESTER.md).
- Drumset, Percussion und Orchester bestehen aus metrisch platzierten Einzelteilen. Ihr Abstand, ihre Modellmaße und die bestehende Kalibrierung der Rasterbilder bleiben erhalten. Die gesamte Gruppe wird nicht auf die sichtbaren Pixel zusammengezogen.
- Riser, FOH, Treppen und Bühnenmodule beschreiben Flächen bzw. Aufbaugrößen. Stellfläche ist etwas anderes als die Größe eines Instruments.
- Generische Gegenstände wie Gitarren, Stative, Stühle, Verstärker, Lichtgeräte, Cases und IEM-Hörer besitzen anpassbare Referenzmaße. Modellbezeichnungen allein garantieren keine identischen Maße für jede Baureihe oder Ausstattung. Diese Werte wurden auf Plausibilität und konsistente Darstellung geprüft, nicht als universelle Herstellermaße bestätigt.
- Bibliothekskarten zeigen Geräte zur Auswahl vergrößert. Auf der Bühne gibt es keine künstliche Mindestgröße. Für kleine Geräte bleibt nur der unsichtbare Klickbereich größer (auf Touch 44 Bildpunkte).

## Eigene Maße

Objekt auswählen → **Eigenschaften → Maße im Plan**. Breite und Länge/Tiefe in Zentimetern eingeben. Bei gerenderten Technikobjekten ist das Seitenverhältnis gekoppelt. Ein bereits gespeicherter abweichender Maßrahmen bleibt beim Laden erhalten; das Bild wird proportional darin eingepasst. Änderungen erscheinen sofort und bleiben beim Speichern, Laden und Projekt-Export erhalten. **Standardmaße verwenden** setzt das Gerät zurück. Beides lässt sich rückgängig machen; gesperrte Objekte schützen auch ihre Maße. Ein Modellwechsel lädt die Maße des neuen Modells.

Drum-, Percussion- und Orchesterteile behalten ihre Maßfelder im jeweiligen Editor. Riser, FOH und Treppen behalten ihre bestehenden Flächenregler. Freier Text hat keine physische Gerätegröße.

## Geprüfte Referenzen

Die Quellen wurden am 10. September 2026 abgeglichen. Angaben hier sind Breite × Länge/Tiefe; die Höhe eines Geräts wird nicht als Bodentiefe verwendet.

| Gegenstand | Planmaß | Grundlage |
| --- | --- | --- |
| Playback-Laptop | 35,57 × 24,81 cm | [Apple MacBook Pro 16″ (2024)](https://support.apple.com/en-gb/121554), Referenz für den allgemeinen Laptop-Baustein. Ein Rack oder Tisch ist ein eigener Gegenstand. |
| Violine | 20,7 × 59 cm | 4/4-Referenz; [Metropolitan Museum, Gould-Violine](https://www.metmuseum.org/art/collection/search/503045) belegt 59 cm Gesamtlänge. Breite und individuelle Bauform bleiben anpassbar. |
| Shure SM57 | 15,7 × 3,2 cm | [Shure-Katalog](https://content-files.shure.com/Pubs2/files/260011.pdf). Der Mikrofonkörper ist als neues Rasterbild dargestellt. |
| Sennheiser EW-D SKM-S mit MMD 835 | 26,8 × 5 cm | [Sennheiser-Datenblatt](https://docs.cloud.sennheiser.com/en-us/ew-d/ew-d/specifications-ew-d-skm-s.html). Der Mikrofonkörper ist als neues Rasterbild dargestellt. |
| Kompakter Schlagzeughocker | Sitz Ø 30 cm; Fußkreis Ø 43 cm | [K&M 14010 Piccolino](https://www.k-m.de/en/kmPdf/datasheet?ordernumber=14010-000-02). Sitz und Gestell sind getrennt kalibriert; gilt auch im Drum-Designer. Kein pauschales Maß für alle Hockermodelle. |
| Monitor-Wedge CM14 | 55,9 × 54,6 cm | [Cohesion CM14](https://www.cohesionaudio.com/products/cm14): Breite 558,8 mm, Tiefe 546,1 mm. Die Höhe von 349,3 mm wird nicht als Bodentiefe verwendet. |
| 3er-Gitarrenständer leer | 62,6 × 33,5 cm Referenzrahmen | [K&M Guardian 3](https://www.k-m.de/en/kmPdf/datasheet?ordernumber=17513-016-00) als Größenreferenz. Bild ist eine generische Rack-Illustration. Befüllt 62,6 × 39 cm als anpassbarer Orientierungswert für die überstehenden Instrumente. |
| Gitarrenbaum | Fußkreis Ø 86 cm | [Hercules AGS Plus](https://www.herculesstands.com/files/file_pool/1/0k312527759205717334/agsplus_reader.pdf): GS432B Plus mit 43 cm Basisradius. Der Fußkreis beschreibt die Stellfläche; die Dreibeinkontur ist keine ausgefüllte 86-cm-Scheibe. |
| Kompakte 4er-Stromleiste | 30 × 6 cm | Generisches Orientierungsmaß ohne Anschlusskabel; kein bestimmtes Herstellermodell. Runde Schuko-Buchsen werden proportional dargestellt. |
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

`objectArtGeometry()` ist die gemeinsame Abbildung vom SVG-Zeichenraum zum metrischen Plan. Gerenderte Technik verwendet Millimeterrahmen und einen gemeinsamen Skalierungsfaktor für beide Achsen. Flexible Vektorobjekte verwenden ihre einmalig gemessenen Konturen; metrische Drum-, Percussion- und Orchestergruppen behalten ihren eigenen Koordinatenraum. Drehungen erfolgen weiterhin um den Objektmittelpunkt. Bestehende Positionen und Signalzuordnungen werden durch die Kalibrierung nicht verändert. Alte Entwürfe ohne eigene Maße erhalten die korrigierten Standardmaße; neue optionale `dimensions: {w, d}` werden validiert und beim Dokument-Roundtrip erhalten.

`stageplot-object-scale.test.cjs` prüft den gesamten statischen Katalog, beide Achsen, asymmetrische Bildränder, kleine Zoomstufen, erhaltene Gruppenkoordinaten, ungültige Maße und alte/neue Dokumente. Die bestehende `stageplot-scale.test.cjs` prüft weiterhin die sichtbaren Fell- und Beckendurchmesser sowie das gemeinsame SPD-SX-Maß.

Browserprüfung: 71 statische Katalogzeichnungen in Bühne und Druckansicht gegen ihre Meterwerte vermessen. Violine, Laptop, Mics, DI, Rack, Bass, Keyboard, Teppich, Treppe und Rampe zusätzlich in Chrome und WebKit geprüft. Eigene Maße, Standardwerte, Undo, ungültige Eingaben, lokales Neuladen und Projekt-Download auf Desktop und 390-px-Touch-Ansicht geprüft. Dies bestätigt den Darstellungsmaßstab; es ersetzt keine Messung eines individuellen, nicht spezifizierten Geräts.

## Korrektur der Technik-Assets (10. September 2026)

Die bisherige Prüfung allein gegen die äußere Objektbox erkannte gestreckte Bildinhalte nicht. Die neue Prüfung kontrolliert zusätzlich gleiche Skalierungsfaktoren für beide Achsen, proportionale Bilddarstellung, gekoppelte Maße und den 30-cm-Hockersitz innerhalb des Bildaufbaus. 3er-Ständer und Gitarrenbaum verwenden auch befüllt gerenderte Projektionen aufrecht gelagerter Gitarren. Die Mikrofonkörper orientieren sich am [SM57-Datenblatt (23-mm-Griff)](https://content-files.shure.com/Pubs2/files/260001.pdf) und am [EW-D-Datenblatt (40-mm-Handsender)](https://www.sennheiser.com/globalassets/digizuite/49039-en-ew-d_skm-s_product_specification_v1.4_en.pdf). Die Originalfotos in der Mikrofonwahl werden nicht ersetzt.

Aktuelle Browserprüfung: Chrome und WebKit mit allen 29 Technik-Assets, gleichen Skalierungsfaktoren, metrischen Rahmen einschließlich FOH, gekoppelter Größenänderung mit lokalem Neuladen, Drehen, Mobilansicht (390 px), Dunkelmodus, 4K-PNG und Offline-Bildexport. Die zehn korrigierten Gegenstände wurden zusätzlich auf demselben 10-cm-Raster visuell verglichen.
