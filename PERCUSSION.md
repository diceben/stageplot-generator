# Percussion-Editor

Im Bausteinkatalog unter **Instrumente** das **Percussion-Setup** platzieren. Am ausgewählten Setup öffnet **Percussion-Editor öffnen** den Aufbau. Conga, Bongos und Timbales sind außerdem direkt als einzelne Bausteine verfügbar und öffnen denselben Editor.

## Bedienung

- Links ein Instrument hinzufügen, in der Mitte auswählen und verschieben. Ziehen rastet in 5-cm-Schritten ein; Zahlenfelder erlauben genaue Positionen.
- Rechts Bezeichnung, Drehung und Größe anpassen. R / Shift+R drehen um 15°, Pfeiltasten verschieben um 5 cm, Shift+Pfeil um 10 cm. Rechtsklick dreht ebenfalls um 15°. Duplizieren und Entfernen stehen direkt daneben.
- „Vorlagen“ bietet einen kompakten Aufbau, ein großes Latin-Setup und einen leeren Anfang. Ein Vorlagenwechsel ersetzt den Entwurf und lässt sich rückgängig machen.
- Änderungen werden erst mit **Auf Bühne übernehmen** gespeichert. Abbrechen und Escape lassen das Bühnenobjekt unverändert. Undo/Redo ist sowohl im Percussion-Editor als auch nach der Übernahme im Bühneneditor verfügbar.
- Auf kleinen Bildschirmen schalten **Instrumente**, **Aufbau** und **Auswahl** zwischen den drei Bereichen um. Zwei Finger zoomen und verschieben die Ansicht.

Die Größen sind anpassbare Planmaße einschließlich Rand und Beschlägen, keine verbindlichen Herstellermaße. Quinto, Conga und Tumba verwenden dieselbe generierte Draufsicht in unterschiedlichen Größen. Stativfüße und Bewegungsflächen sind nicht Teil der Instrumentabmessungen; dafür im Bühnenplan ausreichend Platz vorsehen.

## Abnahme und Inputliste

Trommeln starten mit einem eigenen Mikrofon, Timbales mit zwei. Kleinpercussion und Becken starten ohne eigenes Signal; ein Mikrofon lässt sich bei Bedarf einschalten. Das Multipad bietet kein Signal, Mono oder Stereo L/R. Ein Percussion-Tisch erzeugt keine Inputs.

Die Auswahl erzeugt Einträge im bestehenden gemeinsamen Audio-Plan. Dort werden Mikrofonmodelle, Kanalnummern und Stagebox-Anschlüsse bearbeitet. Instrument-IDs bleiben beim Verschieben, Drehen, Umbenennen und Skalieren erhalten. Neue und duplizierte Instrumente erhalten neue IDs; ein Vorlagenwechsel übernimmt keine Kanalzuordnungen alter Instrumente.

## Bilder und Herkunft

Zwölf Assets wurden am 9. September 2026 jeweils einzeln mit dem integrierten **OpenAI Imagegen** erzeugt. Die beiden vom Auftraggeber bereitgestellten Konzertfotos dienten als Instrument- und Materialreferenz. Die Laufzeit verwendet generierte Rasterbilder mit transparentem Hintergrund, keine mit CSS oder SVG nachgezeichneten Instrumente. SVG dient nur zur Positionierung und Rotation der Bilder.

Das [Asset-Manifest](stageplot-assets/percussion/manifest.json) enthält für jedes Asset den vollständigen finalen Prompt, den Namen und SHA-256 der ursprünglichen Generierung, die Prüfsumme des ausgelieferten Bildes und die Verarbeitungsschritte. Die Originalgenerierungen bleiben außerhalb des Repositories; die Referenzfotos werden nicht ausgeliefert.

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

Im Browser geprüft: kompakter und großer Aufbau, Bilddarstellung, Ziehen, Zahlenfelder, Speichern und erneutes Laden, gemeinsame Inputliste, Druckvorschau, erfolgreicher PNG-Export und eine 390 Pixel breite Ansicht. Mehrfinger-Handler sind automatisiert geprüft; ein zusätzlicher Test auf physischer Touch-Hardware steht aus.
