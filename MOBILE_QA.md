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

„Mehrere“ startet die Auswahl per Antippen; ein bereits ausgewähltes Objekt bleibt enthalten. Erneutes Antippen entfernt ein Objekt aus der Auswahl. „Fertig“ erhält die markierte Auswahl zum gemeinsamen Verschieben, „Bearbeiten“ öffnet die gemeinsamen Aktionen bewusst in den Eigenschaften. Gesperrte Objekte verhindern gemeinsame Positions- und Löschaktionen, bis sie entsperrt werden. Zwei Finger verwenden bei Mehrfachauswahl die Kamerageste statt die Größenänderung eines einzelnen Podests.

Favoriten werden über einen eigenen Stern mit 44-Pixel-Tippfläche markiert. Alle/Favoriten/Zuletzt benutzt sind direkte Filter; Suchkarten nutzen am Handy zwei Spalten, damit Stern und Instrumentenbild getrennten Platz haben. Favoriten und zwölf zuletzt platzierte Typen werden lokal außerhalb der Projektdateien gespeichert. Eine begonnene, dann abgebrochene Platzierung landet nicht im Verlauf.

`scripts/check-qol.cjs` prüft in Chrome und WebKit Shift-Klick, Antippen, gemeinsames Verschieben per Pfeiltaste und Maus, Ausrichten, Sperren, Kopieren/Löschen mit atomarem Undo, unabhängige Signal-IDs sowie Favoriten/Verlauf nach Reload. Die obere Handy-Werkzeugleiste wird bei 320–430 Pixeln auf Überlappungen geprüft. `scripts/check-mobile-library.cjs` prüft weiterhin 320–844 Pixel einschließlich simulierter Tastaturhöhen und Versatz. Diese Simulation ersetzt keinen Test mit der nativen iPhone-Tastatur.
