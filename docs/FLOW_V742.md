# V7.42 – weniger Oberfläche, direkter Durchlauf

## Struktur

- Jede Hauptansicht zeigt nur ihren eigenen Inhalt. Konten öffnen nicht mehr gleichzeitig die Einstellungen.
- Playbook hat keine zweite Navigation. Unter Analyse bleiben nur Auswertung und Training.
- Kompaktere Touch-Oberfläche mit mindestens 44 px hohen Aktionen. Aktive und inaktive Navigation unterscheidbar, Zahlenkarten begrenzt, Formulare weiterhin mindestens 16 px gegen ungewollten iOS-Zoom. Größere Schrift, kantige Ecken und kompakter Modus bleiben anwendbar.
- Analyse: zentrale Review-Kennzahlen und Ausführungs-/Fehlerauswertung. Doppelte Musterdarstellung ausgeblendet; Session-Details und Ideenprüfung aufklappbar.
- Training: kurzer Ablauf, aktive Regel, Vorschlag aus dokumentierten Fällen; Falllisten und Langzeitentwicklung bei Bedarf öffnen. Keine Regeländerung der automatischen Priorisierung.

## Durchlauf

Entry behält die drei Schritte Setup/Idee, Konto/Risiko, Verfassung/Entry. Review erhält drei eigene Schritte: Situation mit Bildern und LTF-Beobachtungen, Ausführung mit Regelprüfung/Fehlern/Emotionen, Lernpunkt mit Trainingsbewertung und finalem Speichern. Ein Wechsel zwischen Schritten rekonstruiert keine Felder und verliert keine Eingaben.

Jeder fehlende gespeicherte Review-Punkt ist direkt antippbar. Er öffnet den richtigen Bereich und Schritt, klappt erforderliche Details auf und fokussiert das konkrete Eingabefeld. Historische Fälle erhalten die tatsächliche Session-Überschrift. Nach erfolgreichem Review-Speichern ist Training direkt erreichbar.

Die aus Journal-Zeitstempeln abgeleitete Haltedauer ist entfernt. Geschlossene Trades zeigen „SL-Verlauf“; keine zusätzliche Pflichtprüfung oder implizite SL-Änderung wurde eingeführt. Nach abgeschlossenem Review wird nicht weiterhin ein fehlender Review-Schritt behauptet.

## Bilder

- Nativer Paste liest sowohl DataTransfer.files als auch DataTransfer.items, mit Entdopplung.
- beforeinput mit Bilddatei wird verarbeitet. Eingefügtes HTML wird nicht in das bearbeitbare Feld übernommen. Eingebettete PNG/JPEG/WebP-Daten können lokal dekodiert werden; fremde Bild-URLs werden nicht geladen.
- Clipboard.read bleibt an einen ausdrücklichen Klick bzw. Paste gebunden. Bei ausbleibender Übergabe erhält der Nutzer den nativen Einfügeweg statt einer vorschnellen roten Fehlermeldung.
- Bilder zeigen vor dem Upload eine Vorschau. „Auswahl verwerfen“ betrifft nur noch nicht hochgeladene Dateien. Bestehende private Upload-Regeln und Größenlimits bleiben erhalten.
- Externe Skripte initialisieren die Anmeldung erst nach DOMContentLoaded, damit auch bei sehr schneller Antwort alle späteren Hilfsfunktionen vorhanden sind.

## Nachweis und Grenzen

104 Node-/DOM-/Gateway-Tests und acht Python-Backup-Prüfungen bestanden. Release-Syntax, CSP, SRI und Dateihashes geprüft. Lokaler Browser mit synthetischem Konto: Playbook → dokumentierter Trade → fehlendes Qualitätsfeld; dreistufiges Review, isolierte Training-/Analyseansicht und tatsächliches PNG-Paste aus der Browser-Zwischenablage bis zur Vorschau erfolgreich geprüft.

Kein echter iPhone-/Safari-Nachweis für „Screenshot → Teilen → Kopieren → Einfügen“. Kein neuer Zwei-Geräte- oder Restore-Test. Keine neue Datenbankmigration; unveränderte Tabellen, ursprüngliche Risikowerte, RLS und Speicherverfahren. Die zuvor abgelehnte Setup-Kopie beim separaten Vormerken einer Idee bleibt außerhalb dieser Veröffentlichung.

Technische Primärquellen für Paste-Verhalten: https://webkit.org/blog/10855/async-clipboard-api/ und https://webkit.org/blog/8170/clipboard-api-improvements/ .
