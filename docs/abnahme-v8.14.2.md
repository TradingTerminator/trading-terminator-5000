# Prüfung V8.14.2

Ausgangsversion V8.14.1. Der Kandidat ist bis zur vollständigen Abnahme von der Produktion getrennt.
## Nachweise zur Abnahme

Ausgeführt wurden die Node- und Python-Regression, der Chromium-Ablauf bei 1440, 390 und 320 Pixeln, der Footer-Test mit 630 Kombinationen sowie WebKit mit drei mobilen Ansichtsgrößen. Firefox und WebKit wurden für die Kapitel auf horizontalen Überlauf geprüft. Vorher-/Nachher-Aufnahmen wurden lokal mit synthetischen Testdaten erstellt. Für einen physischen iPhone-Test liegt kein Nachweis vor. Der gesonderte CI-Job verwendet einen isolierten Supabase-Stack. Für den Reset wurden keine produktiven Daten verwendet.

| Fall | Nachweis und Grenze |
|---|---|
| T01 | Client-Test mit zwei getrennten Browseranmeldungen und beidseitiger Fokusänderung. Vollständiger HTF-Durchlauf auf zwei physischen Geräten offen. |
| T02–03 | Separater CI-Test für lokale Offline-Änderung, konkurrierende Desktop-Änderung, bewusste Auflösung und erneutes Laden. |
| T04 | Kapitel auf Firefox und WebKit geöffnet und aufgenommen. |
| T05 | Regression prüft Gewinnzwang als einzig fehlenden Slider und tatsächliches Fokusziel. |
| T06 | Warnlogik in automatisierten Tests. Vollständige manuelle Pausenfolge auf iPhone offen. |
| T07 | Regression für nachträglichen Entry mit fehlender Emotion und getrennten Analysewerten. |
| T08 | Vier Kontrakte in zwei Marktfamilien geprüft. Multi-Konto-Entry im Chromium-Durchlauf. |
| T09 | Gemeinsame Bildreferenzen implementiert. Vollständiger Speicher- und Anzeigezyklus für HTF auf zwei Geräten offen. |
| T10 | Kartenansicht, Originalbild und Bearbeitungszugang vorhanden. Ersetzen und Sichtbarkeit auf physischem Zweitgerät offen. |
| T11 | Katalog- und Snapshot-Regression. Gemeinsamer Bedienablauf mit zwei Geräten offen. |
| T12 | Automatisierte Rücksprungprüfung einschließlich Umweg über Einstellungen. |
| T13 | Separate Synchronisationsanzeige und Responsivtests. Fokus über alle Upload-/Netzfehlerfälle offen. |
| T14 | SQL-/Storage-Tests für Eigentümertrennung, veraltete Gerätegeneration und Reset. Durchgehende Abnahme der zwei Dialoge mit physischen Geräten offen. |
| T15 | Chromium, Firefox und mobiles WebKit geprüft. Native iOS-Tastatur, Systemzwischenablage und Touch auf Hardware offen. |
| T16 | Pflichtprüfung und redundante Elemente korrigiert. Kapitelansichten und Entry-Ablauf geprüft. |

