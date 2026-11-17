# V8.10 – Abnahmeprotokoll

Stand: 17.11.2026. Ausgangsstand aa4d6cfdedebc62a83377a1489d42f12c018ded4, gesichert unter `backup/pre-v810-aa4d6cf`. Entwicklungsbranch `v8-10-session-flow`, PR #22. V7-HTML und dessen Client-Assets bleiben unverändert.

Geprüfte Ursachen: Das Datum war Teil von `sessionReady()` und der Entry-Zulassung. Zwei Session-Guards und die alte Abschluss-RPC verweigerten offene Trades. Pausenende navigierte immer zur Vorbereitung. Sichtbare Formularvollständigkeit und gespeicherte Bestätigung hatten unterschiedliche Anzeigen. Ein echter Doppelklick bei 320 Pixeln traf nach dem Dialogschluss die darunterliegende Entry-Aktion; der zweite identische Klick wird nun abgefangen.

## Soll / Ist / Ergebnis

PASS bezieht sich auf die jeweils genannten automatisierten Prüfwege, nicht auf einen physischen iPhone-Test.

| Test | Soll | Ist / Nachweis | Ergebnis |
|---|---|---|---|
| T01 | Bestätigung führt direkt zum Trade; konsistenter Status | Native Transaktionsantwort wird übernommen; Dashboard sofort aktualisiert; vollständiger Browserflow | PASS |
| T02 | Unvollständig bewusst schließen, Lücken genau einmal sichern | Server ermittelt fehlende bestätigte Vorbereitung; unveränderliches Abschlussereignis; neuer Start möglich | PASS |
| T03 | Vollständiger Abschluss ohne erfundenen Regelbruch | SQL: bestätigte vollständige Session mit `rule_breach=false` | PASS |
| T04 | Session vom 16.11. am Folgetag ohne Sackgasse beenden | Vergangenes Ende 16.11. 21:55:54 deutscher Zeit; Warnung mit direktem Abschluss; Browser | PASS |
| T05 | Quittierte Warnung bleibt quittiert | Stabile Grenzidentität statt HTF-Revisions-ID; Navigation, Reload-Speicher und Revision geprüft | PASS |
| T06 | Zeit/Verlust/Gewinn getrennt; keine Dokumentationssperre | Browser-/Modelltests; SQL prüft neue Entries nach Zeit/Verlust sowie Gewinnziel ohne automatischen Regelbruch | PASS |
| T07 | Pause aus Vorbereitung und Trade kehrt richtig zurück | Ursprung, Schritt und Entwurf bleiben erhalten; reguläres und vorzeitiges Ende; Sessionwechsel wird kontrolliert behandelt | PASS |
| T08 | Pause und Warnquittung über Reload/Tabwechsel erhalten | Absoluter Zeitpunkt; frische Browserseite stellt Entry-Entwurf und Schritt wieder her; Visibility-Ereignisse | PASS |
| T09 | Offene Trades nach Session-Ende offen und erreichbar | SQL: kein Exit/P&L erfunden, echter nachfolgender Exit möglich; Dashboard listet weitere offene Trades | PASS |
| T10 | Nachtrag erhält ursprünglichen Regelbruch und Verlauf | SQL: append-only Ergänzung mit eigenem Zeitpunkt, Wiederholung ohne Duplikat; UI zeigt beide Ereignisse | PASS |
| T11 | Vier Schritte, Konten und Grenzen gemeinsam | Vier sichtbare Schritte; kontospezifische SL/Quantity, Copy- und unabhängiger Modus, Netto/Gebühren-Regressionsprüfungen | PASS |
| T12 | V8.09-Entwürfe verlustfrei zuordnen | Alte Schritte 1/2/3/4/5 werden 1/2/2/3/4; Felder und Kontoauswahl bleiben erhalten | PASS |
| T13 | Kleine Viewports, lesbare/klickbare Steuerung | Chromium 1440×1000, 390×844, 320×740; native Klicks, Scrollen, Eingaben, kein horizontaler Überlauf | PASS automatisiert; physische Tastatur/Safari offen |
| T14 | Netzwerkfehler ohne falschen Erfolg, sicherer Retry | Eingespritzte Unterbrechung bei Bestätigung/Abschluss; gleicher Request und eingefrorener Payload; Erfolg nur nach Serverantwort | PASS |
| T15 | Parallele Geräte und Doppelklick ohne Duplikate | Zwei unabhängige PostgreSQL-Verbindungen: eine Session, eine Bestätigung, ein Zeitanker und ein Abschluss; Browser-Doppelklick und RLS mit zwei Identitäten | PASS automatisiert; echte Doppelanmeldung offen |
| T16 | Bestehender Gesamtworkflow unverändert funktionsfähig | 215 Node-Tests, 99 gemeinsame V8-Regressionschecks, 14 Python-Prüfungen; Browser von Vorbereitung über Exit/Review, Playbook und Darstellung; Learning/Training/Auswertung in Regressionen | PASS automatisiert; reale Anmeldung/Praxistest offen |
| T17 | Sommerzeit/Tageswechsel/echtes Overnight korrekt | Europe/Berlin Winter/Sommer, nicht existente Frühjahrsuhrzeit, Herbst-Zeitversatz und über Mitternacht geplante Session | PASS |
| T18 | Tatsächliche Trades trotz Warnung/fehlender Vorbereitung dokumentieren | Expliziter rückblickender Entry ohne erfundene Gefühle; serverseitige Annotation und Review-Quelle; keine Orderausführung | PASS |

Vier unverändert ausgeschlossene gemeinsame Checks betreffen ausschließlich V7-DOM-Navigation; die V8-Navigation ist durch eigene Tests ersetzt. Keine fehlgeschlagenen fachlichen Tests wurden übersprungen.

## Reproduzierbare Belege
- `tests/v8-session.test.cjs`: native V8.10-UI-/Speicher-/Zustandsprüfungen.
- `tests/sql/verify_v810.sql`: synthetische Identitäten in BEGIN/ROLLBACK, tatsächliche PostgreSQL-Funktionen, CAS, Replay, Rule-Historie, nachträglicher Exit und Benutzertrennung.
- `scripts/test-v810-concurrency.cjs`: zwei unabhängige PostgreSQL-Verbindungen ausschließlich im isolierten CI-Container.
- `scripts/test-v809-browser.cjs`: bisheriger vollständiger Workflow mit dem neuen Persistenzprotokoll.
- `scripts/test-v810-browser.cjs`: echte Desktop-/Mobil-Chromium-Klicks, Warnung, Fehler/Retry, Doppelklick, Pause/Reload, retrospektiver Entry; Supabase-Zugriffe dort gesperrt.
- GitHub-Workflow `V8.10 acceptance and release`: PostgreSQL 17, gesamte Regression, Browser, ZIP und SHA256; Screenshots als Artefakt.
- `scripts/verify-v810-live.cjs`: abgerufene Live-Versionsseite und SHA256-Vergleich aller eingebundenen Skript-/Stylesheet-Dateien.

Bereits erfolgreicher vollständiger Browser-/SQL-Prüflauf: [44127254817](https://github.com/TradingTerminator/trading-terminator-5000/actions/runs/44127254817). Finale Branch-/Main-Prüfungen laufen auf dem veröffentlichten Commit erneut; maßgeblich ist deren grüner Abschluss.

## Änderungen und Risiken
Geänderte Fachdateien: `src/v8.html`, `src/v8-workflow.js`, `src/v8-preparation.js`, `src/v8-pause.js`, `src/v8.css`; neu `src/v8-session-model.js`, `src/v8-session.js`, `db/v8_10_session_lifecycle.sql`. Dazu erzeugte V8-Assets, Tests, Build-/Release-Prüfung und Dokumentation.

Die neue geschützte Ereignistabelle ist für Benutzer nur lesbar. Genau eine zusätzliche, auf den authentifizierten Eigentümer beschränkte Dispatcher-RPC schreibt sie. Bestehende RLS/Auth bleiben erhalten. Vorhandene Supabase-Beraterhinweise zu älteren privilegierten RPCs und Passwortschutz bleiben separat offen.

Reale PC-/iPhone-/Safari-/PWA-, Zwischenablage-/Bildschirmtastatur- und Mehrgeräte-Anmeldung sind eine separate Nutzerabnahme. Browseremulation und synthetische Auth-Claims werden nicht als diese Praxisabnahme ausgegeben. Handelszeit, Grenzklassifizierung und Nachträge folgen den ausdrücklich genannten Entscheidungen in `V8_10_RELEASE.md`.
