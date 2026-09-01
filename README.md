# Stageplot Generator

Eigenständiger, offline-first Stageplot-Designer mit Bühneneditor, Drum-Designer, Routing, Druckansicht und Projekt-Export.

**Beta live:** https://diceben.github.io/stageplot-generator/

Das Repository enthält ausschließlich den 2D-Stageplotter. Gigboard und der separate 3D-Prototyp Stageplay gehören nicht in dieses Projekt.

## Veröffentlichung

Die Seite ist statisch und wird per GitHub Actions (`.github/workflows/deploy.yml`) auf GitHub Pages ausgeliefert: Bei jedem Push auf `main` läuft `npm test`, und nur bei grünem Lauf geht die neue Fassung live. `index.html` ist der Einstieg und wird von `npm run build` aus `stageplot-studio.html` erzeugt (die kanonische Fragment-Quelle); direkt editiert wird nur `stageplot-studio.html` bzw. die Modulquellen.

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

- `stageplot-studio.html`: kanonischer 2D-App-Stand (autarke Datei; die Modulblöcke unten sind eingebettete, generierte Artefakte)
- `stageplot-account-v1.js`: lokale Account-/Cloud-Grenze
- `stageplot-drums-v12.js`: Drummodell — einzige Quelle, wird in die HTML eingebettet
- `stageplot-symbols-v3.js`: Symbolrenderer — einzige Quelle, wird in die HTML eingebettet
- `stageplot-export-v42.js`: Export-Helfer — einzige Quelle, wird in die HTML eingebettet
- `scripts/build-inline.cjs`: bettet die Module aus den `.js`-Quellen in die HTML ein
- `stageplot-assets/`: lokale Bildassets
- `supabase/migrations/`: versioniertes Datenbankschema
- `stageplot-preview.py`: restriktiver lokaler Vorschau-Server

## Module bearbeiten

`stageplot-drums-v12.js`, `stageplot-symbols-v3.js` und `stageplot-export-v42.js` sind die **einzige Quelle**. Sie liegen zusätzlich eingebettet in `stageplot-studio.html`, damit die App eine autarke, offline öffenbare Datei bleibt. Nach dem Ändern einer dieser Dateien die Einbettung neu generieren:

```bash
npm run build
```

`npm test` prüft mit `build-inline.cjs --check`, dass HTML und Quellen synchron sind, und schlägt bei Drift fehl. Niemals die eingebetteten Blöcke (zwischen den `build-inline:start/end`-Markern) direkt in der HTML editieren.

## Tests

```bash
npm test
```

Die Tests prüfen unter anderem lokale Wiederherstellung, identische Einstiegspunkte, Drumlogik sowie die Account- und Supabase-Grenze.

## Daten und Geheimnisse

Browserentwürfe sind lokale Laufzeitdaten und gehören nicht ins Repository. Ebenso niemals `.env`-Dateien, Zugriffstokens, Supabase-`service_role`-Schlüssel oder exportierte Projekte mit Kontaktdaten committen.

Der öffentliche Supabase-Publishable-Key wird später über die Build-Konfiguration bereitgestellt. Serverseitige Geheimnisse bleiben ausschließlich in Supabase beziehungsweise der Hosting-Umgebung.
