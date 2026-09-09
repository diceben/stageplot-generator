# Audio & Verkabelung

Inputs, Outputs und Stagebox-Belegung verwenden dieselben Signalzeilen in `stage.routing`. Der Ablauf lautet: Signal auswählen, Stagebox wählen, Buchse zuordnen. Die vorhandenen Speicher- und Projektformate werden weiterverwendet.

## Bedienung

- Signale suchen und bei Bedarf nach fehlenden Nummern oder Zuordnungen filtern. Ein passender Stereo-Kanal zeigt auch seinen Partner.
- „Stagebox zuordnen“ in der Signalzeile öffnet den gemeinsamen Signal-Editor am Zuordnungsabschnitt. Eine Stagebox und freie Buchse wählen; bei Stereo werden benachbarte Paare angeboten. Manuelle, auch getrennte Ports bleiben editierbar.
- Eine freie Stagebox-Buchse öffnet die Signalauswahl. Eine belegte Buchse zeigt zunächst kompakte Details. Bearbeiten, Umstecken und Zuordnung lösen sind explizite Aktionen.
- Beim Umstecken wird angezeigt, welches Signal verschoben oder von der Zielbuchse gelöst wird. Das verdrängte Signal bleibt in der Liste. Die Stereo-Zuordnung wird als Ganzes behandelt.
- „Danach nächste freie Buchse öffnen“ schaltet die Serienzuordnung ein. Ohne diese Option bleibt die bearbeitete Buchse ausgewählt.
- Nummerieren ergänzt fehlende Kanalnummern. Automatisches Zuordnen ergänzt fehlende Buchsen und erhält bestehende Angaben. Beide Vorgänge sind unabhängig und rückgängig machbar.
- Kabelzeichnen, Ziehgriffe, Kabellängen-Editor und Kabelansicht entfallen. Bühne, Projektvorschau und Export zeigen keine Kabelzeichnungen. Die Patchliste enthält Buchse, Mischpultkanal, Signal und Anschluss.
- Alte `stage.cables`-Daten bleiben für kompatible Projektdateien gespeichert. Eine geänderte Stagebox-Zuordnung erzeugt oder bearbeitet keine Zeichnung. IEM per Kabel und physische Kabelbrücken bleiben als eigene Technikangaben bzw. Bühnenobjekte verfügbar.

## Technische Prüfung

`npm run build` erzeugt die eingebetteten Module und `index.html`; `npm test` prüft alle 27 aktuellen Testgruppen.

Die Laufzeittests in `stageplot-audio-v1.test.cjs` decken die reinen Zuteilungsfunktionen sowie die tatsächlichen Handler für automatische Zuordnung und Umstecken ab. Fälle: volle Zielbox, benachbarte Stereo-Ports, teilweise vorhandene Stereo-Zuordnung, erforderliche DI-Box, Wiederwahl eines bereits zugeordneten Stereosignals und Konfliktbestätigung. Bestehende Zeichnungsdaten überstehen Normalisieren und Projektkopien; die Ausgabe der Patchliste ist unabhängig von ihnen. Statische Prüfungen verhindern die Wiedereinführung von Kabel-Zeichenaktionen. Bestehende Tests prüfen weiterhin Migration lokaler Entwürfe, Projektkopien und die gemeinsamen Drucktabellen.

Die Browserabnahme für diesen Stand ist noch offen: Desktop/Mobilgerät, Hell-/Dunkelmodus, Stagebox-Auswahl, direkte Portwahl, Umstecken, Rückgängig/Wiederholen, Neuladen und Druckvorschau. Die Browsersteuerung war zuletzt durch den gesperrten Mac nicht erreichbar. Vor dem Veröffentlichen nachholen und diesen Absatz aktualisieren.
