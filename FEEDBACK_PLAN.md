# Instrumente, Routing und Export

Stand: 16. September 2026 · v0.1.0-beta.14. Lokal umgesetzt, noch nicht veröffentlicht. Die folgenden Abschnitte beschreiben den implementierten Umfang; Prüfgrenzen stehen am Ende.

## 1. Fehler und Datensicherheit zuerst

- **PDF:** Die Druckgrafik kopiert jetzt alle extern referenzierten Objektdefinitionen rekursiv in eigene SVG-Definitionen. Vor dem Druck werden Bilder und Schriften geladen. Die Browservorschau zeigt Drumset, Percussion, Orchesterinstrument, Mikrofon und mehrzeilige Notiz. 16 Objektverweise sind innerhalb des Druck-SVG auflösbar; es enthält 46 Bilder und 82 Drum-Teilmarkierungen. Eine tatsächlich gespeicherte PDF-Datei konnte wegen des gesperrten Macs noch nicht kontrolliert werden.
- **Auswahlfenster:** Stagebox-Belegung aus dem Bühnenplan, freie Buchse und Signalauswahl wurden bei Desktopbreite und 390 × 844 Pixeln geprüft. Die Zuweisung wurde gespeichert. Instrument- und Mikrofonpicker funktionierten ebenfalls. Der gemeldete Auswahlfehler ließ sich in dieser Umgebung nicht reproduzieren; eine allgemeine Fehlerbehebung wird deshalb nicht behauptet.
- **DI-Box:** Eine platzierte DI-Box einem bestehenden Instrumentensignal zuordnen und dessen Kanal am Objekt anzeigen. Die DI ist Teil des Signalwegs und darf beim Verknüpfen keinen doppelten Pultkanal erzeugen. Für eine zunächst allein platzierte DI muss sich eine Signalquelle anlegen oder später verbinden lassen.
- **Speicherhinweis:** Beim ersten Projekt und dauerhaft über den Speicherstatus zugänglich. Keine feste Aufbewahrungsdauer versprechen. Lokale Speicherung gilt für diesen Browser und dieses Profil. Website-Daten löschen, Browserprofil entfernen, privates Surfen und automatische Browserbereinigung erklären. Eine Sicherungsdatei muss unmittelbar herunterladbar sein; bestätigten Account-Abgleich separat anzeigen.

## 2. Routing

Ein Instrument besitzt ein oder mehrere Signale. Jedes Signal hat seinen eigenen vollständigen Signalweg:

**Instrument → Abnahme → Stagebox-Buchse → Pultkanal**

Die Hauptliste zeigt Instrumentgruppen, darunter ihre Signale. Spalten: Signal, Mikrofon/DI, Stagebox und Buchse, Pultkanal. Details wie 48 V, Anschluss und Bemerkungen bleiben direkt erreichbar, müssen aber nicht ständig die Liste verbreitern. Eingangssignale und Monitorausgänge erhalten getrennte Ansichten. Die Stagebox-Ansicht verwendet dieselben Daten und denselben Verbindungsdialog.

Beispiel:

| Instrument | Signal | Abnahme | Stagebox | Pult |
| --- | --- | --- | --- | --- |
| Akustikgitarre | DI | DI-Modell | A · IN 9 | CH 9 |
| Akustikgitarre | Mikrofon | Mikrofonmodell | A · IN 10 | CH 10 |

- **Mono:** ein unabhängiges Signal.
- **Stereo:** zwei zusammengehörige Signale L/R mit gemeinsamer Bedienung.
- **Dual Mono:** zwei unabhängige Signale desselben Instruments; eigene Namen, Abnahmen, Mikrofone, 48 V, Buchsen und Pultkanäle. Kein automatischer Stereo-Link.
- Instrumentgruppen und Signale können verschoben werden. Vorgeschlagene Ausgangsreihenfolge: Drums, Percussion, Bass, Gitarren, Tasten, weitere Instrumente, Playback, Gesang. Bestehende Kanalnummern nie stillschweigend ändern; Neunummerierung bleibt eine ausdrückliche Aktion.
- Unvollständige Zuordnungen sichtbar markieren; Konflikte an der betroffenen Buchse erklären. Auswahl und Bearbeitung müssen sowohl beim Instrument als auch in der Routingliste möglich sein.

## 3. Drums und Percussion

Gut sichtbarer Einstieg „Drums & Percussion“ in der Bibliothek sowie „Aufbau bearbeiten“ am ausgewählten Set. Ein gemeinsamer Aufbau enthält frei platzierbare Trommeln, Cajon, Becken, Kleinpercussion, elektronische Pads, Hocker und Gesangsmikrofone.

- Vorlagen: Drumset, Percussion, Cajon-Set, leerer Aufbau. Die Vorlage legt nur den Anfang fest; danach bleibt jedes Teil frei kombinierbar.
- Ein Cajon-Set aus Kick, Cajon und Crash besteht aus drei editierbaren Teilen, nicht aus einer einzigen fest gezeichneten Kombination.
- **Cajon-Grafik:** neue saubere Draufsicht der Cajon selbst. Mikrofone, Kick und Becken werden getrennt darüber bzw. daneben gerendert.
- **Cajon-Abnahme:** vorne an der Schlagfläche, hinten am Schallloch oder beide; je Position ein wählbares Mikrofon und ein eigenes Signal.
- **Crash:** optional, links oder rechts als Startposition und anschließend frei verschiebbar. Eigene Abnahme bzw. Overhead-Zuordnung.
- **Vocal-Mic:** Boom-Stativ als eigenes Teil, dreh- und verschiebbar, mit Modellauswahl und eigenem Gesangskanal.
- Bestehende Drum-/Percussion-Aufbauten und ihre Kanalzuordnungen müssen beim Laden erhalten bleiben. Gemeinsame Bearbeitung darf keine bestehenden Signale umnummerieren oder neu identifizieren.

## 4. Weitere Erweiterungen

| Bereich | Umsetzung |
| --- | --- |
| Treppen | Stufenanzahl in den Eigenschaften und in der Zeichnung; für eingefügte Bühnentreppen, Randtreppen und Treppen im Bühnenform-Editor konsistent speichern. |
| Mikrofone | Sennheiser MD 421 Kompakt im gemeinsamen Mikrofonkatalog und bei passenden Drum-Abnahmen anbieten. |
| Freie Notizen | Die vorhandene „Freie Beschriftung“ als gut auffindbares mehrzeiliges Textfeld anbieten; direkt bearbeiten, verschieben und in PDF/Bild ausgeben. Text sicher behandeln. Für Freigaben dieselben klaren Hinweise wie bei anderen sichtbaren Beschriftungen. |
| Akkordeon | Standardausrichtung neuer Objekte um 180° ändern. Bereits bewusst platzierte Objekte nicht nachträglich drehen. |
| Akustikgitarren | Gemeinsamer Modell-Picker, zunächst Dreadnought, klassische Gitarre und Gypsy-/Selmer-Bauform. Abnahme unabhängig vom Modell einstellen. |
| Streicher | Einzeln platzierte Streicher direkt in den Bühnen-Eigenschaften bearbeiten. Der Orchester-Editor bleibt für gemeinsame Aufstellungen und Gruppen. |

## Prüfstand

- `npm test`: 43 Testgruppen erfolgreich, einschließlich Migration alter Cajon-Kanäle, unveränderter bestehender Akkordeon-Ausrichtung, mehrzeiliger Texte, Stufenanzahl und stabiler DI-/Dual-Mono-Kanäle.
- `npm run check`: 25 Laufzeitmodule und acht eingebettete Skripte erfolgreich geprüft; Build und erzeugte HTML-Dateien sind abgeglichen.
- PostgreSQL/PGlite: alle Migrationen einschließlich 0007 sowie Datenbereinigung, Eigentümerrechte und Freigabeabläufe erfolgreich geprüft. Neue Instrumentfelder werden zwischen Browser- und Datenbankfilter identisch behandelt.
- Browser: DI an Gitarre CH 16 verknüpft und neu geladen; Dual Mono behält ersten Kanal und Patch; Cajon vorne/hinten mit MD 421 Kompakt, zusätzliches Crash und Vocal-Boom mit SM58 gespeichert und erneut geladen. Direkte Violine-Eigenschaften, Gypsy-Gitarre, sieben Treppenstufen, zweizeilige Notiz und Speicherhinweis geprüft. Instrumentgruppen verschieben sich ohne Öffnen eines Dialogs. Mobile Routingansicht visuell geprüft. Keine JavaScript-Fehler in diesen Abläufen.
- Bestandsaufbauten behalten ihre bisherigen Datenmodelle. Der bisherige Percussion-Editor bleibt für solche Objekte zuständig und bietet zusätzlich Kick, Snare, Cajon, Vocal-Boom und Mikrofonwahl; der Drum-Designer enthält die Percussion-Teile ebenfalls. Beide heißen „Drums & Percussion“.

**Noch offen vor Veröffentlichung:** tatsächlich erzeugte PDF auf Vollständigkeit und Seitenausgabe kontrollieren; den gemeldeten Auswahlfehler auf dem betroffenen Gerät nachvollziehen. Migration 0007 ist vorbereitet und lokal geprüft, aber noch nicht auf dem Freigabedienst angewandt. Die neue Version wurde weder gepusht noch veröffentlicht.

## Quellen für Produktdaten und Speicherhinweis

- Sennheiser MD 421 Kompakt: https://www.sennheiser.com/en-de/catalog/products/microphones/md-421-kompakt/md-421-kompakt-700587
- Browser-Speicher und Löschkriterien: https://developer.mozilla.org/de/docs/Web/API/Storage_API/Storage_quotas_and_eviction_criteria
- Web Storage im privaten Modus: https://developer.mozilla.org/en-US/docs/Web/API/Web_Storage_API
