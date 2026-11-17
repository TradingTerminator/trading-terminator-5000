# TradingTerminator V8.10

Reparatur des Handelsablaufs auf Basis von V8.09. Die Handelszeit beginnt bei der ersten serverseitig bestätigten Vorbereitung. Kalendertag und Bereitschaft sind getrennt; ein geplantes Overnight-Zeitfenster bleibt gültig.

## Behoben
- Handelssession aus Vorbereitung, Dashboard, Trade-Fußleiste und Grenzwarnung bewusst beenden. Offene Trades bleiben offen, P&L bleibt unbekannt, Reviews dürfen später folgen.
- Der Server protokolliert Pflichtlücken zum Abschluss genau einmal. Ergänzungen werden mit eigenem Zeitstempel angehängt; Original und Regelbruch bleiben erhalten.
- Einheitliche gespeicherte Bestätigung, direkter Weg zum Trade, serverseitig unveränderter erster Zeitanker und Konflikterkennung bei parallelen Geräten.
- Vier Vorbereitungsschritte; Dauer, Geldgrenzen und Kontostandards gemeinsam im zweiten Schritt. Alte Fünf-Schritt-Entwürfe werden beim Laden zugeordnet.
- Unabhängige, quittierbare Zeit-/Verlust-/Gewinnwarnungen. Dokumentation bleibt möglich. Gewinnziel ist kein automatischer Regelbruch. Neue Entry-Abweichungen werden mit Quellenbezug für das Review gesichert.
- Pause kehrt zum tatsächlichen Ursprung mit Entwurf und Schritt zurück. Absoluter Countdown über Reload/Tabwechsel, kurze wechselnde Übungen und automatisches Ende. Die Handelsdauer wird nicht verlängert.
- Bereits ausgeführte Trades können bei unbestätigter Vorbereitung wahrheitsgemäß dokumentiert werden. Konten, ursprüngliches Risiko und Setup müssen weiterhin tatsächlich bekannt sein.

## Betrieb und vollständiger Quellstand
Das ZIP enthält den vollständigen versionierten Quellstand, erzeugte Webseite, Tests, erforderliche SQL-Dateien und diese Anleitung. Keine privaten Nutzerdaten, Tokens oder Datenbankschlüssel. Der veröffentlichbare Supabase-Client-Key gehört zur bestehenden Webanwendung und ersetzt keine Benutzeranmeldung.

1. ZIP entpacken. Für lokalen Betrieb mit Node 24: `npm ci --ignore-scripts`, `npm run build`, `npm run check`, `npm test`, `npm run test:v8`.
2. Mit einem statischen HTTP-Server aus dem Projektverzeichnis ausliefern, z. B. `python3 -m http.server 4173`. `v8.html` öffnen. Anmeldung und bestehende Daten benötigen die vorhandene Supabase-Verbindung. Kein Offline-Brokerzugriff.
3. In einer bestehenden V8.09-Datenbank vor der Webveröffentlichung ausschließlich `db/v8_10_session_lifecycle.sql` anwenden. Die Dateien unter `tests/sql` sind isolierte Tests und keine Produktivinstallation.
4. Neue Supabase-Installationen benötigen das vollständige Basisschema, Auth und Storage; das ZIP ist keine automatische Cloud-Neuinstallation. `scripts/prepare-v810-sql-test.py` normalisiert nur den historischen Testexport.
5. Download-Prüfsumme mit `sha256sum -c TradingTerminator_V8.10.sha256` prüfen.

## Sicherung und Rückfall
Ausgangsstand: Commit aa4d6cfdedebc62a83377a1489d42f12c018ded4; vorheriges Release v8.09 bleibt verfügbar. Keine historischen Nutzerdatensätze werden bei der Migration geändert. Die beiden bestehenden Session-Guards akzeptieren offene Trades ausschließlich mit einem serverseitig erzeugten V8.10-Abschlussereignis. Die alte V7-Abschluss-RPC prüft weiterhin offene Trades.
Frontend-Rückfall auf v8.09 ist möglich; neue Metadaten bestehen lassen. Bereits mit offenen Trades beendete Sessions bleiben beendet; V8.10 für deren Dokumentation nutzen. Vollständigen Schema-Rückfall nur nach Sicherung der neuen Ereignisse und Prüfung dieser Fälle durchführen. Keine pauschale Datenlöschung.

## Entscheidungen
- Eine fehlende Bestätigung wird als fehlende Vorbereitung dokumentiert. Optionale Ziele/Notizen und später fällige Reviews erzeugen beim Abschluss keinen Regelbruch.
- Reines Weiterdokumentieren quittiert die Warnung und ist kein neuer Entry. Bei tatsächlichen Entries nach Zeit-/Verlustgrenze gilt: ohne Begründung Regelbruch, mit Begründung bzw. rückblickend unklarem Ausführungszeitpunkt Review erforderlich. Gewinnziel allein erzeugt keinen solchen Fehler.
- Erste bestätigte Handelsdauer und Geldgrenzen werden bei erneuter HTF-Bestätigung beibehalten. Ein neues Handelsfenster beginnt mit einer neuen Session.
- Nachträge sind als tatsächlich berichtete Angaben gekennzeichnet und ersetzen keine ursprüngliche Vorbereitung oder Broker-Zeitstempel.

## Abnahmegrenzen
Automatisierte Browserprüfungen arbeiten mit synthetischen API-Antworten und gesperrtem Supabase-Netzwerk. SQL prüft echte PostgreSQL-Transaktionen und zwei synthetische Identitäten; Produktivprüfdaten werden zurückgerollt. Physische PC-/iPhone-/Safari-/PWA-/Tastaturabnahme sowie gleichzeitige echte Benutzeranmeldungen bleiben separat durch den Nutzer zu prüfen. Keine Brokerorders und keine automatische Broker-Sperre.
Bestehende Sicherheitsberaterhinweise zu älteren SECURITY-DEFINER-RPCs und Passwortschutz werden nicht durch diese Reparatur als erledigt erklärt.
