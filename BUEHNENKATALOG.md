# Bühnenkatalog · kostenlose Beta

„Bühnen finden“ auf der Projektseite öffnet den Katalog. Der Einstieg steht zusätzlich im Dialog zum Anlegen eines Projekts; dort wird ein bereits eingetragener Act übernommen. Suche nach Name, Stadt, Bühne und Schlagworten; Umlaute und Schreibweisen wie „guertel“ sind austauschbar. Die Kategorieauswahl besteht aus sichtbaren Buttons.

Alle Katalogeinträge lassen sich während der Beta direkt verwenden, auch im Standard-Modus mit bestehenden Projekten. Weder Account, Pro-Aktivierung, Kauf noch Freischaltcode sind nötig. Der Katalog und seine SVG-Vorschauen sind in die HTML eingebettet. Nur das bewusste Öffnen der Originalquelle benötigt eine Verbindung zur Website der Location.

## Erste Einträge und Erfassungsumfang

Die ersten drei Einträge sind selbst erzeugte rechteckige Maßskizzen nach veröffentlichten Angaben der jeweiligen Häuser. Sie sind keine von den Locations bestätigten vollständigen Hauspläne. Nicht erfasste Zugänge, FOH-Plätze oder Einbauten werden nicht ergänzt. Bühne und IEM-Zone starten mit „unbekannt“ für den Zugang bzw. die Reservierung; die Geometrie ist als ungeprüfte Skizze markiert.

| Location | Erfasste Maße | Originalquelle und Stand |
| --- | --- | --- |
| B72, Wien | Ungefähre Breite 4,18 m, Tiefe 4,27 m, Bühnenhöhe 0,60 m. | [Booking & Tech](https://www.b72.at/booking-and-tech), ohne Datumsangabe. |
| MuTh, Wien | Maximale Breite hinter dem Portal 16 m und Hauptbühnentiefe 8,5 m, Bühnenhöhe 0,9 m, lichte Höhe 6,5 m. Vorbühne und Graben sind nicht abgebildet. | [Technische Ausstattung](https://muth.at/wp-content/uploads/Das-MuTh-Technische-Ausstattung.pdf), September 2021. Der historische Stand wird ausdrücklich angezeigt. |
| Volksoper Wien | Nutzbare Breite 17,2 m und Tiefe 19 m von der vorderen Portalkante bis zum Schiebefalttor. Diese Maße beschreiben nicht die gesamte Bühnenfläche oder die Portalöffnung. | [Technik hinter den Kulissen](https://www.volksoper.at/volksoper_wien/information/ueber_volksoper/Ueber_die_Volksoper.php), ohne Datumsangabe. |

Alle drei Quellen wurden am 8. September 2026 abgerufen. Das Abrufdatum ist kein Datum einer Vermessung oder Aktualisierung durch das Haus. Es werden keine fremden Planbilder, Logos, kompletten Rider oder personenbezogenen Kontaktdaten mitgeliefert.

## Projekte und bestehende Daten

„Auf dieser Bühne planen“ erstellt einen neuen lokalen Entwurf. Der vorherige Entwurf wird zuerst gesichert. Scheitert dessen Sicherung, wird der Wechsel abgebrochen. Der Name der Location steht in den Projektdaten, die Katalogkennung und Revision in `stage.venueRef`, Quelle und Umfang in `stage.geometry.notes`.

Änderungen am Veranstaltungsprojekt ändern keinen Katalogeintrag. Hausvorlagen bleiben eine separate lokale Bibliothek. Projektdateien und Read-only-Links erhalten Geometrie, Quellenangaben und Herkunft; vorhandene Formate und Speicherkeys bleiben unverändert. Die Übernahme verwendet keine Cloud-Schreibvorgänge.

## Pflege und nächste Ausbaustufe

Quelldaten und Oberfläche liegen in `stageplot-venue-catalog-v1.js`, die Gestaltung in der gleichnamigen CSS-Datei. Neue Einträge brauchen eine stabile Kennung, nachvollziehbare Maße mit eindeutig zugeordneten Achsen, eine Originalquelle, deren Datenstand sowie den klar beschriebenen Erfassungsumfang. Bei inhaltlichen Änderungen die Revision erhöhen. Danach `npm run build` und `npm test` ausführen; eingebettete Blöcke werden ausschließlich vom Build erzeugt.

Der aktuelle Katalog wird mit der App versioniert. Eigenständiges öffentliches Einreichen, Freigeben und Aktualisieren durch Locations ist noch nicht enthalten. Bestätigte vollständige Hausgrundrisse und weitere Orte können anschließend ergänzt werden. Eine Online-Veröffentlichung durch Locations braucht eine eigene Berechtigungs- und Versionsverwaltung.
