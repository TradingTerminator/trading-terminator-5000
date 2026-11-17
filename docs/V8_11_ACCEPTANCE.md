# V8.11 · Abnahmeprotokoll

Automatische Freigabe nur bei bestandenem Verify- und V8.11-Acceptance-Workflow des ausgelieferten Commits. Synthetische Benutzer/Konten; Browser blockieren produktive Supabase-Requests, SQL-Abnahmedaten werden zurückgerollt. V7-Quelldateien bleiben unverändert.

| Auftragsbereich | Reproduzierbarer Beleg | Status der ausgelieferten Version |
|---|---|---|
| Session-Abschluss, Ergänzung, offene Trades, Ablauf, CAS, Pause | `tests/v8-session.test.cjs`, `tests/sql/verify_v810.sql`, `scripts/test-v810-browser.cjs`, Zwei-Verbindungs-Concurrency-Test | Bestanden · CI |
| Neutrale neue Session, gleicher Entwurf, bewusst bewertete Mitte | `tests/v8-execution.test.cjs`, native V811/V810 | Bestanden · CI |
| Vier Vorbereitungsschritte, Geldgrenzen, HTF und Navigation | Vorbereitungstests + native V808/V809/V810 | Bestanden · CI |
| Kalenderrechte, Quellenlücken, bewusste Warnfenster | `V8_11_SOURCES.md`, Modelltest, SQL-News-Snapshot | Bestanden · Quellenprüfung + CI |
| HTF-Straffung und Szenarioentscheidung | HTF-/Vorbereitungstests + native V809 | Bestanden · CI |
| Erfassungsart, Warnungen, Pause, Wiederholung | Session-/V811-Tests, native V809/V810/V811 | Bestanden · CI |
| Ideen editieren, Replay, Versionskonflikt, Archiv, alter Snapshot | `tests/sql/verify_v811.sql` | Bestanden · CI |
| LTF-Auswahlen, fehlende Werte, Paste/Original, Kontext und Auswertung | Modell-/DOM-Tests + native V811 | Bestanden · CI |
| Stammdaten, automatische Abweichung, Mixed-NQ/MNQ 900 USD | SQL-V811 + native V811 | Bestanden · CI |
| Kompakter Live-Trade, SL/BE, atomare Auswahl, Initial-R, Exit-Entwurf | SQL-V811 + native V809/V811 + gemeinsame Regression | Bestanden · CI |
| RLS/Eigentümer, fehlgeschlagener Batch vollständig zurückgerollt | isolierte PostgreSQL-Abnahme | Bestanden · CI |
| Backup neuer Tabellen und Bilder, Integrität | SQL-Exporttest, bestehende Backup-/Python-Validatoren | Bestanden · CI |
| Desktop 1440, mobile 390/320, alle sechs Themes, Zentrierung/Overflow | native V809/V811 und Screenshots als CI-Artefakt | Bestanden · CI |
| Release-Paket und veröffentlichte Dateien | SHA256, Release-Integrität, Live-Asset-Prüfung | Main-Bestanden · CI |
| Physisches iPhone, echte Anmeldung auf zwei Geräten | benötigt Praxistest mit Nutzerkonto | Nicht ausführbar in dieser Umgebung |
| Vollständige Wiederherstellung in eigenem zweiten Supabase-Projekt | Restore-Anleitung und Validator vorhanden, kein zweites Ziel bereitgestellt | Nicht ausführbar; kein Restore in Produktion |

Automatisierte Abnahme: 221 Node-Tests, 99 gemeinsame V8-Regressionen (vier ausschließlich V7-spezifische UI-Verträge durch eigene V8-Tests ersetzt), 17 Python-Tests, PostgreSQL 17 einschließlich zweier konkurrierender Verbindungen, native Chromium-Flows V808/V809/V810/V811. Alle sechs Themes wurden auf Overflow und die LTF-Eingaben zusätzlich auf mindestens 4,5:1 Textkontrast geprüft. Native V811 prüft auch die kompakte geschlossene HTF-Ansicht und die Tastaturwahl SL/Exit. Die Begrenzung der Re-Entry-Versuchsanzeige auf 500 geladene Datensätze wurde durch Pagination ersetzt.

Nachweise zum ausgelieferten Commit: [V8.11-CI](https://github.com/TradingTerminator/trading-terminator-5000/actions/workflows/v811.yml), [allgemeine Release-Prüfung](https://github.com/TradingTerminator/trading-terminator-5000/actions/workflows/verify.yml). Die Zeilen „Bestanden“ beziehen sich auf die tatsächlich freigegebene Version; ein nicht grüner Draft-Commit ist keine Freigabe. Browserbilder liegen im CI-Artefakt.

Testadapter ersetzen keine echte Supabase-Authentifizierung oder Broker-Daten. Native Browser verwenden echte Chromium-Inputs und echte PNG-Paste-Daten bei simulierten Backendantworten; PostgreSQL prüft die tatsächlichen Transaktionen/Trigger/RLS separat. Offene P0-Fehler verhindern Merge/Release. Nach erfolgreicher automatisierter Abnahme folgt ausschließlich der beauftragte Praxistest.

## Sicherheitsprüfung der RPC-Grenzen

Die neue SL-Batch-RPC ist absichtlich `SECURITY DEFINER`, weil direkte Schreibrechte auf die unveränderlichen Ereignistabellen entzogen sind. Sie verlangt Authentifizierung, prüft jedes Konto und dieselbe Trade-Zuordnung, sperrt alle betroffenen eigenen Allokationen vor jeder Mutation und erzwingt exakten Request-Replay. Der neue Ledger erlaubt dem Client ausschließlich SELECT eigener Zeilen. Die anderen neuen RPCs laufen als INVOKER. Supabase markiert solche bewusst ausführbaren Definer-RPCs als prüfbedürftig; die Empfehlung ist hier durch explizite Eigentums-/Berechtigungstests abgesichert: https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable

Vorhandener Auth-Hinweis: Leaked-Password-Protection ist projektseitig deaktiviert. Der gegenwärtige Client nutzt E-Mail-Einmalcodes; eine kommerzielle Passwortanmeldung benötigt eine eigene Auth-Abnahme. Anbieterhinweis: https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection
