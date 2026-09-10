# Technik in Draufsicht

29 lokale, mit dem eingebauten OpenAI-Bildgenerator erzeugte Raster-Assets. Realistische Materialien, zurückhaltende Konturen, monochrom. `manifest.json` dokumentiert Quelldatei-Hashes, Alpha-Zuschnitt, Bildgrößen, Millimeterrahmen und die Kalibrierung einzelner Bauteile; `prompts.json` enthält die endgültigen Prompts. Die App verwendet ausschließlich die lokalen WebP-Dateien.

## Maßstab ohne Verzerrung

Die Bilder werden an ihrer Alpha-Kontur zugeschnitten, proportional auf maximal 768 Pixel reduziert und in Graustufen als WebP gespeichert. Ein Millimeterrahmen beschreibt das Referenzmaß. `preserveAspectRatio="xMidYMid meet"` und eine gemeinsame gleichmäßige Transformation verhindern ein getrenntes Strecken der Bildachsen. Abweichungen zwischen der gezeichneten Kontur und dem Referenzrahmen werden durch freien Rand aufgefangen. Die generierten Abbildungen sind Illustrationen, keine technischen CAD-Zeichnungen; genaue Abmessungen eines anderen Gerätemodells können abweichen.

Bei Dreibeinen bleiben der Mittelpunkt und der Fußkreis erhalten. Der kompakte Schlagzeughocker setzt sich aus zwei gerenderten Assets zusammen: Untergestell mit 43 cm Fußkreis und Sitzfläche mit 30 cm Durchmesser. Dieselben Bauteile werden im Drum-Designer verwendet. Das Mikrofonstativ besteht aus gerenderter Basis und Galgen, der am gemeinsamen Gelenk nach links, rechts oder oben gedreht wird; der Rundfuß bleibt eine eigene 25-cm-Variante.

Breite und Tiefe sind beim Bearbeiten dieser Technikobjekte gekoppelt. Gespeicherte eigene Maßrahmen bleiben beim Laden erhalten; die Bilder darin werden proportional eingepasst. Entwürfe ohne eigene Maße verwenden die korrigierten Referenzen. Positionen, IDs und Routing werden nicht migriert oder geändert.

Bibliothek, Bühne, Eigenschaften, Projektvorschau und Export verwenden `stageplot-symbols-v3.js`. Der Export bettet die lokalen Rasterbilder ein. Original-Herstellerfotos in der gemeinsamen Mikrofonwahl bleiben erhalten. Anschlusskapazitäten und die interaktiven Buchsen sind weiterhin Daten des Routing-Modells, unabhängig vom Bild.

Quellen und Referenzmaße: [MASSTAB.md](../../MASSTAB.md).
