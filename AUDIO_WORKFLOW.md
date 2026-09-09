# Routing

Inputs, Outputs und Stagebox-Belegung verwenden dieselben Signalzeilen in `stage.routing`. Der Ablauf lautet: Signal auswählen, Stagebox wählen, Buchse zuordnen. Die vorhandenen Speicher- und Projektformate werden weiterverwendet.

## Bedienung

- Signale suchen und bei Bedarf nach fehlenden Nummern oder Zuordnungen filtern. Ein passender Stereo-Kanal zeigt auch seinen Partner.
- Der gemeinsame Signal-Editor hat vier direkte Bereiche: „Abnahme“, „Signalweg“, „Kanäle“ und „Notizen & Funk“. Name, Kanalnummer und aktuelle Zuordnung bleiben oben sichtbar.
- „Stagebox verbinden“ zeigt Stagebox-Bilder und die physischen Buchsen der gewählten Box. Eine freie Buchse anklicken; Rosa mit Glitzern kennzeichnet den vorgeschlagenen oder ausgewählten Anschluss. Bei Stereo werden zwei benachbarte Buchsen gemeinsam mit L/R markiert. Belegte Ports zeigen ihren Signalnamen; es gibt kein Zahlenfeld für die Buchsenwahl. Vorhandene getrennte oder nicht benachbarte Stereo-Zuordnungen bleiben beim Laden und beim Speichern anderer Signalangaben erhalten.
- Die Verbindung aus dem Signal-Editor ist zunächst Teil des Formularentwurfs. Erst „Übernehmen“ speichert sie; Abbrechen bewahrt die bestehende Zuordnung. Die vollständige Stagebox-Belegung ist weiterhin für Arbeiten von einer Buchse aus verfügbar.
- Eine freie Stagebox-Buchse öffnet die Signalauswahl. Eine belegte Buchse zeigt zunächst kompakte Details. Bearbeiten, Umstecken und Zuordnung lösen sind explizite Aktionen.
- Beim Umstecken wird angezeigt, welches Signal verschoben oder von der Zielbuchse gelöst wird. Das verdrängte Signal bleibt in der Liste. Die Stereo-Zuordnung wird als Ganzes behandelt.
- „Danach nächste freie Buchse öffnen“ schaltet die Serienzuordnung ein. Ohne diese Option bleibt die bearbeitete Buchse ausgewählt.
- Nummerieren ergänzt fehlende Kanalnummern. Automatisches Zuordnen ergänzt fehlende Buchsen und erhält bestehende Angaben. Beide Vorgänge sind unabhängig und rückgängig machbar.
- Kabelzeichnen, Ziehgriffe, Kabellängen-Editor und Kabelansicht entfallen. Bühne, Projektvorschau und Export zeigen keine Kabelzeichnungen. Die Patchliste enthält Buchse, Mischpultkanal, Signal und Anschluss.
- Alte `stage.cables`-Daten bleiben für kompatible Projektdateien gespeichert. Eine geänderte Stagebox-Zuordnung erzeugt oder bearbeitet keine Zeichnung. IEM per Kabel und physische Kabelbrücken bleiben als eigene Technikangaben bzw. Bühnenobjekte verfügbar.

## Technische Prüfung

`npm run build` erzeugt die eingebetteten Module und `index.html`; `npm test` prüft alle 32 aktuellen Testgruppen.

Die Laufzeittests in `stageplot-audio-v1.test.cjs` decken die reinen Zuteilungsfunktionen sowie die tatsächlichen Handler für automatische Zuordnung und Umstecken ab. Fälle: volle Zielbox, benachbarte Stereo-Ports, teilweise vorhandene Stereo-Zuordnung, erforderliche DI-Box, Wiederwahl eines bereits zugeordneten Stereosignals und Konfliktbestätigung. Bestehende Zeichnungsdaten überstehen Normalisieren und Projektkopien; die Ausgabe der Patchliste ist unabhängig von ihnen. Statische Prüfungen verhindern die Wiedereinführung von Kabel-Zeichenaktionen. Bestehende Tests prüfen weiterhin Migration lokaler Entwürfe, Projektkopien und die gemeinsamen Drucktabellen.

Browserprüfung am 09.09.2026: Desktop (1280 × 720) und schmale Ansicht (390 × 844), Hell-/Dunkelmodus, Suche, direkte Stereo-Portwahl mit DI-Hinweis, Buchsendetails, Umstecken, Rückgängig/Wiederholen, Kanalnummern und Wiederherstellung beim erneuten Öffnen. Die vier Spalten der Patchliste sowie Input-/Outputlisten wurden in der A4-Druckvorschau geprüft. Der Bühneneditor und die Objekteigenschaften arbeiten ohne Kabelwerkzeuge; ein verbliebener Verweis auf die entfernte Kabelauswahl wurde korrigiert und zusätzlich als Laufzeittest abgesichert. Die abschließenden Browserprüfungen meldeten keine JavaScript-Fehler. Die schmale Ansicht wurde über eine Browser-Viewport-Simulation geprüft, nicht auf physischer Touch-Hardware.

Zusätzliche Dialogtests prüfen die tatsächlichen Tab- und Speicherfunktionen, Tastaturnavigation, Formularwerte über Bereichswechsel, das erste ungültige Feld bei Fehlern in mehreren Bereichen, gültige Stereo-Paare und den Erhalt unterschiedlicher Mikrofon-/Notizangaben sowie getrennter Stageboxen für L/R.

Der aufgeteilte Signal-Dialog wurde zusätzlich an einer belegten Stagebox-Buchse und über die Audioliste im Browser geprüft: Input-Stereo speichern/abbrechen, Kanalnummernkonflikt, ungültige Buchse in einem zugeklappten Bereich, IEM-Output samt Frequenzbereich und Wiederherstellung nach Neuladen. Die drei Bereiche und der feste Dialogfuß wurden bei 1280 × 720 und 390 × 844 in Hell/Dunkel geprüft; keine JavaScript-Fehler.

Die physische Buchsenauswahl wurde am 09.09.2026 in Chrome und WebKit geprüft: Combo-Inputs und XLR-Outputs, rosa Leuchtrand und Glitzeranimation, reduzierte Bewegung, L/R-Auswahl, belegte Buchsen, Tastatur, Speichern/Abbrechen von Signalentwürfen, Undo und Erhalt der CH-Nummern. Die 390-px-Touchansicht wurde mit 16 und 48 Buchsen geprüft, einschließlich Scrollen zum letzten Input, fest erreichbarem Verbinden-Button und Neuladen. Alle 32 Testgruppen bestanden; keine JavaScript-Fehler im Browser.
