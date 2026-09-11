# Stageplot Generator

Eigenständiger, offline-first Stageplot-Designer mit Bühneneditor, Drum-, Percussion- und Orchester-Editor, Routing, Druckansicht und Projekt-Export.

**Beta live:** https://diceben.github.io/stageplot-generator/

Die mobile Baustein-Auswahl nutzt auch bei geöffneter Tastatur den sichtbaren Bildschirm; Suche und Schließen bleiben erreichbar, Treffer scrollen separat und durchsuchen alle Kategorien.

**Aktuelle Version:** v0.1.0-beta.7 · Release Notes sind in der App über `?` erreichbar.

Accounts benötigen die Einrichtung aus [ACCOUNT_SETUP.md](ACCOUNT_SETUP.md).

## Funktionen

- **Routing am Handy:** Kompakte Tabs und Kanalkarten zeigen Kanalnummer, Instrument, Mikrofon und Anschluss zusammen. „+ Signal“ bleibt sichtbar; Nummerierung, automatische Stagebox-Zuordnung, Rückgängig und Export stehen unter „Aktionen“. Auf kurzen Bildschirmen scrollt die gesamte Ansicht.
- **Zwei-Finger-Drehung am Handy:** Auf einem Objekt beginnen und mit dem zweiten Finger drehen. Eine markierte Auswahl dreht sich gemeinsam; Instrumentgrößen und Abstände bleiben erhalten. Auf freier Fläche zoomen und verschieben zwei Finger die Ansicht. Podeste, FOH, Treppen und Rampen bleiben zusätzlich in 10-cm-Schritten skalierbar. Eine Geste entspricht einem Rückgängig-Schritt.
- **Mehrfachauswahl:** Shift-Klick oder „Mehrere“ am Handy; gemeinsam verschieben, drehen, duplizieren, sperren und löschen. Kanten/Mittelpunkte ausrichten und ab drei Objekten gleichmäßige freie Abstände verteilen. Jede Änderung ist mit einem Schritt rückgängig.
- **Favoriten & zuletzt benutzt:** Sterne an den Bausteinen und am ausgewählten Objekt; drei direkte Filter für alle Bausteine, Favoriten und die zwölf zuletzt platzierten Typen. Lokal und projektübergreifend gespeichert.

- **Offene Objekteigenschaften:** 420 px breite rechte Leiste mit Objektbild, Namen und gemeinsamen Aktionen zum Duplizieren, Sperren und Löschen. Maße, Position, 90°-Drehungen, Beschriftung und Routing sind direkt erreichbar; technische Felder passen sich dem Objekt an. Echter lokaler Speicherstatus, Tastaturbedienung und eine angepasste mobile Leiste bleiben enthalten.

- **Gezielter Start:** Die wiederhergestellte Ansicht erscheint ohne Aufblitzen des alten Bühnenformulars. Kein automatischer Demo-Aufbau, keine versteckten Druckvorschauen beim Start; Bausteine und Pack-Bilder werden erst in ihrer Ansicht aufgebaut. Bilder geschlossener Editoren laden bei Bedarf. [Messung und weitere Codepflege](STARTOPTIMIERUNG.md).

- **Maßstäbliche Gegenstände:** Geräte und Stellflächen verwenden metrische Referenzrahmen; gerenderte Bilder bleiben proportional und Mikrofon-/DI-Symbole werden nicht künstlich vergrößert. Korrigierte Laptop- und Stagebox-Maße; eigene Breite und Länge/Tiefe direkt in cm eingeben, speichern und rückgängig machen. Dieselbe Geometrie gilt in Bühne, Vorschau und Export. [Maße, Quellen und Prüfung](MASSTAB.md).

- **Automatische Projektdaten:** Gültige Eingaben werden lokal gespeichert, auch beim sofortigen Seitenwechsel. Unvollständige Angaben bleiben sichtbar und verhindern versehentliches Verlassen. „Projekt duplizieren“ erstellt eine unabhängige Kopie mit neuer ID; „Sicherung herunterladen“ liefert eine portable Datei. Normales Sichern benötigt keinen zweiten Namensdialog.
- **Klare Arbeitsbereiche:** Projekte, Bühnenplan, Routing, Projektdaten sowie Export & Teilen. Projektdaten zeigen die tatsächliche Bühnenfläche und bei freien Grundrissen die Gesamtausdehnung inklusive Anbauten; „Bühnenform bearbeiten“ führt direkt zum Grundriss.
- **Handy-Editor:** Eine feste untere Leiste öffnet Bausteine, Eigenschaften und Werkzeuge. Die Werkzeug-Icons liegen in einer eigenen Bedienfläche; breite Panels mit Schließen-Taste bleiben bewusst geöffnet. Baustein wählen und auf der Bühne antippen. Die Bühne nutzt ihre tatsächlichen Außenmaße beim Einpassen, Maße stehen direkt daneben. Zwei Finger zoomen und verschieben die Ansicht; ausgewählte Podeste und Flächen behalten ihre Größen-Geste. Objektaktionen bleiben unten, „Einpassen“ setzt die Ansicht zurück. Navigation und verfügbare Höhe passen sich an Hoch-/Querformat und den Browser an. [Prüfung der Handyansicht](MOBILE_QA.md).
- **Übersichtlicher Export:** Direkte Auswahl zwischen PDF, Bild und Link. PDF und Bild bieten denselben Umfang: „Nur Bühnenplan“ oder „Mit Technik & Kanälen“; Darstellung und einzelne Inhalte bleiben anpassbar. Die vergrößerbare Vorschau zeigt dieselben A4-Querformatseiten wie der Ausdruck, mit Projekt-ID, Seitenzahlen, lesbaren Kanaltabellen, wiederholten Tabellenköpfen und vollständigen Notizen. Maßlinien folgen den Bühnenkanten und vermeiden Überlagerungen mit Anbauten. Kompakte Anforderungen, Kontakte, Equipment und Notizen nutzen automatisch Platz rechts, beidseitig oder unter dem Plan; lange Inhalte bleiben vollständig auf Folgeseiten. PNG verwendet dieselben Seiten einschließlich Kopfzeile, Zusatzinfos, Listen und Fußzeile. Für Bilder stehen HD (1280 px), 2K (2048 px) und 4K (3840 px Seitenbreite) sowie ein weißer oder transparenter Hintergrund zur Wahl. Mehrseitige Ausgaben enthalten alle PNG-Seiten in einem ZIP. Schreibgeschützte Freigabelinks bleiben verfügbar. Eine schwarze Bühne lässt sich für den Ausdruck unabhängig vom gespeicherten Projekt einstellen. Veranstalter-PDF und Projektkopien stehen mit der kostenlosen Pro-Beta bereit.
- **Location-Vorlagen:** über „Neues Projekt → Location-Vorlage → Location suchen“ erreichbarer, frei zugänglicher Beta-Katalog mit Suche nach Location, Stadt oder Bühne, sichtbaren Kategorie-Buttons und maßstäblicher Vorschau. Alle Einträge sind ohne Account, Code oder Pro-Aktivierung nutzbar und lokal mitgeliefert. Start mit Maßskizzen von B72, MuTh und Volksoper Wien; Umfang, Originalquelle und Quellenstand stehen bei jedem Eintrag. „Auf dieser Bühne planen“ legt eine unabhängige Veranstaltung an. Details und Pflege: [BUEHNENKATALOG.md](BUEHNENKATALOG.md).
- **Ein gemeinsamer Projekteinstieg:** „Neues Projekt“ bündelt „Bühne selbst festlegen“, „Location-Vorlage“ und „Meine Bühnenvorlagen“. Bandname und Eingaben bleiben beim Wechsel erhalten. Gespeicherte Bühnen erscheinen direkt als auswählbare Vorlagen; separate Startbuttons für Hausbühnen oder den Katalog entfallen.
- **Projekte anlegen:** Band + Location ergeben den Projektnamen. Breite und Tiefe direkt in Metern mit bis zu zwei Nachkommastellen oder über ±1-m-Tasten eingeben. Aufbauoptionen sind offen sichtbar. Am Handy bleibt die Abschlussleiste auch bei Tastatur und kleiner Safari-Fensterhöhe erreichbar; kompakte Navigation und Projektkarten lassen mehr Platz für vorhandene Projekte.
- **Hausbühnen und freie Grundrisse:** Neue Projekte starten unter „Neues Projekt“; den Grundriss bearbeitest du danach unter „Bühnenform“ im Editor. Dort lassen sich unter „Vorlage“ auch eigene Bühnenvorlagen speichern. Rechteck, runde Vorbühne, Kreis/Oval, Trapez, Steg, T-/L-/U-Form, Seitenbühnen und Treppennischen; beliebige Umrisse zeichnen und Kanten oder Punkte bearbeiten. Ein Klick auf eine Grundform fügt sie rechts neben dem vorhandenen Aufbau hinzu. Bestehende Elemente und Hausangaben bleiben erhalten; jeder Neuzugang lässt sich mit einem Undo-Schritt zurücknehmen.
- **Feste Einbauten:** rechteckige, kreisförmige und ovale Ausschnitte, Säulen, Wände, Zugänge, Vorhang/Portal, Treppen, Rampen, FOH und freizuhaltende Bereiche. „Runder Ausschnitt“ ergibt bei gleicher Breite und Tiefe einen Kreis, sonst ein Oval. Exakte Zahlen bleiben erhalten; Griffe bewegen sich wahlweise in 10-cm-Schritten. Zwei Finger verschieben und zoomen den Grundriss.
- **Direkte Formauswahl und Kantenmaße:** beschriftete Formkarten unter „Bauelemente“ und „Grundformen“, auf schmalen Bildschirmen horizontal scrollbar. Maße stehen entlang der Kanten bzw. der Breite und Tiefe von Rundungen. Gleiche gegenüberliegende Kanten mit derselben Ausdehnung werden je Bauteil nur einmal bemaßt; Breite und Tiefe bleiben erkennbar. Nur das ausgewählte Bauteil zeigt seine vollständige Hilfskontur; ein Tipp auf den Hintergrund zeigt wieder den zusammenhängenden Grundriss mit Gesamtmaßen. Der Export bemaßt die freiliegenden geraden Kanten und vermeidet Wiederholungen der Gesamtmaße.
- **Einheitliche Elementaktionen:** Die schwebende Werkzeugleiste im Hausgrundriss entspricht den Bühnenobjekten: ±45°, stufenloses Drehen beim Halten, 0°-Reset, nach hinten, sperren, duplizieren und entfernen. Das Rechtsklickmenü funktioniert im Plan und in der Elementliste. R/Shift+R, Pfeiltasten, Entf und Undo/Redo gelten auch hier. Drehungen erhalten den Elementmittelpunkt; eine gehaltene Drehung bildet einen Undo-Schritt.
- **Hausvorlagen:** lokale, revisionierte Bühnenbibliothek mit ausgewähltem festem Equipment. „Neue Veranstaltung“ erstellt eine unabhängige Kopie. Umrisse, Höhen und Hausnotizen bleiben in Projektdateien, Vorschau und Freigabelinks erhalten.
- **Bühneneditor** mit Bausteinkatalog, Drag & Drop, Drehen, Sperren, Ebenen-Liste (Rechtsklick: 90° drehen/Duplizieren/Sperren/Löschen). Neun eigens gerenderte, lokal mitgelieferte Werkzeug-Icons mit sichtbaren Namen und Aktiv-Häkchen erklären Bewegen, Einrasten, Raster, Namen, schwarze Bühne, Ausgänge, Bühnenbearbeitung, IEM/Rack und Leeren. Auf kleinen Canvas-Flächen ordnen sich Werkzeug- und Zoomleiste ohne Überlappung an. [Icon-Assets und Prompts](stageplot-assets/toolbar/manifest.json).
- **Treppen und Rampen als Bausteine:** direkt und kostenlos unter „Bühnenelemente“ platzieren, auch außerhalb des Bühnenrands. Gemeinsame Objektaktionen zum Drehen, Duplizieren, Sperren und Entfernen; Breite/Tiefe per Griffe in 10-cm-Schritten oder über die Eigenschaften ändern. Kantenmaße und Aufstiegsrichtung erscheinen im Plan und Ausdruck; Größe und Drehung bleiben in Entwürfen und Projektdateien erhalten.
- **Bühne & Treppe direkt auf dem Canvas** in der Größe ziehen — smooth mit Live-Redraw; Treppe zusätzlich breitenverstellbar per Pfeile inkl. Reset auf Standardbreite.
- **IEM-/Rack-Bereich** auch außerhalb der Bühne platzierbar. Riser, IEM-Fläche und FOH lassen sich über Griffe in 10-cm-Schritten skalieren; Zwei-Finger-Gesten sind vorbereitet. Riser zeigen Breite, Tiefe und Aufbauhöhe jeweils einmal kompakt am Rand. Eigene Namen stehen ebenfalls am Rand; die Angaben berücksichtigen Instrumente und deren Beschriftungen und verdecken keine Objekte mit einer großen Beschriftungsbox.
- **Technik & FOH** in den Projektdaten: Strombedarf und Signalübergabe mit Ort und Anschlussart. Der FOH-Platz enthält Maße, Strombedarf sowie Tisch, Absperrung, Sonnen- und Regenschutz.
- **IEM-Monitore:** Beim Platzieren 1–16 Monitor-Mixe einrichten. Pro Musiker:in Mono/Stereo, Funk/Kabel, Frequenzbereich und AUX-Nummern direkt wählen; physische Stagebox-Ausgänge über die gemeinsame Buchsenauswahl verbinden. Dieselbe Übersicht öffnet am Objekt, im Routing und an belegten Buchsen. Bestehende Zuordnungen bleiben erhalten; Undo, Offline-Speicherung und Export verwenden dieselben Daten. [Bedienung](AUDIO_BEDIENUNG.md#iem-monitore).
- **Funkfrequenzen** an Instrumenten und IEM-Racks sowie in Routing und Export.
- **Gerenderte Kategorien:** sechs eigens generierte, lokal mitgelieferte Bild-Icons in einem einheitlichen Stil. Zwei gleichmäßige Reihen mit dauerhaft sichtbaren Namen, auch bei Touch. Orchester ist an Cello, Harfe und Horn erkennbar; die Orchester-Karte nutzt dasselbe Bild. Die maßstäblichen Instrumentbilder im Plan bleiben unverändert. [Assets, Herkunft und Prompts](stageplot-assets/categories/manifest.json).
- **Mein Inventar** mit Modellen, Stückzahlen, Frequenzen, Strombedarf und Plansymbolen. Equipment direkt platzieren und den verwendeten Bestand im aktuellen Plan sehen.
- **Drum-Designer** direkt über den schwebenden „Open Drumdesigner“-Button am ausgewählten Drumset öffnen; das breitere Eigenschaften-Panel ändert Trommel- und Beckengrößen übersichtlich per −/+, 93 Mikrofonmodelle werden mit derselben Fotoauswahl, Sofortsuche, Herstellerfiltern und Favoriten wie im Audio-Plan gewählt; Overhead-Mikrofone sind direkt erreichbar, Becken wechseln exklusiv zwischen eigenem Mic und OH L/R, und die Hi-Hat startet mit einem SM57.
- **Percussion-Set** direkt neben Schlagzeug, mit eigenem **Percussion-Editor** und 18 Instrumentvarianten: Quinto/Conga/Tumba, Bongos, Timbales, Pandeiro, Cowbell, Jam Block, Tamburin, Bar Chimes, Maracas, Crash, Splash, Ride, China, Hi-Hat, Multipad und Tisch. 16 eigens generierte, freigestellte Draufsicht-Bildassets erscheinen in Graustufen im Editor, Bühnenplan, in Projektvorschauen und Exporten. Alle 18 Varianten mit einer schwebenden Drehleiste wie im Drumdesigner stufenlos drehen und auf 0° zurücksetzen, auch per Touch. Beckengrößen direkt über Zoll-Buttons wählen: Splash 6–12″, Crash 14–20″, Ride 18–24″, China 12–22″ und Hi-Hat 10–16″. Instrumente verschieben, in Zentimetern bemaßen, duplizieren und ihre Abnahme wählen; Vorlagen, Undo/Redo und mobile Bedienung sind enthalten. Kanäle landen im gemeinsamen Audio-Plan. [Bedienung, Datenmodell und Asset-Herkunft](PERCUSSION.md).
- **Symphonie-Orchester & Klassik:** komplette, anpassbare Aufstellung mit schaltbaren Registern sowie 25 Einzelinstrumenten als realistische monochrome Bildassets. Orchester-Editor mit Besetzungszählern, Stühlen/Pulten, Einzelpositionen, Drehung, cm-Maßen und optionalen Mikrofonkanälen. Dieselbe metrische Geometrie gilt in Bühne, Vorschau und Export. Die Vorlage folgt der belegten antiphonalen Aufstellungsart; Besetzung und Abstände sind veränderbare Planungswerte. [Bedienung, Recherche, Maßstab und Bildherkunft](ORCHESTER.md).
- **Stageplotter-Branding** mit normaler Wortmarke im Free-Plan, PRO-Wortmarke bei aktivem Pro-Plan und großem Otter-Logo neben „Projekte“; das bisherige Headerlogo bleibt als Ladefehler-Fallback erhalten.
- **Metallisches Menüband** mit stets mittiger Navigation, limefarbener aktiver Ansicht, einem der Maus folgenden rosa Hover-Unterstrich und Projektangaben direkt vor dem Speicherstatus.
- **Versteckter Otter mode** für neugierige Mehrfachklicker auf das Headerlogo.
- **Stabiler App-Viewport** mit separat scrollenden Projekt- und Routinglisten statt eines springenden Seiten-Scrollbalkens.
- **Kostenlose Pro-Beta-Umschaltung** direkt auf der Projektseite; ein Wechsel zurück zum Standard-Modus ist jederzeit möglich.
- **Gemeinsamer Audio-Plan:** Verwendete Signale sind die gemeinsame Grundlage für Bühnenobjekte, Input-/Outputlisten, Stagebox-Ports und PDFs. Derselbe Signal-Editor öffnet sich am Objekt, in der Liste und an einem belegten Stagebox-Port. Direkte Bereiche für Abnahme, Signalweg, Kanäle sowie Notizen & Funk halten den Dialog übersichtlich. Instrument, Kanalnummer und aktuelle Zuordnung bleiben sichtbar. Hersteller-Tasten, Modellkarten und eine Sofortsuche greifen auf denselben Mikrofonkatalog wie der Drum-Editor zu; 81 der 88 konkreten Mikrofoneinträge besitzen Original-Herstellerfotos (78 Bilddateien, zusammen unter 2,5 MB); allgemeine Mikrofontypen bleiben neutral. Die Bilder laden erst bei Bedarf. Bei Modellfamilien ist die abgebildete Variante genannt. Favoriten und zuletzt verwendete Modelle stehen in beiden Editoren bereit. Mikrofon und 48 V werden zwischen Drumset und Audio-Kanal in beide Richtungen abgeglichen; CH, Patch und Notizen bleiben erhalten. Gerätebuchsen sind getrennte Kapazitätsangaben; neue Keyboards starten mit Stereo L/R, zusätzliche Signale lassen sich gezielt aktivieren.
- **Stabile Kanäle:** CH bezeichnet den Mischpultkanal, IN/OUT am Patch die Stagebox-Buchse. Nummerieren und Stagebox-Zuordnung sind getrennte Aktionen. Sortieren verschiebt Stereo-Paare gemeinsam und erhält Kanalnummern; auf Mobilgeräten stehen Signalkarten und Auf-/Ab-Tasten bereit.
- **Signalwege statt doppelter Inputs:** Mono-Kanäle wie Gitarre, Amp und Mikrofon lassen sich im Signal-Editor ausdrücklich zusammenführen. Die ursprünglichen Kanäle bleiben zum Wiederherstellen gespeichert. Bestehende Projekte behalten ihre aktiven Signale, Namen, Nummern und Zuordnungen. Entfernte Signale werden nicht automatisch neu angelegt.
- **Lesbare Audio-Unterlagen:** Auf dem Plan stehen Kanalnummern, Strom- und FOH-Anforderungen. Die Inputliste trennt Quelle, Mikrofon/DI, 48V, Stagebox-Port und Notizen; Outputs/Monitore einschließlich IEM und Funkangaben stehen separat. Eine Stagebox-Patchliste ist optional. CSV/XLSX und portable Projektdateien bleiben verfügbar.
- **Einheitlich anschließen:** Signal auswählen → freie Buchse antippen oder in der Stagebox-Belegung Buchse antippen → Signal wählen. Beide Wege speichern sofort, mit direktem Rückgängig. Beim Anschluss aus dem Signal-Editor werden seine Änderungen atomar übernommen. CH/Mix bleibt von IN/OUT unabhängig; Stereo bleibt zusammen. Belegte Buchsen bieten ausdrückliches Tauschen oder Ersetzen. Noch freie Kanäle eines Instruments können nach einer gemeinsamen Buchsenvorschau als Gruppe angeschlossen werden.
- **Stagebox-Belegung:** Große Buchsen zeigen Signal und Pultkanal. Geräte per Bildkarte wählen; Name und Buchsentyp stehen in getrennten Geräteeinstellungen. Keine automatisch aufspringende Detailleiste und kein Kabelzeichnen. Die gemeinsame Verbindungsauswahl öffnet am Handy als Fenster vom unteren Rand, ohne die Tastatur automatisch einzublenden.
- **Komplexe Bühnen** aus magnetisch anklippbaren 2 × 1-m-Modulen sowie maßstäbliche Treppen mit Breite, Tiefe und verankerter Skalierung.
- **Bündig einrasten:** Treppen, Rampen, Bühnenmodule und Riser richten sich bei aktiviertem Raster an den tatsächlichen Bühnenkanten aus, auch bei ungeraden Bühnenmaßen. Im Bühnenbauer gilt das ebenso für verschiebbare Flächen, Treppen und Rampen. Kanten haben Vorrang vor dem Raster; Pfeiltasten und ausgeschaltetes Raster erlauben freie Korrekturen.
- **Gerenderte Technik-Draufsichten:** 30 lokale monochrome Bildassets für Technik, Mikrofone und Gitarrenständer. Boom-Mikrofone zeigen einen ausgezogenen 74,5-cm-Arm mit erkennbarem Rohr und einen separat gerenderten, zur besseren Erkennung bewusst vergrößerten Mikrofonkopf, der bei links/rechts schwenkendem Arm nach oben zeigt. Neue 3er-Ständer und Gitarrenbäume leer/voll in Draufsicht, kräftigere Mikrofonkörper, unverzerrte Stromleisten und Wedges. Kalibrierter kompakter Hocker mit 30-cm-Sitz und 43-cm-Fußkreis, auch im Drum-Designer. Bilder werden proportional skaliert; Breite und Tiefe sind gekoppelt. [Assets und Herkunft](stageplot-assets/tech/manifest.json), [Prompts](stageplot-assets/tech/prompts.json), [Maße](MASSTAB.md).
- **Technische Topviews** für Teleprompter, Wedges, Licht, Effekte, Nebelmaschine und Flightcases.
- **Object Packs** mit Shop-Vorschau, lokalen Offline-Freischaltungen, signierten Codes, Beta Crew Pass und Crew Rewards.
- **Projektverwaltung** mit Karten-Vorschau, direktem Umbenennen, portablem Download und abgesichertem Löschen.
- **Dauerhafte Projekt-ID** auf jeder Projektkarte und in den Projektdaten, per Klick kopierbar und über die Projektsuche auffindbar. Bestehende lokale Projekte erhalten automatisch eine ID; Umbenennen, normales Speichern und Gerätesync behalten sie bei. „Projekt duplizieren“, importierte Kopien und Konfliktkopien erhalten eigene IDs. Der Speicherstatus unterscheidet lokale Speicherung, offene Änderungen und tatsächlich bestätigten Sync.
- **Playback-Laptop:** Stereo L/R, PLAYAUDIO1U mit zwölf symmetrischen XLR-Ausgängen oder Dante Virtual Soundcard über ein Netzwerkkabel direkt wählen. Ausgangspaare benennen (z. B. 1–2 Intro, 3–4 Percussion), in zwei Mono-Signale teilen und benötigte Kanäle aktivieren. Dante-Sendekanäle und Übergabeziel festlegen; keine Zuweisung auf analoge Stagebox-Buchsen. Namen, physische Ausgangsnummern und Netzwerkübergabe erscheinen im gemeinsamen Audioplan und Export. [Bedienung und Herstellerquellen](PLAYBACK.md).
- **Outs am Symbol** global per Toolbar-Button ein-/ausblendbar.
- **Offline-first mit optionalem Account-Abgleich** für Projekte, Entwürfe, Vorlagen und Inventar. Lokale Speicherung bleibt primär; Übertragungen werden vorgemerkt, gleichzeitige Änderungen als Konfliktkopien erhalten. Ohne konfigurierte Supabase-Anbindung bleibt der Account-Dienst deaktiviert.

Details zum neuen Signal-Editor, zur Stagebox-Schnellauswahl und zu den Originalfotos: [Audio-Bedienung](AUDIO_BEDIENUNG.md).

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

35 Testgruppen prüfen unter anderem lokale Wiederherstellung, identische Einstiegspunkte, Drumlogik, 10-cm-Resize, simulierte Touch-Gesten, Produktionsdaten, Inventar, Katalogkopien mit Quellenangaben und Gerätesync mit einem simulierten RPC-Server. Ein echter Supabase- und Touch-Hardware-Test steht noch aus.

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
