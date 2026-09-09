# Audio & Verkabelung

Der Signal-Editor zeigt Instrument und Kanalnummer dauerhaft im Kopf. Vier direkt erreichbare Bereiche ersetzen aufklappbare Abschnitte:

- **Abnahme:** Mikrofon, DI, Direkt / Line oder Digital. Mikrofone per Hersteller-Taste und Modellkarte wählen; „Vorschläge“ berücksichtigt den Signalnamen. „Eigenes Modell“ erhält die Möglichkeit, nicht enthaltenes Equipment anzugeben. Eine Modellwahl übernimmt die 48-V-Voreinstellung aus dem Katalog; sie bleibt ausdrücklich änderbar.
- **Signalweg:** Die beteiligten Bühnenobjekte und der Weg über Abnahme, Stagebox und Mischpult. Große Karten binden weitere Mono-Signale in einen gemeinsamen Kanal ein. Die Auswahl zeigt vor dem Speichern, welcher CH dadurch integriert wird. Originaldaten bleiben wiederherstellbar.
- **Kanäle:** Mischpultnummern und die Stagebox-Buchsen des aktuellen Signals. CH und IN/OUT sind unabhängig voneinander. Stereo kann weiterhin getrennte Notizen, Modelle oder Buchsen an verschiedenen Stageboxen behalten.
- **Notizen & Funk:** Signalname, Notizen, Frequenzbereich, IEM-Übertragung und Reihenfolge.

## Stagebox verbinden und Stagebox-Belegung

**Stagebox verbinden** ist ein kleines Auswahlfenster für genau ein Signal bzw. Stereopaar. Es zeigt die Stageboxen mit Bild und schlägt eine passende freie Buchse vor. Eine gültige bestehende Zuordnung hat Vorrang; sonst wird die nächste kompatible Stagebox mit genügend Platz empfohlen. Die Buchsennummer lässt sich direkt ändern. Ein Klick auf „IN … verbinden“ übernimmt die Zuordnung. Volle und inkompatible Stageboxen bleiben sichtbar mit einer Erklärung. Kanalnummern, Mikrofon und Notizen werden dabei nicht geändert.

**Stagebox-Belegung** zeigt dagegen die gesamte Belegung einer oder mehrerer Stageboxen. Dort kann man von einer konkreten Buchse aus arbeiten und prüfen, was bereits angeschlossen ist.

Wird das kleine Fenster aus dem Signal-Editor geöffnet, ist die Wahl zunächst nur Teil des Formularentwurfs. Erst „Übernehmen“ im Signal-Editor speichert sie. Abbrechen lässt die ursprünglichen Daten stehen. Stereo-Zuordnungen werden vollständig geprüft und gemeinsam übernommen; belegte Buchsen werden nicht automatisch überschrieben.

## Originalfotos

Die Mikrofonbilder sind unveränderte Originaldateien aus den Produktseiten von Shure, Telefunken, beyerdynamic, Neumann, sE Electronics, Audix und Sennheiser. Sie liegen lokal unter `stageplot-assets/mics/` und funktionieren offline. Es werden keine KI-generierten Mikrofonbilder eingesetzt.

Die acht konkreten Modellfotos sind in [original-sources.json](stageplot-assets/mics/original-sources.json) mit Produktseite, Bildadresse, Abrufdatum und SHA-256 dokumentiert. Bildrechte und Marken verbleiben bei den jeweiligen Rechteinhabern; der Quellennachweis ist keine zusätzliche Lizenz. CSS zeigt die vollständigen Dateien mit `object-fit: contain`. Auch der Drum-Mikrofonpicker verwendet diese Originale.

Für Modelle ohne passendes Originalfoto erscheint eine beschriftete Modellkarte. Ein Foto einer anderen Bauform oder Modellrevision wird nicht als Ersatz verwendet. Beispielsweise bekommt der kurze M80-SH kein Foto des langen M80.

## Technische Grenzen

`stage.routing` bleibt die gemeinsame Datenquelle für Editor, Bühnenobjekte, Stagebox-Belegung und Ausdrucke. Der Umbau ändert weder das Speicherformat noch die Offline-Speicherung. `planAudioPatch` prüft Kapazität, belegte Buchsen, Stereo und notwendige DI-Boxen vor der Übernahme. Vorhandene Entwürfe und individuelle Mikrofonbezeichnungen bleiben erhalten.

## Validierung dieser Fassung

`npm test`: 28 Testgruppen, darunter gezielte Prüfungen für Originalfoto-Prüfsummen, Hersteller und Empfehlungen, freie bzw. belegte Buchsen, Stereo, unveränderte Mischpultdaten, Abbruch und Formularentwürfe. Browserprüfung mit frischem Beispielprojekt: 1280 × 720, 1280 × 900 und 390 × 844; Mikrofonwahl, 48 V, Wechsel der Abnahme, Speichern/Neuladen, Stagebox-Verbindung, verschachteltes Abbrechen, Signal-Zusammenführung und Wiederherstellen sowie Output-/IEM-Darstellung. Zusätzlich im Codex-App-Browser an einem vorhandenen lokalen Entwurf geprüft. Keine JavaScript-Laufzeitfehler bei diesen Abläufen.
