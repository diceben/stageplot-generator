# Playback-Laptop

Auf der Bühne den Laptop auswählen und **Playback-Ausgänge** öffnen. Derselbe Einstieg steht in seinen Audio-Eigenschaften. Drei große Schaltflächen wählen die Ausgabe ohne Dropdown:

- **Stereo L/R:** zwei Klinken-Ausgänge. Im Audioplan kann vor einer analogen XLR-Stagebox wie bisher eine DI-Box geplant werden.
- **PLAYAUDIO1U:** zwölf symmetrische XLR-Ausgänge, zunächst als sechs Stereo-Paare. Ein Name pro Paar ergibt z. B. `Intro · L` / `Intro · R` auf Out 1 / 2 und `Percussion · L` / `Percussion · R` auf Out 3 / 4. Jedes Paar kann zu zwei einzeln beschrifteten Mono-Ausgängen werden, etwa Click und Cue.
- **Dante:** Dante Virtual Soundcard über ein kabelgebundenes Ethernet-Netzwerk, mit Anzahl der genutzten Sendekanäle und Übergabeziel, etwa `FOH · Dante-Switch`. Die Kanäle teilen sich einen CAT5e-/CAT6-Netzwerkanschluss (RJ45); eine Internetverbindung ist dafür nicht erforderlich.

Über **Aktiv / Verwenden** werden nur benötigte Signale in den Audioplan übernommen. Bei Stereo gilt der Schalter für das Paar; bei Mono hat jeder Ausgang einen eigenen Schalter. Die physische Ausgangskapazität bleibt erhalten. Die Übersicht zeigt die Anzahl genutzter Kanäle.

**CH** bleibt die Mischpultnummer. **XLR Out** bezeichnet den physischen Playback-Ausgang, **Dante Tx** den Netzwerk-Sendekanal und **Stagebox IN** die Eingangsbuchse der Stagebox. Audioliste und Druckliste zeigen diese Angaben getrennt. Die Namen erscheinen auch im Export. Die Dante-Übergabe lässt sich direkt in der Audioliste anklicken und bearbeiten. Die App beschreibt eine geplante Verbindung und richtet keine Audiohardware oder Dante-Abonnements ein.

## Bestehende Projekte und Änderungen

Öffnen oder Abbrechen des Dialogs verändert das Projekt nicht. Innerhalb eines geöffneten Dialogs bleiben die bearbeiteten Optionen beim Hin- und Herwechseln erhalten. Erst **Übernehmen** speichert lokal; der gesamte Schritt lässt sich rückgängig machen.

Die vorhandenen Ausgangs-IDs, Mischpultnummern und Notizen bleiben für weiterverwendete Kanäle erhalten. Namen und Ausgangsformate aktualisieren den gemeinsamen Audioplan. Beim Wechsel zu Dante werden analoge Stagebox-Patches des Laptops gelöst; die übrigen Bühnenobjekte bleiben zugeordnet. Der Dialog zeigt die Zahl betroffener Verbindungen und entfallender Kanäle vor dem Übernehmen. Dante-Signale können nicht versehentlich auf analoge XLR-Buchsen gepatcht werden.

Weniger Ausgänge oder deaktivierte Signale entfernen deren aktive Kanäle. Rückgängig stellt auch deren alte Nummern, Namen und Patches wieder her. Ein gespeicherter Wechsel ist kein dauerhaftes Archiv separater Geräteprofile. Bereits mit anderen Quellen zusammengeführte Signalwege müssen vor einem Wechsel ihres Ausgangsformats im Signal-Editor getrennt werden; dadurch bleiben ihre ursprünglichen Kanaldaten erhalten.

Ältere, individuell konfigurierte Laptops behalten ihre Buchsen und Ausgangs-IDs. Im Dialog erscheinen diese als vorhandenes Setup, bis ausdrücklich eine der drei Optionen gewählt wird. Projektdateien, lokale Entwürfe und Kopien enthalten dieselben Daten.

## Datenmodell

`stageplot-playback-v1.js` und `.css` sind die Modulquellen; `npm run build` aktualisiert die eingebetteten Kopien. `o.io` bleibt die gemeinsame Quelle für Hardwarekapazität, Anschlüsse, Stereo-Paare und Ausgangs-Aliase. Die kleine Ergänzung `o.playback = {version: 1, mode, target}` beschreibt Ausgabeart und Netzwerkziel. Die aktiven Signale und deaktivierten Ausgangs-IDs verbleiben in `stage.routing`.

Die vorhandenen nativen Schlüssel `playback-l`, `playback-r`, `io-out-N` bzw. ältere `configured-out-N` bleiben stabil. Kanalbeschriftungen, Abnahme, Mischpultnummer und Stagebox-Zuordnung verwenden weiter die gemeinsamen Routing-Datensätze. Hardware- und Kanaländerungen bilden einen gemeinsamen Undo-Schritt.

## Herstellerangaben

Geprüft am 10. September 2026:

- [iConnectivity PLAYAUDIO1U](https://www.iconnectivity.com/playaudio1u): zwölf symmetrische XLR-Ausgänge. Der Ethernet-Port des Geräts dient RTP-MIDI und ist keine Dante-Audioschnittstelle. Die Dante-Option im Stageplotter beschreibt deshalb einen eigenen Weg über Virtual Soundcard.
- [iConnectivity: PLAYAUDIO1U einrichten](https://www.iconnectivity.com/blog/plug-and-play-effortless-audio-setup-with-the-playaudio1u): zwölf Mono- bzw. sechs Stereo-Kanäle; symmetrische XLR-Ausgänge können direkt an Mischpult oder Stagebox angeschlossen werden.
- [Dante Virtual Soundcard Datenblatt](https://www.getdante.com/docs/dante-virtual-soundcard-datasheet/) und [Produktvergleich](https://www.getdante.com/products/software-essentials/dante-virtual-soundcard/compare/): Standard-DVS bietet bis zu 64 × 64 Kanäle bei 44,1/48 kHz, 32 × 32 bei 88,2/96 kHz und 8 × 8 bei 176,4/192 kHz; kabelgebundenes Gigabit-Ethernet, kein WLAN.
- [DVS-Kanalzahlen](https://support.getdante.com/hc/en-gb/articles/5502029407263-How-many-channels-of-audio-does-Dante-Virtual-Soundcard-support): DVS selbst wird in unterstützten Kapazitätsstufen konfiguriert. Die Stageplotter-Auswahl meint die **genutzten Sendekanäle**; für z. B. zwölf geplante Kanäle muss DVS entsprechend ausreichend konfiguriert werden. Treiber, Abtastrate und DVS-Ausgabe bestimmen die verfügbare Kapazität.
