# Weitere Funktions- und Logikprüfung – 12.11.2026

Änderungen ausschließlich im unveröffentlichten Arbeitsstand. Bestehende Journal-Daten bleiben unangetastet. Der zuvor begonnene Arbeitsstand wurde geprüft und fertiggestellt.

| Bereich | Korrektur | Nachweis |
|---|---|---|
| Historische Trades | Playbook-Trades aus früheren Sessions direkt laden und bearbeiten; die aktive Sessionliste bleibt unverändert | DOM-Test mit nachgebildeter Datenanbindung |
| Detailansicht | Frischer Detaildatensatz wird verwendet; gespeicherte Änderungen synchronisieren vorhandene Listenkopien, fügen historische Trades aber nicht zur Session hinzu | DOM-Test |
| Gleichzeitiges Öffnen | Langsame Antworten einer älteren Auswahl können die zuletzt gewählte Ansicht nicht ersetzen | Test mit absichtlich verzögerter Antwort |
| Offene Reviews | Fehlende Trainingsbewertung, unzugeordneter Regelbruch und noch unbewertete Tagesausnahme halten das Review offen | Funktionstests |
| Fehlerquote | Nur ausdrücklich geprüfte Trades bilden den Nenner; ungeprüfte Trades separat ausweisen | Ein Fehler bei einem geprüften und 24 ungeprüften Trades ergibt 100 % unter geprüften Trades, keine vermeintlichen 4 % |
| Fehlerarten | Alle angebotenen Fehlerarten, einschließlich „Sonstiges“, werden in den Trainingsmetriken berücksichtigt | Funktionstest |
| R-Werte | Vollständige ursprüngliche Kontorisiken und endgültige Kontoergebnisse erforderlich; fehlende Ergebnisse als unvollständig kennzeichnen | Detail-/Session-/Analysetests |
| Trainingsschwerpunkt | Wiederholung nach unklarer Speicherantwort verwendet dieselbe Request-ID; ersetzter Schwerpunkt kann nicht als aktiv bestätigt werden | DOM-Test und SQL-Test |
| Aktivierung Training | Mehrere vorhandene aktive Ziele führen zu einem klaren Vorprüfungsfehler; kein Ziel wird stillschweigend ausgewählt oder gelöscht | SQL-Vorprüfung im Code; normaler Migrationspfad getestet |

## Ausgeführte Prüfungen

42 Node-/DOM-/Gatewaytests und 6 Python-Archivtests bestanden, insgesamt 48. Releaseprüfung für Syntax, SRI, Dateihashes, CSP und statische DOM-IDs bestanden.

Die vorbereitete Trainingserweiterung zusammen mit 14 Datenbank-Prüffällen innerhalb einer Transaktion erfolgreich geprüft und zurückgerollt. Sie wurde nicht dauerhaft aktiviert. Es wurde nichts auf GitHub hochgeladen und keine neue App-Version veröffentlicht.

DOM-Tests verwenden nachgebildete Datenanbindung. Eine gerenderte visuelle Abnahme, der angemeldete iPhone-/PC-Ablauf, reale Parallelbedienung und die vollständige Wiederherstellungsprobe in einem separaten Projekt bleiben offen. Der Praxisplan in PRAXISTEST_7.35.md bleibt maßgeblich; keine dieser Grenzen gilt durch die automatisierten Tests als erledigt.
