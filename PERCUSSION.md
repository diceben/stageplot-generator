# Percussion-Editor

Im Bausteinkatalog unter **Instrumente** das **Percussion-Set** direkt neben **Schlagzeug** platzieren. Am ausgewählten Setup öffnet **Percussion-Editor öffnen** den Aufbau. Conga, Bongos und Timbales sind außerdem direkt als einzelne Bausteine verfügbar und öffnen denselben Editor.

## Bedienung

- Links ein Instrument hinzufügen, in der Mitte auswählen und verschieben. Ziehen rastet in 5-cm-Schritten ein; Zahlenfelder erlauben genaue Positionen.
- Beim Überfahren oder Auswählen erscheint direkt am Objekt eine schwebende Drehleiste mit denselben Pfeil- und Reset-Symbolen wie im Drumdesigner. Links/rechts gedrückt halten dreht stufenlos mit derselben Beschleunigung; 0° setzt die Drehung zurück. Das funktioniert für alle 14 Varianten, einschließlich Becken, Multipad und Tisch. Die Leiste bleibt bei Zoom und auf dem Handy innerhalb der Zeichenfläche; Touch-Buttons sind mindestens 44 px groß. Dieselben Buttons stehen auch rechts bei den Eigenschaften.
- Rechts Bezeichnung, Drehung sowie **Breite und Tiefe in Zentimetern** anpassen. Die Außenmaße lassen sich unabhängig mit 0,1-mm-Auflösung eingeben; der unspezifische Größenregler entfällt. Enter/Leertaste auf einem Drehpfeil dreht um 10°. R / Shift+R drehen weiterhin um 15°, Pfeiltasten verschieben um 5 cm, Shift+Pfeil um 10 cm. Rechtsklick dreht ebenfalls um 15°. Duplizieren und Entfernen stehen direkt daneben.
- „Vorlagen“ bietet einen kompakten Aufbau, ein großes Latin-Setup und einen leeren Anfang. Ein Vorlagenwechsel ersetzt den Entwurf und lässt sich rückgängig machen.
- Änderungen werden erst mit **Auf Bühne übernehmen** gespeichert. Abbrechen und Escape lassen das Bühnenobjekt unverändert. Eine gehaltene Drehung erzeugt genau einen Undo-Schritt. Loslassen außerhalb des Buttons stoppt sie ebenfalls; eine abgebrochene Touch-Geste setzt die begonnene Drehung zurück. Undo/Redo ist sowohl im Percussion-Editor als auch nach der Übernahme im Bühneneditor verfügbar.
- Auf kleinen Bildschirmen schalten **Instrumente**, **Aufbau** und **Auswahl** zwischen den drei Bereichen um. Zwei Finger zoomen und verschieben die Ansicht.

Bühne, Instrumente und Export verwenden dieselben Meter. Das Editor-Raster zeigt 10 cm. Die Größen sind Außenmaße einschließlich Rand und Beschlägen. Bei generischen Instrumenten sind es anpassbare Planmaße, keine verbindlichen Herstellermaße. Quinto, Conga und Tumba verwenden dieselbe generierte Draufsicht in unterschiedlichen Größen. Stativfüße und Bewegungsflächen sind nicht Teil der Instrumentabmessungen; dafür im Bühnenplan ausreichend Platz vorsehen.

## Abnahme und Inputliste

Trommeln starten mit einem eigenen Mikrofon, Timbales mit zwei. Kleinpercussion und Becken starten ohne eigenes Signal; ein Mikrofon lässt sich bei Bedarf einschalten. Das Multipad bietet kein Signal, Mono oder Stereo L/R. Ein Percussion-Tisch erzeugt keine Inputs.

Die Auswahl erzeugt Einträge im bestehenden gemeinsamen Audio-Plan. Dort werden Mikrofonmodelle, Kanalnummern und Stagebox-Anschlüsse bearbeitet. Instrument-IDs bleiben beim Verschieben, Drehen, Umbenennen und Skalieren erhalten. Neue und duplizierte Instrumente erhalten neue IDs; ein Vorlagenwechsel übernimmt keine Kanalzuordnungen alter Instrumente.

## Bilder und Herkunft

Zwölf Assets wurden am 9. September 2026 jeweils einzeln mit dem integrierten **OpenAI Imagegen** erzeugt. Die beiden vom Auftraggeber bereitgestellten Konzertfotos dienten als Instrument- und Materialreferenz. Die Laufzeit verwendet generierte Rasterbilder mit transparentem Hintergrund, keine mit CSS oder SVG nachgezeichneten Instrumente. SVG positioniert, dreht und skaliert die Bilder auf die angegebenen Außenmaße. Ein lokaler Graustufenfilter zeigt sie im Katalog, Editor, Bühnenplan, in Projektkarten sowie in PNG und Druck monochrom; die generierten Originaldateien bleiben unverändert. Auch die Percussion-Bedienelemente verwenden neutrale Grautöne.

Das [Asset-Manifest](stageplot-assets/percussion/manifest.json) enthält für jedes Asset den vollständigen finalen Prompt, den Namen und SHA-256 der ursprünglichen Generierung, die Prüfsumme des ausgelieferten Bildes und die Verarbeitungsschritte. Die Originalgenerierungen bleiben außerhalb des Repositories; die Referenzfotos werden nicht ausgeliefert.

Transparente Verpackungsränder werden bei der Darstellung aus dem Maßbezug herausgerechnet. Die Conga-Varianten sind am Fell in der Draufsicht kalibriert (570 px = 11″ / 11¾″ / 12½″); das 16″-Becken misst 40,64 cm. Das Multipad startet mit 36,4 × 33,1 cm nach Roland SPD-SX. Eigene Außenmaße bleiben in lokalen Entwürfen, Projektdateien und beim Rückgängigmachen erhalten. Bisher gespeicherte proportionale Skalierungen werden weiterhin gelesen.

Für die Auslieferung wurden ausschließlich transparente Außenränder beschnitten, auf maximal 700 Pixel verkleinert und WebP-Dateien mit Alpha erzeugt. Alle zwölf Dateien zusammen benötigen etwa 1,3 MB. Quinto/Conga/Tumba teilen ein Asset, sodass 14 auswählbare Varianten entstehen.

Die Darstellung ist generisch und ohne Markenlogos. Größenorientierung: [LP Conga 11¾″](https://www.lpmusic.com/products/lp806t-pm-pedrito-11-3-4-conga/), [LP Tumba 12½″](https://www.lpmusic.com/products/lp552x-classic-12-1-2-tumba/) und [Roland SPD-SX mit 364 × 331 mm](https://www.roland.com/CA/products/spd-sx/). Diese Produkte sind keine zugesicherten exakten Nachbildungen der Bildassets.

## Speicherung und Export

- `stageplot-percussion-v1.js`: Katalog, normalisierte Konfiguration, Geometrie und stabile Signal-IDs.
- `stageplot-percussion-editor-v1.js` / `.css`: isolierter modaler Entwurf und responsive Bedienung.
- Konfigurationen liegen am Bühnenobjekt unter `percussion`; lokale Entwürfe und portable Projektdateien enthalten dieselben Daten. Bestehende Projekte brauchen keine Migration.
- Die Module werden durch `npm run build` eingebettet. Bilder bleiben lokal unter `stageplot-assets/percussion/`; zur Darstellung ist kein Bilddienst nötig.
- Projektvorschauen verwenden unveränderliche Zeichnungen je Konfiguration, damit verschiedene Projekte mit gleichen Objekt-IDs einander nicht überschreiben.
- Bildexporte betten komprimierte WebP-Daten ein und verwenden mehrfach vorkommende Assets nur einmal. Die bisherige SVG-Größenbegrenzung bleibt erhalten.

## Validierung

`npm test` prüft unter anderem normalisierte Imports, portable Projektdateien, gedrehte Abmessungen, stabile Kanal-IDs, Mono/Stereo, Asset-Prüfsummen, voneinander unabhängige Vorschaubilder sowie die echten Editor-Handler für Hinzufügen, Drehen, Duplizieren, Vorlagen, Eingaben, Undo, Speichern, Abbrechen und Pointer-Gesten.

Die Drehleiste wurde zusätzlich in Chrome und WebKit geprüft: alle 14 Objekttypen, Hover und Auswahl, Tastatur und Reset, Halten mit Loslassen außerhalb, genau ein Undo-Schritt, Speichern und Abbrechen, mobile Touch-Tipps sowie Toolbar-Grenzen. In Chrome zusätzlich eine emulierte gehaltene Touch-Drehung.

Im Browser geprüft: kompakter und großer Aufbau, Bilddarstellung, Ziehen, Zahlenfelder, Speichern und erneutes Laden, gemeinsame Inputliste, Druckvorschau, erfolgreicher PNG-Export und eine 390 Pixel breite Ansicht. Mehrfinger-Handler sind automatisiert geprüft; ein zusätzlicher Test auf physischer Touch-Hardware steht aus.

## Maßstabsabgleich mit dem Schlagzeug

Das Drummodell verwendet 50 Zeichnungseinheiten pro Meter, der Percussion-Editor 100. Die sichtbaren Felle und Beckenscheiben werden an ihren Bildkoordinaten auf die gewählte Zollgröße kalibriert (1 Zoll = 25,4 mm), ohne transparente Außenränder als Instrumentfläche zu zählen. Insbesondere das bisher zu große Ride und Multipad sind korrigiert. Die Kick-Tiefe folgt unabhängig vom Durchmesser dem eingegebenen Tiefenmaß. Ein 16″-Becken ist in beiden Editoren 40,64 cm groß.

Die Zeichnungen bleiben generische Draufsichten. Hardware, Stativfüße, Gehäuse und Bewegungsflächen unterscheiden sich je nach Modell; Zollangaben bezeichnen Fell bzw. Becken, nicht die komplette Stellfläche. Für einen exakten Aufbau des eigenen Percussion-Equipments die gemessenen Außenmaße eintragen.

`stageplot-scale.test.cjs` misst den sichtbaren Durchmesser aus dem erzeugten SVG, prüft verschiedene Zollgrößen, Kick-Tiefen, gleiche Multipad-Maße, Riser und unvergrößerte kleine Vorschauobjekte. Browserprüfung: tatsächlicher 40,64-cm-Durchmesser im Percussion-Editor, Bühnenplan und Druck; Zentimetereingaben nach Neuladen, 390-px-Ansicht und erfolgreicher PNG-Export.
