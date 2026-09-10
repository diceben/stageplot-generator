# Technik in Draufsicht

21 lokale, eigens mit dem eingebauten OpenAI-Bildgenerator gerenderte Assets. Realistische Materialien mit zurückhaltender zeichnerischer Kontur, monochrom und senkrecht von oben. Einzeln generiert; keine CSS-Zeichnungen oder Produktfotos.

`manifest.json` dokumentiert Quellen-Hashes, Freistellung, Bildgrößen und die bestehenden Planmaße. `prompts.json` enthält die verwendeten Prompts. Die Quelldateien bleiben im lokalen Verzeichnis der Bildgenerierung; die App benötigt nur die versionierten WebP-Dateien.

Die Freistellung wird bis zur Objektkontur zugeschnitten (Alpha-Schwelle 128 zur Messung, Bild-Alpha bleibt erhalten), proportional auf höchstens 768 Pixel reduziert und als WebP komprimiert. Die gemeinsame Objektgeometrie bildet diese Kontur auf die gespeicherte Breite und Tiefe ab. Vorhandene Projekte erhalten keine neuen Maße oder Positionen.

Bibliothek, Bühne, Eigenschaften, Projektvorschau und Export referenzieren dieselben Bilder über `stageplot-symbols-v3.js`. Der Export bettet sie ein. Die Zeichnungen dienen zur Orientierung; Kanalzahl und Anschlussbelegung kommen weiterhin aus dem gemeinsamen Gerätekatalog und Routing. Die interaktiven Buchsen bleiben unabhängig vom Bild.

Bei WING Rack und Verstärkern ist die Oberseite dargestellt. Stageboxen liegen mit dem Anschlussfeld nach oben. Original-Mikrofonfotos und verstellbare Mikrofonständer bleiben erhalten. Die nicht ersetzten Modellvarianten nutzen weiterhin ihre vorhandene Zeichnung.
