# Prüfung der Handyansicht

Stand: 11. September 2026 · v0.1.0-beta.7

Der mobile Editor hat eine feste untere Leiste für Bausteine, Eigenschaften und Werkzeuge. Die vorhandenen Steuerelemente und Daten bleiben dieselben wie am Desktop. Auf schmalen Bildschirmen liegen die großen Werkzeug-Icons in einer ausdrücklich geöffneten Bedienfläche. Bausteine und Eigenschaften öffnen breite Panels; eine Objektauswahl verändert ihren offenen oder geschlossenen Zustand nicht.

Beim Antippen eines Bausteins schließt die Bibliothek und die Bühne erwartet die Platzierung. Zwei Finger zoomen und verschieben die Ansicht. Bei einer ausgewählten veränderbaren Fläche (Podest, FOH, Treppe/Rampe oder IEM-Bereich) bleibt die vorhandene Größen-Geste bestehen. „Einpassen“ zeigt wieder den gesamten Aufbau einschließlich außen liegender Elemente. Die metrischen Objektgrößen werden dafür nicht verändert.

## Automatische Prüfungen

- `npm run build` und `npm test`: 38 Testgruppen. Ergänzte Tests üben die echten Zwei-Finger-Handler aus: Zoomen, Verschieben, Ignorieren eines dritten Fingers, Abbruch mit Wiederherstellung der Kamera und unveränderte Objekt-/Undo-Daten. Bestehende Tests prüfen weiterhin Größen-Gesten für Podeste.
- Kameratests: reale Außenmaße einschließlich Treppe, außen liegende Objekte beim ausdrücklichen Einpassen, stabile Ansicht während Objektbewegungen und unveränderte Desktop-Ränder.
- Browserabläufe in Chrome und WebKit mit Touch-Emulation: 390 × 640, 320 × 568, 375 × 600, 430 × 740 sowie 844 × 390 Pixel. Platzieren, Drehen, manuell gesteuerte Panels, Werkzeugwechsel, Zoom und Einpassen, Routing-Wechsel, gespeicherte Projekte nach Reload, Offline-Bearbeitung und Dunkelmodus.
- In Chrome zusätzlich eine Zwei-Finger-Geste über native Browser-Touch-Ereignisse. Desktop-Kontrolle bei 1600 × 1000 Pixeln: normale Werkzeugleiste sichtbar und bedienbar, mobile Schaltflächen verborgen.

Bei 390 Pixeln Fensterbreite nimmt eine rechteckige 8-m-Bühne mit vorderer Treppe jetzt etwa 337 Pixel ein (vorher etwa 249 Pixel im gleichen Fenster). Maße liegen neben dem Bühnenrand. Die Bedienflächen berücksichtigen den unteren Sicherheitsabstand; der Editor reagiert auf die sichtbare Browserhöhe.

Die Browserprüfungen ersetzen keine Prüfung auf einem physischen iPhone. Safari-Leisten, Bildschirmtastatur und Gerätesicherheitsabstände sollten beim nächsten echten Handytest zusätzlich kontrolliert werden.

## Nachbesserung vom 11. September 2026

Ein echter außerhalb platzierter Baustein reproduzierte eine 421 Pixel hohe Warnfläche bei 390 × 640 Pixeln. Ursache: Die mobile `top`-Angabe traf auf eine spezifischere alte `bottom`- und Zentrierungsregel. Der vollständige mobile Positionsanker wird jetzt gemeinsam zurückgesetzt; die Höhe folgt dem Text.

Der Browser-Regressionstest `scripts/check-mobile-warning.cjs` prüft diesen Zustand in Chrome und WebKit bei 320–844 Pixeln, mehrzeilige Warnungen, Dunkelmodus, erreichbare Bedienflächen und eine beim Ein-/Ausblenden unveränderte Bühnenansicht. Bei laufender Vorschau und verfügbarem Playwright: `node scripts/check-mobile-warning.cjs`; `BROWSER=webkit` wählt WebKit, `APP_URL` eine andere Vorschau oder die Live-Seite. Playwright kann bei Bedarf über `PLAYWRIGHT_MODULE` angegeben werden.


## Mehrfachauswahl und Favoriten · 11. September 2026

„Mehrere“ startet die Auswahl per Antippen; ein bereits ausgewähltes Objekt bleibt enthalten. Erneutes Antippen entfernt ein Objekt aus der Auswahl. „Fertig“ erhält die markierte Auswahl zum gemeinsamen Verschieben, „Bearbeiten“ öffnet die gemeinsamen Aktionen bewusst in den Eigenschaften. Gesperrte Objekte verhindern gemeinsame Positions- und Löschaktionen, bis sie entsperrt werden. Zwei Finger am Objekt drehen die gesamte Auswahl, ohne ihre Abstände oder Instrumentgrößen zu verändern. Auf freier Fläche und im Auswahlmodus bleibt die Kamerageste erhalten.

Favoriten werden über einen eigenen Stern mit 44-Pixel-Tippfläche markiert. Alle/Favoriten/Zuletzt benutzt sind direkte Filter; Suchkarten nutzen am Handy zwei Spalten, damit Stern und Instrumentenbild getrennten Platz haben. Favoriten und zwölf zuletzt platzierte Typen werden lokal außerhalb der Projektdateien gespeichert. Eine begonnene, dann abgebrochene Platzierung landet nicht im Verlauf.

`scripts/check-qol.cjs` prüft in Chrome und WebKit Shift-Klick, Antippen, gemeinsames Verschieben per Pfeiltaste und Maus, Ausrichten, Sperren, Kopieren/Löschen mit atomarem Undo, unabhängige Signal-IDs sowie Favoriten/Verlauf nach Reload. Die obere Handy-Werkzeugleiste wird bei 320–430 Pixeln auf Überlappungen geprüft. `scripts/check-mobile-library.cjs` prüft weiterhin 320–844 Pixel einschließlich simulierter Tastaturhöhen und Versatz. Diese Simulation ersetzt keinen Test mit der nativen iPhone-Tastatur.

## Zwei-Finger-Drehung · 11. September 2026

Im Bühneneditor mit dem ersten Finger ein Objekt berühren und mit dem zweiten Finger drehen. Eine aktive Mehrfachauswahl dreht sich gemeinsam um ihren Mittelpunkt. Im Auswahlmodus zuerst „Fertig“ drücken. Freie Fläche, der Verschiebemodus und gesperrte Objekte verwenden weiterhin die Kamera. Instrumente bleiben maßstäblich; Podeste, FOH, Treppen und Rampen behalten zusätzlich die Größenänderung in 10-cm-Schritten. Der ältere IEM-Flächenbereich bleibt achsenparallel und lässt sich skalieren.

Geprüft: 38 Testgruppen einschließlich Winkelübergang ±180°, Mindestabstand, Zitterschwelle, Gruppendistanzen, gesperrter Auswahl, Abbruch, Fokusverlust und kombinierter Riser-Skalierung/Drehung. `scripts/check-touch-rotation.cjs` prüft Einzeldrehung, Gruppendrehung, unveränderte Instrumentgrößen, Rückgängig, Abbruch und Offline-Reload bei 390 × 740 px. Chrome nutzt native Touch-Ereignisse via CDP; WebKit verwendet synthetische PointerEvents (keine echte iPhone-Multitouch-Prüfung). Der bestehende Chrome-QoL-Browsertest prüft weiterhin Auswahl, Drag, Kamera und Favoriten. Screenshot der mobilen Darstellung visuell geprüft.

## Kompaktes Routing · 11. September 2026

Die Kopfzeile enthält Titel, Kanalanzahl, „+ Signal“ und „Aktionen“. Inputs, Outputs und Stageboxen sind direkte Tabs. Jede Kanalkarte zeigt CH/OUT, Instrument, Mono/Stereo, Mikrofon und Anschluss; 48 V bleibt direkt bedienbar. Leere Notizen und doppelte Angaben entfallen. Antippen des Instrumentnamens öffnet den bestehenden Signal-Editor; „Anschließen“ öffnet dieselbe Buchsenauswahl wie bisher. Seltene Werkzeuge erscheinen in einem expliziten Dialog mit Schließen-Taste. Beim Wechsel zur Desktopbreite kehren dieselben Buttons an ihre ursprünglichen Stellen zurück.

Browserprüfung: `scripts/check-mobile-routing.cjs`, Chrome und WebKit, frischer synthetischer Entwurf mit 22 Inputs, einem Output und einer Stagebox. Geprüft sind Nummerierung/Rückgängig, Suche und Zurücksetzen, Signal- und Anschlussdialog, alle drei Tabs, Aktionsdialog und Rückkehr zur Desktopansicht bei 320 × 568, 390 × 670, 430 × 800, 740 × 390 und 1440 × 900 px. Bei 390 × 670 px bleiben 285 px für die Kanalliste. Handy-, Stagebox- und Aktionsansicht anhand von Screenshots geprüft; kein physischer iPhone-Test. Alle 38 Testgruppen bestehen.

## Mehr Suchtreffer über der Tastatur · 11. September 2026

Während der mobilen Bausteinsuche stehen Suchfeld und Schließen in einer gemeinsamen 44-px-Zeile. Der separate Titel entfällt während der Eingabe; die Bibliothek behält ihren zugänglichen Namen. Darunter stehen Trefferzahl und eine scrollbare Liste mit 56-px-Zeilen: unverzerrtes Vorschaubild, Name, gegebenenfalls Modellanzahl und separater 44-px-Favorit. Ohne Suche bleibt die bisherige Kachelübersicht erhalten. „Fertig“/Enter beendet die Eingabe ohne Auswahl oder Verlust des Suchbegriffs.

Browserprüfung mit `scripts/check-mobile-library.cjs`: Chrome und WebKit, 320–844 px Breite sowie simulierte sichtbare Tastaturbereiche von 280–360 px und Safari-Versatz bis 48 px. Bei 390 × 344 px sichtbarem Bereich passen vier vollständige Treffer für „stag“. Geprüft werden Bild-/Text-/Sternabstände, Modellzeile, Favorisieren ohne Platzierung, Enter-Fokusfreigabe, erhaltene Suche, Scrollen, Leerzustand, Schließen, erste Touch-Auswahl und Desktopansicht. Screenshots der sichtbaren Fläche werden geprüft. Die Tastaturgeometrie ist simuliert; kein physischer iPhone-Test.

## Projektübersicht · 11. September 2026

„Projekt hinzufügen“ steht auf dem Handy vor Suche und Projektkarten. Titel sowie Account-/Importaktionen teilen sich eine kompakte Zeile. Projektkarten zeigen ein maßstäbliches Vorschaubild neben dem Namen; Maße und Bausteinanzahl stehen gemeinsam darunter. Gestrichelte Rahmen und die separate große ID-Fläche entfallen. ID-Kopieren, vollständiger Speicherstatus und alle bisherigen Projektaktionen bleiben erreichbar. Die Vorschau nutzt ein 4:3-Bildformat für rechteckige und freie Bühnen, ohne Objekte oder Umrisse abzuschneiden.

Browserprüfung: `scripts/check-project-dashboard.cjs` in Chrome und WebKit. Bei 390 × 670 px passt eine vollständige Standard-Projektkarte einschließlich aller Aktionen in den sichtbaren Bereich. Geprüft: Erstellen bleibt vor Suche/Projekten, Suche und leere Ergebnisse, Öffnen/Projektdaten, ID-Kopieren ohne versehentliches Öffnen, Sicherungsdownload, lange Namen, mehrere Projekte und Reload sowie 320–1440 px Breite. Helle und dunkle Darstellung anhand von Screenshots geprüft. Kein physischer iPhone-Test; alle 38 Testgruppen bestehen.

## Automatische Veröffentlichungsschranke · 11. September 2026

`npm run test:browser` startet ohne `APP_URL` einen eigenen lokalen Vorschau-Server und beendet ihn anschließend. `BROWSER=chromium` (Standard) und `BROWSER=webkit` wählen die Engine; `BROWSER=chrome` verwendet ein lokal installiertes Chrome. Playwright und Browser vorher mit `npm ci` sowie `npx playwright install chromium webkit` installieren (auf Linux gegebenenfalls `--with-deps`).

Vier isolierte Browserabläufe laufen bei Pull Requests und vor der Veröffentlichung: Projektübersicht, mobile Bausteinsuche, mobiles Routing und Projektaktionen. Letzterer prüft Einstellungen/Fokusrückkehr, Abbrechen von Leeren, IEM-Aktion, Sicherungsdownload, unabhängige Projektkopie, Reload und Import einer synthetischen Datei. Die vorhandenen Tests für lokale Daten und Migrationen bleiben zusätzlich aktiv. Screenshots werden unter `test-results/` gespeichert und in GitHub Actions als Artefakte angehängt. Beide Browserjobs und die Funktionstests müssen erfolgreich sein, bevor Pages veröffentlicht.

Die Tests verwenden synthetische Projekte in frischen Browserkontexten. Die Tastaturgeometrie bleibt simuliert; dies ersetzt keinen Test mit einer echten iPhone-Tastatur.

Die neue Linux-WebKit-Prüfung fand bei 320 px einen tatsächlichen Überlauf des Importbuttons. Die Kopfzeile verwendet nun eine feste Titelspalte und eine flexible Aktionsspalte; „Account & Inventar“ darf innerhalb seines verfügbaren Platzes schrumpfen. Die Überlaufprüfung wartet auf das fertige Layout und erzeugt bei Fehlern Geometriedaten und einen Screenshot.

## Bausteinleiste · 12. September 2026

Inventar sitzt neben dem Titel. Objekte/Packs verwenden eine schmale Tab-Markierung; Katalog, Favoriten und Zuletzt bleiben direkt bedienbar. Kategorien zeigen die vorhandenen lokalen Bild-Icons mit sichtbaren Namen, am Handy in zwei kompakten Reihen mit mindestens 44 px hohen Zielen. Karten und Favoriten sind optisch ruhiger; dunkle Gerätebilder bekommen im Dunkelmodus eine helle Vorschaufläche. Die einzeilige Suche mit separatem Schließen und den kompakten Treffern bei Tastatur bleibt erhalten.

Geprüft in Chromium und WebKit: Desktop und Handy, Hell/Dunkel, alle Kategorien, Packs/Objekte, Inventarzugang sowie der vorhandene mobile Suchablauf einschließlich simuliertem Tastaturbereich. 38 Funktionstestgruppen bestehen.
