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

1. **CSS zusammenführen.** Rund 375 kB Inline-CSS enthalten mehrere zeitlich gewachsene Überschreibungen. Regeln nach Bauteilen bündeln und gezielt ersetzen. Dafür sind Vergleiche von Desktop, Mobilansicht, Hell/Dunkel und Druck erforderlich; eine unbenutzte Regel in einer einzelnen Ansicht ist kein ausreichender Löschbeleg.
2. **Alte Dialoge ablösen.** Das Bühnenformular wird weiterhin unter anderem für IEM-Einstellungen und gespeicherte Setup-Ansichten verwendet. Auch das versteckte Datei-Menü dient neueren Schaltflächen noch als Aktionsziel. Diese Abhängigkeiten zuerst auf gemeinsame Aktionen umstellen, danach das überholte Markup entfernen.
3. **Laufzeitdatei aufteilen.** Die ausgelieferte HTML-Datei enthält ungefähr 1,4 MB Quelltext samt eingebetteten Modulen. Getrennte, versionierte Ressourcen könnten Browser-Caching verbessern. Die portable lokale Nutzung muss dabei erhalten bleiben, etwa durch einen zusätzlichen selbstständigen Build.
4. **Große Bibliotheken gezielter zeichnen.** Beim tatsächlichen Öffnen werden weiterhin alle Karten der gewählten Kategorie erzeugt. Bei weiter wachsendem Katalog können nur sichtbare Karten aufgebaut werden; Suche und Tastaturbedienung müssen dabei vollständig bleiben.

## Bewusst erhalten

Migrationen für lokale Projekte, ältere Drum-Konfigurationen und gespeicherte Kabeldaten bleiben bestehen. Die Kabel werden nicht mehr gezeichnet, müssen aber beim Laden und Sichern älterer Projekte erhalten bleiben. Die Versionsnummern der aktiven Quell- und Testdateien kennzeichnen keine entbehrlichen Altversionen: Die Build- und Testskripte verwenden sie weiterhin. Die aktuelle Bildbibliothek wurde nicht pauschal gelöscht.

## Prüfung

`npm run build`, 35 Testgruppen sowie Browserprüfung in Chrome und WebKit (Desktop und 390 px Mobilansicht). Geprüft: leerer Start, Wiederherstellung aller fünf aktuellen Arbeitsansichten, unveränderte Objekte und Projekt-IDs, Bibliothek und Packs beim Öffnen, schreibgeschützte Freigaben, Exportvorschau, beschädigte lokale Daten ohne Überschreiben, Startfehler mit Wiederholungsaktion und direkter Start der lokalen HTML-Datei.
