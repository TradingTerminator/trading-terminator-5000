# Trading Terminator V8.13 Test

**Stand 19. November 2026 · Ausgangspunkt V8.12 auf `ff40c9c`.**

## Änderungen

| Bereich | Teststand |
|---|---|
| Navigation und Session | Die gemeinsame Fußleiste behält eine Mindestbreite bei schmalen Ansichten und Zoom. Entry-Aktionen erscheinen nur im Entry. Neue Sessions beginnen neutral. Sitzungsgebundene Entwürfe und bereits bestätigte Vorbereitungen folgen dem bestehenden Wiederherstellungsablauf. |
| Pflichtfelder | Vorbereitung, Kontenauswahl, Entry, LTF und Exit führen zur konkreten Angabe und zeigen den Fehler am Feld. Der bestehende Review-Feldsprung bleibt verfügbar. |
| Termine | Forex Factory ist direkt verlinkt. Die optionale Übersicht nutzt die bestehenden amtlichen Daten und kennzeichnet veraltete oder lückenhafte Stände. Mehrere eigene Termine und Warnfenster lassen sich speichern. |
| Sentiment | ES und NQ sind getrennt erfassbar. Yields und Bonds bilden eine Gruppe. Gegenläufiger Kontext und eigene Einordnung bleiben sichtbar. |
| Entry | Richtung, Playbook-Setup, optionale Notiz und Re-Entry-Verknüpfung. Geplanter TP und tatsächlicher Zeitpunkt bei nachträglicher Erfassung sind optional. Die Kontozeilen sind direkt editierbar. |
| LTF und Bilder | Optionale Beobachtungsgruppen, neutrale und nicht relevante Werte, gespeicherte Chartstandards sowie gemeinsamer Datei-, Drop- und Einfügeablauf. Bildvorschauen zeigen den bestätigten Speichervorgang getrennt von der Dateiauswahl. |
| Trade-Management | Kompakte Ansicht, SL je Konto oder Copy-Auswahl, Break-even und Plus-Ticks, Zeitstempel und ursprüngliche Risikobasis. |
| Exit | Zehn bewusst zu bewertende Emotionen. „Trade beendet“ speichert den Positionsabschluss und den tatsächlichen Zeitpunkt. Exit-Grund, TP-Abweichung, Ergebnis und Review folgen im Nachgang. |
| Gebühren | Hinterlegter Tarif pro Konto und Instrument. USD-Tarife werden automatisch je Seite oder Round-Turn berechnet. Bei Teilverkäufen oder Aufstockungen können die tatsächlichen Kontraktseiten erfasst werden. Korrekturen und die Tarifbasis werden zusammen mit dem Ergebnis gespeichert. |
| Auswertung | Fallzahlen nach Setup und LTF-Kombination, Exit-Emotionen im Verhältnis zur Ausführungsqualität, SL-Anpassungen und Folge-Trade. Brutto, Netto und R werden nur mit den jeweils vorhandenen Grundlagen ausgewiesen. |

Forex Factory untersagt die Weiterveröffentlichung seiner Kalenderzusammenstellung ohne schriftliche Einwilligung. Dieser Stand übernimmt keine Feed-Daten von Forex Factory. Istwert, Prognose, Vorwert und Anbieter-Impact stehen in der amtlichen Teilübersicht nicht zur Verfügung. [Forex Factory – Notices](https://www.forexfactory.com/notices)

## Prüfergebnisse

| Prüfung | Ergebnis |
|---|---|
| Node | 233 bestanden. Enthält V7-Regressionen, Session-Zustände, Pflichtfelder, Sparse-LTF und gemischten Intermarket-Kontext. |
| Übertragene V8-Regressionen | 99 bestanden, 4 V7-spezifische Oberflächenprüfungen im V8-Lauf übersprungen. |
| Python | 17 bestanden. Backup- und Kalenderprüfung. |
| Build | Versionskennzeichnung, Syntax, CSP, Skriptintegrität, Redirects und Asset-Prüfsummen bestanden. |
| Footer | 630 Chromium-Kombinationen auf 320–3.840 px, sechs Themes, zwei Textgrößen, zwei Layouts und Zoom bis 200 %. Safe-Area simuliert. Der V8.11-Fehler wurde bei 3.840 px reproduziert. |
| Entry und Exit | In Chromium bei 320, 390 und 1.440 px mit simuliertem Backend geprüft. PNG-Einfügen und Vorschau, 900 USD gemischtes Initialrisiko, SL auf BE, Abschluss mit zehn Emotionen und getrennte Nachdokumentation. |
| Datenbank | Isolierte PostgreSQL-kompatible PGlite-Instanz. Migrationen und V8.10–V8.13-Prüfskripte bestanden. Unter anderem Tarif-Snapshot, tatsächliche Kontraktseiten, Retry und Benutzertrennung. |
| Produktionsumgebung | Keine V8.13-Migration und kein V8.13-Deployment. Produktive Konten und Trading-Daten waren an diesen Tests nicht beteiligt. |

## Offene Abnahme

- Physisches iPhone, echte Zwischenablage in Safari, Auth und private Originaldateien über zwei angemeldete Geräte sowie Tests unter Netzunterbrechung an einem echten isolierten Supabase-Backend.
- Noch nicht abgeschickte Entry-Entwürfe werden lokal wiederhergestellt. Gespeicherte Session- und Trade-Datensätze sind für die Datenbank-Synchronisation vorgesehen. Diese Abnahme bestätigt keine geräteübergreifende Zusammenführung gleichzeitiger Entwurfsänderungen.
- Der Zielwert von 15–30 Sekunden gilt erst nach einem gemessenen Praxistest. Die Browser-Automatisierung misst keine reale Dokumentationszeit.
- Bei Fremdwährungstarifen fehlt eine verifizierte Umrechnungsbasis. Für das USD-Journal ist der tatsächlich abgerechnete USD-Betrag zu ergänzen. Tarifwerte ohne USD-Betrag erscheinen als offen.
- Mehrere feste Gültigkeitsstände pro Konto und Instrument lassen sich aktuell nur über die gespeicherten Entry-Snapshots nachvollziehen. In den Kontostammdaten gibt es einen editierbaren Satz je Instrument.
- Pflichtfeldführung im Altbestand außerhalb der getesteten Handelsabläufe sowie serverseitige Screenshot-Synchronisation sind noch nicht vollständig abgenommen. Die Version ist für den Praxistest vorgesehen.

## Praxistest

1. `TradingTerminator-V8.13-Praxistest.html` im Browser öffnen und **Trade vorbereiten** wählen. Die Demo startet mit zwei Beispielkonten und vorbereiteter Beispielsitzung.
2. **Trade bereits ausgeführt** wählen. Richtung **Long** und Setup **Momentum** wählen. LTF bewusst prüfen oder überspringen. Ein beliebiges PNG einfügen, speichern und Vorschau öffnen.
3. Beide Konten prüfen. Entry speichern. Bei einer SL-Änderung **Break-even** auswählen und einen Grund setzen.
4. **Trade beendet** öffnen, alle zehn Skalen bewerten und den gleichnamigen Button drücken. Der Trade muss danach **Dokumentation offen** anzeigen.
5. Exit-Grund auswählen und auf beiden Konten je **50 USD brutto** eintragen. Die Beispielsätze ergeben **4,00 USD** und **4,50 USD** Gebühren sowie **91,50 USD** netto gesamt. Nachdokumentation abschließen und den Review öffnen.

Die HTML-Demo speichert Testdaten nur in der geöffneten Registerkarte und verwendet keinen externen Server.

## Isolierten Datenbanktest vorbereiten

`db/v8_13_workflow.sql` auf einem isolierten, bereits bis V8.12 migrierten Projekt ausführen. Der Build verwendet standardmäßig lokalen Supabase-Zugriff. Für ein separates HTTPS-Testprojekt `TT_TEST_SUPABASE_URL` und `TT_TEST_SUPABASE_KEY` mit dessen URL und Publishable Key setzen, dann `npm run build` ausführen und `dist` als statische Dateien gemeinsam bereitstellen. Die Produktionsadresse wird vom V8.13-Testbuild abgewiesen.

Der gesicherte Ausgangspunkt ist im Git-Verlauf unter `ff40c9c84cc8563ec55463d70be70b600f2d8ea5` nachvollziehbar. V6 und V7 liegen unverändert auf demselben Stand.
