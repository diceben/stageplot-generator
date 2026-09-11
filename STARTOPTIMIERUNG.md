# Start und Codepflege

Stand: 10. September 2026 · v0.1.0-beta.7

## Behoben

- Das alte Bühnenformular war als einzige Arbeitsansicht im initialen HTML sichtbar. Während die nachfolgenden Skripte luden, wurde „Wie viel Platz habt ihr?“ bereits dargestellt. Es startet jetzt verborgen. Eine kleine Ladeansicht hält die App bis zur Wiederherstellung von Projekt und Ansicht unsichtbar und nicht bedienbar. Bei einem Startfehler gibt es einen erneuten Ladeversuch ohne Eingriff in gespeicherte Daten.
- Ein früherer Demo-Aufbau mit acht Objekten wurde bei jedem Start angelegt und danach normalerweise überschrieben. Dieser Startblock ist entfernt. Ohne geöffnetes Projekt beginnt die App mit der Projektübersicht.
- Der allgemeine Zeichen-Callback rief für jede Ansicht außer Bühne und Setup die Druckansicht auf. Dashboard, Routing und Projektdaten bauen jetzt keine versteckte Druckseite mehr auf. Auch ein Ansichtswechsel vor einem bereits geplanten Zeichen-Frame wird berücksichtigt.
- Die Bibliothek wurde beim Start zweimal und die Pack-Vorschau dreimal aufgebaut. Die Inhalte werden jetzt erst beim Öffnen des betreffenden Bereichs erzeugt; der versteckte Pack-Bereich wird nicht mit jedem Bibliotheksfilter erneut aufgebaut.
- Statische Bilder in geschlossenen Bereichen, insbesondere dem Drum-Editor, nutzen natives verzögertes Laden. Das sichtbare Headerlogo bleibt unmittelbar verfügbar.
- 13 Hilfsfunktionen ohne Produktionsaufrufe wurden entfernt: `openSetupLibrary`, `createNewProject`, `nextFreeChannelNumber`, `nearestAvailableStagebox`, `moveRoutingRow`, `renumberRoutingRows`, `renderTechnicalDocument`, `routingTableMarkup`, `drumDesignerLabels`, `drumInput`, `drumText`, `drumCheck`, `drumSelect`.
- Historische Tests, die ausschließlich entfernte Implementierungen voraussetzten, wurden angepasst. Die Sicherung vor einem Projektwechsel wird jetzt am tatsächlich verwendeten Projektdialog geprüft, einschließlich Speicherfehler.

## Vergleichsmessung

Lokale Chrome-Vorschau, frischer Browserkontext ohne Projekte oder Cache, 1440 × 1000 px. Beide Läufe verzögern die Cloud-Konfigurationsdatei um 600 ms, um die problematische Startphase sichtbar zu machen. Das Zeitfenster nach dem Laden und die Instrumentierung sind gleich. Die Zahlen beschreiben diese leere Startansicht, keine allgemeine Zeitgarantie für große Projekte.

| Kennzahl | Vorher | Nachher |
| --- | ---: | ---: |
| Zusätzlich zum HTML geladene Ressourcen | 61 | 7 |
| Deren entpackte Dateigrößen | 4.811.128 Byte | 1.155.387 Byte |
| DOM-Elemente nach dem Start | 6.394 | 2.010 |
| Elemente der internen Zeichnungsbibliothek | 3.675 | 1 |
| Beobachtete Frames mit sichtbarem Setup-Formular | 35 | 0 |

Die lokale Vorschau bettet den Account-Client ein; die öffentliche Seite liefert ihn als zusätzliche Datei. Übertragungsgrößen hängen außerdem von Browser-Cache und HTTP-Kompression ab. Bereits gespeicherte Projekte benötigen die Bilder ihrer tatsächlichen Vorschauen weiterhin.

## Verbleibende größere Arbeiten

1. **CSS zusammenführen.** Nach der Bereinigung vom 11. September verbleiben rund 431 kB Inline-CSS mit weiteren zeitlich gewachsenen Überschreibungen. Regeln nach Bauteilen bündeln und gezielt ersetzen. Dafür sind Vergleiche von Desktop, Mobilansicht, Hell/Dunkel und Druck erforderlich; eine unbenutzte Regel in einer einzelnen Ansicht ist kein ausreichender Löschbeleg.
2. **Alte Dialoge ablösen.** Das Bühnenformular wird weiterhin unter anderem für IEM-Einstellungen und gespeicherte Setup-Ansichten verwendet. Das versteckte Datei-Menü wurde am 11. September vollständig durch direkte Aktionen ersetzt. Das Bühnenformular und die Setup-Bibliothek bleiben wegen aktiver Aufrufer vorerst erhalten.
3. **Laufzeitdatei aufteilen.** Die ausgelieferte HTML-Datei enthält ungefähr 1,4 MB Quelltext samt eingebetteten Modulen. Getrennte, versionierte Ressourcen könnten Browser-Caching verbessern. Die portable lokale Nutzung muss dabei erhalten bleiben, etwa durch einen zusätzlichen selbstständigen Build.
4. **Große Bibliotheken gezielter zeichnen.** Beim tatsächlichen Öffnen werden weiterhin alle Karten der gewählten Kategorie erzeugt. Bei weiter wachsendem Katalog können nur sichtbare Karten aufgebaut werden; Suche und Tastaturbedienung müssen dabei vollständig bleiben.

## Bewusst erhalten

Migrationen für lokale Projekte, ältere Drum-Konfigurationen und gespeicherte Kabeldaten bleiben bestehen. Die Kabel werden nicht mehr gezeichnet, müssen aber beim Laden und Sichern älterer Projekte erhalten bleiben. Die Versionsnummern der aktiven Quell- und Testdateien kennzeichnen keine entbehrlichen Altversionen: Die Build- und Testskripte verwenden sie weiterhin. Die aktuelle Bildbibliothek wurde nicht pauschal gelöscht.

## Prüfung

`npm run build`, 35 Testgruppen sowie Browserprüfung in Chrome und WebKit (Desktop und 390 px Mobilansicht). Geprüft: leerer Start, Wiederherstellung aller fünf aktuellen Arbeitsansichten, unveränderte Objekte und Projekt-IDs, Bibliothek und Packs beim Öffnen, schreibgeschützte Freigaben, Exportvorschau, beschädigte lokale Daten ohne Überschreiben, Startfehler mit Wiederholungsaktion und direkter Start der lokalen HTML-Datei.

## Weitere Bereinigung · 11. September 2026

- Sechs Helfer ohne Produktivaufrufer entfernt: `refreshSetupLibrary`, `nextStageboxPort`, `stageInputCableStats`, `audioSignalDescription`, `audioPortCandidates`, `audioMicCatalog`. Die Mikrofon-Fototests prüfen nun unmittelbar `StageplotMics.catalog`; die Tests des aktiven Stereo-Patch-Planers bleiben erhalten.
- Verstecktes Dateimenü, globale Menü-Schließhandler, tote Fokusziele und der versteckte manuelle Routing-Sync-Button entfernt. Einstellungen, IEM-Bereich, Leeren, Sicherung und Projektkopie rufen gemeinsame Aktionen direkt auf. Der Datei-Input für den aktiven Import bleibt erhalten. Native Dialoge stellen den vorherigen Tastaturfokus wieder her.
- Rund 100 Regeln für nicht mehr erzeugte Stagebox-Panels entfernt; aktive Hardware- und Buchsenansichten bleiben bestehen. Mobile Dashboard-Regeln aus zwei Entwicklungsständen zu einem Block zusammengeführt. HTML einschließlich eingebetteter Module um rund 20 kB reduziert; daraus wird kein pauschaler Ladezeitgewinn abgeleitet.
- `npm run check` erfasst alle 23 Laufzeitmodule und acht Inline-Skripte. `npm run test:browser` führt vier unabhängige Browserabläufe aus; Chromium und WebKit sind verpflichtende Deployment-Prüfungen. Playwright ist versionsfest als Entwicklungsabhängigkeit eingetragen und wird nicht mit der Website ausgeliefert.

Geprüft: 38 Funktionstestgruppen, Syntax, mobile Projektkarten, Suche mit simulierter Bildschirmtastatur, Routing, Einstellungen mit Fokus-Rückkehr, IEM-Aktion, Abbrechen von Leeren, Backup, unabhängige Kopie, Reload und Import. Lokale Speicherformate, Migrationen, archivierte Kabeldaten und die Offline-Bildbibliothek wurden nicht verändert. Die Aufteilung der Laufzeitdatei und eine eventuelle Virtualisierung großer Bibliotheken bleiben eigenständige Architekturarbeiten.
