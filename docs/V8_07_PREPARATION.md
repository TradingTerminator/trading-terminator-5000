# V8.07 – Neue Handelssession und Vorbereitung

## Ablauf

1. **Wie fühle ich mich?** Vier Grundwerte (Fokus, Anspannung, Müdigkeit, Handelsdrang), vier weitere optionale Bewertungen (Angst, Gewinnzwang, Verluste zurückholen, Frust). Jeder auffällige Faktor hat einen eigenen Hinweis und eine eigene Bestätigung. Änderungen der jeweiligen Bewertung entwerten ihre Bestätigung. Bei starken oder mehreren Auffälligkeiten wird zunächst Nicht-Handeln/Pausieren empfohlen; keine Broker-Sperre. Freiwillige Pause mit Zeitwahl auch vor dem Erstellen einer Handelssession.
2. **Zeit & Grenzen.** Handelsdauer ab Bestätigung oder feste zukünftige Endzeit in Deutschland; Gewinnziel optional, Verlustmaximum ausdrücklich festlegen. Beträge in USD netto nach Gebühren, Summe aller dokumentierten Kontenausführungen dieser Handelssession. Dokumentationszeit ist keine Handelsdauer.
3. **Konten & Standards.** Konten bewusst neu wählen, Instrument, Kontrakte und SL bearbeiten. Erst eine erfolgreiche Kontobestätigung erzeugt die Handelssession. Frühere persönliche Eingaben bleiben erhalten. Eigene bestätigte Standards können je Benutzer auf diesem Gerät gemerkt werden; sie wählen Konten niemals automatisch aus. Keine erfundene SL-Vorgabe beim ersten Mal.
4. **Wo steht der Markt?** Erster HTF-Überblick mit vorhandener Mehrbild-/Einfügefunktion. Bilder optional; ausgewählte Dateien vor dem Weitergehen speichern oder verwerfen.
5. **HTF prüfen.** Aufklappbare Abschnitte für News/Makro, Sentiment, Marktumfeld/Richtung/Levels und Szenario/Notizen. Zusätzliche Prüfpunkte bleiben bearbeitbar. Bei relevanten Zonen/Optionslevels muss die Beobachtung dokumentiert werden. ES/NQ-Vergleich, Yields, Bonds, Öl jeweils bewusst einordnen, bei Bedarf als nicht relevant kennzeichnen. Abschließende Bestätigung nur nach vollständigen Angaben, mit Links zu fehlenden Stellen.

## Überblick und Learning

- Aufklappbarer HTF-Überblick beim Entry und in Trade-Details: Richtungen, Termine, persönliche News-Regel, Zonen, Optionslevels, Marktumfeld und gesetzter Rahmen.
- Trade-Details zeigen den beim Entry gespeicherten HTF-Snapshot; spätere Änderungen ersetzen keine ursprüngliche These.
- Der zusätzliche Rahmen und das Marktumfeld bleiben im HTF-Learning einsehbar. Die bestehende serverseitige Zwei-Stunden-Frist bleibt unverändert.

## Limitmeldungen

- Vollflächige, neutrale und schließbare Meldung für erreichte Handelszeit, Verlustmaximum oder Gewinnziel. Freiwillige Pause, Nachbereitung oder Rückkehr sind jederzeit wählbar. Keine Orders oder technische Handelssperre.
- Geldgrenzen verwenden nur vollständig dokumentierte finale Kontoergebnisse abzüglich Gebühren. Offene Positionen und nicht erfasste Trades werden nicht geschätzt. Unvollständige Daten lösen keine Geldgrenze aus.
- Aktualisierung nach geladenen Session-Ergebnissen und im Vordergrund ungefähr minütlich ohne Neuaufbau offener Trade-Formulare. Zeitgrenze wird alle zehn Sekunden und bei Rückkehr zur Seite geprüft.
- Bestätigte Hinweise werden je Benutzer, Handelssession und HTF-Stand auf diesem Gerät gemerkt; ein anderer Nutzer oder eine neue Handelssession übernimmt sie nicht.

## Kalender und Quellen

Der bestehende automatische BLS-/BEA-Kalender bleibt ein ergänzender Teilkalender. Fed/FOMC und ISM sind zusätzliche ausdrückliche Prüfpunkte mit offiziellen Quellen und manueller Terminübernahme:

- https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm
- https://www.ismworld.org/supply-management-news-and-reports/reports/rob-report-calendar

Beide direkten Abrufe lieferten in dieser Entwicklungsumgebung HTTP 403. Die ISM-Nutzungsbedingungen untersagen außerdem automatisiertes Datensammeln und beschränken die Nutzung ihrer Daten: https://www.ismworld.org/footer/terms-of-use/ . Es wurde kein Scraper und keine Umgehung implementiert. Keine Behauptung eines vollständigen automatischen Kalenders, keine erfundenen Veröffentlichungstermine, keine automatische Makro-Handelsrichtung.

News-Regelvorlagen sind unter Einstellungen bearbeitbar und einzeln aktivierbar; ihre aktuelle Gerätebindung ist im Formular ausdrücklich beschriftet. Gewählte Regeln und alle Vorbereitungsangaben werden dagegen im HTF-Snapshot der Handelssession gespeichert.

## Speicherung und Schutz

Die Definition des produktiven `save_htf_assessment_v803` wurde lesend geprüft: Eigentümerprüfung, Session-Sperre und erwarteter Kontext, vollständige Speicherung der JSON-Planfelder, unveränderlicher Snapshot und getrennte serverseitige Learning-Freigabe bleiben bestehen. Keine Schema-, Rollen-, Auth- oder V7-Änderung. Die neuen Felder werden über die bestehende RPC gespeichert. Keine realen Trades für Tests angelegt oder verändert.

## Verifikation

Automatisierte Prüfungen decken die neue Schrittfolge, Einzelbestätigungen, Bestätigungsentwertung, erhaltene Eingaben bei Kontoanlage, Options-/Makropflichten, Snapshot-Payload, Deutschland-Zeit/Sommerzeit, vollständige Nettoergebnisse, Grenzmeldungen, freiwillige Pause ohne Session, Benutzerisolation, Kontostandards, News-Regeln und den Übergang in den Trade ohne doppelten Abschlussbutton ab. Bestehende HTF-Tests wurden an die zusätzlichen Pflichtangaben angepasst; Prüfungen auf zwei statt drei technische Standardpunkte wurden um Optionslevels erweitert.

Browserprüfung mit synthetischen Daten: mobile Schrittfolge 1–4 und vollständige HTF-Eingabe bis zur Bestätigung/Trade-Vorbereitung, erhaltene Zonen/Optionslevels im aufklappbaren Überblick. Native iPhone-Zwischenablage und echte Haptik werden dadurch nicht bestätigt.

Zusätzliche Browserprüfung: vollflächiger Zeit-Hinweis → freie Pausendauer → laufender neutraler Countdown → vorzeitig zurück mit erhaltenen Bewertungen. Geprüfte mobile Inhaltsbreite ohne horizontales Überlaufen. Abschließender Übergang zeigt sechs Entry-Skalen, genau einen Rückweg und keinen zweiten Vorbereitungs-Abschlussbutton.
