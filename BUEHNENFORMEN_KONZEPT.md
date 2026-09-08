# Bühnenformen und Hausvorlagen – Umsetzungsvorschlag

Recherche: 7. September 2026. Ausgangsbasis: `985b869`. Umsetzung begonnen und erster nutzbarer Stand fertiggestellt am 8. September 2026 im Branch `codex/feedback-editor-production`. Die folgenden Abschnitte dokumentieren das vollständige Konzept, einschließlich späterer Erweiterungen.

**Im ersten Stand umgesetzt:** Formen und Flächen kombinieren, freie Polygone zeichnen, Kanten und Punkte verändern, Kreisbögen über Ausladung einstellen, echte Ausschnitte, feste Einbauten, Treppen-/Rampenanschlüsse an Polygonkanten, Maß- und Höhenangaben, Sperren, Undo/Redo, 10-cm-Ziehen mit exakter Zahleneingabe, Zwei-Finger-Ansicht, lokale Hausvorlagen mit ausgewähltem Equipment und unabhängige Veranstaltungskopien. Editor, Projektkarten, PDF-/PNG-Vorschau, Projektdateien und Read-only-Links verwenden die neue Geometrie.

**Später:** Durchzeichnen eines importierten Bestandsplans, freie Béziergriffe, eigener Kreissektor-Dialog, frei wählbare Publikumsanordnung, Bauteilkatalog mit vollständigen technischen Daten und weitergehende Anschlussautomatik. Kreis-/Ovalflächen und runde Vorbühnen verwenden derzeit frei platzierte Treppen. Die bestehende Account-Grenze transportiert neue Vorlagenfelder, benötigt aber weiterhin eine eingerichtete Supabase-Instanz.

## Empfehlung

Den vorhandenen Bühneneditor um einen Modus **„Location / Hausbühne anlegen“** erweitern. Eine Location erfasst ihren tatsächlichen Grundriss einmal, ergänzt feste Einbauten und technische Anschlüsse und gibt daraus einen verständlichen Hausplan an Gastveranstalter weiter. Für einen Auftritt wird eine unabhängige Veranstaltungskopie angelegt.

Kern sind frei bearbeitbare Umrisse aus Geraden und Bögen, kombinierbare Flächen und echte Aussparungen. Vorlagen wie „runde Vorbühne“, „Steg“ und „Seitenbühnen“ sind schnelle Einstiege in dasselbe Modell. Besonders Kulturhäuser, Theater und Clubs in bestehenden Gebäuden brauchen zusätzlich schiefe Wände, einspringende Ecken, Säulen und genaue Einzelmaße.

## Was die Recherche für das Produkt bedeutet

**Bühnenform und Publikumsanordnung getrennt erfassen.** Guckkastenbühnen können eine Vorbühne vor dem Portal haben. Bei einer Thrust-Bühne sitzt Publikum an drei Seiten; ihre Fläche kann halbrund oder polygonal sein. Auch eine Arena beziehungsweise ein Theater „in the round“ muss keine kreisrunde Fläche haben. Deshalb darf ein Preset „Rund“ nicht automatisch die Publikumsrichtung oder Stage Left/Right ändern. [Theatres Trust](https://www.theatrestrust.org.uk/discover-theatres/theatre-faqs/170-what-are-the-types-of-theatre-stages-and-auditoria)

**Häuser bestehen aus unterschiedlichen Bereichen.** La Poste Visp beschreibt Hauptbühne, Vorbühne, Seitenbühnenzugang und verstellbaren Orchestergraben. Das sind nicht einfach mehrere gleichberechtigte Rechtecke: Flächen haben unterschiedliche Funktionen und können unterschiedliche Höhen oder Nutzungszustände haben. [La Poste, technische Daten](https://www.lapostevisp.ch/de/theater/technische-daten)

**Die nutzbare Fläche kann kleiner als der räumliche Umriss sein.** Der Rider des Nationaltheaters Weimar unterscheidet Haupt-, Hinter- und Seitenbühnen und beschreibt eingeschränkt verfügbare Flächen. Daraus folgt für unseren Editor eine separate Kennzeichnung „bespielbar“, „Nebenbereich“ oder „freihalten“. Die Quelle hat den Dokumentstand Januar 2021; sie dient als Beispiel für die Informationsstruktur, nicht als aktuelle Buchungsauskunft. [Nationaltheater Weimar, Rider](https://www.nationaltheater-weimar.de/de/ueber-uns/spielorte/grosses-haus/pdfs/dnt-grosses-haus-2021.pdf)

**Gürtel-Locations brauchen genaue Eingaben.** Das B72 nennt eine Bühnenbreite von ungefähr 4,18 m, eine Tiefe von ungefähr 4,27 m und etwa 0,60 m Höhe. Außerdem nennt es feste Stagebox-Positionen und die Signalübergabe am FOH. Empfehlung: Ziehen standardmäßig in 10-cm-Schritten, aber gemessene Zahlen wie 4,18 m unverändert eingeben und speichern können. „Ungefähr“ muss als Angabe erhalten bleiben. [B72, Booking and Tech](https://www.b72.at/booking-and-tech)

**Reale Podestsysteme gehen über Rechtecke hinaus.** Nivtec nennt Kreis- und Trapezformen sowie Öffnungen und Aussparungen. Treppen und Rampen sind eigene Zugänge mit einer räumlichen Verbindung zur Bühne. Die Grundrissgestaltung sollte deshalb herstellerunabhängig sein; ein optionaler Modulplan kann ergänzend konkrete Podeste darstellen. [Nivtec, Sonderformen](https://nivtec.com/en/customized/), [Podeste](https://nivtec.com/en/platforms/), [Treppen und Rampen](https://nivtec.com/en/stairs-and-ramps/)

**Hauspläne werden heute bereits zur Weitergabe veröffentlicht.** Theater Lübeck stellt Grundrisse, Schnitte und technische Dokumentation bereit, darunter PDF- und DWG-Dateien. Für unseren Anwendungsfall sind ein kompakter PDF-Hausplan und eine bearbeitbare Vorlage besonders naheliegend. [Theater Lübeck, Bühnengrundrisse](https://www.theaterluebeck.de/seiten/buehnengrundrisse.html)

## Welche Formen und Elemente der Editor abdecken soll

| Form / Element | Sinnvolle Eingaben und Bearbeitung |
| --- | --- |
| Rechteck / Quadrat | Breite, Tiefe, einzelne Kanten verschieben |
| Runde Vorbühne | Anschlussbreite und Ausladung nach vorne; Halbkreis als Sonderfall; flachere Bögen ebenfalls möglich |
| Kreis / Oval / Kreissektor | Durchmesser bzw. zwei Achsen; beim Sektor Winkel und Radius |
| Trapez / abgeschrägte Ecke | Vorder- und Hinterbreite oder einzelne Eckpunkte; Winkel bzw. Streckenmaß |
| L-, T-, U-Form | Kombination von Flächen; Anbauten bleiben gezielt bearbeitbar |
| Steg / Laufsteg | Breite, Länge, Ansatzpunkt und Richtung; optional Querpodest oder separate Endplattform |
| Seiten- / Hinterbühne | Eigene Fläche mit Name, Höhe und Nutzungsart; Übergang zur Hauptfläche |
| Freier Grundriss | Punkte setzen, verbinden, verschieben, ergänzen und entfernen; Kanten gerade oder gebogen |
| Treppeneinschnitt / Eckausnehmung | Fläche vom Rand wegnehmen; anschließend Zugang daran anlegen |
| Innenöffnung / Orchestergraben | Geschlossene Öffnung oder eigene tiefer liegende Fläche; Zustand „offen / abgedeckt“ bei Bedarf |
| Säule / Wandvorsprung | Festes Hindernis mit Grundfläche; muss keine Bodenöffnung sein |
| Vorhang / Portal / Geländer | Linie oder schmales Element mit Breite, Öffnung und optionaler Höhe |
| Treppe / Rampe | Anfangs- und Zielniveau, Breite, Ausladung und Ausrichtung; an beliebige passende Kanten ansetzen |

„Halbkreis vorne“ sollte nicht die einzige Rundungsoption sein: Bei einem echten Halbkreis ist die Ausladung halb so groß wie seine Breite. Eine flach gerundete Theaterfront braucht unabhängig einstellbare Anschlussbreite und Ausladung. Im Hintergrund kann daraus ein Kreisbogen bestimmt werden. Für unregelmäßige Bestandsfronten sind mehrere Bogenabschnitte möglich. Freie Béziergriffe wären eine spätere Ergänzung für Sonderfälle.

## Vier getrennte Arten von Information

1. **Bodenflächen:** Wo ist tatsächlich Boden, und auf welcher Höhe? Hauptbühne, Vorbühne, Steg, Seitenbühne, Podium.
2. **Öffnungen:** Wo fehlt Boden? Treppenausschnitt, offene Versenkung, offener Graben. Diese Flächen werden geometrisch ausgeschnitten.
3. **Einbauten und Hindernisse:** Säule, Wand, festes Pult. Boden kann dort vorhanden sein, der Platz ist trotzdem nicht verfügbar.
4. **Nutzungsbereiche:** Bespielbare Fläche, Backstage, IEM, FOH, Zugang oder „freihalten“. Diese Markierungen verändern den Boden nicht.

Eine schraffierte Sperrfläche darf somit nicht automatisch zu einem Loch werden. Umgekehrt muss eine echte Öffnung auch beim Export mit transparentem Hintergrund offen bleiben. Überlappende Flächen dürfen bei der Flächenberechnung nicht doppelt gezählt werden. Unterschiedliche Höhenniveaus behalten ihre Übergänge.

## Vorgeschlagene Bedienung

**1. Grundriss beginnen.** Beim Anlegen zwischen Veranstaltung und Hausvorlage wählen. In der Hausvorlage: Rechteck als Start, eine Formvorlage wählen oder einen freien Umriss zeichnen. Die vorhandenen Projektbereiche bleiben erhalten; „Hausgrundriss bearbeiten“ ist ein klarer eigener Bearbeitungsmodus im Editor.

**2. Am Plan bearbeiten.** Eine Kante oder Ecke antippen. Dazu passende Aktionen erscheinen mit Namen: „Kante verschieben“, „Punkt ergänzen“, „Rundung“, „Fläche anbauen“, „Ausschnitt“. Maße lassen sich direkt anklicken und eingeben. Bei einer Rundung gibt es einen Griff für ihre Ausladung. Bei einem Rechteck bleibt die vertraute Bearbeitung über Breite und Tiefe verfügbar.

**3. Formen verbinden oder ausschneiden.** Ein Rechteck für den Steg an die Vorderkante ziehen; Breite und Länge einstellen. Für eine Treppennische ein Rechteck am Eck als Ausschnitt markieren. Beide Bestandteile bleiben später in der Liste auswählbar. Die äußere Bühnenlinie wird daraus gemeinsam berechnet.

**4. Bestandsmaße respektieren.** Verschieben und Vergrößern standardmäßig in 0,10 m; Raster bei Bedarf ausschalten. Zahlenfelder nehmen genauere Maße an. Ein eingetragener Wert wie 4,18 m wird durch Speichern, Laden oder eine unbeteiligte Bearbeitung nicht auf 4,20 m gerundet. Beim Ziehen einer bereits exakt vermessenen Kante sollte der 10-cm-Schritt auf die Änderung angewendet werden, statt alle Koordinaten auf ein neues absolutes Raster zu zwingen.

**5. Auf Touch bewusst auswählen.** Erst ein Objekt oder eine Kante antippen, dann große Griffe ziehen. Zwei Finger verschieben beziehungsweise zoomen die Ansicht; beim ausgewählten Flächenbaustein wird die bereits vorhandene Größenänderung nur im expliziten Größenmodus genutzt. So verändert das Navigieren nicht versehentlich den Hausgrundriss. Alle wesentlichen Aktionen funktionieren ohne Hover und Rechtsklick.

**6. Hausplan vervollständigen.** Feste Säulen, Wände, Türen, Treppen, Portal und Vorhang ergänzen. Bühnenhöhe und lichte Höhe als optionale Maße hinterlegen; bei einem Gewölbe gegebenenfalls mehrere beschriftete Höhenpunkte. Keine unbekannte Höhe automatisch als null darstellen. Stageboxen, Strom, Signalübergabe und festes FOH aus den bestehenden Funktionen übernehmen.

**7. Vorlage sichern und nutzen.** Die Hausvorlage enthält Raumname, Grundriss, feste Einbauten, Anschlusspunkte, Maße, Quellen-/Messhinweis und Revisionsstand. „Veranstaltung auf dieser Bühne planen“ erzeugt eine eigenständige Kopie mit Verweis auf diese Revision. Ein anderer Bandaufbau verändert das Original nicht. Neuere Hausvorlagen ersetzen bestehende Veranstaltungspläne nicht automatisch.

## Maße und Weitergabe an Veranstalter

Der Hausplan braucht mehr als „8 × 6 m“: Gesamtbreite und Gesamttiefe, relevante einzelne Kanten, Stegbreite, Nischenmaße, Vorbühnenausladung, Portalöffnung und Bühnenhöhe. Optional: tatsächliche Bodenfläche und nutzbare Spielfläche getrennt. Eine frei platzierbare Maßlinie misst den Abstand zwischen zwei Punkten. Angeheftete Maße bleiben bei Änderungen an der zugehörigen Kante.

Stage Left/Right bleiben aus Sicht der Performer definiert. Die Referenzrichtung wird ausdrücklich gespeichert; eine Publikumsfläche an drei Seiten führt nicht zu einer automatischen Neudefinition. Für Theater sind eine sichtbare Bühnenmittellinie und eine Portal-/Bezugslinie hilfreiche optionale Ergänzungen. Der gespeicherte Koordinatenursprung bleibt bei Anbauten und Ausschnitten stabil.

Empfohlene Ausgabe:

- **PDF-Hausplan:** Grundriss mit Maßen, Orientierung, Legende, Datum/Revision und ausgewählten technischen Angaben. Wahlweise „nur Haus“ oder „Haus mit Veranstaltungsaufbau“.
- **Bearbeitbare Projekt-/Vorlagendatei:** Ein Gastveranstalter kann auf derselben Geometrie weiterplanen, auch ohne Account.
- **Leselink:** Die bestehende schreibgeschützte Momentaufnahme erweitern. Für umfangreiche Pläne mit Hintergrundbildern ist eine Datei zunächst verlässlicher; ein dauerhafter kurzer Weblink mit aktualisierbarer Hausversion wäre eine spätere Serverfunktion.

Maßzahlen und Maßstabsbalken gehören in die Ausgabe. Ein auf die Seite eingepasster Plan bekommt keinen erfundenen festen Maßstab. „1:50“ oder „1:100“ nur anbieten, wenn Papierformat und Ausgabegröße tatsächlich darauf eingestellt sind.

Der Hausplan beschreibt die Location in 2D samt Höhenangaben. Baustatik, automatische Fluchtwegprüfung und vollständige Theatermaschinerie gehören nicht in diese Erweiterung.

## Was im aktuellen Code bereits hilft und was geändert werden muss

Vorhanden sind SVG-Darstellung, gemeinsame Plan-/Exportdarstellung, Projektdateien, Offline-Speicherung, Undo, Treppen, magnetisch ansetzbare Bühnenmodule, Bühnenvorlagen und Leselinks. Diese Funktionen können weiterverwendet werden.

Die eigentliche Hauptbühne ist aber noch über `stage.w` und `stage.d` als Rechteck definiert:

- `drawFloor()` zeichnet ein Rechteck und füllt es grundsätzlich mit 2 × 1-m-Modulen. Bei einer festen Hausbühne sollte eine neutrale Fläche der Standard sein; Modulraster nur auf Wunsch.
- `outside()` prüft gegen die vier Rechteckgrenzen. Dadurch ist eine beliebige Erweiterung noch keine einheitlich erkannte Bühnenfläche.
- `snapStageModule()` und die Treppenfunktionen orientieren sich an Rechteckseiten und überwiegend orthogonalen Richtungen.
- `workspaceBounds()` und die gespeicherte Kamera nutzen weiterhin Breite/Tiefe als Grundreferenz.
- `draft()`, `normalizeStageTemplate()` und `normalizeSetupDocument()` übernehmen ausdrücklich aufgezählte Felder. Neue Geometrie würde ohne gemeinsame Anpassung beim Speichern, Exportieren oder Synchronisieren verloren gehen.
- Die einfache Bühnenvorlage speichert Bühnenparameter, aber keine allgemeine Sammlung fester Einbauten oder komplexer Anbauobjekte.
- Leselinks enthalten bereits das normalisierte Dokument im URL-Fragment und benötigen keinen Account; derzeit gibt es eine Größenbegrenzung von 90.000 Bytes vor der Kodierung. Das ist keine Garantie für problemlose Weitergabe langer Links in jedem Messenger.

Fundstellen im Stand `985b869`: `stageplot-studio.html`, insbesondere Funktionen `draft`, `snapStageModule`, `stairsGeometry`, `moveStairsAlongEdge`, `workspaceBounds`, `outside`, `drawFloor`, `normalizeStageTemplate`, `normalizeSetupDocument`, `encodeShareDocument`.

## Technischer Aufbau – Vorschlag

Ein eigenes Modul `stageplot-geometry-v1.js` berechnet Formen unabhängig von der Benutzeroberfläche. Es liefert gemeinsame Umrisse, Öffnungen, Flächen, Begrenzungsrahmen, nächstgelegene Kanten und Überlappungen. Editor, Ausrichtung, Maßlinien, Treppen, Objektprüfung und Export verwenden dieselbe Geometrie. Das Modul wird lokal ausgeliefert und in den bestehenden Build-/Prüfablauf aufgenommen.

Das Dokument speichert eine versionierte Geometrie mit:

- stabilen IDs für Flächen, Kanten und Öffnungen;
- Metern als Koordinateneinheit, unabhängig vom Bearbeitungsraster;
- Geraden und parametrischen Bögen;
- Fläche hinzufügen / Fläche wegnehmen als nachvollziehbaren, weiter editierbaren Bausteinen;
- Rolle und Höhenniveau je Fläche;
- festen Einbauten, separaten Nutzungszonen und verankerten Maßlinien;
- Referenzrichtung, Hausvorlagen-ID und verwendeter Revision.

Zusammenführen und Ausschneiden benötigen geometrische Mengenoperationen. Als Kandidat für einen kleinen technischen Prototyp bietet sich `polygon-clipping` an: Es unterstützt Vereinigung, Differenz und Mehrfachpolygone einschließlich Innenringen, unter MIT-Lizenz. Die endgültige Wahl sollte anhand unserer Fälle mit berührenden Kanten, schmalen Nischen und Rundungen geprüft werden. [Projekt und API](https://github.com/mfogel/polygon-clipping)

Wichtiger Punkt: Dieser Kandidat arbeitet mit Polygonen, nicht mit analytischen Kreisbögen. Deshalb müssen editierbare Bogenparameter erhalten bleiben. Für die gemeinsame Berechnung wird daraus eine deterministische, fein genug unterteilte Kontur abgeleitet; eine maximale Abweichung von beispielsweise 1 mm wäre ein zu prüfendes technisches Ziel, keine behauptete Vermessungsgenauigkeit. Berechnungs- und Ausgabegenauigkeit müssen zusammenpassen. Eine Alternative für komplexere Kurvenoperationen ist Paper.js; die zusätzlich eingeführte Zeichenstruktur wäre gegenüber dem vorhandenen SVG-Editor abzuwägen. [Paper.js, Path-Referenz](https://paperjs.org/reference/path/)

Treppen speichern künftig die referenzierte Fläche/Kante, Position entlang der Kante, Richtung und Abmessungen. Beim Löschen einer Kante bleibt eine betroffene Treppe sichtbar und wird als neu zuzuordnen markiert. Ihre Position darf nicht still verloren gehen. Bei Rundungen oder schrägen Kanten ist die gesamte Anschlussbreite zu prüfen, nicht nur der Mittelpunkt.

Für Platzierungsprüfungen zählt die gesamte Grundfläche eines Objekts. Ein Mittelpunkt innerhalb der Bühne reicht bei Löchern und einspringenden Ecken nicht aus. Außerhalb liegende Objekte bleiben wie bisher platzierbar; Hinweise berücksichtigen, ob sie auf der Bühne, im FOH oder in einem Nebenbereich vorgesehen sind.

## Bestehende Projekte erhalten

Alte Rechteckbühnen werden beim Einlesen als entsprechende Grundfläche interpretiert. Ursprung, Objektpositionen, Kabel und Notizen bleiben erhalten. Vorhandene Erweiterungsmodule können unter Beibehaltung ihrer IDs und Positionen in Bühnenflächen überführt werden; dabei weder doppelt zeichnen noch gewöhnliche Riser versehentlich mit der Hauptbühne verschmelzen.

Die neue Geometrie muss den kompletten Weg über Entwurf, Projekt, Vorlage, Export/Import, Leselink und Gerätesync überstehen. Für neue Dateien eine explizite Dokumentversion einführen und unbekannte neuere Versionen verständlich ablehnen. Kein stilles Zurücksetzen komplexer Bühnen auf das alte umschließende Rechteck. Lokale Speicherung bleibt primär; eine Hausvorlage funktioniert ohne Supabase.

## Reihenfolge der Umsetzung

**1. Gemeinsame Geometrie und Grundrissbearbeitung.** Rechteck, Polygon, Rundung, Anbau und echter Ausschnitt; exakte Maße, Kantenbearbeitung, Undo, neue Objektprüfung und einheitlicher Export. Abnahme anhand eines Clubs mit schräger Wand und Nische, einer runden Theaterfront sowie Seitenbühnen mit Steg.

**2. Hausvorlage als vollständiger Arbeitsablauf.** Feste Einbauten, nutzbare Flächen, anschließbare Treppen/Rampen, Höhen- und Maßangaben; Hausrevision sichern, Veranstaltungskopie erstellen und PDF/Datei/Leselink weitergeben. Die ersten beiden Schritte bilden gemeinsam den ersten sinnvoll veröffentlichbaren Umfang für Locations.

**3. Bestehende Hauspläne als Zeichenhilfe.** Bild oder ausgewählte PDF-Seite hinterlegen, zwei Punkte markieren, bekannte Distanz eingeben, drehen und mit einstellbarer Deckkraft nachzeichnen. Eine zweite bekannte Strecke hilft, verzerrte Scans zu erkennen. Zunächst manuelles Nachzeichnen; vollständiger DWG-/DXF-Import und automatische Erkennung kommen später. Referenzbilder gehören in eine lokale Asset-Ablage und bei Bedarf in eine portable Projektdatei, nicht unbeschränkt in URL-Links.

**4. Erweiterungen nach praktischen Tests.** Weitere Formpresets, elliptische und komplexere Kurven, offene/abgedeckte Varianten des Orchestergrabens, zusätzliche Höhenbereiche und ein veröffentlichbarer Hauslink mit Versionsverwaltung.

## Prüffälle für die Umsetzung

- Halbkreis und flacher Frontbogen behalten Breite/Ausladung nach Speichern und Laden.
- Ein Steg ist auf seiner Fläche als Bühne erkannt; Bereiche neben dem Steg sind es nicht.
- Treppeneinschnitt und vollständige Innenöffnung sind im Editor sowie im hellen, dunklen und transparenten Export identisch offen.
- Eine Säule begrenzt die nutzbare Fläche, ohne als Bodenöffnung gespeichert zu werden.
- Angrenzende und überlappende Flächen erhalten einen eindeutigen Umriss; getrennte Flächen und Höhenniveaus bleiben unterscheidbar.
- Ein Wert von 4,18 m bleibt durch Bearbeitung anderer Teile, Undo, Import und Sync unverändert.
- Ergänzen einer Fläche links vom bisherigen Ursprung verschiebt keine Instrumente und keine bestehende Bemaßung.
- Vorhandene Entwürfe und Vorlagen bleiben verlustfrei lesbar; neue Versionen werden nicht still reduziert.
- Hausrevision und Veranstaltungskopie lassen sich unabhängig ändern.
- Fingerbedienung auf echter Touch-Hardware prüft Auswahl, Kantenziehen und Navigation; Simulation allein reicht für die Abnahme der Gesten nicht.

Offen vor der endgültigen Implementierung bleiben die konkrete Geometriebibliothek, ihre Kurven-Toleranz und die Detailgestaltung der Kantenbedienung. Sie sollten mit wenigen repräsentativen Grundrissen überprüft werden, bevor die komplette Oberfläche daran angeschlossen wird.
