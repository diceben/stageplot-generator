# Session-Handoff

Stand: 2. September 2026

## Aktueller Release

- Live: https://diceben.github.io/stageplot-generator/
- Version: `v0.1.0-beta.6`
- Release-Commit: `a313981` (`Expand routing and production workflow`)
- Arbeitsbranch am Sitzungsende: `main`
- `main`, `origin/main` und `feature/cable-routing-io-v2` zeigen auf denselben Release-Commit.
- Der GitHub-Pages-Workflow `33681231371` ist inklusive Test- und Deploy-Job erfolgreich abgeschlossen.
- Die danach öffentlich abgerufene `index.html` war bytegleich mit dem lokalen Release-Build.

## Was in beta.6 enthalten ist

- Verlustfreie lokale Projekt- und Entwurfsverwaltung ohne Überschreiben bestehender Projekte.
- Kabelansicht mit ausblendbaren, geglätteten Kabeln, Instrument-I/O, Aliasen, Stereo-Links, DI-Hinweisen und Stagebox-Zuweisung.
- Fullscreen-Stagebox-Patch-Ansicht mit XLR-/Kombibuchsen, gruppierter Suche, IEM-Ausgängen, 48 V sowie MADI und Dante.
- Drum-Designer mit bauteilbezogenen Outputs, mehr als 80 durchsuchbaren Mikrofonen, OH-Logik, Mic-Markern, Splashes und Größensteuerung per Minus/Plus.
- Modell-Picker: In der Bibliothek stehen nur `Keyboard`, `Gitarre` und `Bass`; der gleiche Picker wird beim Platzieren und Modellwechsel verwendet.
- Größere Mikrofon-Plansymbole bei weiterhin dokumentierten realen Originalmaßen.
- Project Settings als eigene Seite und papiergetreuer Export-Wizard für PNG, 4K und PDF.
- Allgemeiner Hell-/Dunkelmodus; das Exportpapier bleibt unabhängig davon weiß.
- Drei-spaltige Projektübersicht, Object Packs, neue Produktionsobjekte, technische Topviews und überarbeitete Treppensteuerung.
- Release Notes für `v0.1.0-beta.6` sind über `?` in der App erreichbar.

## Morgen weiterarbeiten

```bash
cd /Users/ben/Downloads/stageplot-generator
git status --short --branch
git pull --ff-only
npm test
npm run dev
```

Die lokale Vorschau läuft danach unter http://127.0.0.1:8872/.

Für neue Änderungen zuerst einen Branch anlegen:

```bash
git switch -c feature/kurze-beschreibung
```

## Verbindliche Projektgrenzen

- `stageplot-studio.html` ist die kanonische App-Datei.
- `stageplot-drums-v12.js`, `stageplot-symbols-v3.js` und `stageplot-export-v42.js` sind die einzigen Quellen ihrer eingebetteten Module.
- Nach Änderungen an diesen drei Dateien immer `npm run build` ausführen; die generierten Inline-Blöcke niemals direkt bearbeiten.
- Nach jeder Implementierungsänderung `npm test` ausführen.
- Offline-first-Speicherung und Migration bestehender Browserentwürfe müssen erhalten bleiben.
- Keine Exporte, Zugangsdaten, privaten Schlüssel oder Kontaktdaten committen.
- Die 2D-App bleibt unabhängig von Gigboard und Stageplay 3D.

Weitere Regeln stehen in `AGENTS.md`, `CLAUDE.md` und `README.md`.

## Verifizierter Ausgangspunkt

- `npm test`: 18 Testgruppen bestanden.
- Browserprüfungen: Modell-Picker, Mikrofongröße, technische Objekte, Treppen, Kabel-Toggles, Dunkelmodus und Exportvorschau bestanden.
- Keine JavaScript-Ausnahmen in den abschließenden Browserläufen.
- `npm run build` hatte `index.html` und die eingebetteten Module synchronisiert.

## Noch offene Produktentscheidungen

- Produktiven Checkout und Backend-Endpunkte für Pack-Käufe, Feedback und Newsletter anbinden. Die Beta nutzt weiterhin lokale Warteschlangen/Freischaltungen.
- Import-Popup um Drag-and-drop und klar ausgewiesene Dateitypen erweitern.
- Für `Foto → Stageplot` zuerst Cloud-/API- und Datenschutzentscheidung treffen; offline ist das nicht vollständig lösbar.
- Die GitHub Actions melden derzeit nur einen nicht blockierenden Wartungshinweis zu Actions auf Node.js 20; der erfolgreiche Lauf wurde bereits auf Node.js 24 ausgeführt.

Am Sitzungsende gibt es keine uncommitteten App-Änderungen und keinen bekannten Blocker für die nächste Entwicklungsrunde.
