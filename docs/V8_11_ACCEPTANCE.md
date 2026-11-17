# V8.11 · Abnahmeprotokoll

Automatische Freigabe nur bei bestandenem Verify- und V8.11-Acceptance-Workflow des ausgelieferten Commits. Synthetische Benutzer/Konten; Browser blockieren produktive Supabase-Requests, SQL-Abnahmedaten werden zurückgerollt. V7-Quelldateien bleiben unverändert.

| Auftragsbereich | Reproduzierbarer Beleg | Status vor Freigabe |
|---|---|---|
| Session-Abschluss, Ergänzung, offene Trades, Ablauf, CAS, Pause | `tests/v8-session.test.cjs`, `tests/sql/verify_v810.sql`, `scripts/test-v810-browser.cjs`, Zwei-Verbindungs-Concurrency-Test | Workflow-Gate |
| Neutrale neue Session, gleicher Entwurf, bewusst bewertete Mitte | `tests/v8-execution.test.cjs`, native V811/V810 | Workflow-Gate |
| Vier Vorbereitungsschritte, Geldgrenzen, HTF und Navigation | Vorbereitungstests + native V808/V809/V810 | Workflow-Gate |
| Kalenderrechte, Quellenlücken, bewusste Warnfenster | `V8_11_SOURCES.md`, Modelltest, SQL-News-Snapshot | Lokal geprüft + Workflow-Gate |
| HTF-Straffung und Szenarioentscheidung | HTF-/Vorbereitungstests + native V809 | Workflow-Gate |
| Erfassungsart, Warnungen, Pause, Wiederholung | Session-/V811-Tests, native V809/V810/V811 | Workflow-Gate |
| Ideen editieren, Replay, Versionskonflikt, Archiv, alter Snapshot | `tests/sql/verify_v811.sql` | Workflow-Gate |
| LTF-Auswahlen, fehlende Werte, Paste/Original, Kontext und Auswertung | Modell-/DOM-Tests + native V811 | Workflow-Gate |
| Stammdaten, automatische Abweichung, Mixed-NQ/MNQ 900 USD | SQL-V811 + native V811 | Workflow-Gate |
| Kompakter Live-Trade, SL/BE, atomare Auswahl, Initial-R, Exit-Entwurf | SQL-V811 + native V809/V811 + gemeinsame Regression | Workflow-Gate |
| RLS/Eigentümer, fehlgeschlagener Batch vollständig zurückgerollt | isolierte PostgreSQL-Abnahme | Workflow-Gate |
| Backup neuer Tabellen und Bilder, Integrität | SQL-Exporttest, bestehende Backup-/Python-Validatoren | Workflow-Gate |
| Desktop 1440, mobile 390/320, alle sechs Themes, Zentrierung/Overflow | native V809/V811 und Screenshots als CI-Artefakt | Workflow-Gate |
| Release-Paket und veröffentlichte Dateien | SHA256, Release-Integrität, Live-Asset-Prüfung | Main-Workflow-Gate |
| Physisches iPhone, echte Anmeldung auf zwei Geräten | benötigt Praxistest mit Nutzerkonto | Nicht ausführbar in dieser Umgebung |
| Vollständige Wiederherstellung in eigenem zweiten Supabase-Projekt | Restore-Anleitung und Validator vorhanden, kein zweites Ziel bereitgestellt | Nicht ausführbar; kein Restore in Produktion |

Testadapter ersetzen keine echte Supabase-Authentifizierung oder Broker-Daten. Native Browser verwenden echte Chromium-Inputs und echte PNG-Paste-Daten bei simulierten Backendantworten; PostgreSQL prüft die tatsächlichen Transaktionen/Trigger/RLS separat. Offene P0-Fehler verhindern Merge/Release. Nach erfolgreicher automatisierter Abnahme folgt ausschließlich der beauftragte Praxistest.
