# Prüfung der Handyansicht

Stand: 10. September 2026 · v0.1.0-beta.7

Der mobile Editor hat eine feste untere Leiste für Bausteine, Eigenschaften und Werkzeuge. Die vorhandenen Steuerelemente und Daten bleiben dieselben wie am Desktop. Auf schmalen Bildschirmen liegen die großen Werkzeug-Icons in einer ausdrücklich geöffneten Bedienfläche. Bausteine und Eigenschaften öffnen breite Panels; eine Objektauswahl verändert ihren offenen oder geschlossenen Zustand nicht.

Beim Antippen eines Bausteins schließt die Bibliothek und die Bühne erwartet die Platzierung. Zwei Finger zoomen und verschieben die Ansicht. Bei einer ausgewählten veränderbaren Fläche (Podest, FOH, Treppe/Rampe oder IEM-Bereich) bleibt die vorhandene Größen-Geste bestehen. „Einpassen“ zeigt wieder den gesamten Aufbau einschließlich außen liegender Elemente. Die metrischen Objektgrößen werden dafür nicht verändert.

## Automatische Prüfungen

- `npm run build` und `npm test`: 36 Testgruppen. Ergänzte Tests üben die echten Zwei-Finger-Handler aus: Zoomen, Verschieben, Ignorieren eines dritten Fingers, Abbruch mit Wiederherstellung der Kamera und unveränderte Objekt-/Undo-Daten. Bestehende Tests prüfen weiterhin Größen-Gesten für Podeste.
- Kameratests: reale Außenmaße einschließlich Treppe, außen liegende Objekte beim ausdrücklichen Einpassen, stabile Ansicht während Objektbewegungen und unveränderte Desktop-Ränder.
- Browserabläufe in Chrome und WebKit mit Touch-Emulation: 390 × 640, 320 × 568, 375 × 600, 430 × 740 sowie 844 × 390 Pixel. Platzieren, Drehen, manuell gesteuerte Panels, Werkzeugwechsel, Zoom und Einpassen, Routing-Wechsel, gespeicherte Projekte nach Reload, Offline-Bearbeitung und Dunkelmodus.
- In Chrome zusätzlich eine Zwei-Finger-Geste über native Browser-Touch-Ereignisse. Desktop-Kontrolle bei 1600 × 1000 Pixeln: normale Werkzeugleiste sichtbar und bedienbar, mobile Schaltflächen verborgen.

Bei 390 Pixeln Fensterbreite nimmt eine rechteckige 8-m-Bühne mit vorderer Treppe jetzt etwa 337 Pixel ein (vorher etwa 249 Pixel im gleichen Fenster). Maße liegen neben dem Bühnenrand. Die Bedienflächen berücksichtigen den unteren Sicherheitsabstand; der Editor reagiert auf die sichtbare Browserhöhe.

Die Browserprüfungen ersetzen keine Prüfung auf einem physischen iPhone. Safari-Leisten, Bildschirmtastatur und Gerätesicherheitsabstände sollten beim nächsten echten Handytest zusätzlich kontrolliert werden.
