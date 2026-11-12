# Aktueller Prüfstand

Weitere Funktionsfehler sind im lokalen Arbeitsstand korrigiert; 48 automatisierte Tests bestehen. Keine Veröffentlichung. Details und Grenzen in `LOGIC_REVIEW_7.35.md`. Nachfolgende ältere Zählstände dokumentieren frühere Prüfungen.

# V7.35 – Sicherheit, Review und Datensicherung

## Stand

Die Datenbankmigration `security_and_review_v735` einschließlich der Ergänzung `review_error_types_v735` ist auf der bestehenden Supabase-Datenbank angewendet und nachgetestet. Die V7.35-Webdateien liegen im Branch `fix/security-and-review-v735`; Veröffentlichung ist auf Nutzerwunsch bis nach erfolgreichem Praxistest zurückgestellt; zusätzlich fehlt authentifizierter GitHub-Schreibzugriff. Der aktuell veröffentlichte Stand bleibt bis dahin V7.33.

Keine Trades, Sessions oder Kontozuordnungen gelöscht. Bestand nach Migration: 10 Trades, 2 Sessions, 20 Kontozuordnungen. Eine vollständig berechenbare, widersprüchliche Trade-Risikosumme wurde mit den ursprünglichen Kontorisiken abgeglichen. Der alte Wert ist in `trade_events` unter `risk_aggregate_repaired_v735` erhalten. Eine alte Kontozuordnung ohne Initialrisiko bleibt offen; ihr Risiko wird nicht geschätzt.

## Bedienprüfung

Quelltext- und DOM-Prüfung durchgeführt, konkrete Bedienfehler behoben. Keine gerenderte visuelle Freigabe: Browser-Vorschau nicht erreichbar. Details und offene Sichtprüfung in `docs/UX_REVIEW_7.35.md`. GitHub-Upload inzwischen grundsätzlich erlaubt; in dieser Nacharbeit nicht ausgeführt.

## Zusätzlicher Trainingsablauf

Der manuell gewählte Trainingsschwerpunkt ist im unveröffentlichten Code ergänzt. SQL-Erweiterung nur mit ROLLBACK geprüft, nicht dauerhaft aktiviert. Vor dem Praxistest in der getrennten Testumgebung `sql/training_focus_v735.sql` anwenden; Bedienung, Grenzen und Nachweise in `docs/TRAINING_FOCUS_7.35.md`.

## Änderungen

| Befund | Umsetzung | Aktivierung |
|---|---|---|
| F01 Benutzerwechsel | Private Arrays, Formulare und Ansichten zurücksetzen; verspätete Antworten der alten Anmeldung verwerfen; bei Netzfehlern Entwürfe behalten | Oberfläche V7.35 |
| F02 Datensicherung | Snapshot aller 23 Tabellen, Bilder im ZIP, SHA-256, Abbruch statt Teilsicherung bei Fehlern/Änderungen; Restore-Validierung und Administrationsskript | RPC aktiv; Oberfläche V7.35 |
| F03 Initialrisiko | Gesamtänderung nur entsprechend vollständiger ursprünglicher Kontorisiken; ursprüngliche Kontozuordnung gesperrt | Datenbank aktiv |
| F04 Instrumente | Erlaubte Instrumentliste und endliche Risikowerte | Datenbank aktiv |
| F05 Mehrfachfehler | Mehrere Fehler mit je eigener editierbarer Gegenmaßnahme, Legacy-Übernahme, Auswertung auch des zweiten Fehlers; emotionale Warnungen allein werden nicht als Fehler gezählt | DB-Prüfung aktiv; Oberfläche V7.35 |
| F06 Ausnahmen | Berliner Tageszähler über Sessions hinweg, optionale Live-Begründung, explizite Review-Entscheidung, unbegründet = Regelbruch; SL-Ausnahmen analog | Neue RPC aktiv; Oberfläche V7.35 |
| Entry-Wiederholung | Request-ID, Eigentümerbindung und Payloadvergleich verhindern doppelte Entries nach unklarer Netzwerkantwort | Neue RPC aktiv; Oberfläche V7.35 |
| Gleichzeitige HTF-Änderung | Bedingtes Update statt blindem Überschreiben des Kontexts | Oberfläche V7.35 |
| F07 Bibliothek | Lokal gebündelte exakte Versionen, Lockdatei, SRI und Dateiprüfsummen; keine CDN-Skripte zur Laufzeit | Oberfläche V7.35 |
| F08 Datenbankhärtung | Fester search_path, unnötige Tabellenrechte entzogen; zwei Abschlussfunktionen verwenden zusätzlich RLS | Datenbank aktiv |
| F09 Version | Anzeige und Export 7.35; Versionsvergleich gegen dieselbe Konstante | Oberfläche V7.35 |
| F10 Altversionen | Feste Weiterleitung von Startseite, V6 und `v7-Test.html` auf den kanonischen Einstieg | Nach Veröffentlichung |
| F11 Webhärtung | CSP im HTML mit Skripten nur vom eigenen Ursprung; externer Header-Gateway vorbereitet und getestet | CSP nach Veröffentlichung; HTTP-Header separat |
| F12 Veröffentlichungsschutz | Automatische Tests, Build- und Abhängigkeitsprüfung; Konfiguration für geschützten Hauptbranch | Workflow nach Push; Branchregeln erfordern Adminzugriff |

## Validierung

- 30 automatisierte Node-/DOM-/Gatewaytests bestanden, einschließlich tatsächlicher ZIP-Erzeugung und anschließender Prüfung durch das Restore-Werkzeug.
- 6 Python-Tests für vollständige Archive, fremde Eigentümer, fehlende Tabellen, unsichere Pfade, Bild-Prüfsummen und beschädigte Dateien bestanden.
- 11 Datenbank-Prüffälle mit temporären Daten und ROLLBACK: Risikoschutz, Instrument-/Zuordnungsschutz, idempotenter Entry, sessionsübergreifendes Tageslimit, Pflichtmaßnahme, zwei Fehler, eigener Snapshot, SL-Risikoerhöhung ohne Blockade, Reviewpflicht, profitabler Trade mit Regelbruch, fremder Snapshot leer.
- Aktivierungsskript für den neuen Entry-Endpunkt zusammen mit den Datenbank-Prüffällen innerhalb einer zurückgerollten Transaktion getestet. Es ist noch nicht dauerhaft aktiviert.
- Releaseprüfung: JavaScript-Syntax, eindeutige statische HTML-IDs, SRI-Hashes, CSP, Redirects und Dateiprüfsummen bestanden.
- Abhängigkeitsprüfung für produktive Pakete ohne gemeldete Schwachstellen zum Prüfzeitpunkt.
- Die neue Anmeldeseite wurde im Browser geöffnet; leere Anmeldedaten werden lokal abgefangen. Das ist kein angemeldeter End-to-End-Test.

## Veröffentlichung – erst nach bestandenem Praxistest

Vor diesen Schritten die Geräte- und Funktionsabnahme in `docs/PRAXISTEST_7.35.md` durchführen.

1. GitHub verbinden; Branch mit sämtlichen Dateien pushen und CI erfolgreich durchlaufen lassen.
2. Änderungen prüfen und nach main übernehmen. Bestehendes GitHub Pages veröffentlicht die erzeugten Root-Dateien und Assets. Nicht nur die HTML-Datei hochladen: `assets/` und `vendor/` gehören zwingend dazu.
3. Veröffentlichte V7.35 prüfen: Version, Anmeldung, Entry, Exit, Review, ZIP, alte URLs und Dateihashes. Erst danach `sql/activate_v735_after_publish.sql` ausführen. Das entzieht älteren Entry-RPCs und direkten Client-Inserts die Berechtigung; eine Aktivierung vor dem Frontend-Wechsel würde die alte App beeinträchtigen.
4. `scripts/configure-github.sh` mit Repository-Adminrechten ausführen und den zurückgegebenen Schutzstatus prüfen. Es erzwingt erfolgreiche `verify`-Checks, lineare Historie und verbietet Force-Push/Löschung. Eine zweite Person wird nicht vorausgesetzt.
5. HTTP-Schutzheader im Hosting aktivieren. GitHub Pages wertet eine `_headers`-Datei nicht aus. `ops/headers-worker.mjs` ist ein vorbereiteter, getesteter Cloudflare-Gateway; er benötigt eine eingerichtete Route für die bestehende App-Domain. Er ist nicht deployt und ändert keine DNS-Einstellungen automatisch. Alternativ die Header in einer vorhandenen vorgeschalteten Infrastruktur setzen.
6. In Supabase den Schutz gegen kompromittierte Passwörter aktivieren, soweit der Tarif das unterstützt. Die vorhandene Verbindung stellt keine Auth-Konfigurationsänderung bereit. Der Status ist weiterhin deaktiviert.

## Absichtlicher privilegierter Zugriff

`record_stop_adjustment` bleibt SECURITY DEFINER, weil direkte Änderungen an der Stop-Historie für Clients gesperrt sind. Die Funktion prüft Benutzer, Eigentümer, Trade-Status und vorherigen Stop. Der Supabase-Advisor meldet dies weiterhin als prüfpflichtige Warnung; die Berechtigung ist hier beabsichtigt. Nach Aktivierung erhält auch der einzige neue Entry-Endpunkt diesen Ausführungsmodus, während seine internen alten Endpunkte für Clients gesperrt werden. Alle Parameter werden über `auth.uid()` an den Eigentümer gebunden. Keine Berechtigungsentscheidung verwendet editierbare Benutzer-Metadaten.

## Wiederherstellung

Die ZIP-Datei sichert das persönliche Journal einschließlich Bilder, nicht Auth-Benutzer, Passwörter oder die gesamte Supabase-Plattformkonfiguration.

Archive zuerst prüfen:

```bash
python3 scripts/restore-backup.py MEINE_SICHERUNG.zip
```

Für eine vollständige Wiederherstellungsprobe ein separates leeres Supabase-Testprojekt bereitstellen. Dort den geprüften Schema-Baseline-Export `sql/schema_baseline_before_v735.sql` und anschließend `sql/security_v735.sql`, `sql/review_types_v735.sql` und `sql/training_focus_v735.sql` ausführen. Einen Test-Auth-Benutzer erstellen. Das Wiederherstellungswerkzeug benötigt Python mit `psycopg[binary]`, Datenbankzugriff und den ausschließlich lokal als Umgebungsvariablen gesetzten Testprojekt-Service-Key:

- `TT_RESTORE_DATABASE_URL`
- `TT_RESTORE_PROJECT_URL`
- `TT_RESTORE_SERVICE_KEY`

```bash
python3 scripts/restore-backup.py MEINE_SICHERUNG.zip --restore --target-owner TEST_AUTH_USER_UUID
```

Das Werkzeug verweigert den bekannten Quell-/Produktivprojektbezug, nichtleere Journal-Tabellen und unbekannte Zielbenutzer. Es validiert Prüfsummen und Eigentümer, übernimmt Daten in einer Transaktion und behandelt Bilder separat. Uploadbereinigung bei Fehlern erfolgt nach bestem Bemühen; Datenbank und Storage können keine gemeinsame Transaktion garantieren. Danach Bilder, Zeilen, Beziehungen und App-Abläufe im Testprojekt prüfen.

**Eine vollständige Wiederherstellung in einem separaten Projekt ist noch nicht durchgeführt.** Die bestandene Archivprüfung ersetzt sie nicht. Ebenso offen bleiben angemeldete Tests mit zwei echten Benutzern sowie iPhone-/PC-Tests. Es besteht keine Freigabe für öffentlichen Verkauf.
