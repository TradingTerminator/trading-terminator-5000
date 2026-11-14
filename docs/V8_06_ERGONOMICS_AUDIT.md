# V8.06 – Ergonomieprüfung, 14.11.2026

## Maßstab

Geprüfte Primärquellen, keine Ranglisten oder Erfolgsversprechen:

- Apple UI Design Tips: https://developer.apple.com/design/tips/ – gut erreichbare Bedienflächen, lesbare Texte, Ausrichtung, Rückmeldung.
- Apple Accessibility: https://developer.apple.com/design/human-interface-guidelines/accessibility – verständliche Navigation, einfache Aufgabenfolgen, alternative Bedienung und reduzierte Bewegung. 44 CSS-Pixel sind unser Web-Touch-Ziel; keine Behauptung über native iPhone-Punkte oder Vibration.
- TradeZella Trades Page: https://help.tradezella.com/en/articles/17096919-understanding-the-trades-page – zusammenhängender Arbeitsbereich und klare Wege zwischen Übersicht und Trade.
- Tradervue Tag Reports: https://www.tradervue.com/help/reports/reports_tags – gezieltes Wiederfinden statt unstrukturierter Listen. Bei uns Suche über tatsächliche Setup-Namen, Beschreibung und Regeln sowie Filter für dokumentierte Lernbeispiele.

## Gefundene und korrigierte Probleme

| Problem | Verhalten in V8.06 |
|---|---|
| Verspätete Trade-Abfrage zieht Nutzer nach Navigation zurück | Abbruch anhand Route, Anfrage, Nutzer und Handelssession vor dem Zielwechsel |
| Verspätetes Öffnen eines Trades trotz anderer Navigation | Ungültige Journal- und Detailanfragen werden verworfen |
| Trade-Details ohne gemeinsame Rücknavigation | Unterer Zurück-Button führt zu Playbook, Review, Auswertung, Training oder ursprünglicher Trade-Liste; Fokus und Scrollposition werden zurückgegeben |
| Bestehende Playbook-Suche berücksichtigt nur Setup-Namen | Suche kombiniert alle eingegebenen Begriffe über Name, Beschreibung, Regeln; optional nur Setups mit Trade-/HTF-Lernbeispielen; Trefferzahl und Reset |
| Alte Playbook-Antworten überschreiben neuere Aufrufe | Sequenz- und Nutzerprüfung sowohl für Trades als auch nachgeladene HTF-Beispiele |
| Kleine Review-Texte und schmale Touch-Bereiche | 44px Mindesthöhe für Labels, Summary und Slider; 48px mobile Trade-/Review-Tabs und 13px Beschriftung |
| Helle Akzentfläche mit weißer SL-Auswahlbeschriftung | Themenspezifische Button-Textfarbe |
| Zwei gleichartige Start-Aktionen bei offener Vorbereitung | Genau ein Vorbereitungsbutton; Verwaltung erst nach gespeicherter Vorbereitung sichtbar; kürzerer Startkopf |
| Fehlende Orientierung nach Ansichtswechsel | Ansicht an den Anfang bringen und Überschrift fokussieren; Rücknavigation stellt den Ausgangspunkt wieder her |
| Mauszentrierte Trade-Tabs | Pfeiltasten sowie Home/End und ein aktiver Tab im Tastaturfokus |

## Grenzen und unveränderte fachliche Anforderungen

- Kein Broker-/ATAS-Zugriff, keine erfundene Haltedauer und keine automatisch als korrekt bewerteten Marktthesen.
- HTF-Richtung, freiwillige Pause, Kalenderauswahl, serverseitige Zwei-Stunden-Frist und Pflichtprüfung der Vorbereitung bleiben erhalten.
- Kalender bleibt eine klar beschriftete Teilabdeckung (BLS/BEA), kein vollständiger Forex-Factory-Ersatz.
- Kein Datenbankschema, keine Auth-Konfiguration und keine V7-Dateien verändert.
- Browser-Vorschau und automatisierte Tests ersetzen keinen nativen iPhone-Safari-Test der Zwischenablage oder tatsächlichen haptischen Rückmeldung.

## Verifikation

- Anwendungssuite ohne Fehler; zusätzlich neue Navigationstests für verspätete Antworten, Ausgangspunkt/Fokus, Trade-Liste, kombinierte Suche, HTF-Beispiele, parallele Playbook-Ladevorgänge und Tastatur-Tabs.
- Gemeinsame V8-Regressionssuite: 99 bestanden; vier ausschließlich V7 betreffende Oberflächenverträge unverändert ausgenommen.
- Python: 14 Tests bestanden. Produktionsabhängigkeiten: keine gemeldeten Sicherheitslücken. Release-Prüfung: Syntax, CSP, SRI und Dateihashes bestanden.
- Browser mit synthetischen Daten: Desktop, 390px- und 320px-Rahmen; Suche nach Regel „Sweep“, Beispiel öffnen und mit erhaltenem Filter/aufgeklapptem Setup/Fokus zurückkehren; HTF-Learning öffnen/zurück. Keine horizontale Überbreite in den geprüften schmalen Ansichten; sichtbare Hauptnavigation und Zurück-Button mindestens 44 CSS-Pixel hoch.
- Keine realen Trades angelegt oder geändert. Keine native Safari-/Zwischenablage-/Vibrationsbestätigung aus diesen Tests ableitbar.

Der gemeinsame optionale Cloudflare-Header-/Routing-Worker bleibt bytegleich. Der V8-Build regeneriert ihn nicht mehr automatisch. Dieses Release nutzt den bestehenden GitHub-Pages-Weg; keine Änderung an V7-/Root-Routing oder an der Cloudflare-Konfiguration.
