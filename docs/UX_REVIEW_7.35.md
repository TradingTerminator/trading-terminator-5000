# Optik und Bedienbarkeit – V7.35

Stand 12.11.2026. **Quelltext- und DOM-Prüfung abgeschlossen; gerenderte visuelle Abnahme ausdrücklich offen.** Der Browser konnte den lokalen HTTP-Vorschauserver nicht erreichen. Dateiseiten wurden durch die Browserrichtlinie abgewiesen und nicht zur Umgehung dieser Beschränkung geöffnet. Es liegen keine Screenshots oder Messungen eines gerenderten Layouts als Nachweis vor.

## Geprüfte Struktur und konkrete Änderungen

| Bereich | Befund und Bearbeitung | Nachweisgrenze |
|---|---|---|
| Session | Text „beliebig viele“ widersprach Tageswarnschwelle; Text korrigiert. Sessionbereich und Konten weiterhin gemeinsam zugänglich. | Echte Startbedienung offen |
| Entry | Pflicht-SL war hinter standardmäßig geschlossenem Kontenbereich. Bereich jetzt geöffnet; bei fehlendem SL gezielt öffnen, Feld fokussieren und Fehler dauerhaft neben der Aktion anzeigen. | Verhalten im DOM-Test bestätigt; Bildschirmtastatur offen |
| Initialrisiko | Manuell korrigiertes, bereits gespeichertes Risiko konnte durch Vorschauinitialisierung im Feld wieder editierbar werden. Erfasste Werte bleiben jetzt gesperrt. | DOM-Test bestätigt; DB-Schutz bestand bereits |
| Schaltflächen | Globale Regel `button+button` setzte in Rastern nur auf spätere Schaltflächen Zusatzabstand. Für gerichtete Button-Gruppen neutralisiert. Session-/Abmeldebutton auf mindestens 44 CSS-Pixel Höhe gesetzt. | CSS geprüft; tatsächliche Geometrie nicht gemessen |
| Navigation | „Settings“ zu „Einstellungen“, „Training & Learnings“ zu „Training“ vereinheitlicht. Aktiver Hauptbereich hat `aria-current`; Trainings-/Journal-Unteransichten korrekt zugeordnet. | Navigation im DOM-Test bestätigt |
| Training | Aktiver eigener Schwerpunkt vor den Fehlermustern angeordnet. Auf schmalen Ansichten Trainingsaktionen einspaltig. Keine automatische Auswahl. | Reihenfolge/CSS geprüft, Mobilansicht nicht gerendert |
| Review | Mehrfachfehler, Einzelmaßnahmen, explizite Ausnahmeentscheidungen und Trainingsbewertung bleiben getrennt. Lange Aktionsbuttons auf schmalen Ansichten über volle Breite. | Vorhandene Funktionstests; Sichtabnahme offen |
| Exit | Schneller Exit bleibt eigener Bereich mit Ergebnis/Einheit/Gebühren; optionale Analyse und Screenshots werden eingeklappt bzw. nachgelagert. | Ablauf im Code geprüft; tatsächliche Erreichbarkeit bei Scrollen/Tastatur offen |
| Sicherung | Beschreibung behauptete weiter „keine Bilddateien“ und JSON trotz ZIP-Export. Beschreibung und Aktion auf Journal-ZIP mit Bildern/Prüfsummen korrigiert. | Text und tatsächlicher Exportweg abgeglichen |
| Anmeldung | Technische OTP-Vorlagenanweisung aus dem normalen Anmeldehinweis entfernt; Adminvorlage bleibt in Einstellungen. | Beschriftung geprüft; echte OTP-Anmeldung offen |
| Zugänglichkeit | Dateiauswahl beschriftet, Symbolbuttons mit eindeutigen Namen versehen, dauerhafter Entry-Fehler als Alert ausgezeichnet. Navigationsschrift mindestens 12 CSS-Pixel. | Keine vollständige Accessibility-Zertifizierung |

## Rechnerisch geprüfte Farbpaare

Die folgenden Kontraste wurden aus den expliziten CSS-Farbwerten berechnet. Sie gelten nur für die angegebenen Paare, nicht pauschal für alle Elemente, Zustände, Transparenzen oder Themes.

| Farbschema | Haupttext auf Panel | Sekundärtext auf Panel | Weißer Text auf primärem Button |
|---|---:|---:|---:|
| Petrol | 14,34:1 | 9,74:1 | 7,05:1 |
| Graphit | 13,08:1 | 8,96:1 | 6,98:1 |
| Kontrast | 17,89:1 | 15,01:1 | 9,00:1 |

## Tests und verbleibende Abnahme

30 Node-/DOM-/Gatewaytests und 6 Python-Archivtests bestanden. Neue DOM-Prüffälle: fehlender SL öffnet Kontenbereich und fokussiert das richtige Feld; gespeichertes manuelles Risiko bleibt gesperrt; aktive Hauptnavigation folgt den Unteransichten. Release-Syntax, SRI, Hashes, CSP und statische DOM-IDs geprüft.

Noch offen: gerenderte Ansichten bei 320/390/430 Pixeln und am PC, beide Layoutdichten und drei Farbschemata, Zeilenumbrüche langer Namen und Maßnahmen, horizontales Überlaufen/Abschneiden, Fokus-/Tastaturbedienung, iPhone-Bildschirmtastatur, Sticky-Navigation und fixierte Aktionen, Fotoauswahl sowie kompletter angemeldeter Ablauf. CSS `overflow-x:hidden` allein beweist keine fehlerfreie Breite. Kein Punkt wird wegen einer vorhandenen CSS-Regel als visuell bestanden erklärt.

GitHub-Upload wurde inzwischen grundsätzlich erlaubt. Diese UX-Nacharbeit ist lokal; es wurde in diesem Schritt weder gepusht noch die laufende App verändert. Vor einer Aussage „Optik vollständig geprüft“ ist die gerenderte Abnahme nachzuholen.
