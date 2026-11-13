# Trading Terminator 7.41 – geführter Ablauf

Stand: 13. November 2026. Umsetzung des mobilen Praxistests.

## Ablauf

1. **Session vorbereiten:** Konten wählen, Instrument, ganze Kontrakte und Standard-SL pro Konto festlegen, HTF-Kontext erfassen. Kontenverwaltung direkt erreichbar.
2. **Vor dem Trade:** eigenes Setup wählen, dessen Kriterien prüfen; These, Trigger, Ziel und Invalidation mit vorhandenen Setup-Regeln vorbereiten. Wahlweise nur Idee speichern oder eine vorhandene Idee handeln. Fehlende Kerndaten werden gezielt angezeigt.
3. **Konto und Risiko:** Session-Vorgaben übernehmen; Änderungen ausdrücklich freischalten. Gesamtbetrag vor dem Entry sichtbar. Copy-Trades bleiben eine Entscheidung.
4. **Verfassung und Entry:** ausdrücklich bewertete Skalen; Hinweise auf alle relevanten Belastungssignale. Keine neue Handelssperre. Nach erfolgreichem Speichern am Anfang der zugehörigen Trade-Ansicht landen.
5. **Trade begleiten / Exit:** initiales Risiko unverändert; SL-Änderungen separat protokollieren. Exit und dessen ausdrücklich bewertete Verfassung gemeinsam speichern.
6. **Review:** Charts und tatsächliche LTF-Beobachtungen vor Bewertung und Training. LTF-Speicherung abwarten, neue Bilder sichern, danach Review speichern. Fehler werden einzeln erfasst; endgültiges Speichern bleibt am Ende. Unvollständige Reviews bleiben als solche erkennbar.
7. **Lernen:** Playbook als eigener Hauptbereich mit Suche, fünf eigenen Setup-Regeln, Referenzbild und verknüpften Trades/Lernbeispielen. Training hervorgehoben, aktive Regel präzisierbar, historische Regeln erhalten.

## Weitere Änderungen

- Dauerhafte Trade-Nummer pro Session, serverseitig vergeben; bestehende Trades chronologisch nummeriert.
- Historische Sessions und nach tatsächlicher Session gruppierte offene Reviews.
- Kontenverwaltung unter Einstellungen; Design zuerst, technische Funktionen gebündelt. Zusätzliche Farbschemata, Schriftgröße, Form und Bewegung.
- Kein permanenter globaler Statuskasten. Hinweise bei der zugehörigen Aktion, zusätzlicher Knopf nach oben.
- HTF-Textfelder volle Breite; Bildbereiche mit explizitem mobilen Einfügeziel. Ein echter iPhone-/Safari-Test von Zwischenablage und Tastatur bleibt erforderlich.
- Session-Kontoänderungen werden serverseitig mit Vorher/Nachher und Zeit erfasst. Deaktivierung eines Kontos erhält bestehende Trades.
- Berechnung bleibt unverändert: 580 MNQ × −800 Ticks × 0,50 USD = −232.000 USD. Große Mengen werden nicht stillschweigend als Dollar oder Punkte interpretiert.

## Daten und Sicherheit

`sql/guided_flow_v741.sql` wurde angewendet. Die transaktionale Prüfung `sql/verify_guided_flow_v741.sql` wurde mit 19 erfolgreichen Prüfungen vollständig zurückgerollt. Neue Funktionen sind SECURITY INVOKER, bestehende RLS-Grenzen bleiben bestehen. Konto-Historie und Trade-Nummern können nicht durch den normalen Client umgeschrieben werden. Trainingsrevisionen sind idempotent und vergleichen die erwartete aktive Regel.

Die zusätzliche Migration für eine unveränderliche Setup-Kopie schon beim **separaten Vormerken** einer Idee wurde abgelehnt. Sie wurde nicht angewendet; `PROPOSED_setup_snapshot_v741.sql` ist ausschließlich ein Vorschlag und keine Release-Voraussetzung. Beim **Entry** werden die Setup-Regeln im vorhandenen unveränderlichen Entry-Kontext gespeichert. Separat vorgemerkte Ideen behalten ihre ursprünglichen Planfelder, aber noch keine unabhängige Version der Setup-Regeln.

## Validierung und Grenzen

- 98 erfolgreiche Node/DOM/Gateway-Tests, acht Python-Backup-Prüfungen und bestandene Release-Integritätsprüfung.
- Browserprüfung des dreistufigen Entries, gesperrter Kontovorgaben, sichtbarem finalem Entry-Knopf und Setup-Lexikon mit synthetischen lokalen Daten. Keine echten Trades durch diesen Oberflächentest angelegt.
- Keine Behauptung eines vollständigen iPhone-, Zwei-Geräte-Konflikt- oder isolierten Wiederherstellungstests. Diese Abnahmen stehen noch aus.
- Bestehende Sicherheitsbefunde zu zwei SECURITY-DEFINER-Funktionen und deaktivierter Prüfung kompromittierter Passwörter sind nicht Teil dieser UX-Korrektur und nicht als erledigt ausgewiesen.
- Datenabfragen paginiert, mit sichtbarem Fehler statt stiller Kürzung oberhalb von 20.000 Datensätzen. Für größere Langzeitbestände ist ein serverseitiger Zeitraum-/Aggregationsausbau erforderlich.
- Keine neuen Trading-Setups erfunden, kein statistischer Wirksamkeitsnachweis aus kleinen Fallzahlen, keine Broker-Ausführung oder Kurswiedergabe hinzugefügt.
