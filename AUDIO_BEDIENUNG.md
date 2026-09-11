# Routing

Der Signal-Editor zeigt Instrument und Kanalnummer dauerhaft im Kopf. Vier direkt erreichbare Bereiche ersetzen aufklappbare Abschnitte:

- **Abnahme:** Mikrofon, DI, Direkt / Line oder Digital. Mikrofone per Hersteller-Taste und Modellkarte wählen; „Vorschläge“ berücksichtigt das Instrument und bei Drum-Kanälen die genaue Abnahmeposition. Die Sofortsuche durchsucht immer den gesamten Katalog, auch wenn zuvor ein Hersteller gewählt war; „SM 57“ findet ebenso wie „sm57“ das richtige Modell. „Eigenes Modell“ erhält die Möglichkeit, nicht enthaltenes Equipment anzugeben. Eine Modellwahl übernimmt die 48-V-Voreinstellung aus dem Katalog; sie bleibt ausdrücklich änderbar.
- **Signalweg:** Die beteiligten Bühnenobjekte und der Weg über Abnahme, Stagebox und Mischpult. Große Karten binden weitere Mono-Signale in einen gemeinsamen Kanal ein. Die Auswahl zeigt vor dem Speichern, welcher CH dadurch integriert wird. Originaldaten bleiben wiederherstellbar.
- **Kanäle:** Mischpultnummern und die Stagebox-Buchsen des aktuellen Signals. CH und IN/OUT sind unabhängig voneinander. Stereo kann weiterhin getrennte Notizen, Modelle oder Buchsen an verschiedenen Stageboxen behalten.
- **Notizen & Funk:** Signalname, Notizen, Frequenzbereich, IEM-Übertragung und Reihenfolge.

## Einheitlich anschließen

Inputliste und Stagebox-Belegung verwenden dieselbe Verbindungsauswahl. In der Inputliste „Anschließen“ wählen und eine freie Buchse antippen. In der Stagebox-Belegung eine freie Buchse antippen und das Signal wählen. Die letzte Auswahl speichert sofort; „Rückgängig“ stellt den vorherigen Stand wieder her. Öffnen und Schließen ohne Auswahl ändern nichts.

Der Kopf zeigt Instrument, Stagebox-Buchse und Pultkanal bzw. Mix. IN/OUT ist die physische Buchse; CH/Mix bleibt beim Umstecken erhalten. Die vorgeschlagenen Buchsen glitzern rosa, Stereo zeigt L/R gemeinsam. Eine bestehende Verbindung und dann die nächste passende Stagebox werden bevorzugt. Die Signalauswahl zeigt unverbundene Signale zuerst, mit Bild, Kanal und Mikrofon sowie einer Sofortsuche.

Eine belegte Buchse zeigt ihre Verbindung mit „Anderes Signal“, „Andere Buchse“, „Signal bearbeiten“ und „Trennen“. Beim Anschließen auf eine belegte Buchse erscheinen direkt die betroffenen Signale und die Aktionen „Andere Buchse“, „Ersetzen“ und – für gleich große, vollständig verbundene Gruppen – „Verbindungen tauschen“. Ersetzen trennt ein betroffenes Stereopaar vollständig. Es gibt keine zusätzliche Bestätigungskette. Kapazität und Anschlussart werden beim endgültigen Klick erneut geprüft.

Beim Anschließen aus dem Signal-Editor werden dessen sichtbare Änderungen gemeinsam mit der Verbindung gespeichert. Der Hinweis im Anschlussfenster erklärt dies vor der Auswahl. Es folgt kein zweiter Übernehmen-Schritt. Ungültige Angaben führen zurück ins unverändert erhaltene Formular; das Projekt wird dabei nicht teilweise geändert.

Bei Instrumenten mit mehreren Signalen bietet die Auswahl eine gemeinsame Zuordnung der noch freien Kanäle an. Vor dem Anschließen zeigt sie jeden Kanal mit der vorgeschlagenen Buchse. Bereits verbundene Kanäle bleiben an ihrem Platz; Stereo wird nicht aufgeteilt und vorhandene Ports werden nicht überschrieben.

Die Stagebox-Belegung zeigt eine per Bildkarte gewählte Stagebox mit großen Buchsen und lesbaren Signal-/Kanalbeschriftungen. Die Arbeitsfläche bleibt stabil; Geräteeinstellungen öffnen ausdrücklich in einem eigenen Fenster. Am Handy öffnet die Verbindungsauswahl vom unteren Rand. Instrument und Ziel bleiben oben sichtbar, die Tastatur erscheint erst beim Antippen der Suche. Die lokalen Datenformate und der Offline-Betrieb bleiben erhalten.

## IEM-Monitore

„IEM-Monitore · Funk / Kabel“ auf die Bühne setzen: Die Übersicht öffnet direkt. Über +/− die Anzahl der Monitor-Mixe (1–16) festlegen. Jede Karte steht für einen Musiker bzw. einen Mix; Name, Mono/Stereo und Funk/Kabel bleiben offen sichtbar. Bei Funk lässt sich der Frequenzbereich ergänzen.

Mono benötigt einen AUX, Stereo zwei. Freie AUX-Nummern werden vorgeschlagen; eigene Nummern sind direkt änderbar. Bereits verwendete Nummern werden nicht doppelt vergeben. AUX bezeichnet den Mix am Pult; die physische OUT-Buchse wird davon unabhängig über „Ausgänge verbinden“ gewählt. Dafür öffnet dieselbe Stagebox-Auswahl mit sichtbaren Buchsen und gemeinsamem L/R-Vorschlag wie im übrigen Routing.

Am Objekt „IEM-Monitore einrichten“ bzw. die schwebende IEM-Taste wählen. Auch die Kanalnummer im Routing und „Signal bearbeiten“ an einer belegten Buchse führen in dieselbe Übersicht. Namen, Funkangaben, AUX und Buchsen erscheinen in den gemeinsamen Outputlisten und im Export mit Technik & Kanälen.

Gültige Änderungen speichern automatisch lokal. Bestehende IEM-Racks übernehmen ihre bisherigen Namen, Kanal-IDs, AUX-Nummern, Notizen und Buchsen. Beim Umschalten auf Mono bleibt der linke Kanal erhalten und der rechte Ausgang wird frei. Weniger IEMs entfernt die letzten Mixe; „Rückgängig“ stellt den vorherigen Stand einschließlich Buchsen wieder her. Der Speicherstatus zeigt auch Fehler an. Die IEM-/Rack-Fläche im Bühnenaufbau bleibt eine separat bemaßbare Stellfläche.

Prüfung: `npm test` enthält die Migration, gemischte Sets, AUX-Konflikte und den Erhalt vorhandener Verbindungen. `scripts/check-iem-monitors.cjs` prüft optional im Browser Platzieren, vier gemischte IEMs, physische Buchsenwahl, Undo, Neuladen, Routing-Einstieg, mobile Ansicht, Druckvorschau und Offline-Speicherung. `APP_URL`, `BROWSER=webkit` und `PLAYWRIGHT_MODULE` sind einstellbar.

## Originalfotos

Der gemeinsame Katalog enthält Fotos für **81 von 88 konkreten Mikrofoneinträgen**. Hinzu kommen fünf allgemeine Mikrofontypen ohne erfundenes Modellfoto. 78 unterschiedliche Originalaufnahmen stammen direkt von 22 Herstellern, ihren regionalen Produktseiten und Archiven. Sie liegen lokal unter `stageplot-assets/mics/` und funktionieren ohne Abfrage eines Bilddienstes. Es werden keine KI-generierten Mikrofonbilder eingesetzt.

Die Aufnahmen werden für die Modellkarten proportional auf höchstens 640 × 640 Pixel verkleinert und als WebP komprimiert. Der vollständige Bildausschnitt bleibt erhalten; es werden keine Teile ergänzt oder neu gezeichnet. Zusammen benötigen die 78 ausgelieferten Fotos weniger als 2,5 MB. Sie laden erst bei Bedarf, mit asynchroner Bilddekodierung. Die Auswahl lädt auch für die bisherigen 19 Fotos jetzt kompakte Fassungen. Die früheren Bildadressen bleiben für noch geöffnete ältere App-Versionen erreichbar.

[original-sources.json](stageplot-assets/mics/original-sources.json) dokumentiert für jedes Foto Produktseite, Bildadresse, Abrufdatum, Original-Prüfsumme, ausgelieferte Prüfsumme, Dateigrößen und Verarbeitung. Bildrechte und Marken verbleiben bei den jeweiligen Rechteinhabern; der Quellennachweis ist keine zusätzliche Lizenz. CSS zeigt die vollständigen Dateien mit `object-fit: contain`. Routing, Drum-Editor, Favoriten und Suchvorschläge verwenden dieselbe Zuordnung.

Bei kombinierten Modellnamen steht die abgebildete Variante direkt auf der Karte und beim gewählten Mikrofon: C414 XLS, SCX1HC und R88. SR25mp zeigt ein einzelnes SR25 aus dem Stereopaar; das Schoeps CMC 6 + MK 4 ist als Set mit Zubehör gekennzeichnet. Diese Hinweise ändern weder Modellnamen noch gespeicherte Kanäle.

KM 84 und KM 184, M201 TG und M 201 sowie M80 und M80-SH haben jeweils eigene Originalaufnahmen. Für unklare ältere MD-421-Bezeichnungen wird kein Bild einer anderen Revision eingesetzt. Die [verbleibenden Einträge](stageplot-assets/mics/missing-photos.json) sind mit Recherchegrund dokumentiert. Sie bleiben mit Namen auswählbar, einschließlich eigener Modelle.

## Gemeinsame Mikrofon-Auswahl

Audio-Plan und Drum-Editor verwenden `stageplot-mics-v1.js` mit 93 identischen Modelldatensätzen und dieselbe Oberfläche aus `stageplot-mic-picker-v1.js` / `.css`. Auch die Signal-Editoren am Bühnenobjekt und an einem belegten Stagebox-Port öffnen diese Auswahl. Die Recherche- und Originaldateinachweise stehen in der Asset-Liste oben.

- Hersteller, passende Vorschläge, Favoriten, zuletzt verwendete Modelle und alle Modelle sind direkt erreichbar.
- Der Stern merkt ein Mikrofon, ohne es auszuwählen. Favoriten und die zwölf zuletzt verwendeten Katalogmodelle werden lokal für alle Projekte und beide Editoren gespeichert. Sie enthalten keine Projekt- oder Kontaktdaten.
- Die Suche reagiert sofort, toleriert Leerzeichen und Bindestriche und zeigt Treffer samt Fotos. Enter übernimmt den ersten Treffer, Pfeil nach unten wechselt zu den Ergebnissen. Escape leert zuerst eine aktive Suche; danach schließt es das Auswahlfenster.
- Eigene Modellnamen bleiben möglich. Ohne passendes Originalfoto zeigt die Auswahl den Namen mit „Ohne Produktfoto“.
- Der Drum-Editor zeigt bei der Mikrofonwahl die Abnahmeposition und eine vorhandene CH-Nummer. Overhead-Mikrofone sind im Gesamtset und bei den Becken direkt auswählbar.

`stage.routing` bleibt die gemeinsame Datenquelle für Audio-Plan, Stagebox-Belegung und Ausdrucke. Mikrofonänderungen und 48 V werden beim Übernehmen zwischen Drumset und Audio-Kanal abgeglichen. Beim Öffnen des Drum-Editors werden vorhandene Routing-Angaben in den Entwurf übernommen; beim Speichern wechseln nur geänderte Mikrofonfelder. Kanalnummern, eigene Signalnamen, Stagebox-Buchsen und Notizen bleiben erhalten. Abbrechen verändert das gespeicherte Projekt nicht, Rückgängig stellt beide Seiten gemeinsam wieder her. Ein entferntes Modell lässt das Signal aktiv; die separate Deaktivierung im Drum-Editor entfernt die Abnahme.

Die Auswahl benötigt keinen Account und keine Netzabfrage. Originalbilder werden lokal mit der App ausgeliefert. Nicht enthaltene Modelle werden nicht automatisch durch andere Revisionen ersetzt.

## Prüfung

35 automatisierte Testgruppen einschließlich gemeinsamer Modellidentitäten, Originaldatei-Hashes, Suchvarianten, Favoriten, blockiertem Browser-Speicher, bidirektionalem Abgleich, unveränderten CH-/Patch-Angaben und älteren Drum-Entwürfen. Zusätzlich erfolgreiche Browserprüfung in Chrome und WebKit: alle 19 Originalbilder laden, Sofortsuche, Tastaturbedienung, gemeinsame Favoriten, beide Änderungsrichtungen, Abbrechen, Speichern, Rückgängig/Wiederholen, direkte OH-Auswahl, mobile Darstellung, Offline-Bearbeitung und erneutes Laden der gespeicherten Auswahl.

Die physische Buchsenauswahl wurde am 09.09.2026 in Chrome und WebKit geprüft: Combo-Inputs und XLR-Outputs, rosa Leuchtrand und Glitzeranimation, reduzierte Bewegung, L/R-Auswahl, belegte Buchsen, Tastatur, Speichern/Abbrechen von Signalentwürfen, Undo und Erhalt der CH-Nummern. Die 390-px-Touchansicht wurde mit 16 und 48 Buchsen geprüft, einschließlich Scrollen zum letzten Input, fest erreichbarem Verbinden-Button und Neuladen. Alle 32 Testgruppen bestanden; keine JavaScript-Fehler im Browser.


Foto-Erweiterung vom 10.09.2026: Automatische Prüfungen kontrollieren alle ausgelieferten Dateien und Prüfsummen, Herstellerquellen, eindeutige Modellzuordnung, unterschiedliche Revisionen, Variantenbeschriftung, die dokumentierten Lücken und das gemeinsame Datenbudget. Browserprüfung in Chrome und WebKit erfolgreich: alle 81 Fotozuordnungen laden; Routing und Drum-Editor zeigen dieselben Originale und Variantenbeschriftungen. Sofortsuche, Tastaturwahl, gemeinsame Favoriten, Speichern/Abbrechen, bidirektionaler Abgleich, Undo/Redo, mobile Ansicht, Offline-Bearbeitung und Wiederherstellung nach Reload funktionieren ohne JavaScript-Fehler.
