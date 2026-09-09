# Audio & Verkabelung

Der Signal-Editor zeigt Instrument und Kanalnummer dauerhaft im Kopf. Vier direkt erreichbare Bereiche ersetzen aufklappbare Abschnitte:

- **Abnahme:** Mikrofon, DI, Direkt / Line oder Digital. Mikrofone per Hersteller-Taste und Modellkarte wählen; „Vorschläge“ berücksichtigt das Instrument und bei Drum-Kanälen die genaue Abnahmeposition. Die Sofortsuche durchsucht immer den gesamten Katalog, auch wenn zuvor ein Hersteller gewählt war; „SM 57“ findet ebenso wie „sm57“ das richtige Modell. „Eigenes Modell“ erhält die Möglichkeit, nicht enthaltenes Equipment anzugeben. Eine Modellwahl übernimmt die 48-V-Voreinstellung aus dem Katalog; sie bleibt ausdrücklich änderbar.
- **Signalweg:** Die beteiligten Bühnenobjekte und der Weg über Abnahme, Stagebox und Mischpult. Große Karten binden weitere Mono-Signale in einen gemeinsamen Kanal ein. Die Auswahl zeigt vor dem Speichern, welcher CH dadurch integriert wird. Originaldaten bleiben wiederherstellbar.
- **Kanäle:** Mischpultnummern und die Stagebox-Buchsen des aktuellen Signals. CH und IN/OUT sind unabhängig voneinander. Stereo kann weiterhin getrennte Notizen, Modelle oder Buchsen an verschiedenen Stageboxen behalten.
- **Notizen & Funk:** Signalname, Notizen, Frequenzbereich, IEM-Übertragung und Reihenfolge.

## Stagebox verbinden und Stagebox-Belegung

**Stagebox verbinden** ist ein kleines Auswahlfenster für genau ein Signal bzw. Stereopaar. Es zeigt die Stageboxen mit Bild und schlägt eine passende freie Buchse vor. Eine gültige bestehende Zuordnung hat Vorrang; sonst wird die nächste kompatible Stagebox mit genügend Platz empfohlen. Die Buchsen der ausgewählten Stagebox sind als physische XLR-Anschlüsse sichtbar; Inputs, Outputs und Kombibuchsen verwenden dieselbe Darstellung wie die Stagebox-Belegung. Eine freie Buchse direkt anklicken. Die aktuelle Auswahl glitzert rosa und trägt „Gewählt“, bei Stereo mit L/R an beiden Buchsen. Belegte Buchsen zeigen ihren Signalnamen und sind für eine neue Verbindung gesperrt. Für Stereo wird die linke Buchse angeklickt und das benachbarte Paar gemeinsam ausgewählt. Ein Klick auf die bereits gewählte rechte Seite verschiebt das Paar nicht. Zahlenfelder für Stagebox-Ports entfallen auch im Signal-Editor; dessen rosa Buchsen öffnen dieselbe Auswahl. Ein Klick auf „IN … verbinden“ übernimmt die Zuordnung. Volle und inkompatible Stageboxen bleiben mit einer Erklärung zur Ansicht auswählbar; „Verbinden“ bleibt dort gesperrt. Kanalnummern, Mikrofon und Notizen werden dabei nicht geändert. Auch 48 Buchsen lassen sich am Handy durchsuchen, während Signalname und Verbinden-Button sichtbar bleiben. Bei reduzierten Animationen bleibt die rosa Markierung stehen, ohne zu glitzern.

**Stagebox-Belegung** zeigt dagegen die gesamte Belegung einer oder mehrerer Stageboxen. Dort kann man von einer konkreten Buchse aus arbeiten und prüfen, was bereits angeschlossen ist.

Wird das kleine Fenster aus dem Signal-Editor geöffnet, ist die Wahl zunächst nur Teil des Formularentwurfs. Erst „Übernehmen“ im Signal-Editor speichert sie. Abbrechen lässt die ursprünglichen Daten stehen. Stereo-Zuordnungen werden vollständig geprüft und gemeinsam übernommen; belegte Buchsen werden nicht automatisch überschrieben.

## Originalfotos

Die Mikrofonbilder sind unveränderte Originaldateien aus den Produktseiten von Shure, Telefunken, beyerdynamic, Neumann, sE Electronics, Audix und Sennheiser. Sie liegen lokal unter `stageplot-assets/mics/` und funktionieren offline. Es werden keine KI-generierten Mikrofonbilder eingesetzt.

Die 19 konkreten Modellfotos sind in [original-sources.json](stageplot-assets/mics/original-sources.json) mit Produktseite, Bildadresse, Abrufdatum und SHA-256 dokumentiert. Bildrechte und Marken verbleiben bei den jeweiligen Rechteinhabern; der Quellennachweis ist keine zusätzliche Lizenz. CSS zeigt die vollständigen Dateien mit `object-fit: contain`. Auch der Drum-Mikrofonpicker verwendet diese Originale.

Für Modelle ohne passendes Originalfoto erscheint eine beschriftete Modellkarte. Ein Foto einer anderen Bauform oder Modellrevision wird nicht als Ersatz verwendet. Beispielsweise haben der kurze M80-SH und der lange M80 jeweils ihre eigene Originalaufnahme. Für unklare ältere MD-421-Bezeichnungen wird kein Foto einer anderen Revision eingesetzt.

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

32 automatisierte Testgruppen einschließlich gemeinsamer Modellidentitäten, Originaldatei-Hashes, Suchvarianten, Favoriten, blockiertem Browser-Speicher, bidirektionalem Abgleich, unveränderten CH-/Patch-Angaben und älteren Drum-Entwürfen. Zusätzlich erfolgreiche Browserprüfung in Chrome und WebKit: alle 19 Originalbilder laden, Sofortsuche, Tastaturbedienung, gemeinsame Favoriten, beide Änderungsrichtungen, Abbrechen, Speichern, Rückgängig/Wiederholen, direkte OH-Auswahl, mobile Darstellung, Offline-Bearbeitung und erneutes Laden der gespeicherten Auswahl.

Die physische Buchsenauswahl wurde am 09.09.2026 in Chrome und WebKit geprüft: Combo-Inputs und XLR-Outputs, rosa Leuchtrand und Glitzeranimation, reduzierte Bewegung, L/R-Auswahl, belegte Buchsen, Tastatur, Speichern/Abbrechen von Signalentwürfen, Undo und Erhalt der CH-Nummern. Die 390-px-Touchansicht wurde mit 16 und 48 Buchsen geprüft, einschließlich Scrollen zum letzten Input, fest erreichbarem Verbinden-Button und Neuladen. Alle 32 Testgruppen bestanden; keine JavaScript-Fehler im Browser.
