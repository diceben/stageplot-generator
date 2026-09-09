# Audio & Verkabelung

Inputs, Outputs und Stagebox-Belegung verwenden dieselben Signalzeilen in `stage.routing`. Der Ablauf lautet: Signal auswählen, Stagebox wählen, Buchse zuordnen. Die vorhandenen Speicher- und Projektformate werden weiterverwendet.

## Bedienung

- Signale suchen und bei Bedarf nach fehlenden Nummern oder Zuordnungen filtern. Ein passender Stereo-Kanal zeigt auch seinen Partner.
- Der gemeinsame Signal-Editor hat drei beschriftete Bereiche: „Signal“, „Stagebox & Kanäle“ und „Weitere Angaben“. Name, Richtung und aktuelle Zuordnung bleiben oben sichtbar. „Signal bearbeiten“ öffnet die Signalangaben; „Stagebox zuordnen“ und die Kanalnummer führen direkt zu „Stagebox & Kanäle“.
- Eine Stagebox und freie Buchse wählen; bei Stereo werden gültige benachbarte Paare angeboten. „Automatisch“ wählt beim Übernehmen das nächste freie Paar. Unter „Buchsen einzeln festlegen“ bleiben nicht benachbarte und vorhandene getrennte Stereo-Zuordnungen erreichbar. Änderungen an diesen Feldern werden erst mit „Übernehmen“ gespeichert.
- Funk, Notizen, Signalwege, Reihenfolge und Entfernen stehen unter „Weitere Angaben“. Bereichswechsel erhalten den Formularentwurf. Bei ungültigen Angaben öffnet sich das betroffene Feld vor der Fehlermeldung.
- Eine freie Stagebox-Buchse öffnet die Signalauswahl. Eine belegte Buchse zeigt zunächst kompakte Details. Bearbeiten, Umstecken und Zuordnung lösen sind explizite Aktionen.
- Beim Umstecken wird angezeigt, welches Signal verschoben oder von der Zielbuchse gelöst wird. Das verdrängte Signal bleibt in der Liste. Die Stereo-Zuordnung wird als Ganzes behandelt.
- „Danach nächste freie Buchse öffnen“ schaltet die Serienzuordnung ein. Ohne diese Option bleibt die bearbeitete Buchse ausgewählt.
- Nummerieren ergänzt fehlende Kanalnummern. Automatisches Zuordnen ergänzt fehlende Buchsen und erhält bestehende Angaben. Beide Vorgänge sind unabhängig und rückgängig machbar.
- Kabelzeichnen, Ziehgriffe, Kabellängen-Editor und Kabelansicht entfallen. Bühne, Projektvorschau und Export zeigen keine Kabelzeichnungen. Die Patchliste enthält Buchse, Mischpultkanal, Signal und Anschluss.
- Alte `stage.cables`-Daten bleiben für kompatible Projektdateien gespeichert. Eine geänderte Stagebox-Zuordnung erzeugt oder bearbeitet keine Zeichnung. IEM per Kabel und physische Kabelbrücken bleiben als eigene Technikangaben bzw. Bühnenobjekte verfügbar.

## Technische Prüfung

`npm run build` erzeugt die eingebetteten Module und `index.html`; `npm test` prüft alle 27 aktuellen Testgruppen.

Die Laufzeittests in `stageplot-audio-v1.test.cjs` decken die reinen Zuteilungsfunktionen sowie die tatsächlichen Handler für automatische Zuordnung und Umstecken ab. Fälle: volle Zielbox, benachbarte Stereo-Ports, teilweise vorhandene Stereo-Zuordnung, erforderliche DI-Box, Wiederwahl eines bereits zugeordneten Stereosignals und Konfliktbestätigung. Bestehende Zeichnungsdaten überstehen Normalisieren und Projektkopien; die Ausgabe der Patchliste ist unabhängig von ihnen. Statische Prüfungen verhindern die Wiedereinführung von Kabel-Zeichenaktionen. Bestehende Tests prüfen weiterhin Migration lokaler Entwürfe, Projektkopien und die gemeinsamen Drucktabellen.

Browserprüfung am 09.09.2026: Desktop (1280 × 720) und schmale Ansicht (390 × 844), Hell-/Dunkelmodus, Suche, direkte Stereo-Portwahl mit DI-Hinweis, Buchsendetails, Umstecken, Rückgängig/Wiederholen, Kanalnummern und Wiederherstellung beim erneuten Öffnen. Die vier Spalten der Patchliste sowie Input-/Outputlisten wurden in der A4-Druckvorschau geprüft. Der Bühneneditor und die Objekteigenschaften arbeiten ohne Kabelwerkzeuge; ein verbliebener Verweis auf die entfernte Kabelauswahl wurde korrigiert und zusätzlich als Laufzeittest abgesichert. Die abschließenden Browserprüfungen meldeten keine JavaScript-Fehler. Die schmale Ansicht wurde über eine Browser-Viewport-Simulation geprüft, nicht auf physischer Touch-Hardware.

Zusätzliche Dialogtests prüfen die tatsächlichen Tab- und Speicherfunktionen, Tastaturnavigation, Formularwerte über Bereichswechsel, das erste ungültige Feld bei Fehlern in mehreren Bereichen, gültige Stereo-Paare und den Erhalt unterschiedlicher Mikrofon-/Notizangaben sowie getrennter Stageboxen für L/R.

Der aufgeteilte Signal-Dialog wurde zusätzlich an einer belegten Stagebox-Buchse und über die Audioliste im Browser geprüft: Input-Stereo speichern/abbrechen, Kanalnummernkonflikt, ungültige Buchse in einem zugeklappten Bereich, IEM-Output samt Frequenzbereich und Wiederherstellung nach Neuladen. Die drei Bereiche und der feste Dialogfuß wurden bei 1280 × 720 und 390 × 844 in Hell/Dunkel geprüft; keine JavaScript-Fehler.
