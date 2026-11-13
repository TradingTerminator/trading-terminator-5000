# V7.40 – Idee, Teilnahme und datenbasierter Trainingsvorschlag

## Ablauf

1. Geplanter Trade: These, Trigger, Zielbereich und Invalidation festhalten. „Idee vormerken“ erlaubt weiterhin Ideen ohne Entry. Spontane Trades bleiben dokumentierbar. Die bestehende atomare Entry-API wurde abwärtskompatibel um den Zielbereich im neuen Ideenobjekt erweitert; Risiko und Emotionsskalen bleiben erhalten.
2. Analyse → Ideen & Teilnahme (auch über Journal → Ideen prüfen). Eine Idee und alle zugeordneten Versuche werden zusammen angezeigt; Copy-Ausführungen erzeugen keinen zusätzlichen Versuch.
3. Ideenverlauf: Ziel vor Invalidation erreicht / teilweise / invalidiert / nicht beurteilbar. Teilnahme separat: kein Entry / ausgestoppt / vorher ausgestiegen / mitgenommen / unklar.
4. Gründe: zu früh, zu spät, Trigger verpasst, ausgestoppt, Unsicherheit/Abbruch, Sonstiges. Mehrere Gründe sind möglich. Kurzer Textbeleg ist erforderlich, bei Sonstiges inklusive Erläuterung. Zwei konkrete Ausführungsprüfungen: Trigger abgewartet, Anfangsrisiko wie geplant. Ohne Versuch ist „kein Einstiegsversuch“ vorbelegt.
5. Abschluss speichert Selbstbewertung mit Serverzeit und Versionsvergleich. Solange zugehörige Trades offen sind, wird kein abschließendes Ideen-Review gespeichert. Die Idee wird abgeschlossen bzw. invalidiert; für eine neue These wird ein neuer Plan verwendet. Ursprüngliche Planfelder und Zielbereich bleiben unveränderlich. Ältere Ideen ohne Ziel erhalten keinen nachträglich erfundenen Zielbereich und können nicht eindeutig als „bestätigt“ eingestuft werden.

## Aussagegrenzen

„Idee bestätigt, aber nicht dabei“ ist eine Beobachtung, kein automatischer Ausführungsfehler. Die App prüft keine Marktkurse. Getrennt erfasste Ideen werden als vorgemerkt bezeichnet; gemeinsam mit dem Entry gespeicherte Ideen ausdrücklich als im Entry-Vorgang erfasst, ohne unabhängigen Vorabnachweis. Der neue Ziel-Zeitstempel entspricht dem serverseitigen Transaktionsbeginn und ist kein Brokerzeitstempel.

Die Ideenübersicht nutzt bis zu 50 zuletzt abgeschlossene Ideen-Reviews, zeigt nicht beurteilbare und offene Fälle separat und verlinkt Gründe auf genau diese Fälle. Kein hypothetischer entgangener Gewinn, keine automatische SL-Verbreiterung, keine Vermischung mit dem finanziellen Ergebnis. Ideen werden kontenübergreifend ausgewertet; der vorhandene Kontofilter betrifft die Trade-Analyse.

## Training

Automatische Rangfolge aus den letzten bis zu 50 vollständig bewerteten Trades. Je Fehlerart und Gegenmaßnahme zählt ein Trade höchstens einmal. Einzelne Fälle (weniger als zwei Treffer), gleich häufige Fehler oder gleich häufige konkurrierende Gegenmaßnahmen ergeben keinen eindeutigen Vorschlag. Zwei Treffer sind nur die Definition einer Wiederholung, keine statistische Belastbarkeitsschwelle. Nenner, geringe Fallzahlen und gespeicherte Herkunft bleiben sichtbar. Es wird eine vorhandene Gegenmaßnahme vorgeschlagen; keine Regel erfunden. Übernahme erfolgt bewusst, ein laufender Fokus wird weiterhin erst nach Bestätigung ersetzt. Beliebige neue Freitext-Ziele sind in der Oberfläche nicht mehr der primäre Weg. Die Trainings-Snapshots früherer Trades bleiben unverändert.

## Daten und Prüfungen

Additive Spalten auf der bestehenden Eigentümer-geschützten Ideentabelle; keine neue öffentlich privilegierte RPC. Neuer Trigger läuft mit Aufruferrechten, validiert Werte, schützt Ziel und Serverzeit und verhindert abschließende Reviews offener Versuche. CAS-Versionsvergleich verhindert stilles Überschreiben. Lokale Ideenentwürfe verwenden die vorhandene benutzergebundene Draft-Verwaltung; Abmelden leert Cache und Entwürfe. Backups umfassen neue Spalten automatisch; der Restore für ein separates leeres Testprojekt ergänzt bei älteren Backups ausschließlich fehlende neue Standardwerte und bewahrt vorhandene Daten. Der bisher offene vollständige separate Restore-Praxistest ist damit nicht erledigt.

Validierung: 89 Node-/DOM-/Gatewaytests, 8 Python-Archivtests. 13 neue SQL-Prüfungen und 11 bestehende Entry-/Exit-Prüfungen erfolgreich gegen die migrierte Datenbank; alle Testdatensätze zurückgerollt. Neue Fälle prüfen Ziel-Unveränderlichkeit, Serverzeit, atomaren Entry, Retry, offene Versuche, RLS, ungültige Reviews, CAS, Fallzahlen, Gleichstände, Mehrfachfehler und alte Ideen. Syntax, Release-Integrität, CSP/SRI geprüft. Echte angemeldete iPhone-/PC-Abnahme bleibt offen.

Die Sicherheits-Advisories sind gegenüber dem vorherigen Stand unverändert: zwei angemeldet erreichbare bestehende SECURITY-DEFINER-RPCs sowie deaktivierter Schutz gegen kompromittierte Passwörter. Hinweise: https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable und https://supabase.com/docs/guides/auth/password-security#password-strength-and-leaked-password-protection . Keine Verkaufs- oder vollständige Sicherheitsfreigabe.
