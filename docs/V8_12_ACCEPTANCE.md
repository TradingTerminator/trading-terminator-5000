# V8.12 · Reproduzierbare Abnahme

Für die veröffentlichte Version müssen Verify und V8.12-Acceptance vollständig grün sein. Draft-Stände sind keine Freigabe. Laufnachweise: https://github.com/TradingTerminator/trading-terminator-5000/actions/workflows/v812.yml

| Kriterium | Beleg | Status der freigegebenen Version |
|---|---|---|
| Gemeinsame Footer-Ursache reproduziert | V8.11-Originalstylesheet bei 3840 px, Screenshot und Messwerte | Bestanden im CI |
| Alle Ansichten, Zentrierung, breite Buttons, kein Abschneiden | `test-v812-browser.cjs`, 320/390/768/1280/1920/2560/3840 px | Bestanden im CI |
| Sechs Themes, normale/große Schrift, kompakt/komfortabel, Kanten/Animation | 630 Kombinationen einschließlich der Ansichten/Zoomprüfung | Bestanden im CI |
| Zoom 100/125/200 %, kontrollierter Umbruch | echte Chromium-Messungen; keine Assertion nur anhand CSS-Text | Bestanden im CI |
| Safe-Area und keine verdeckten letzten Inhalte | 34 px Zusatzinset simuliert, dynamische Höhenreserve und Sentinel am Inhaltsende | Bestanden im CI |
| Erste, regulär abgeschlossene und vorzeitig abgeschlossene Session | `v8-repair.test.cjs`, native V812, SQL V810/V812 | Bestanden im CI |
| Mehrere Sessions am gleichen Tag, alte Daten unverändert | `tests/sql/verify_v812.sql`, BEGIN/ROLLBACK | Bestanden im CI |
| Keine alten Bewertungen, Notizen, Bilder, Warnungsbestätigungen | direkte ID-Wechsel und Abschluss/Neustart, DOM- und Browserprüfungen | Bestanden im CI |
| Optional bedeutet nicht automatisch geprüft | Anfang ohne Haken; bewusster Übergang; gespeicherter Review-Nachweis | Bestanden im CI |
| Session-/Benutzerbindung lokaler Entwürfe | richtige Wiederherstellung; fremde/stale Entwürfe abgewiesen | Bestanden im CI |
| Reload / unabhängiger zweiter Browserkontext | gespeicherter Session-Snapshot auf zwei unabhängigen Clients | Bestanden im CI |
| Supabase-Persistenz und Eigentumsgrenzen | tatsächliche PostgreSQL-17-RPCs, CAS, unveränderte frühere Pläne, zwei Verbindungen | Bestanden im CI |
| Vollständige Vorbereitung → Entry → Management / Exit | native V809/V810/V811 zusätzlich unverändert ausgeführt | Bestanden im CI |
| Regression, Build, Integrität, Abhängigkeiten, Backups | Node-, gemeinsame V8-, Python-Tests und npm audit | Bestanden im CI |
| Veröffentlichte Version und ZIP | Main-Workflow, Live-Prüfsummen und SHA256 des Downloads | Bestanden vor Übergabe |
| Echtes iPhone / echte Benutzeranmeldung auf zwei physischen Geräten | keine Hardware-/Kontositzung verfügbar | Nicht ausführbar; Praxistest erforderlich |

Native Browser blockieren sämtliche produktiven Supabase-Anfragen. UI-Abläufe verwenden isolierte Backendantworten; SQL prüft die bestehenden Transaktionen separat. Der Browserwechsel belegt die Wiederherstellung desselben persistierten JSON-Plans, keinen nicht durchgeführten realen Benutzerlogin. Safe-Area und Zoom sind simulierte Browserbedingungen, keine physische iPhone-Abnahme.

Keine neue Datenbankmigration; keine Veränderung produktiver Nutzerhistorie. Ungespeicherte lokale Entwürfe werden bewusst nicht als bereits geräteübergreifend synchronisiert ausgegeben. Screenshots liegen im CI-Artefakt. Nach Freigabe Stopp für den Praxistest.
