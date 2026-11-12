# Funktion und Praxistest V7.35

Stand: 12.11.2026. Veröffentlichung bleibt bis nach erfolgreichem Praxistest zurückgestellt. Verkauf ist derzeit kein Arbeitsziel. Automatisierte Tests ersetzen keine Geräteabnahme.

## Aktuell nachgeprüft

30 Node-/DOM-/Gatewaytests und 6 Python-Archivtests bestanden. Zusätzlich Release-Prüfung bestanden. Die Datenanbindung in den DOM-Tests ist nachgebildet; es wurden dabei keine produktiven Journal-Daten verändert. Die früheren Datenbankprüfungen wurden in diesem Arbeitsschritt nicht erneut ausgeführt.

Korrigierter Bedienfehler: Beim Wechsel der Fehlerart aktualisiert sich die Auswahl vorhandener Gegenmaßnahmen. Bereits selbst geschriebener Text bleibt erhalten, bis eine andere Maßnahme ausdrücklich übernommen wird.

Zusätzlich korrigiert und geprüft: Beim Lesen lokaler Entwürfe wird ein neuerer gültiger Entwurf im jeweils anderen Browserspeicher berücksichtigt; beschädigter Inhalt verdeckt keine gültige Alternative mehr. Vor dem Download eines asynchron erzeugten ZIPs wird die Benutzeridentität erneut geprüft. Bei fehlgeschlagenem oder zwischenzeitlich geändertem Snapshot entsteht kein Download einer Teilsicherung.

## Noch praktisch abzunehmen

Alle nachfolgenden Fälle sind offen. Für iPhone/Safari und PC getrennt Ergebnis, beobachteten Fehler und Wiederholungsprüfung erfassen. Testdaten eindeutig kennzeichnen und eine getrennte Testumgebung verwenden. Die bestehende Produktionsdatenbank nicht als Restore-Ziel verwenden.

| Fall | Handlung | Erwartetes Ergebnis |
|---|---|---|
| Session | Session mit zwei Konten starten und neu öffnen | Konten, Instrumente, Mengen und HTF-Kontext erhalten |
| Entry | Idee und Versuch erfassen, Trade mit Initialrisiko speichern | Genau ein Trade, richtige Session, richtige Kontorisiken |
| Unsichere Verbindung | Antwort beim Entry unterbrechen und denselben Versuch wiederholen | Kein doppelter Trade; Speicherstatus verständlich |
| Stop | SL auf BE, danach über ursprüngliches Risiko hinaus verschieben | Zeit/Grund dokumentiert; Initialrisiko und R-Basis unverändert |
| Exit | Ergebnis und Gebühren für beide Konten erfassen | Brutto, Gebühren, Netto und R korrekt getrennt |
| Mehrere Fehler | Gewinntrade mit zwei Fehlern und zwei Maßnahmen prüfen | Beide Fehler unabhängig gespeichert und auswertbar |
| Historische Trades | Trade aus alter Session im Playbook öffnen, Review speichern und zur aktiven Session zurückkehren | Richtiger Trade geändert; aktive Sessionliste und Sessionzuordnung unverändert |
| Fehlende Ergebnisse | Unvollständigen historischen Trade und seine Session-/Kontoauswertung öffnen | Fehlende Ergebnisse erkennbar; kein R aus Teilwerten |
| Maßnahmen | Fehlerart wechseln und vorhandene Maßnahme übernehmen | Nur passende Vorschläge; eigene Eingabe bleibt bis zur Übernahme erhalten |
| Trainingsschwerpunkt | Gespeicherte Maßnahme übernehmen, Schwerpunkt wechseln, kommenden Trade erfassen und Umsetzung bewerten | Ein aktiver Schwerpunkt, alter Regeltext am Trade erhalten; keine Gelegenheit und offene Bewertungen separat; siehe TRAINING_FOCUS_7.35.md |
| Tageslimit | Fünf Trades auf mehrere Sessions verteilen; sechsten mit/ohne Begründung erfassen | Gemeinsamer Berliner Tageszähler; Dokumentation möglich; Reviewpflicht korrekt |
| Entwurf | Review ändern, offline gehen, schließen und wieder öffnen | Nicht synchronisierter Entwurf erkennbar und wiederherstellbar |
| Benutzerwechsel | A abmelden, B anmelden, verzögerte/fehlgeschlagene Abfragen auslösen | Keine Daten von A sichtbar; keine verspätete Übernahme |
| Parallelität | Denselben HTF-Kontext/Trade auf zwei Geräten bearbeiten | Konflikt erkennbar; kein stilles Überschreiben |
| Bilder | HTF-/LTF-Bilder hinzufügen und erneut laden | Richtige Zuordnung, lesbare Bilder, mobile Bedienung |
| Sicherung | Journal mit Ideen, Versuchen, Reviews und Bildern exportieren | Vollständiges Archiv, Bildprüfsummen gültig |
| Wiederherstellung | Archiv in separates leeres Testprojekt einspielen | Zeilen, Beziehungen, Bildinhalte und App-Abläufe stimmen überein |

## Abnahmeregel

Fehler mit Reproduktionsschritten erfassen, beheben und betroffenen Ablauf erneut auf beiden Geräten prüfen. Erst nach gemeinsamem Praxistest über Veröffentlichung entscheiden. Kein Fall gilt allein aufgrund dieser Checkliste als bestanden.
