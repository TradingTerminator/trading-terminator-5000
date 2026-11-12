# V7.37 – Trade-Arbeitsbereich nach zweitem iPhone-Test

## Umgesetzt

- Keine inneren vertikalen Scrollflächen für offene Reviews oder Rückblick. Startseite zeigt drei offene Reviews und eine vollständige Liste bei Bedarf.
- Startdaten aktualisieren sich alle 20 Sekunden, bei Rückkehr zur sichtbaren App und nach Wiederherstellung der Verbindung. Kein kompletter Seitenreload, kein Neubau eines offenen Editors. Verbliebene manuelle Aktualisierungen sind kleine, zugänglich beschriftete ↻-Symbole.
- Ein Trade-Arbeitsbereich mit vier Reitern: Übersicht, SL, Exit, Review. Trade-ID-Kürzel, Instrument, Richtung, Setup, Konto und Berliner Dokumentationszeit bleiben eindeutig zugeordnet. Offene Reviews öffnen diesen Arbeitsbereich, keine zweite bearbeitbare Kopie im Training. Exit führt nach erfolgreichem Speichern in dessen Review.
- Wiederverwendeter Plan übernimmt Setup, Markt und Richtung; ein abweichender neuer Setup-Klick wechselt ausdrücklich zu einem neuen Plan. Die lange abgeschnittene Ideenoption wurde verkürzt und die Beschriftung erklärt den erneuten Einstieg.
- Alle Session-, Entry- und Exit-Skalen stehen sichtbar im Formular. Keine fiktiven Standardbewertungen: nicht angefasste Skalen bleiben unbewertet. Session: Fokus, Anspannung, Müdigkeit, Handelsdrang. Entry: Fokus, Anspannung, FOMO, Verluste zurückholen, Angst, Gier. Exit: Angst, Anspannung, Gier, Frust, Erleichterung, Unsicherheit.
- Während des Trades keine verpflichtende Ablenkung. Angst, Gier und Unsicherheit werden im Review rückblickend erfasst. Für neue V7.37-Trades für den vollständigen Review erforderlich; historische Bewertungen werden nicht künstlich ergänzt.
- Gespeichertes Originalrisiko erscheint kompakt und lesbar, ohne funktionslos wirkende gesperrte Bearbeitungsfelder. Es bleibt unveränderlich. Nur alte fehlende Risiken haben eine echte Speicheraktion.
- SL-Verwaltung: direkter Wert, BE 0 Ticks, +1 Tick, Gründe als Auswahl statt Button-Matrix. Speichern aktualisiert die vorhandene Karte, kein kompletter Neuaufbau und kein Verlust ungespeicherter Exit-Eingaben. Geschlossene Trades können ihre Stop-Historie weiterhin öffnen. Risikoerhöhungen aktualisieren die erforderlichen Ausnahmeprüfungen.
- Exit-BE ist ein editierbarer Vorschlag von +1 Brutto-Tick je Konto, niemals eine Behauptung über Gebührenfreiheit oder tatsächliche Broker-Ausführung. Gebühren werden nicht verändert.
- Fehler zuerst auswählen, dann Gegenmaßnahme/Regelbruch erfassen. Kleines × verwirft den Entwurfseintrag mit Rückgängig-Aktion; keine sofortige Löschung gespeicherter Journaldaten.
- Gemerkte Beispiele werden nach Ausführung getrennt: Vorbild-Trades (geprüft, ohne dokumentierte Fehler/Regelbruch, A/A+), Lernfälle (Fehler oder Regelbruch) und bisher nicht ausreichend eingeordnete alte Beispiele. P&L ist kein Kategorisierungskriterium; keine alten Beispiele werden gelöscht.

## Zeitprüfung

Live-Datenbank: timestamptz, Standard now(), Serverzone UTC. Geprüfter Trade 12.11.2026 18:19:20 UTC entspricht 19:19:20 Berlin/MEZ. Keine pauschale Datenverschiebung vorgenommen. Darstellung nennt nun MEZ/MESZ und bezeichnet den Entry als Dokumentationszeit. Ein konkreter darüber hinaus berichteter Zeitfehler ist ohne genaueres Feld/Sollzeit noch nicht belegt.

## Geprüfte Vorbilder, keine Behauptung allgemeiner Überlegenheit

TradeZella dokumentiert einen einzelnen Trade-Detailbereich mit getrennten Bereichen für Statistik, Strategie, Ausführungen und Anhänge sowie getrennte Strategie- und Fehler-Tags. Apple warnt vor gleichgerichteten verschachtelten Scrollansichten. Daraus wurde die oben beschriebene Lösung für dieses Projekt abgeleitet, keine kopierte Funktionsliste und keine belegte universelle Bestlösung.

- https://help.tradezella.com/en/articles/5860216-understanding-the-trade-detail-page
- https://help.tradezella.com/en/articles/13863136-getting-started-with-tradezella
- https://developer.apple.com/design/human-interface-guidelines/scroll-views
- https://developer.apple.com/design/human-interface-guidelines/tab-views

## Validierung

59 Node-/DOM-/Gatewaytests und 6 Python-Archivtests bestanden (65 insgesamt). Acht neue Fälle prüfen den tatsächlichen Detailrenderer/Reiter/Trade-Kontext, SL-Speicherung ohne Rekonstruktion, BE-Vorschlag samt Gebühren und Editierbarkeit, sichtbare Pflichtskalen/gesperrten unbewerteten Entry, Verwerfen/Rückgängig, Playbook-Trennung unabhängig vom P&L, konsistente Wiederverwendung eines Plans und Berliner Sommer-/Winterzeit.

Additive Migration `required_ratings_for_v737` erzwingt vollständige Entry-/Exit-Skalen und rückblickende Review-Skalen für neue, ausdrücklich mit capture_version 737 markierte Trades. Sie verändert keine historischen Zahlen. Sieben Datenbankprüffälle mit Rollback bestanden, einschließlich vollständigem Zurückrollen eines wegen fehlender Exit-Bewertungen abgelehnten Abschlusses. Bestehende APIs bleiben kompatibel.

Echte iPhone-Touch-/Scroll-/Tastaturabnahme und vollständiger Benutzerablauf bleiben praktisch zu bestätigen. Kein Verkaufs- oder vollständiger Sicherheitsnachweis; offene frühere Restore-/Sicherheitsarbeiten bleiben offen.
