# Stageplot Generator

Eigenständiger, offline-first Stageplot-Designer mit Bühneneditor, Drum- und Percussion-Editor, Routing, Druckansicht und Projekt-Export.

**Beta live:** https://diceben.github.io/stageplot-generator/

**Aktuelle Version:** v0.1.0-beta.6 · Release Notes sind in der App über `?` erreichbar.

Accounts benötigen die Einrichtung aus [ACCOUNT_SETUP.md](ACCOUNT_SETUP.md).

## Funktionen

- **Automatische Projektdaten:** Gültige Eingaben werden lokal gespeichert, auch beim sofortigen Seitenwechsel. Unvollständige Angaben bleiben sichtbar und verhindern versehentliches Verlassen. „Projekt duplizieren“ erstellt eine unabhängige Kopie mit neuer ID; „Sicherung herunterladen“ liefert eine portable Datei. Normales Sichern benötigt keinen zweiten Namensdialog.
- **Klare Arbeitsbereiche:** Projekte, Bühnenplan, Audio & Verkabelung, Projektdaten sowie Export & Teilen. Projektdaten zeigen die tatsächliche Bühnenfläche und bei freien Grundrissen die Gesamtausdehnung inklusive Anbauten; „Bühnenform bearbeiten“ führt direkt zum Grundriss.
- **Mehr Platz auf kleinen Bildschirmen:** kompakte Beta-Information und eine gemeinsam scrollende Projektübersicht. „Projekt hinzufügen“ bleibt die erste Karte. Im Editor öffnen beschriftete Schaltflächen die Bausteine und die ausgewählten Objekteigenschaften; die rechte Seitenleiste und ihr gewählter Tab bleiben beim Auswählen, Wechseln oder Abwählen von Objekten unverändert. Die Schaltflächen an der Leiste öffnen und schließen sie ausdrücklich.
- **Übersichtlicher Export:** Direkte Auswahl zwischen PDF, Bild und Link. PDF bietet „Nur Bühnenplan“ oder „Mit Technik & Kanälen“; Darstellung und einzelne Inhalte bleiben anpassbar. Die vergrößerbare Vorschau zeigt dieselben A4-Querformatseiten wie der Ausdruck, mit Projekt-ID, Seitenzahlen, lesbaren Kanaltabellen, wiederholten Tabellenköpfen und vollständigen Notizen. Standard-/4K-PNG mit weißem oder transparentem Hintergrund sowie schreibgeschützte Freigabelinks bleiben verfügbar. Eine schwarze Bühne lässt sich für den Ausdruck unabhängig vom gespeicherten Projekt einstellen. Veranstalter-PDF und Projektkopien stehen mit der kostenlosen Pro-Beta bereit.
- **Location-Vorlagen:** über „Neues Projekt → Location-Vorlage → Location suchen“ erreichbarer, frei zugänglicher Beta-Katalog mit Suche nach Location, Stadt oder Bühne, sichtbaren Kategorie-Buttons und maßstäblicher Vorschau. Alle Einträge sind ohne Account, Code oder Pro-Aktivierung nutzbar und lokal mitgeliefert. Start mit Maßskizzen von B72, MuTh und Volksoper Wien; Umfang, Originalquelle und Quellenstand stehen bei jedem Eintrag. „Auf dieser Bühne planen“ legt eine unabhängige Veranstaltung an. Details und Pflege: [BUEHNENKATALOG.md](BUEHNENKATALOG.md).
- **Ein gemeinsamer Projekteinstieg:** „Neues Projekt“ bündelt „Bühne selbst festlegen“, „Location-Vorlage“ und „Meine Bühnenvorlagen“. Bandname und Eingaben bleiben beim Wechsel erhalten. Gespeicherte Bühnen erscheinen direkt als auswählbare Vorlagen; separate Startbuttons für Hausbühnen oder den Katalog entfallen.
- **Projekte anlegen** über ein Popup: Band + Location (→ automatischer Projektname), Bühnengröße per Vorschau-Buttons (Breite/Tiefe mit ±1 m), erweiterte Einstellungen aufklappbar.
- **Hausbühnen und freie Grundrisse:** Neue Projekte starten unter „Neues Projekt“; den Grundriss bearbeitest du danach unter „Bühnenform“ im Editor. Dort lassen sich unter „Vorlage“ auch eigene Bühnenvorlagen speichern. Rechteck, runde Vorbühne, Kreis/Oval, Trapez, Steg, T-/L-/U-Form, Seitenbühnen und Treppennischen; beliebige Umrisse zeichnen und Kanten oder Punkte bearbeiten. Ein Klick auf eine Grundform fügt sie rechts neben dem vorhandenen Aufbau hinzu. Bestehende Elemente und Hausangaben bleiben erhalten; jeder Neuzugang lässt sich mit einem Undo-Schritt zurücknehmen.
- **Feste Einbauten:** rechteckige, kreisförmige und ovale Ausschnitte, Säulen, Wände, Zugänge, Vorhang/Portal, Treppen, Rampen, FOH und freizuhaltende Bereiche. „Runder Ausschnitt“ ergibt bei gleicher Breite und Tiefe einen Kreis, sonst ein Oval. Exakte Zahlen bleiben erhalten; Griffe bewegen sich wahlweise in 10-cm-Schritten. Zwei Finger verschieben und zoomen den Grundriss.
- **Direkte Formauswahl und Kantenmaße:** beschriftete Formkarten unter „Bauelemente“ und „Grundformen“, auf schmalen Bildschirmen horizontal scrollbar. Maße stehen entlang der Kanten bzw. der Breite und Tiefe von Rundungen. Gleiche gegenüberliegende Kanten mit derselben Ausdehnung werden je Bauteil nur einmal bemaßt; Breite und Tiefe bleiben erkennbar. Nur das ausgewählte Bauteil zeigt seine vollständige Hilfskontur; ein Tipp auf den Hintergrund zeigt wieder den zusammenhängenden Grundriss mit Gesamtmaßen. Der Export bemaßt die freiliegenden geraden Kanten und vermeidet Wiederholungen der Gesamtmaße.
- **Einheitliche Elementaktionen:** Die schwebende Werkzeugleiste im Hausgrundriss entspricht den Bühnenobjekten: ±45°, stufenloses Drehen beim Halten, 0°-Reset, nach hinten, sperren, duplizieren und entfernen. Das Rechtsklickmenü funktioniert im Plan und in der Elementliste. R/Shift+R, Pfeiltasten, Entf und Undo/Redo gelten auch hier. Drehungen erhalten den Elementmittelpunkt; eine gehaltene Drehung bildet einen Undo-Schritt.
- **Hausvorlagen:** lokale, revisionierte Bühnenbibliothek mit ausgewähltem festem Equipment. „Neue Veranstaltung“ erstellt eine unabhängige Kopie. Umrisse, Höhen und Hausnotizen bleiben in Projektdateien, Vorschau und Freigabelinks erhalten.
- **Bühneneditor** mit Bausteinkatalog, Drag & Drop, Drehen, Sperren, Ebenen-Liste (Rechtsklick: 90° drehen/Duplizieren/Sperren/Löschen).
- **Treppen und Rampen als Bausteine:** direkt und kostenlos unter „Bühnenelemente“ platzieren, auch außerhalb des Bühnenrands. Gemeinsame Objektaktionen zum Drehen, Duplizieren, Sperren und Entfernen; Breite/Tiefe per Griffe in 10-cm-Schritten oder über die Eigenschaften ändern. Kantenmaße und Aufstiegsrichtung erscheinen im Plan und Ausdruck; Größe und Drehung bleiben in Entwürfen und Projektdateien erhalten.
- **Bühne & Treppe direkt auf dem Canvas** in der Größe ziehen — smooth mit Live-Redraw; Treppe zusätzlich breitenverstellbar per Pfeile inkl. Reset auf Standardbreite.
- **IEM-/Rack-Bereich** auch außerhalb der Bühne platzierbar. Riser, IEM-Fläche und FOH lassen sich über Griffe in 10-cm-Schritten skalieren; Zwei-Finger-Gesten sind vorbereitet. Riser zeigen Breite, Tiefe und Aufbauhöhe jeweils einmal kompakt am Rand. Eigene Namen stehen ebenfalls am Rand; die Angaben berücksichtigen Instrumente und deren Beschriftungen und verdecken keine Objekte mit einer großen Beschriftungsbox.
- **Technik & FOH** in den Projektdaten: Strombedarf und Signalübergabe mit Ort und Anschlussart. Der FOH-Platz enthält Maße, Strombedarf sowie Tisch, Absperrung, Sonnen- und Regenschutz.
- **Funkfrequenzen** an Instrumenten und IEM-Racks sowie in Routing und Export.
- **Lesbare Kategorien** mit animiert eingeblendeten Namen; auf schmalen Bildschirmen und bei Touch bleiben die Namen sichtbar.
- **Mein Inventar** mit Modellen, Stückzahlen, Frequenzen, Strombedarf und Plansymbolen. Equipment direkt platzieren und den verwendeten Bestand im aktuellen Plan sehen.
- **Drum-Designer** direkt über den schwebenden „Open Drumdesigner“-Button am ausgewählten Drumset öffnen; das breitere Eigenschaften-Panel ändert Trommel- und Beckengrößen übersichtlich per −/+, mehr als 80 praxisübliche Mikrofonmodelle werden über einen durchsuchbaren, positionsbezogenen „Typisch“-/„Alle“-Picker gewählt, Becken wechseln exklusiv zwischen eigenem Mic und OH L/R, und die Hi-Hat startet mit einem SM57.
- **Percussion-Editor** mit 14 Instrumentvarianten: Quinto/Conga/Tumba, Bongos, Timbales, Pandeiro, Cowbell, Jam Block, Tamburin, Bar Chimes, Maracas, Becken, Multipad und Tisch. Zwölf eigens generierte, freigestellte Draufsicht-Bildassets erscheinen im Editor, Bühnenplan, in Projektvorschauen und Exporten. Instrumente verschieben, drehen, skalieren, duplizieren und ihre Abnahme wählen; Vorlagen, Undo/Redo und mobile Bedienung sind enthalten. Kanäle landen im gemeinsamen Audio-Plan. [Bedienung, Datenmodell und Asset-Herkunft](PERCUSSION.md).
- **Stageplotter-Branding** mit normaler Wortmarke im Free-Plan, PRO-Wortmarke bei aktivem Pro-Plan und großem Otter-Logo neben „Projekte“; das bisherige Headerlogo bleibt als Ladefehler-Fallback erhalten.
- **Metallisches Menüband** mit stets mittiger Navigation, limefarbener aktiver Ansicht, einem der Maus folgenden rosa Hover-Unterstrich und Projektangaben direkt vor dem Speicherstatus.
- **Versteckter Otter mode** für neugierige Mehrfachklicker auf das Headerlogo.
- **Stabiler App-Viewport** mit separat scrollenden Projekt- und Routinglisten statt eines springenden Seiten-Scrollbalkens.
- **Kostenlose Pro-Beta-Umschaltung** direkt auf der Projektseite; ein Wechsel zurück zum Standard-Modus ist jederzeit möglich.
- **Gemeinsamer Audio-Plan:** Verwendete Signale sind die gemeinsame Grundlage für Bühnenobjekte, Input-/Outputlisten, Stagebox-Ports und PDFs. Derselbe Signal-Editor öffnet sich am Objekt, in der Liste und an einem belegten Stagebox-Port. Beschriftete Bereiche für Signal, Stagebox & Kanäle sowie weitere Angaben halten den Dialog übersichtlich; die aktuelle Zuordnung bleibt sichtbar. Gerätebuchsen sind getrennte Kapazitätsangaben; neue Keyboards starten mit Stereo L/R, zusätzliche Signale lassen sich gezielt aktivieren.
- **Stabile Kanäle:** CH bezeichnet den Mischpultkanal, IN/OUT am Patch die Stagebox-Buchse. Nummerieren und Stagebox-Zuordnung sind getrennte Aktionen. Sortieren verschiebt Stereo-Paare gemeinsam und erhält Kanalnummern; auf Mobilgeräten stehen Signalkarten und Auf-/Ab-Tasten bereit.
- **Signalwege statt doppelter Inputs:** Mono-Kanäle wie Gitarre, Amp und Mikrofon lassen sich im Signal-Editor ausdrücklich zusammenführen. Die ursprünglichen Kanäle bleiben zum Wiederherstellen gespeichert. Bestehende Projekte behalten ihre aktiven Signale, Namen, Nummern und Zuordnungen. Entfernte Signale werden nicht automatisch neu angelegt.
- **Lesbare Audio-Unterlagen:** Auf dem Plan stehen Kanalnummern, Strom- und FOH-Anforderungen. Die Inputliste trennt Quelle, Mikrofon/DI, 48V, Stagebox-Port und Notizen; Outputs/Monitore einschließlich IEM und Funkangaben stehen separat. Eine Stagebox-Patchliste ist optional. CSV/XLSX und portable Projektdateien bleiben verfügbar.
- **Schnell zuordnen:** Suche nach Signal, Kanalnummer, Mikrofon oder Stagebox sowie Filter „Ohne Nummer“ und „Ohne Zuordnung“. Direkt an der Signalzeile öffnet „Stagebox zuordnen“ denselben Editor mit einer Auswahl freier Buchsen. Stereo wird gemeinsam zugeordnet; vorhandene Kanalnummern und Ports bleiben beim automatischen Ergänzen erhalten. Rückgängig/Wiederholen ist in allen Audio-Ansichten erreichbar.
- **Stagebox-Belegung**: gemeinsamer Audio-Kopfbereich mit gleichbleibender Navigation und Aktionen für Inputs, Outputs und Stagebox-Belegung; beschriftete Raster-/Listenumschaltung ohne zusätzliche Schein-Tabs. Eine belegte Buchse zeigt Signaldetails; „Anderes Signal zuordnen“ öffnet die gruppierte Suche. Der Sprung zur nächsten freien Buchse ist ausdrücklich einschaltbar. Umstecken zeigt betroffene Signale vor dem Übernehmen. Dieselbe Ansicht öffnet sich direkt an der Stagebox auf der Bühne. Die Planung erfolgt ausschließlich über Signal, Stagebox und Buchse; Kabelzeichnen, separate Kabelansicht und Kabellängen-Editor entfallen. Fehlen zwei freie Buchsen für Stereo, bleibt der bisherige Stand erhalten.
- **Komplexe Bühnen** aus magnetisch anklippbaren 2 × 1-m-Modulen sowie maßstäbliche Treppen mit Breite, Tiefe und verankerter Skalierung.
- **Technische Topviews** für Teleprompter, Wedges, Licht, Effekte, Nebelmaschine und Flightcases.
- **Object Packs** mit Shop-Vorschau, lokalen Offline-Freischaltungen, signierten Codes, Beta Crew Pass und Crew Rewards.
- **Projektverwaltung** mit Karten-Vorschau, direktem Umbenennen, portablem Download und abgesichertem Löschen.
- **Dauerhafte Projekt-ID** auf jeder Projektkarte und in den Projektdaten, per Klick kopierbar und über die Projektsuche auffindbar. Bestehende lokale Projekte erhalten automatisch eine ID; Umbenennen, normales Speichern und Gerätesync behalten sie bei. „Projekt duplizieren“, importierte Kopien und Konfliktkopien erhalten eigene IDs. Der Speicherstatus unterscheidet lokale Speicherung, offene Änderungen und tatsächlich bestätigten Sync.
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
- `stageplot-percussion-v1.js` / `stageplot-percussion-editor-v1.js` / `.css`: Percussion-Modell und Editor, generiert in die HTML eingebettet
- `stageplot-assets/percussion/manifest.json`: Bildgenerierung, vollständige Prompts, Prüfsummen und Verpackung der lokalen Assets
- `stageplot-symbols-v3.js`: Symbolrenderer — einzige Quelle, wird in die HTML eingebettet
- `stageplot-audio-v1.js` / `.css`: gemeinsamer Signal-Editor, Stereo-Gruppen, Signalwege, mobile Audio-Ansicht und Drucklisten (im Editor-Kontext eingebettet)
- `stageplot-export-v42.js`: Export-Helfer — einzige Quelle, wird in die HTML eingebettet
- `stageplot-geometry-v1.js`: reine Geometrie in Metern, Konturen, Ausschnitte, Flächenprüfung und Anker
- `stageplot-venue-v1.js` / `.css`: Hausgrundriss-Editor und gemeinsame Planbeschriftung
- `stageplot-venue-catalog-v1.js` / `.css`: lokal eingebetteter Beta-Bühnenkatalog, Quelldaten, Suche und Vorschau
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

23 Testgruppen prüfen unter anderem lokale Wiederherstellung, identische Einstiegspunkte, Drumlogik, 10-cm-Resize, simulierte Touch-Gesten, Produktionsdaten, Inventar, Katalogkopien mit Quellenangaben und Gerätesync mit einem simulierten RPC-Server. Ein echter Supabase- und Touch-Hardware-Test steht noch aus.

## Daten und Geheimnisse

Browserentwürfe sind lokale Laufzeitdaten und gehören nicht ins Repository. Ebenso niemals `.env`-Dateien, Zugriffstokens, Supabase-`service_role`-Schlüssel oder exportierte Projekte mit Kontaktdaten committen.

Der öffentliche Supabase-Publishable-Key wird optional über GitHub-Repository-Variablen in die Build-Konfiguration eingesetzt. Serverseitige Geheimnisse bleiben ausschließlich in Supabase beziehungsweise der Hosting-Umgebung.

## Hausgrundrisse: Daten und Prüfungen

Neue Umrisse liegen als `stage.geometry.version: 1` vor. Die Ausgangsformen bleiben editierbar; vereinigte Konturen und echte Löcher werden für Vorschau, Export und Flächenprüfung daraus berechnet. Bestehende rechteckige Entwürfe werden erst beim Übernehmen im Grundriss-Editor umgestellt. Bühnenmodule und vorhandene Treppen werden dabei in den Grundriss übernommen.

Projektdateien und Freigabelinks mit Geometrie verwenden die Hüllformat-Version 2, damit ältere Apps sie nicht stillschweigend als Rechteck öffnen. Alte Dateien und Links bleiben lesbar. Hausvorlagen speichern Geometrie und ausgewähltes Equipment, aber keine Veranstaltungs-Kontakte oder Routinglisten. Vorlagenänderungen wirken nicht nachträglich auf vorhandene Veranstaltungskopien.

`npm test` prüft zusätzlich Rundungen, Flächenvereinigung, Löcher, Hindernisse, exakte Maße, Anker, Vorlagen-/Datei-/Link-Roundtrips sowie die tatsächlichen Pointer-Handler für Resize, Sperren, Abbruch und Zwei-Finger-Zoom. Browserprüfung: 1280 × 720 und 390 × 844, Kanten-Drag, Bogen, Treppe, Hausvorlage, Veranstaltungskopie, Neuladen, PDF-Vorschau, PNG-Ausgabe und Read-only-Link. Physische Touch-Geräte und ein produktiver Supabase-Abgleich stehen separat aus.

Noch nicht enthalten: PDF/Bild als maßstäbliche Durchzeichenvorlage, freie Bézierkurven, eigener Kreissektor-Dialog, Publikumsbestuhlung und eine umfangreiche technische Bauteildatenbank. Treppen und Rampen lassen sich an gerade oder gebogene Polygonkanten hängen; an Kreis-/Ovalflächen und separaten runden Vorbühnen werden sie frei platziert.

Das Drucklayout wird in `stageplot-print-v1.js` und `stageplot-print-v1.css` gepflegt und über `npm run build` offline in die HTML eingebettet. Für PDF-Ausgabe im Browser: A4 quer, 100 % Maßstab und Browser-Kopf-/Fußzeilen ausschalten.

### Audio-Daten

`stage.routing` bleibt die gemeinsame Quelle für aktive `inputs` und `outputs`. Version 2 ergänzt `disabledSources` für ausdrücklich entfernte Signale sowie `pickup`, `outputKind`, `edited`, `adoptedSource` und `linkedSources` an Kanalzeilen. `linkedSources` hält die Originaldaten zusammengeführter Kanäle; beim Wiederherstellen werden zwischenzeitlich belegte Nummern oder Ports freigelassen. Projektkopien remappen Objektbezüge auch in Stereo-Gruppen, deaktivierten Quellen und Originalkanälen. Physische Buchsenzahlen bleiben unter `object.io`, ohne daraus jeden Anschluss automatisch als verwendetes Signal zu planen. Alte Zeichnungsdaten in `stage.cables` bleiben für kompatible Projektdateien gespeichert; sie werden weder dargestellt noch neu erzeugt.
