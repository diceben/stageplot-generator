# Accounts und Gerätesync einrichten

Der Editor und das Inventar funktionieren mit lokalem Browserspeicher. Der Account-Dienst ist optional und im Repository standardmäßig deaktiviert. Anmeldung, Gerätesync und SQL-Migrationen sind vorbereitet; ein produktives Supabase-Projekt ist noch nicht eingerichtet oder getestet.

## 1. Eigenes Supabase-Projekt

Ein separates Projekt für diesen 2D-Stageplotter verwenden. Keine Datenbank von Gigboard oder Stageplay 3D anschließen.

Im SQL Editor die Migrationen in dieser Reihenfolge ausführen:

1. [0001_stageplot_documents.sql](supabase/migrations/0001_stageplot_documents.sql)
2. [0002_inventory.sql](supabase/migrations/0002_inventory.sql)

Wenn Migration 0001 bereits ausgeführt wurde, nur 0002 ergänzen. Die Tabelle speichert Projekte, Drumvorlagen, Bühnenvorlagen und Inventareinträge als versionierte Dokumente. Row Level Security begrenzt den Zugriff auf den angemeldeten Eigentümer. Der Browser verwendet ausschließlich die Funktionen `stageplot_sync_push` und `stageplot_sync_pull`.

## 2. Anmeldung per E-Mail-Code

E-Mail-Anmeldung und Registrierungen im Supabase-Projekt aktivieren. In der E-Mail-Vorlage **Magic Link** einen Code mit `{{ .Token }}` ausgeben. Die App verwendet `signInWithOtp` und `verifyOtp` mit `type: 'email'`; sie verarbeitet keine Magic Links aus der URL. Sie akzeptiert Codes mit sechs bis zehn Ziffern.

Für externe Nutzer einen eigenen SMTP-Versand einrichten und den Versand an eine Testadresse prüfen. Die Standardeinstellungen des E-Mail-Dienstes sind für einen öffentlichen Betrieb nicht ausreichend. Details: [Supabase: Passwordless E-Mail Login](https://supabase.com/docs/guides/auth/auth-email-passwordless) und [SMTP](https://supabase.com/docs/guides/auth/auth-smtp).

## 3. Öffentliche Build-Konfiguration

Im GitHub-Repository unter **Settings → Secrets and variables → Actions → Variables** zwei Repository-Variablen hinterlegen:

| Variable | Inhalt |
| --- | --- |
| `STAGEPLOT_SUPABASE_URL` | HTTPS-Projektadresse, beispielsweise `https://dein-projekt.supabase.co` |
| `STAGEPLOT_SUPABASE_PUBLISHABLE_KEY` | Öffentlicher Schlüssel, beginnend mit `sb_publishable_` |

Der Pages-Workflow erzeugt daraus `stageplot-cloud-config.js`. Der Build akzeptiert ausschließlich eine Supabase-Projektadresse und einen Publishable-Key. `service_role`, `sb_secret_` und andere serverseitige Schlüssel gehören niemals ins Frontend. Der öffentliche Schlüssel ersetzt keine Zugriffsregeln; dafür ist die RLS-Konfiguration aus den Migrationen zuständig. [Supabase: API keys](https://supabase.com/docs/guides/getting-started/api-keys)

Sind beide Variablen leer, bleibt der Account-Dienst deaktiviert. Ist nur eine gesetzt oder ungültig, bricht der Deploy ab. Die Versionskontrolle enthält weiterhin die leere Konfiguration. Erst ein geprüfter Merge auf `main` und ein erfolgreicher Pages-Workflow veröffentlichen die Änderung.

Lokal lassen sich dieselben Variablen für `npm run build:cloud-config` setzen. Danach den Vorschau-Server neu starten und den Browser neu laden. Vor einem Commit ohne echte Konfiguration den Befehl mit beiden Variablen leer ausführen.

## 4. Zwei Geräte verbinden

Auf jedem Gerät dieselbe veröffentlichte URL öffnen, unter **Account & Inventar → Account & Sync** mit derselben E-Mail anmelden und **Dieses Gerät verbinden** wählen. Erst das Verbinden gibt die lokalen Projekte, Entwürfe, Vorlagen und das Inventar für den Account-Abgleich frei.

Änderungen werden zuerst lokal gespeichert und anschließend übertragen. Der Abgleich läuft nach Änderungen, bei Rückkehr zur App, nach erneuter Internetverbindung oder über **Jetzt synchronisieren**. Er ist kein gemeinsames Live-Editing: Vor einem Gerätewechsel den erfolgreichen Sync-Status prüfen, auf dem anderen Gerät die App fokussieren oder manuell synchronisieren.

Bei gleichzeitigen Änderungen entsteht eine zusätzliche **Konfliktkopie**. Die Cloud-Fassung des Originals bleibt erhalten. Kollidiert eine Löschung mit einer neueren Fassung, wird diese Fassung wieder übernommen. Abgebrochene Übertragungen und Löschungen während einer abgemeldeten Sitzung bleiben im lokalen, an den Account gebundenen Auftragsspeicher erhalten.

Ein Browserprofil bleibt an den zuerst verbundenen Account gebunden. Ein anderer Account erhält dessen lokale Daten nicht automatisch; dafür ein separates Browserprofil verwenden. Abmelden entfernt weder lokale Projekte noch Inventar. Noch nicht übertragene Änderungen gehen beim Löschen der Browserdaten verloren; wichtige Projekte lassen sich weiterhin als Datei exportieren.

## 5. Prüfung vor Freigabe

Die automatisierten Tests verwenden einen simulierten RPC-Server. Nach der Einrichtung zusätzlich mit zwei Browserprofilen prüfen:

- E-Mail-Code empfangen, anmelden, Gerät verbinden und später erneut anmelden.
- Projekt samt FOH, IEM-Fläche, Strombedarf, Frequenzen und Inventar auf dem zweiten Gerät öffnen.
- Offline bearbeiten, wieder online gehen und den aktualisierten Stand abrufen.
- Auf beiden Geräten dasselbe Projekt ändern: Original und Konfliktkopie müssen erhalten bleiben.
- Ein Projekt beziehungsweise Inventarobjekt löschen und den Abgleich prüfen.
- Mit einem zweiten Account prüfen, dass er keine Datensätze des ersten lesen oder verändern kann.

Echte Zwei-Finger-Bedienung zusätzlich auf iOS und Android prüfen. Die Pointer-Tests simulieren die Gestenlogik; sie ersetzen keinen Test auf Touch-Hardware.

## Lokaler SDK-Build

Der Supabase-Client liegt unter `stageplot-assets/vendor/supabase.js` und wird erst bei konfiguriertem Account-Dienst geladen. Es gibt keine CDN-Abhängigkeit. Zum Aktualisieren des Bundles:

```bash
npm ci
npm run build:vendor
npm test
```

Das Build-Skript aktualisiert auch die Lizenzhinweise. App-Tests und der normale HTML-Build benötigen die SDK-Abhängigkeiten nicht, da das geprüfte Bundle mit versioniert wird.
