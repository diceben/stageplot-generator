# Stageplot Generator

Eigenständiger, offline-first Stageplot-Designer mit Bühneneditor, Drum-Designer, Routing, Druckansicht und Projekt-Export.

**Beta live:** https://diceben.github.io/stageplot-generator/

**Aktuelle Version:** v0.1.0-beta.6 · Release Notes sind in der App über `?` erreichbar.

Die Feedback-Erweiterungen in diesem Entwicklungsstand sind noch nicht veröffentlicht. Accounts benötigen zusätzlich die Einrichtung aus [ACCOUNT_SETUP.md](ACCOUNT_SETUP.md).

## Funktionen

- **Projekte anlegen** über ein Popup: Band + Location (→ automatischer Projektname), Bühnengröße per Vorschau-Buttons (Breite/Tiefe mit ±1 m), erweiterte Einstellungen aufklappbar.
- **Hausbühnen und freie Grundrisse:** Einstieg über „Hausbühnen“ auf der Projektseite oder „Bühnenform“ im Editor. Rechteck, runde Vorbühne, Kreis/Oval, Trapez, Steg, T-/L-/U-Form, Seitenbühnen und Treppennischen; beliebige Umrisse zeichnen und Kanten oder Punkte bearbeiten.
- **Feste Einbauten:** rechteckige, kreisförmige und ovale Ausschnitte, Säulen, Wände, Zugänge, Vorhang/Portal, Treppen, Rampen, FOH und freizuhaltende Bereiche. „Runder Ausschnitt“ ergibt bei gleicher Breite und Tiefe einen Kreis, sonst ein Oval. Exakte Zahlen bleiben erhalten; Griffe bewegen sich wahlweise in 10-cm-Schritten. Zwei Finger verschieben und zoomen den Grundriss.
- **Direkte Formauswahl und Kantenmaße:** beschriftete Formkarten unter „Bauelemente“ und „Grundformen“, auf schmalen Bildschirmen horizontal scrollbar. Maße stehen entlang der Kanten bzw. der Breite und Tiefe von Rundungen. Nur das ausgewählte Bauteil zeigt seine vollständige Hilfskontur; ein Tipp auf den Hintergrund zeigt wieder den zusammenhängenden Grundriss mit Gesamtmaßen. Der Export bemaßt die freiliegenden geraden Kanten.
- **Einheitliche Elementaktionen:** Die schwebende Werkzeugleiste im Hausgrundriss entspricht den Bühnenobjekten: ±45°, stufenloses Drehen beim Halten, 0°-Reset, nach hinten, sperren, duplizieren und entfernen. Das Rechtsklickmenü funktioniert im Plan und in der Elementliste. R/Shift+R, Pfeiltasten, Entf und Undo/Redo gelten auch hier. Drehungen erhalten den Elementmittelpunkt; eine gehaltene Drehung bildet einen Undo-Schritt.
- **Hausvorlagen:** lokale, revisionierte Bühnenbibliothek mit ausgewähltem festem Equipment. „Neue Veranstaltung“ erstellt eine unabhängige Kopie. Umrisse, Höhen und Hausnotizen bleiben in Projektdateien, Vorschau und Freigabelinks erhalten.
- **Bühneneditor** mit Bausteinkatalog, Drag & Drop, Drehen, Sperren, Ebenen-Liste (Rechtsklick: 90° drehen/Duplizieren/Sperren/Löschen).
- **Bühne & Treppe direkt auf dem Canvas** in der Größe ziehen — smooth mit Live-Redraw; Treppe zusätzlich breitenverstellbar per Pfeile inkl. Reset auf Standardbreite.
- **IEM-/Rack-Bereich** auch außerhalb der Bühne platzierbar. Riser, IEM-Fläche und FOH lassen sich über Griffe in 10-cm-Schritten skalieren; Zwei-Finger-Gesten sind vorbereitet. Riser zeigen Breite, Tiefe und Aufbauhöhe im Plan.
- **Technik & FOH** in den Project Settings: Strombedarf und Signalübergabe mit Ort und Anschlussart. Der FOH-Platz enthält Maße, Strombedarf sowie Tisch, Absperrung, Sonnen- und Regenschutz.
- **Funkfrequenzen** an Instrumenten und IEM-Racks sowie in Routing und Export.
- **Lesbare Kategorien** mit animiert eingeblendeten Namen; auf schmalen Bildschirmen und bei Touch bleiben die Namen sichtbar.
- **Mein Inventar** mit Modellen, Stückzahlen, Frequenzen, Strombedarf und Plansymbolen. Equipment direkt platzieren und den verwendeten Bestand im aktuellen Plan sehen.
- **Drum-Designer** direkt über den schwebenden „Open Drumdesigner“-Button am ausgewählten Drumset öffnen; das breitere Eigenschaften-Panel ändert Trommel- und Beckengrößen übersichtlich per −/+, mehr als 80 praxisübliche Mikrofonmodelle werden über einen durchsuchbaren, positionsbezogenen „Typisch“-/„Alle“-Picker gewählt, Becken wechseln exklusiv zwischen eigenem Mic und OH L/R, und die Hi-Hat startet mit einem SM57.
- **Stageplotter-Branding** mit normaler Wortmarke im Free-Plan, PRO-Wortmarke bei aktivem Pro-Plan und großem Otter-Logo neben „Projekte“; das bisherige Headerlogo bleibt als Ladefehler-Fallback erhalten.
- **Metallisches Menüband** mit stets mittiger Navigation, limefarbener aktiver Ansicht, einem der Maus folgenden rosa Hover-Unterstrich und Projektangaben direkt vor dem Speicherstatus.
- **Versteckter Otter mode** für neugierige Mehrfachklicker auf das Headerlogo.
- **Stabiler App-Viewport** mit separat scrollenden Projekt- und Routinglisten statt eines springenden Seiten-Scrollbalkens.
- **Kostenlose Pro-Beta-Umschaltung** direkt auf der Projektseite; ein Wechsel zurück zum Standard-Modus ist jederzeit möglich.
- **Routing** (Input/Output-Kanäle, CSV/XLSX), **Druckansicht** und **Projekt-Export**.
- **Stagebox-View und Bühnenkabel**: fullscreenfähiges dunkles Patch Overview mit echten XLR- beziehungsweise XLR/Klinke-Kombibuchsen, einer breiten nach Instrumenten gruppierten Channel-Suche, permanentem Info-Sidepanel und sofortigem Patchen samt Sprung zum nächsten freien Port; die Auswahl bleibt dabei geöffnet. Dieselbe Ansicht öffnet sich direkt an der Stagebox auf der Bühne. Einzelne Instrument-Inputs/-Outputs oder Stereo-Links lassen sich als schwarze, weich verlegte Kabel mit silbernen Enden an Stagebox-Ports ziehen.
- **Komplexe Bühnen** aus magnetisch anklippbaren 2 × 1-m-Modulen sowie maßstäbliche Treppen mit Breite, Tiefe und verankerter Skalierung.
- **Technische Topviews** für Teleprompter, Wedges, Licht, Effekte, Nebelmaschine und Flightcases.
- **Object Packs** mit Shop-Vorschau, lokalen Offline-Freischaltungen, signierten Codes, Beta Crew Pass und Crew Rewards.
- **Projektverwaltung** mit Karten-Vorschau, direktem Umbenennen, portablem Download und abgesichertem Löschen.
- **Outs am Symbol** global per Toolbar-Button ein-/ausblendbar.
- **Offline-first mit optionalem Account-Abgleich** für Projekte, Entwürfe, Vorlagen und Inventar. Lokale Speicherung bleibt primär; Übertragungen werden vorgemerkt, gleichzeitige Änderungen als Konfliktkopien erhalten. Ohne konfigurierte Supabase-Anbindung bleibt der Account-Dienst deaktiviert.

## Stand & Nächste Schritte

Beta öffentlich live. Offen:

- **Pack-Verkauf und Crew Rewards**: Checkout-Anbieter sowie produktiver Feedback-/Newsletter-Endpunkt müssen vor dem Verkauf verbunden werden; die Beta verwendet dafür lokale Warteschlangen und kostenlose Freischaltung.
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
git switch -c codex/kurze-beschreibung
```

Nach einer überprüften Änderung:

```bash
git add -A
git commit -m "Kurze Beschreibung"
git push -u origin HEAD
```

Nicht gleichzeitig auf zwei Laptops uncommittete Änderungen an denselben Dateien vornehmen. Vor dem Laptopwechsel immer committen und pushen.

## Wichtige Dateien

- `stageplot-studio.html`: kanonischer 2D-App-Stand; die Modulblöcke unten sind eingebettete, generierte Artefakte
- `stageplot-account-v1.js`: bestehende Account-/Cloud-Grenze
- `stageplot-sync-v2.js`: Account-Abgleich mit Offline-Aufträgen und Konfliktkopien
- `stageplot-inventory-v1.js`: lokale Inventardaten
- `stageplot-cloud-config.js`: öffentliche Account-Konfiguration, standardmäßig leer
- `ACCOUNT_SETUP.md`: Anleitung für den optionalen Account-Dienst
- `stageplot-drums-v12.js`: Drummodell — einzige Quelle, wird in die HTML eingebettet
- `stageplot-symbols-v3.js`: Symbolrenderer — einzige Quelle, wird in die HTML eingebettet
- `stageplot-export-v42.js`: Export-Helfer — einzige Quelle, wird in die HTML eingebettet
- `stageplot-geometry-v1.js`: reine Geometrie in Metern, Konturen, Ausschnitte, Flächenprüfung und Anker
- `stageplot-venue-v1.js` / `.css`: Hausgrundriss-Editor und gemeinsame Planbeschriftung
- `stageplot-assets/vendor/polygon-clipping.js`: lokale MIT-lizenzierte Polygonbibliothek; über `npm run build:vendor` reproduzierbar
- `BUEHNENFORMEN_KONZEPT.md`: recherchiertes Konzept mit Implementierungsstand und späteren Ausbauschritten
- `scripts/build-inline.cjs`: bettet die Module aus den `.js`-Quellen in die HTML ein
- `stageplot-assets/`: lokale Bildassets
- `stageplot-assets/branding/`: optimierte Stageplotter-Logos für Header, Projektübersicht und Browser-Icon
- `supabase/migrations/`: versioniertes Datenbankschema
- `stageplot-preview.py`: restriktiver lokaler Vorschau-Server

## Module bearbeiten

`stageplot-drums-v12.js`, `stageplot-symbols-v3.js` und `stageplot-export-v42.js` sind die **einzige Quelle**. Sie liegen zusätzlich eingebettet in `stageplot-studio.html`, damit diese Module ohne zusätzliche Netzwerkanfragen verfügbar sind. Nach dem Ändern einer dieser Dateien die Einbettung neu generieren:

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

20 Testgruppen prüfen unter anderem lokale Wiederherstellung, identische Einstiegspunkte, Drumlogik, 10-cm-Resize, simulierte Touch-Gesten, Produktionsdaten, Inventar und Gerätesync mit einem simulierten RPC-Server. Ein echter Supabase- und Touch-Hardware-Test steht noch aus.

## Daten und Geheimnisse

Browserentwürfe sind lokale Laufzeitdaten und gehören nicht ins Repository. Ebenso niemals `.env`-Dateien, Zugriffstokens, Supabase-`service_role`-Schlüssel oder exportierte Projekte mit Kontaktdaten committen.

Der öffentliche Supabase-Publishable-Key wird optional über GitHub-Repository-Variablen in die Build-Konfiguration eingesetzt. Serverseitige Geheimnisse bleiben ausschließlich in Supabase beziehungsweise der Hosting-Umgebung.

## Hausgrundrisse: Daten und Prüfungen

Neue Umrisse liegen als `stage.geometry.version: 1` vor. Die Ausgangsformen bleiben editierbar; vereinigte Konturen und echte Löcher werden für Vorschau, Export und Flächenprüfung daraus berechnet. Bestehende rechteckige Entwürfe werden erst beim Übernehmen im Grundriss-Editor umgestellt. Bühnenmodule und vorhandene Treppen werden dabei in den Grundriss übernommen.

Projektdateien und Freigabelinks mit Geometrie verwenden die Hüllformat-Version 2, damit ältere Apps sie nicht stillschweigend als Rechteck öffnen. Alte Dateien und Links bleiben lesbar. Hausvorlagen speichern Geometrie und ausgewähltes Equipment, aber keine Veranstaltungs-Kontakte oder Routinglisten. Vorlagenänderungen wirken nicht nachträglich auf vorhandene Veranstaltungskopien.

`npm test` prüft zusätzlich Rundungen, Flächenvereinigung, Löcher, Hindernisse, exakte Maße, Anker, Vorlagen-/Datei-/Link-Roundtrips sowie die tatsächlichen Pointer-Handler für Resize, Sperren, Abbruch und Zwei-Finger-Zoom. Browserprüfung: 1280 × 720 und 390 × 844, Kanten-Drag, Bogen, Treppe, Hausvorlage, Veranstaltungskopie, Neuladen, PDF-Vorschau, PNG-Ausgabe und Read-only-Link. Physische Touch-Geräte und ein produktiver Supabase-Abgleich stehen separat aus.

Noch nicht enthalten: PDF/Bild als maßstäbliche Durchzeichenvorlage, freie Bézierkurven, eigener Kreissektor-Dialog, Publikumsbestuhlung und eine umfangreiche technische Bauteildatenbank. Treppen und Rampen lassen sich an gerade oder gebogene Polygonkanten hängen; an Kreis-/Ovalflächen und separaten runden Vorbühnen werden sie frei platziert.
