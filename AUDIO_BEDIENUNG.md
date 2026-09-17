# Routing

Drei Ansichten bearbeiten dieselben gespeicherten Verbindungen: **Quellen**, **Monitoring** und **Stagebox**. Die Draufsicht links unten zeigt den tatsächlichen Bühnenplan; ausgewählte Objekte leuchten grün. Einstellungen erfolgen über Karten, Tasten und Textfelder ohne Dropdowns.

## Quellen

Links ein Instrument wählen. Es erscheint einmal im Signalweg. Jede physische DI erscheint einmal mit ihren belegten Eingängen und einem gemeinsamen Anschlussfeld. Erst dahinter teilen sich die Wege in die einzelnen Pultkanäle auf. **Weitere Abnahme** steht unter der letzten Abnahme und fügt an dieser Stelle eine weitere hinzu. Zwei unabhängige Wege bleiben Dual-Mono; **Stereo · L / R** verbindet zwei Abnahmen ausdrücklich zu einem Paar.

Unter dem Instrumentnamen öffnet **Ausgänge** die Einstellungen in der Quellenkarte. Anzahl und Buchsenart gelten für die Ausgänge am Instrument. Jeder vorhandene Ausgang lässt sich benennen und mit **Verwenden** in den Signalweg aufnehmen; **Einzeln** und **Stereo L/R** bestimmen das Format benachbarter Ausgänge. Die Einstellung aktiviert echte Geräteausgänge. **Weitere Abnahme** ergänzt dagegen eine separate Abnahme. Auch bei null Ausgängen bleibt die Quelle erreichbar. Drum-, Percussion-, Orchester- und Playback-Setups öffnen direkt von ihrer Quellenkarte. Im Bühneninspektor führt **Ausgänge im Routing bearbeiten** zur gleichen Quelle. Änderungen bleiben mit einem Schritt rückgängig machbar.

Mikrofon, DI, Direkt oder Digital stehen als ständig sichtbare Tasten oben im Abnahmefeld. Bei Direkt und Digital wählst du den Anschluss unmittelbar darunter. Ein Bearbeiten-Stift ist dafür nicht nötig; die Karte bleibt kompakt. Mikrofone lassen sich im lokalen Fotokatalog suchen oder mit eigenem Namen erfassen. Modellwahl und 48 V werden mit dem Drum- und Percussion-Editor abgeglichen. Die Kanalnummer kann sich von der Buchsennummer unterscheiden und bleibt beim Umstecken erhalten.

Eine DI ist ein physisches Gerät mit getrennt belegbaren Eingängen. Zur Wahl stehen Radial J48 (ein Eingang, aktiv, 48 V), Radial J48 Stereo (zwei Eingänge, aktiv, 48 V), Radial ProD2 (zwei Eingänge, passiv), vier generische DI-Boxen. Ein Klick auf den Modellnamen öffnet ein Popup mit sieben gleich großen Kacheln; die Auswahl wird direkt übernommen. Schließen oder Escape lässt die bisherige Zuordnung unverändert. Die generischen Varianten sind **passiv Mono**, **passiv Stereo**, **aktiv Mono** und **aktiv Stereo** mit jeweils eigenem Bild. Bei aktiven generischen DIs stehen 48 V, Batterie und Netzteil zur Wahl. Vorhandene eigene Geräte aus älteren Plänen bleiben erhalten; dort sind Kanalzahl und Aktiv/Passiv weiter einstellbar. Eine Mono-Quelle kann einen Eingang einer Stereo-DI nutzen; der zweite bleibt frei oder wird einer anderen Quelle zugeordnet. Die Gerätekapazität erzeugt keine zusätzlichen Signale. Für ein bereits eingerichtetes Stereo-Paar verbindet die Auswahl einer Stereo-DI beide Ausgänge mit Eingang 1 und 2 derselben Box. **L + R anschließen** verbindet auch bisher einzelne analoge Ausgänge zu einem Paar. Das gilt für Out 1/2, Out 3/4 und weitere benachbarte Paare. Beim Nord Stage 4 können etwa **Out 1 + 2 = Piano** auf einer ProD2 und **Out 3 + 4 = Synth** auf einer zweiten ProD2 liegen. Die Namen und Stereo-Paare werden unter **Ausgänge** in der Quellenkarte eingestellt. Ein Modellwechsel an einer gemeinsamen DI-Karte gilt für beide Eingänge; Kanalnamen und Patch bleiben erhalten. Ein bisher nicht genutzter rechter Ausgang wird dabei aktiviert. Die zwei Wege sind als L/R markiert; vorhandene Kanalnummern, Stagebox-Zuordnungen und Notizen bleiben erhalten. Ist ein DI-Eingang durch eine andere Quelle belegt, bleibt die bisherige Verbindung unverändert. Die Änderung lässt sich mit einem Schritt rückgängig machen.

Jede DI besitzt genau ein Bühnenobjekt. Neue Boxen erscheinen möglichst ohne Überlappung neben dem Instrument und lassen sich frei verschieben. **Box zuordnen** öffnet die Boxen des Plans mit ihren freien und belegten Eingängen, einschließlich manuell platzierter DIs. **Neue DI** legt eine zusätzliche Box an. Ein Modellwechsel an der zugeordneten Box erhält deren Position. Eine Stereo-DI für zwei Ausgänge bleibt auch auf der Bühne eine einzelne Box. Beim Anklicken stehen die Anschlüsse oben in den Eigenschaften. DIs erzeugen keine eigenen Instrumentquellen.

Wird nur die Verbindung gelöst, bleibt die Box auf der Bühne verfügbar. Wird die Box auf der Bühne gelöscht, werden ihre DI-Zuordnungen entfernt; die Instrumentkanäle mit Nummern, Notizen und Stagebox-Patch bleiben erhalten. Rückgängig stellt die Box samt Verbindungen wieder her. Bestehende lokale Pläne erhalten Bühnenobjekte für ihre bisherigen Routing-DIs; bereits platzierte Boxen behalten ihre Position.

## Anschlüsse und Stagebox

Im Anschlussfeld eine Stagebox und eine freie nummerierte Buchse wählen. Die Änderung speichert sofort. Belegte Eingänge können nicht versehentlich überschrieben werden. Bei einer gemeinsamen DI werden genau deren beide Wege geprüft; bei den übrigen Stereo-Verbindungen wird das gesamte Paar geprüft und auf zwei benachbarte Buchsen gelegt; die gewählte Nummer ist der linke Eingang. Trennen löst beide Seiten. Bereits bestehende getrennte Zuordnungen bleiben beim Laden erhalten.

Die Stagebox-Ansicht zeigt Inputs und Outputs, freie und belegte Buchsen, 48 V und zusammengehörige Stereopaare. Eine belegte Buchse öffnet ihren Signalweg; an einer freien Buchse lässt sich ein Signal wählen. Name und XLR/Klinke-Kombibuchsen werden an der Stagebox eingestellt. Für reine XLR-Inputs benötigt ein Klinkensignal eine DI. Dante wird im Playback-Setup über das Netzwerk geführt.

## IEM-Monitore

Monitoring zeigt **Mix/Bus → Stagebox-Ausgänge → Gerät → Empfänger**. Stereo hat zwei parallele L/R-Verbindungen bis zu einem gemeinsamen IEM-Sender und Empfänger. Mixname, Busnummer, Gerät, Empfänger, Funk/Kabel und Frequenz stehen direkt im jeweiligen Feld. Wedges können aktiv oder passiv mit separatem Verstärker angegeben werden.

**Monitorweg** legt einen IEM-, Wedge- oder Line-Weg an. Vorhandene IEM-Racks bleiben auch über ihre bisherige Übersicht für 1–16 Mixe bearbeitbar. Beide Einstiege nutzen dieselben Kanäle. Mono benötigt einen Bus, Stereo zwei. Beim Wechsel auf Mono wird der rechte Ausgang frei; der linke Kanal behält seine Nummer und Zuordnung. Rückgängig stellt den vorherigen Stand wieder her.

## Speichern und Export

Gültige Änderungen speichern lokal und funktionieren offline. Alte Projekte behalten Kanalnummern, Modelle, Notizen und Zuordnungen. Vorhandene DI-Verbindungen werden in Geräte mit belegbaren Eingängen übernommen. Der angezeigte Speicherstatus stammt vom lokalen Projektspeicher.

**Werkzeuge** enthält Rückgängig/Wiederholen, Nummerierung freier Kanäle, automatische Belegung freier Stagebox-Ports und die Import-/Export-Aktionen. Die Patchliste enthält DI-Eingänge, physische Buchsen und Monitoring-Geräte. Geteilte Projekte übernehmen diese Angaben; private Notizen und Kontakte bleiben ausgeschlossen. Der Freigabedienst benötigt dafür Migration `0008_routing_devices.sql`.

## DI-Bilder und Originalfotos

Die vier generischen DI-Boxen verwenden lokal gespeicherte, mit Bildgenerierung erstellte Illustrationen ohne Herstellermarke. [Bilder, Prompts und Referenzen](stageplot-assets/di/generic-di-v1.json).

Radial J48, J48 Stereo und ProD2 zeigen in der DI-Auswahl, am Gerät und im Signalweg jeweils das passende Originalfoto von Radial Engineering. Die drei unveränderten Herstellerfotos liegen lokal unter `stageplot-assets/di/` und benötigen zusammen rund 184 kB. Eigene Modelle zeigen einen neutralen Platzhalter. [Bildquellen und Prüfsummen](stageplot-assets/di/original-sources.json).

Der gemeinsame Katalog enthält Fotos für **81 von 88 konkreten Mikrofoneinträgen**. Hinzu kommen fünf allgemeine Mikrofontypen ohne erfundenes Modellfoto. 78 unterschiedliche Originalaufnahmen stammen direkt von 22 Herstellern, ihren regionalen Produktseiten und Archiven. Sie liegen lokal unter `stageplot-assets/mics/` und funktionieren ohne Abfrage eines Bilddienstes. Es werden keine KI-generierten Mikrofonbilder eingesetzt.

Die Aufnahmen werden für die Modellkarten proportional auf höchstens 640 × 640 Pixel verkleinert und als WebP komprimiert. Der vollständige Bildausschnitt bleibt erhalten; es werden keine Teile ergänzt oder neu gezeichnet. Zusammen benötigen die 78 ausgelieferten Fotos weniger als 2,5 MB. Sie laden erst bei Bedarf, mit asynchroner Bilddekodierung. Die Auswahl lädt auch für die bisherigen 19 Fotos jetzt kompakte Fassungen. Die früheren Bildadressen bleiben für noch geöffnete ältere App-Versionen erreichbar.

[original-sources.json](stageplot-assets/mics/original-sources.json) dokumentiert für jedes Foto Produktseite, Bildadresse, Abrufdatum, Original-Prüfsumme, ausgelieferte Prüfsumme, Dateigrößen und Verarbeitung. Bildrechte und Marken verbleiben bei den jeweiligen Rechteinhabern; der Quellennachweis ist keine zusätzliche Lizenz. CSS zeigt die vollständigen Dateien mit `object-fit: contain`. Routing, Drum-Editor, Favoriten und Suchvorschläge verwenden dieselbe Zuordnung.

Bei kombinierten Modellnamen steht die abgebildete Variante direkt auf der Karte und beim gewählten Mikrofon: C414 XLS, SCX1HC und R88. SR25mp zeigt ein einzelnes SR25 aus dem Stereopaar; das Schoeps CMC 6 + MK 4 ist als Set mit Zubehör gekennzeichnet. Diese Hinweise ändern weder Modellnamen noch gespeicherte Kanäle.

KM 84 und KM 184, M201 TG und M 201 sowie M80 und M80-SH haben jeweils eigene Originalaufnahmen. Für unklare ältere MD-421-Bezeichnungen wird kein Bild einer anderen Revision eingesetzt. Die [verbleibenden Einträge](stageplot-assets/mics/missing-photos.json) sind mit Recherchegrund dokumentiert. Sie bleiben mit Namen auswählbar, einschließlich eigener Modelle.

## Gemeinsame Mikrofon-Auswahl

Routing und Drum-Editor verwenden denselben Katalog aus `stageplot-mics-v1.js`. Das Routing zeigt die Modellkarten direkt im Abnahmefeld; Drum- und Percussion-Editor nutzen `stageplot-mic-picker-v1.js` / `.css`. Die Recherche- und Originaldateinachweise stehen in der Asset-Liste oben.

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
