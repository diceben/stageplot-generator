# Stageplot Generator

Eigenständiger, offline-first Stageplot-Designer mit Bühneneditor, Drum-Designer, Routing, Druckansicht und Projekt-Export.

**Beta live:** https://diceben.github.io/stageplot-generator/

**Aktuelle Version:** v0.1.0-beta.3 · Release Notes sind in der App über `?` erreichbar.

## Funktionen

- **Projekte anlegen** über ein Popup: Band + Location (→ automatischer Projektname), Bühnengröße per Vorschau-Buttons (Breite/Tiefe mit ±1 m), erweiterte Einstellungen aufklappbar.
- **Bühneneditor** mit Bausteinkatalog, Drag & Drop, Drehen, Sperren, Ebenen-Liste (Rechtsklick: Duplizieren/Sperren/Löschen).
- **Bühne & Treppe direkt auf dem Canvas** in der Größe ziehen — smooth mit Live-Redraw; Treppe zusätzlich breitenverstellbar per Pfeile inkl. Reset auf Standardbreite.
- **IEM-/Rack-Bereich** und **Bühnentreppe** platzier- und löschbar.
- **Drum-Designer** direkt über den schwebenden „Open Drumdesigner“-Button am ausgewählten Drumset öffnen.
- **Stageplotter-Branding** mit normaler Wortmarke im Free-Plan, PRO-Wortmarke bei aktivem Pro-Plan und großem Otter-Logo neben „Projekte“; das bisherige Headerlogo bleibt als Ladefehler-Fallback erhalten.
- **Metallisches Menüband** mit stets mittiger Navigation, limefarbener aktiver Ansicht, einem der Maus folgenden rosa Hover-Unterstrich und Projektangaben direkt vor dem Speicherstatus.
- **Versteckter Otter mode** für neugierige Mehrfachklicker auf das Headerlogo.
- **Stabiler App-Viewport** mit separat scrollenden Projekt- und Routinglisten statt eines springenden Seiten-Scrollbalkens.
- **Kostenlose Pro-Beta-Umschaltung** direkt auf der Projektseite; ein Wechsel zurück zum Standard-Modus ist jederzeit möglich.
- **Routing** (Input/Output-Kanäle, CSV/XLSX), **Druckansicht** und **Projekt-Export**.
- **Stagebox-View und Bühnenkabel**: Outs als weiche, längenverstellbare Kabel an Stagebox-Ports ziehen; die Portzuweisung erscheint automatisch im Routing.
- **Komplexe Bühnen** aus magnetisch anklippbaren 2 × 1-m-Modulen sowie maßstäbliche Treppen mit Breite, Tiefe und verankerter Skalierung.
- **Technische Topviews** für Teleprompter, Wedges, Licht, Effekte, Nebelmaschine und Flightcases.
- **Object Packs** mit Shop-Vorschau, lokalen Offline-Freischaltungen, signierten Codes, Beta Crew Pass und Crew Rewards.
- **Projektverwaltung** mit Karten-Vorschau, direktem Umbenennen, portablem Download und abgesichertem Löschen.
- **Outs am Symbol** global per Toolbar-Button ein-/ausblendbar.
- Offline-first: alles im Browser gespeichert; Supabase-Cloud-Grenze vorbereitet, Login noch nicht sichtbar.

## Stand & Nächste Schritte

Beta öffentlich live. Offen:

- **Pack-Verkauf und Crew Rewards**: Checkout-Anbieter sowie produktiver Feedback-/Newsletter-Endpunkt müssen vor dem Verkauf verbunden werden; die Beta verwendet dafür lokale Warteschlangen und kostenlose Freischaltung.
- **Drum-Designer**: Outs-Tabelle pro Bauteil mit „nicht abnehmen" (ausgrauen statt löschen).
- **Import-Popup** mit Drag & Drop und Hinweis auf erlaubte Dateitypen.
- **Foto → Stageplot** (handgezeichneten Plan einlesen) — zurückgestellt, braucht eine Cloud-/API-Entscheidung, da nicht rein offline lösbar.

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
- `stageplot-assets/branding/`: optimierte Stageplotter-Logos für Header, Projektübersicht und Browser-Icon
- `supabase/migrations/`: versioniertes Datenbankschema
- `stageplot-preview.py`: restriktiver lokaler Vorschau-Server

## Module bearbeiten

`stageplot-drums-v12.js`, `stageplot-symbols-v3.js` und `stageplot-export-v42.js` sind die **einzige Quelle**. Sie liegen zusätzlich eingebettet in `stageplot-studio.html`, damit die App eine autarke, offline öffenbare Datei bleibt. Nach dem Ändern einer dieser Dateien die Einbettung neu generieren:

```bash
npm run build
```

`npm test` prüft mit `build-inline.cjs --check`, dass HTML und Quellen synchron sind, und schlägt bei Drift fehl. Niemals die eingebetteten Blöcke (zwischen den `build-inline:start/end`-Markern) direkt in der HTML editieren.

## Object-Pack-Codes ausstellen

Die App prüft Pack-Codes vollständig offline mit einem öffentlichen ECDSA-Schlüssel. Der zugehörige private JWK darf niemals im Repository liegen. Einen Code stellt man mit einem privaten Schlüssel an einem sicheren, externen Pfad aus:

```bash
npm run pack-code -- --key /sicherer/pfad/stageplot-packs.private.jwk --pack light-lab --license bestellung-123
```

Optional kann mit `--expires 2027-09-02` ein Ablaufdatum gesetzt werden. Verkaufbare Pack-IDs sind `light-lab`, `stage-builder`, `pro-crew` und `production-bundle`. Vor dem produktiven Verkauf muss der private Ausstellerschlüssel sicher verwahrt oder das Schlüsselpaar bewusst rotiert werden.

## Tests

```bash
npm test
```

Die Tests prüfen unter anderem lokale Wiederherstellung, identische Einstiegspunkte, Drumlogik sowie die Account- und Supabase-Grenze.

## Daten und Geheimnisse

Browserentwürfe sind lokale Laufzeitdaten und gehören nicht ins Repository. Ebenso niemals `.env`-Dateien, Zugriffstokens, Supabase-`service_role`-Schlüssel oder exportierte Projekte mit Kontaktdaten committen.

Der öffentliche Supabase-Publishable-Key wird später über die Build-Konfiguration bereitgestellt. Serverseitige Geheimnisse bleiben ausschließlich in Supabase beziehungsweise der Hosting-Umgebung.
