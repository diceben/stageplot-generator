# Linkfreigabe einrichten; Accounts später

Der Editor und das Inventar funktionieren mit lokalem Browserspeicher. Kurze Links benötigen den separaten Supabase-Dienst. Absender und Empfänger brauchen dafür kein Anmeldeformular, keine E-Mail und kein Passwort. Die App merkt sich die Verwaltungserlaubnis im Browser des Absenders. E-Mail-Accounts und Gerätesync bleiben vorerst deaktiviert.

## 1. Eigenes Supabase-Projekt

Ein separates Projekt für diesen 2D-Stageplotter verwenden. Keine Datenbank von Gigboard oder Stageplay 3D anschließen.

Im SQL Editor die Migrationen in dieser Reihenfolge ausführen:

1. [0001_stageplot_documents.sql](supabase/migrations/0001_stageplot_documents.sql)
2. [0002_inventory.sql](supabase/migrations/0002_inventory.sql)
3. [0003_project_shares.sql](supabase/migrations/0003_project_shares.sql)
4. [0004_reusable_share_ids.sql](supabase/migrations/0004_reusable_share_ids.sql)
5. [0005_share_only_guest_access.sql](supabase/migrations/0005_share_only_guest_access.sql)
6. [0006_share_label_positions.sql](supabase/migrations/0006_share_label_positions.sql)
7. [0007_instrument_details.sql](supabase/migrations/0007_instrument_details.sql)

Nur noch fehlende Migrationen ergänzen. Migration 0007 erhält Stufenanzahl, zusätzliche Drum-/Percussion-Teile und deren Mikrofonwahl. Die bestehenden Datenschutzfilter und Berechtigungen bleiben erhalten. Sie ist Voraussetzung für vollständige neue Online-Freigaben; lokal funktioniert der neue Stand auch ohne Datenbank. Migration 0006 erhält die verschobenen Positionen von Objektbeschriftungen in Freigaben. Der Ausschluss privater Felder und die Zugriffsrechte bleiben unverändert; bereits freigegebene Pläne erhalten die Positionen beim nächsten Aktualisieren des Links. Migration 0005 beschränkt anonyme Browser-Sitzungen auf die Freigabe-Funktionen. Private Dokumente und der spätere Gerätesync benötigen eine dauerhafte Anmeldung; die Eigentümerprüfung bleibt zusätzlich bestehen. Die private Dokumenttabelle speichert Projekte, Drumvorlagen, Bühnenvorlagen und Inventareinträge. Row Level Security begrenzt den Zugriff auf den angemeldeten Eigentümer. Der Geräteabgleich verwendet ausschließlich `stageplot_sync_push` und `stageplot_sync_pull`.

Migration 0003 ergänzt eine getrennte Tabelle für bewusst veröffentlichte Bühnenpläne. Direkter Tabellenzugriff und Auflisten sind gesperrt. `stageplot_share_get` liefert ohne Anmeldung genau eine aktive Freigabe zur angegebenen ID. Migration 0004 ermöglicht die Freigabe ohne E-Mail-Anmeldung. Veröffentlichen und Löschen benötigen die automatisch erzeugte Browser-Sitzung. Die Statusabfrage gibt nur aktive/freie ID, eigene Berechtigung und Zeitstempel aus. Client und Server übernehmen nur ausdrücklich erlaubte Plan- und Routingfelder: keine Kontakte, Autorenangaben, freien Notizen oder Inventarverweise. Projekttitel, Objektbeschriftungen und technische Bezeichnungen bleiben enthalten und müssen vor dem Freigeben auf private Inhalte geprüft werden. Die ID ist ein Zugang zur Ansicht, kein Ersatz für personenbezogene Berechtigungen.

Der Primärschlüssel und eine Transaktionssperre garantieren genau eine aktive Freigabe pro ID, auch bei gleichzeitigen Anfragen. „Link löschen“ entfernt den Datensatz und gibt die ID wieder frei. Auch alte Widerrufsreservierungen werden durch Migration 0004 freigegeben. Der nächste erfolgreiche Absender erhält die ID; der frühere Absender kann dessen Plan weder überschreiben noch löschen. Alte Links können nach einer Neuvergabe auf den neuen Plan zeigen.

Das Löschen eines lokalen Projekts entfernt keine Online-Freigabe. Den Link bei Bedarf vorher im Teilen-Dialog löschen. Heruntergeladene Kopien und vollständige Offline-Links bleiben bestehen. Höchstens 100 aktive Freigaben pro Browser-Identität und 2 MB pro Snapshot; „Link kopieren“ auf Projektkarten und in den Projektdaten stellt den aktuellen Stand bereit und kopiert einen vollständigen Link. Im Teilen-Dialog heißt die Aktion „Aktualisieren & Link kopieren“. Erst nach erfolgreicher Veröffentlichung wird die Adresse in die Zwischenablage geschrieben. Bei verweigertem Zugriff bleibt sie zum manuellen Kopieren sichtbar. Lokal erzeugte Projekt-IDs sind erst mit erfolgreicher Online-Freigabe global belegt.

## 2. Teilen ohne Anmeldeformular aktivieren

Unter **Authentication → Sign In / Providers** den Schalter **Allow anonymous sign-ins** einschalten und **Save changes** wählen. **Allow new users to sign up** bleibt eingeschaltet. E-Mail-Versand und SMTP sind für diese Funktion nicht erforderlich.

Erst „Link erstellen“ erzeugt im Hintergrund eine anonyme Supabase-Sitzung. Sie wird getrennt von späteren E-Mail-Accounts unter einem eigenen Browser-Speicherschlüssel gespeichert. Empfänger benötigen keine Sitzung. Nach Löschen der Website-Daten oder in einem anderen Browser fehlt die Verwaltungsberechtigung; ein belegter Link kann dann nur angesehen werden. Für eine eigene neue Freigabe lässt sich das Projekt duplizieren. [Supabase: Anonymous Sign-Ins](https://supabase.com/docs/guides/auth/auth-anonymous)

Für den öffentlichen Betrieb empfiehlt Supabase CAPTCHA gegen automatisierte Neuanmeldungen. Die aktuelle App übergibt noch keinen CAPTCHA-Token; den Schutz erst gemeinsam mit einer passenden App-Erweiterung aktivieren. Die vorhandenen Supabase-Rate-Limits aktiv lassen.

## 3. Öffentliche Build-Konfiguration

Im GitHub-Repository unter **Settings → Secrets and variables → Actions → Variables** zwei Repository-Variablen hinterlegen:

| Variable | Inhalt |
| --- | --- |
| `STAGEPLOT_SUPABASE_URL` | HTTPS-Projektadresse, beispielsweise `https://dein-projekt.supabase.co` |
| `STAGEPLOT_SUPABASE_PUBLISHABLE_KEY` | Öffentlicher Schlüssel, beginnend mit `sb_publishable_` |

Der Pages-Workflow erzeugt daraus `stageplot-cloud-config.js`. Der Build akzeptiert ausschließlich eine Supabase-Projektadresse und einen Publishable-Key. `service_role`, `sb_secret_` und andere serverseitige Schlüssel gehören niemals ins Frontend. Der öffentliche Schlüssel ersetzt keine Zugriffsregeln; dafür ist die RLS-Konfiguration aus den Migrationen zuständig. [Supabase: API keys](https://supabase.com/docs/guides/getting-started/api-keys)

Sind beide Variablen leer, bleiben die Online-Dienste deaktiviert. Mit den beiden Variablen wird die Linkfreigabe aktiviert; E-Mail-Accounts bleiben ohne `STAGEPLOT_ACCOUNTS_ENABLED=true` deaktiviert. Ist nur eine gesetzt oder ungültig, bricht der Deploy ab. Die Versionskontrolle enthält weiterhin die leere Konfiguration. Erst ein geprüfter Merge auf `main` und ein erfolgreicher Pages-Workflow veröffentlichen die Änderung.

Lokal lassen sich dieselben Variablen für `npm run build:cloud-config` setzen. Danach den Vorschau-Server neu starten und den Browser neu laden. Vor einem Commit ohne echte Konfiguration den Befehl mit beiden Variablen leer ausführen.

## Später: Anmeldung per E-Mail-Code

Dieser Abschnitt betrifft ausschließlich den späteren optionalen Account-Abgleich. Erst nach dessen Einrichtung und Prüfung die zusätzliche GitHub-Variable `STAGEPLOT_ACCOUNTS_ENABLED` auf `true` setzen. Für die aktuelle Linkfreigabe diese Variable weglassen.

E-Mail-Anmeldung und Registrierungen im Supabase-Projekt aktivieren. Unter Authentication → URL Configuration als Site URL die veröffentlichte App-Adresse eintragen. In der E-Mail-Vorlage **Magic Link** einen Code mit `{{ .Token }}` ausgeben, beispielsweise Betreff „Dein Stageplotter-Anmeldecode“ und Inhalt:

```html
<h2>Dein Anmeldecode</h2>
<p>Gib diesen Code im Stageplotter ein:</p>
<p><strong>{{ .Token }}</strong></p>
<p>Wenn du keinen Code angefordert hast, kannst du diese E-Mail ignorieren.</p>
```

Die App verwendet `signInWithOtp` und `verifyOtp` mit `type: 'email'`; sie verarbeitet keine Magic Links aus der URL. Sie akzeptiert Codes mit sechs bis zehn Ziffern. Die Browser-Identität der Linkfreigabe bleibt davon getrennt; ein E-Mail-Login übernimmt bestehende Links nicht automatisch.

Für externe Nutzer einen eigenen SMTP-Versand einrichten und den Versand an eine Testadresse prüfen. Die Standardeinstellungen des E-Mail-Dienstes sind für einen öffentlichen Betrieb nicht ausreichend. Details: [Supabase: Passwordless E-Mail Login](https://supabase.com/docs/guides/auth/auth-email-passwordless) und [SMTP](https://supabase.com/docs/guides/auth/auth-smtp).

## Später: Zwei Geräte verbinden

Auf jedem Gerät dieselbe veröffentlichte URL öffnen, unter **Account & Inventar → Account & Sync** mit derselben E-Mail anmelden und **Dieses Gerät verbinden** wählen. Erst das Verbinden gibt die lokalen Projekte, Entwürfe, Vorlagen und das Inventar für den Account-Abgleich frei.

Änderungen werden zuerst lokal gespeichert und anschließend übertragen. Der Abgleich läuft nach Änderungen, bei Rückkehr zur App, nach erneuter Internetverbindung oder über **Jetzt synchronisieren**. Er ist kein gemeinsames Live-Editing: Vor einem Gerätewechsel den erfolgreichen Sync-Status prüfen, auf dem anderen Gerät die App fokussieren oder manuell synchronisieren.

Bei gleichzeitigen Änderungen entsteht eine zusätzliche **Konfliktkopie**. Die Cloud-Fassung des Originals bleibt erhalten. Kollidiert eine Löschung mit einer neueren Fassung, wird diese Fassung wieder übernommen. Abgebrochene Übertragungen und Löschungen während einer abgemeldeten Sitzung bleiben im lokalen, an den Account gebundenen Auftragsspeicher erhalten.

Ein Browserprofil bleibt an den zuerst verbundenen Account gebunden. Ein anderer Account erhält dessen lokale Daten nicht automatisch; dafür ein separates Browserprofil verwenden. Abmelden entfernt weder lokale Projekte noch Inventar. Noch nicht übertragene Änderungen gehen beim Löschen der Browserdaten verloren; wichtige Projekte lassen sich weiterhin als Datei exportieren.

## Prüfung vor Freigabe

`npm test` prüft die Freigabedaten und RPC-Fehlerbehandlung. `npm run test:database` führt alle Migrationen in einer isolierten PostgreSQL-Testdatenbank (PGlite) aus und prüft Rollen, Eigentümergrenzen, Entfernen privater Felder, Löschen, ID-Eindeutigkeit und Wiederverwendung sowie Größen-/Anzahlgrenzen. Browserprüfungen verwenden simulierte RPC-Antworten. Nach der Einrichtung mit zwei Browserprofilen einen künstlichen Testplan prüfen:

- Ohne E-Mail und Passwort freigeben; Link und ID in einem anderen Browser öffnen. Empfänger legen keine Sitzung an.
- Dieselbe ID gleichzeitig veröffentlichen: Nur ein Absender darf erfolgreich sein. Der andere darf die Freigabe weder ändern noch löschen.
- Link löschen und die ID im zweiten Browser wiederverwenden. Der erste Browser darf die neue Freigabe weder ändern noch löschen. Eigene lokale Entwürfe bleiben beim Lesen unverändert.

Erst bei späterer Aktivierung von Accounts zusätzlich prüfen:

- E-Mail-Code empfangen, anmelden, Gerät verbinden und später erneut anmelden.
- Projekt samt FOH, IEM-Fläche, Strombedarf, Frequenzen und Inventar auf dem zweiten Gerät öffnen.
- Offline bearbeiten, wieder online gehen und den aktualisierten Stand abrufen.
- Auf beiden Geräten dasselbe Projekt ändern: Original und Konfliktkopie müssen erhalten bleiben.
- Ein Projekt beziehungsweise Inventarobjekt löschen und den Abgleich prüfen.
- Mit einem zweiten Account prüfen, dass er keine Datensätze des ersten lesen oder verändern kann.

Eine bloß lokal kopierte Projekt-ID ist ohne vorherige Freigabe nicht abrufbar. Ohne Online-Konfiguration bietet die App weiterhin vollständige Offline-Links an und erklärt, dass die ID-Funktion noch nicht eingerichtet ist. Alte `#share=`-Links bleiben lesbar; kurze Online-Links verwenden `#p/SP-…`.

Echte Zwei-Finger-Bedienung zusätzlich auf iOS und Android prüfen. Die Pointer-Tests simulieren die Gestenlogik; sie ersetzen keinen Test auf Touch-Hardware.

## Lokaler SDK-Build

Der Supabase-Client liegt unter `stageplot-assets/vendor/supabase.js` und wird erst bei Bedarf für eine konfigurierte Linkfreigabe oder einen aktivierten Account-Dienst geladen. Es gibt keine CDN-Abhängigkeit. Zum Aktualisieren des Bundles:

```bash
npm ci
npm run build:vendor
npm test
```

Das Build-Skript aktualisiert auch die Lizenzhinweise. App-Tests und der normale HTML-Build benötigen die SDK-Abhängigkeiten nicht, da das geprüfte Bundle mit versioniert wird.
