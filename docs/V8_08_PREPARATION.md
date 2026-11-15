# V8.08 – Vorbereitung, Trade-Übergang und dokumentierte Grenzen

Stand: 15.11.2026. Basis: main `661a7a9`, einschließlich Teilfix `05b4237`.

## Umgesetzte Anforderungen

| Auftrag | Umsetzung |
|---|---|
| 01 | Eine sichtbare Minuteneingabe (5–720). 90 Minuten bleiben 90 Minuten. Historische Endzeitfelder bleiben nur für Entwurfskompatibilität unsichtbar. Eine abgelaufene, gespeicherte Dauer verursacht keine erneute Pflichtfeldschleife. |
| 02–03 | Weiter prüft tatsächliche offene Angaben, öffnet den richtigen Abschnitt und fokussiert das konkrete Feld. Erfolgreich gespeichertes HTF führt zum bestehenden Trade-Flow. Bestehende Sessions und lokale Entwürfe bleiben verwendbar. |
| 04 | Kein Playbook-Pflichtfeld im HTF. Eine optionale Marktthese bleibt möglich. Aktive Playbook-Setups werden im Trade-Schritt dargestellt und sind dort auswählbar. |
| 05 | Alle acht Vorbereitungsbewertungen sichtbar und verpflichtend. Unberührte Slider-Standardwerte zählen nicht. Jeder auffällige Faktor benötigt eine eigene Bestätigung; Änderungen entwerten die passende Bestätigung. |
| 06 | Acht kurze Übungen wechseln minütlich. Pausenstart und Ende werden gespeichert, damit Countdown und Übung nach Reload stimmen. Freiwilliger Abbruch bleibt möglich. |
| 07 | Beide Geldgrenzen optional. Gesamt summiert dokumentierte Kontoausführungen; pro Konto gilt derselbe Betrag für jedes Konto separat. Keine Einzelkontoauswahl in diesem Schritt. |
| 08 | Geldgrenzen verwenden nur finale Kontoergebnisse mit ausdrücklich dokumentierten Gebühren. Fehlende Ergebnisse bleiben unbekannt. Exit-Grund und sechs Emotionen können ohne P&L gespeichert werden; Kontoergebnisse werden später atomar ergänzt. Keine vorhandene ATAS-Anbindung behauptet. |
| 09 | Erreichte Zeit-/Geldgrenzen erzeugen schließbare Vollbildhinweise. Kontohinweise nennen Konto, Netto und Grenze. Copy-Ausführungen werden je Allocation-ID einmal gezählt. Keine Dokumentationssperre. |
| 10–11 | Eine primäre Weiter-Aktion; keine sichtbare alternative Endzeiteingabe, keine Setup-Auswahl im HTF. Instrument, SL und Kontrakte ausdrücklich als Session-Standards beschriftet; Trade-Abweichungen bleiben separat. |
| 12 | Kalender im News-Schritt, Standard heute, ein Zeitraum-Umschalter für heute/7 Kalendertage, keine willkürliche Zeilenbegrenzung. Relevanz wird direkt per Checkbox festgehalten. Tagesprüfung ist Pflicht. BLS/BEA automatisch, FOMC und ISM-PMI als separat gekennzeichneter, manuell geprüfter Terminstand. |
| 13–14 | Schrittüberschriften und HTF-Gruppen unterscheiden erledigt/offen anhand echter Validierung. Extrempunkte, Zonen und Optionslevels ausdrücklich als Chart-Markierung bestätigen; bei fehlenden Daten ist eine begründete Ausnahme möglich. Alte Bewertungen bleiben historisch lesbar und werden bei neuer Bestätigung erneut geprüft. |
| 15 | Separate Anleitung `V8_08_SECOND_USER.md`. Kein zusätzlicher echter Benutzer angelegt, keine Einladungs-E-Mail versandt. |

## Kalenderabdeckung und verbleibende Abweichung

`data/macro-reviewed.json` enthält den am 15.11.2026 anhand der Primärquellen geprüften ISM-PMI-Jahresplan 2026 und die verbleibenden FOMC-Termine für November/Dezember 2026. Dieser Stand wird in die bestehende Pipeline aufgenommen, aber niemals als erfolgreicher automatischer Fed-/ISM-Abruf ausgegeben. Der letzte manuelle Prüfzeitpunkt bleibt erhalten. BLS/BEA werden weiterhin etwa alle sechs Stunden abgerufen; ausgefallene Quellen behalten ihren alten Zeitstempel und werden als ausgefallen markiert.

Eine vollständige automatische Fed-/ISM-Integration ist **nicht** abgeschlossen. Direkter Fed-Abruf lieferte hier HTTP 403. Es gibt keinen ISM-Scraper und keine Umgehung von Quellenbeschränkungen. Nicht abgedeckt: Fed-Reden, ISM-Prognoseberichte, weitere Kalenderanbieter, ungeplante Ereignisse, Prognosen und Istwerte. Die Oberfläche benennt diese Grenzen und gibt bei einem leeren Kalender keine Entwarnung. Alle im jeweiligen Datenstand verfügbaren Termine des Zeitraums werden gelistet.

Primärquellen:
- https://www.bls.gov/schedule/
- https://www.bea.gov/news/schedule
- https://www.federalreserve.gov/monetarypolicy/fomccalendars.htm
- https://www.federalreserve.gov/newsevents/2026-november.htm
- https://www.federalreserve.gov/newsevents/2026-december.htm
- https://www.ismworld.org/supply-management-news-and-reports/reports/rob-report-calendar/

## Datenbankänderung und Rollout

`db/v8_08_preparation.sql` ist eine separate, noch nicht produktiv ausgeführte Migration:

- Neue V808-HTF-RPC statt Änderung der bisherigen V803-RPC. Eigentümerprüfung, Session-Sperre, optimistischer Kontextvergleich, Wiederholschutz und Bildzuordnung bleiben erhalten. Acht Bewertungen, individuelle Warnbestätigungen, Dauer, Geldgrenzen und Chart-Arbeit werden serverseitig geprüft.
- Zwei neue SECURITY INVOKER RPCs für einen Exit mit unbekanntem Ergebnis und die spätere Vervollständigung. Bestehende RLS und Berechtigungen gelten. Ursprüngliches Risiko bleibt unverändert.
- `trades_check1` erhält eine enge Ausnahme für ausdrücklich als `results_pending_v808` gespeicherte Exits. Sonstige abgeschlossene Trades benötigen weiterhin Exit-Grund und P&L. Es wird kein bestehender Datensatz umgeschrieben.
- V7-Dateien, V7-Assets, Auth-Konfiguration, RLS, Storage-Regeln und bestehende RPC-Definitionen bleiben unverändert.

Produktionsreihenfolge: verfügbares Datenbackup bestätigen → Migration als eine Transaktion anwenden → SQL-Prüfung ausführen → Frontend nach grüner CI veröffentlichen → Version und Deployment prüfen. Bei Rücknahme zuerst zurück auf den vorherigen Frontendstand; neue Pending-Exits vor Wiederherstellung der alten Constraint vollständig abschließen. Kein blindes Löschen von Nutzerdaten und kein ungeprüfter Constraint-Rollback.

Der angefragte Export eines Datenbackups wurde von der automatischen Freigabeprüfung abgelehnt, weil vollständige private Handelsdaten übertragen würden. Es wurde kein Datenbackup erstellt, kein Produktions-Rollout vorgenommen und keine Migration dauerhaft angewandt.

## Verifikation und Grenzen

- Ausgangsstand: 174 Node-Tests erfolgreich.
- V808: 184/184 Node-Tests, 99/99 gemeinsame V8-Geschäftsregressionen (vier bestehende reine V7-UI-Verträge übersprungen), 14/14 Python-Tests, Build und Integritätsprüfung erfolgreich; keine Produktionsabhängigkeitslücken. GitHub-CI für Commit `65c6d8d`: `verify` und `browser-v808` erfolgreich, Run https://github.com/TradingTerminator/trading-terminator-5000/actions/runs/43756013818 .
- `tests/v8-08.test.cjs`: 90 Minuten, Altendzeit, abgelaufener Zeitanker/Reload, konkrete Pflichtfeldnavigation, vollständige Emotionen, HTF ohne Setup, echte Trade-Setup-Auswahl, Chart-Ausnahme, wechselnde Pausenübungen, optionale Geldgrenzen, Kontosemantik, Copy-Deduplizierung, fehlende Gebühren, vollständige Kalenderliste, Tageswechsel, schneller Exit und spätere Ergebnisse.
- `tests/sql/verify_v808.sql`: zwei neue synthetische Identitäten und synthetische Datensätze, ausschließlich in einer Transaktion mit anschließendem ROLLBACK. Prüft Speicherung/Wiederholung, Dauer, Emotionen, Chart-Ausnahme, fremde Bilder, Nutzertrennung, fremde RPCs, unbekanntes P&L, spätere Gebühren/Ergebnisse und erhaltenes Initialrisiko. Keine echten privaten Datensätze werden für Tests verändert.
- Echter Chromium-Test in GitHub-CI erfolgreich: Desktop 1440×1000 und iPhone-Viewport 390×844. Durchlauf: neue Vorbereitung mit 90 Minuten → Konten → Reload mit erhaltenen Eingaben → HTF → Setup/Idee → gespeicherter Entry → SL-Verwaltungsansicht → Exit mit sechs Emotionen und unbekanntem P&L → Ergebnisergänzung einschließlich ausdrücklicher Nullgebühren → abgeschlossenes Review → freiwillige Pause. Initialrisiko unverändert, keine JavaScript-Fehler, kein horizontales Überlaufen beim Entry. Supabase-Antworten sind für diesen Browserlauf synthetisch; echte SQL-Prüfung separat. Native iPhone-Zwischenablage und Safari auf echter Hardware bleiben ungeprüft. Der lokale Chromium-Start war gesperrt; der Test wurde erfolgreich in CI ausgeführt.
- Reale Anmeldung/Einladung zweier Testbenutzer und Storage-Übertragung zwischen zwei echten Sitzungen wurden nicht durchgeführt. Synthetische SQL-Eigentümerprüfungen und bestehende lokale Workspace-Isolation ersetzen diesen Praxistest nicht.
