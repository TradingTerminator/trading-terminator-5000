# Trainingsschwerpunkt – Umsetzung und Prüfstand

Stand 12.11.2026. Nur im unveröffentlichten Code vorbereitet. Die Datenbankerweiterung wurde in einer Transaktion geprüft und zurückgerollt, nicht dauerhaft aktiviert.

## Bedienung

1. Abgeschlossenen Trade prüfen und alle Fehler mit eigenen Gegenmaßnahmen im Review speichern.
2. Bei einer gespeicherten Maßnahme „Als Trainingsschwerpunkt übernehmen“ wählen. Regeln benötigen 10–500 Zeichen. Längere Gegenmaßnahmen zuerst im Review konkret kürzen und speichern.
3. Ein vorhandener Schwerpunkt wird nur nach ausdrücklicher Bestätigung ersetzt. Er bleibt als „Ersetzt“ in der Historie; das behauptet keine erfolgreiche Umsetzung.
4. Die gewählte Regel steht vor der Session im Sessionbereich. Keine zusätzliche Live-Pflichteingabe.
5. Beim Entry hält die Datenbank die gültige Regel mit Ziel-ID und Regeltext am Trade fest. Spätere Änderungen wirken nicht rückwirkend. Alte Trades werden nicht nachträglich einem neuen Ziel zugeordnet.
6. Im Review nach Exit auswählen: noch nicht bewertet, keine passende Gelegenheit, eingehalten, teilweise eingehalten oder nicht eingehalten. Erklärung optional, maximal 500 Zeichen.
7. Die Zusammenfassung zeigt die letzten bis zu 50 abgeschlossenen Trades dieses Schwerpunktes. Nur eingehalten/teilweise/nicht eingehalten bilden den Nenner „passende Gelegenheiten“. Keine Gelegenheit und offene Bewertungen separat. Kein P&L-Kriterium, kein automatischer Wirksamkeitsnachweis.

Manuelle Auswahl bleibt maßgeblich. Das Fehlermusterfeld zeigt dokumentierte Häufigkeiten und vorhandene eigene Gegenmaßnahmen, wählt aber keinen aktiven Schwerpunkt automatisch. Ein bewusst beendeter Schwerpunkt ist keine Wirksamkeitsbestätigung.

## Technik und Betrieb

- SQL-Erweiterung: `sql/training_focus_v735.sql`, nach `security_v735.sql` und `review_types_v735.sql` in der getrennten Testumgebung anwenden. Nicht vor Geräteabnahme veröffentlichen.
- Bestehende Tabellen weiterverwendet: `training_goals_v7` sowie `trades.observations`. Snapshot-Export enthält diese bereits; keine zusätzliche Tabelle.
- Ein aktiver Schwerpunkt je Eigentümer wird durch einen partiellen eindeutigen Index gesichert. Ersetzen erfolgt atomar in einem RPC mit Eigentümerprüfung, erwarteter vorheriger Ziel-ID und Wiederholschutz.
- Review-Quelle wird serverseitig gegen einen eigenen abgeschlossenen und vollständig geprüften Trade samt gespeicherter Maßnahme geprüft.
- Snapshot am Entry ist serverseitig vor Änderung geschützt. Bewertungszustand, Ziel-ID, Textlänge und Exit werden serverseitig geprüft.
- Lokale Review-Entwürfe enthalten auch die Trainingsbewertung.
- Bei unbekanntem Ladezustand kann kein neuer Schwerpunkt gespeichert werden. Erneutes Laden erfolgt beim Aufruf der Trainingsauswertung und bei Rückkehr in den sichtbaren Tab.
- Aktivierung bleibt ausdrücklich ausstehend. Die unveröffentlichte Oberfläche benötigt diese SQL-Erweiterung für den vollständigen Ablauf.

## Nachweise

27 Node-/DOM-/Gatewaytests und 6 Python-Archivtests bestanden, zusammen 33. Release-Prüfung bestanden. Sieben neue Oberflächetests betreffen Zählweise ohne P&L, Anzeige und Exit-Zustand, tatsächliche Review-Speicherung, Startanzeige/Abmeldung, ausdrücklichen Wechsel mit Quell-IDs, ungespeicherte Maßnahmen und Entwurfswiederherstellung. Die Datenanbindung dieser Oberflächetests ist nachgebildet.

13 Datenbank-Prüffälle aus `sql/verify_training_focus_v735.sql` in derselben Transaktion wie die Erweiterung bestanden; anschließend ROLLBACK. Nachkontrolle: 10 Trades, 2 Sessions und 20 Kontozuordnungen erhalten; Erweiterung nicht dauerhaft vorhanden.

Offen: Aktivierung in getrennter Testumgebung, angemeldeter Gesamtablauf, iPhone/PC, tatsächliche konkurrierende Gerätezugriffe und vollständiger Restore mit den neuen Zielfeldern. Keine praktische Abnahme durch automatisierte Tests ersetzt.

## Weitere Logikprüfung

Wiederholungsversuche mit unklarer Speicherantwort behalten im Browser dieselbe Request-ID. Der Server bestätigt einen inzwischen ersetzten Schwerpunkt nicht erneut als aktiv. Die vorbereitete Erweiterung wurde mit 14 SQL-Prüffällen erfolgreich in einer zurückgerollten Transaktion geprüft. Keine dauerhafte Aktivierung. Aktueller Gesamtstand: 48 automatisierte Tests, Details in LOGIC_REVIEW_7.35.md.
