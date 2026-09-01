# Stageplot Generator

Eigenständiger, offline-first Stageplot-Designer mit Bühneneditor, Drum-Designer, Routing, Druckansicht und Projekt-Export.

Das Repository enthält ausschließlich den 2D-Stageplotter. Gigboard und der separate 3D-Prototyp Stageplay gehören nicht in dieses Projekt.

## Auf einem neuen Laptop starten

```bash
gh repo clone diceben/stageplot-generator
cd stageplot-generator
npm test
npm run dev
```

Danach `http://127.0.0.1:8872/` öffnen. Das Terminalfenster bleibt während des lokalen Tests geöffnet.

## Arbeitsablauf

Vor Arbeitsbeginn:

```bash
git pull --ff-only
```

Für eine Änderung einen Branch anlegen:

```bash
git switch -c feature/kurze-beschreibung
```

Nach einer überprüften Änderung:

```bash
git add -A
git commit -m "Kurze Beschreibung"
git push -u origin HEAD
```

Nicht gleichzeitig auf zwei Laptops uncommittete Änderungen an denselben Dateien vornehmen. Vor dem Laptopwechsel immer committen und pushen.

## Wichtige Dateien

- `stageplot-studio.html`: kanonischer 2D-App-Stand
- `stageplot-prototyp-detail.html`: synchronisierter Alias; muss bytegleich bleiben
- `stageplot-account-v1.js`: lokale Account-/Cloud-Grenze
- `stageplot-drums-v12.js`: eingebettetes Drummodell als prüfbare Quelle
- `stageplot-symbols-v3.js`: eingebetteter Symbolrenderer als prüfbare Quelle
- `stageplot-assets/`: lokale Bildassets
- `supabase/migrations/`: versioniertes Datenbankschema
- `stageplot-preview.py`: restriktiver lokaler Vorschau-Server

## Tests

```bash
npm test
```

Die Tests prüfen unter anderem lokale Wiederherstellung, identische Einstiegspunkte, Drumlogik sowie die Account- und Supabase-Grenze.

## Daten und Geheimnisse

Browserentwürfe sind lokale Laufzeitdaten und gehören nicht ins Repository. Ebenso niemals `.env`-Dateien, Zugriffstokens, Supabase-`service_role`-Schlüssel oder exportierte Projekte mit Kontaktdaten committen.

Der öffentliche Supabase-Publishable-Key wird später über die Build-Konfiguration bereitgestellt. Serverseitige Geheimnisse bleiben ausschließlich in Supabase beziehungsweise der Hosting-Umgebung.
