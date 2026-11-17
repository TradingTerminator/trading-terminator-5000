# TradingTerminator V8.11 · Testversion

Überarbeitet den dokumentierten Workflow bis zum laufenden Trade. Danach folgt der nächste Praxistest.

- Vier Vorbereitungsschritte, neutrale neue Bewertungen, explizite Erfassungsart, kompakte Warnungen und freiwillige Pause.
- Kalenderprüfung mit offiziellen Teilquellen und externem Kalender; manuelle Termine mit bewusst festgelegtem Warnfenster. Keine unlizenzierte Einbettung.
- LTF-Beobachtungen vor Entry mit Screenshot-Paste/Upload, ausdrücklichen fehlenden Werten und gespeichertem Kontext; Vergleich im vorhandenen Auswertungsbereich.
- Kontostandards einschließlich SL in Settings, direkt editierbare Entry-Werte und serverseitiger Soll/Ist-Snapshot samt Risikoauswirkung.
- Ideen bearbeiten/archivieren; ursprüngliche Planung und historische Trade-Snapshots bleiben erhalten.
- Live-Fokus auf SL und Exit, atomare ausgewählte Copy-SL-Änderungen, unverändertes Initialrisiko für R und getrennte Eingabekorrektur.
- Export enthält auch Session-Ereignisse und SL-Anfrageprotokoll.

## Installation / Update

Die ZIP enthält vollständigen Quellcode, fertige `v8.html`, `assets/`, `vendor/`, SQL-Migrationen, Tests und Anleitungen. Keine Zugangsdaten oder Broker-Anbindung.

Bei bestehender V8.10 zuerst vollständiges Journal-Backup inklusive Bilder erstellen. Anschließend `db/v8_11_execution.sql` genau einmal als Migration anwenden. Sie ist additiv; bestehende V7-Daten werden nicht umgeschrieben. Danach die enthaltenen statischen Dateien gemeinsam veröffentlichen. V7-Dateien unverändert belassen. V8.11 braucht die Migration vor der ersten neuen Dokumentation.

Bei Neuinstallation die vorhandene Installationsdokumentation und chronologische SQL-Kette beachten; `.github/workflows/v811.yml` zeigt die vollständige isolierte Testdatenbank-Kette. `tests/sql/bootstrap_v810.sql` ist ausschließlich ein Testadapter für lokale PostgreSQL-Instanzen und gehört niemals auf Supabase Produktion.

Reproduzierbar: `npm ci --ignore-scripts`, `npm run build`, `npm run check`, `npm test`, `npm run test:v8`, `python3 -m unittest discover -s tests -p 'test_*.py'`. Native Browser- und PostgreSQL-Tests laufen im V8.11-Acceptance-Workflow. Download-SHA256 liegt separat bei.

## Bewusste Grenzen

Kalenderabdeckung BLS/BEA ist unvollständig; Fed/ISM und weitere relevante Termine extern prüfen. Ohne Anbieter-Lizenz keine Weiterverteilung fremder Kalenderschedules. Warnfenster sind Nutzerregeln, keine Handelsprognosen. LTF-Auswahlen sind Beobachtungen, keine statistisch validierten Handelssignale. TT zeigt dokumentierte SL-Werte, keine Broker-Liveposition. Tatsächliche Ausführung wird nicht technisch verifiziert. Retrospektive Angaben werden ausdrücklich so markiert.

Echtes iPhone und tatsächliche geräteübergreifende Anmeldung erfordern den anschließenden Praxistest; Browser-Viewports ersetzen keine Geräteabnahme. Vollständige Wiederherstellung in ein zweites Supabase-Projekt ist als administrativer Vorgang beschrieben; keine Produktionshistorie für Tests ändern.

Abnahme: [V8_11_ACCEPTANCE.md](V8_11_ACCEPTANCE.md). Quellen und Rechte: [V8_11_SOURCES.md](V8_11_SOURCES.md).
