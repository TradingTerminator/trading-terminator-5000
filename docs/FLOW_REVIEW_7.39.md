# V7.39 – gesammelte Bedienkorrekturen

## Umgesetzt

- Cockpit-Ziel heißt „Trades & Session“ statt fälschlich „Offene Trades“. Die Liste enthält laufende und geschlossene Trades. Review-Status wird separat angezeigt.
- Session-Verwaltung und Abschluss sind im Journal erreichbar. Startzeit identifiziert die Session; mehrere nacheinander gestartete Sessions am selben Tag sind vom Schema bereits erlaubt. Abschluss prüft weiterhin serverseitig offene Trades, ist unabhängig von einer Mindestanzahl und von offenen Reviews. Der bestehende Tageszähler samt Ausnahmeregel bleibt unverändert.
- Review-Checkliste verwendet dieselbe Vollständigkeitsprüfung für Liste, Reiter und Rückblick: Exit, Ausführungsqualität, Regelprüfung sowie bedingt Fehler/Gegenmaßnahmen, Ausnahmen, rückblickende Emotionsskalen und Trainingsumsetzung. Fehlende Angaben werden benannt. Fortschritt beschreibt erfasste Dokumentation, keine Qualitätsnote. Ungeprüfte Trades werden nicht als regelkonform gezählt.
- Fehler und Gegenmaßnahmen stehen direkt im Review, nur tatsächlich hinzugefügte oder gespeicherte Fehler erscheinen. Hinweis trennt Lernfehler von bestätigten Regelbrüchen; Verwerfen bleibt vor dem Speichern rückgängig machbar.
- Ein Haken wählt höchstens eine Gegenmaßnahme als nächsten Trainingsfokus. Erst explizites Review-Speichern schreibt Daten und übernimmt nach bestätigter, vollständiger Speicherung exakt die gespeicherte Maßnahme. Fokuswechsel behält seine bewusste Bestätigung. Fehler lassen die Wahl erhalten, ohne falsche Erfolgsbestätigung.
- Speicheraktionen zeigen sofort eine Prüfungsmeldung, während des Schreibens den Status und danach Erfolg oder konkrete Validierungs-/Serverfehler im sichtbaren Hinweis. Review-Feedback wird oben im Formular gespiegelt; kein erfolgreicher Save wird vor Serverbestätigung behauptet.
- Rückblick: letzte abgeschlossene Session nach Abschlusszeit (statt bloß Datum) oder Gesamt. Gesamt liest paginiert mit stabiler Sortierung. Bei mehr als 20.000 Zeilen wird die Auswertung als nicht verfügbar markiert, statt unbemerkt abgeschnittene Summen auszugeben.
- Session-/Gesamtauswertung: Review-Abdeckung, dokumentierte Fehler, Umsetzung der erfassten Trainingsregel, Erkenntnisse sowie Kontoergebnisse mit Brutto/Gebühren/Netto. Finanzwerte stammen aus finalen Kontoergebnissen; unvollständige Ergebnisse werden benannt. Brutto-P&L/Gesamtrisiko ist ausdrücklich so beschriftet; kein Wechsel der R-Formel. Analyse verwendet Netto-R konsistent für beide Kontofilter-Ebenen.
- Kontofilter sitzt direkt in der Analyse, ohne eigene Klappkarte. Auswahl wirkt auch auf dokumentierte Muster und schließt alte Drilldowns. Veraltete „Emotion = nach Plan“-Metriken entfernt: neue unabhängige Skalen sind kein Beweis regelkonformer Ausführung. Metriken nennen bewertete bzw. regelgeprüfte Bezugsmenge; ungeprüfte Trades werden nicht implizit als fehlerfrei gewertet.
- SL bei geschlossenem Trade: Schreibschutz klar benannt, Verlauf direkt offen. Die Serverfunktion sperrt Änderungen nach Exit weiterhin. Kein nachträglicher Eintrag wird als damaliges Live-Ereignis ausgegeben.
- Dokument-Scroll statt zweier vertikaler HTML/Body-Scrollflächen; Druckdarstellung ergänzt. Dies ist kein bestätigter Fix für die native iPhone-Funktion „Ganze Seite“.

## Validierung

80 Node-/DOM-/Gatewaytests und 6 Python-Archivtests bestanden. Build, Syntax, CSP, SRI und Dateihashes geprüft. Produktionsabhängigkeiten: npm audit meldet 0 bekannte Schwachstellen. Neue Tests decken Session-Ziel, Journal-Abschluss, Review-Pflichten, relevante Metrik-Nenner, einheitlichen expliziten Save samt Fokus, Fehlerreaktion, Pagination, gleiche Kalendertage, Gesamtfilter, Kontoberechnung und HTML-Escaping ab. DOM-Tests verwenden eine nachgebildete Datenanbindung; eine echte iPhone-Touch-/Tastatur-Abnahme wird nicht behauptet.

Nur lesende Serverprüfung: öffentliche Tabellen ohne RLS = 0. Eigentümerpolicies für Sessions, Trades, Kontozuordnungen und Kontoergebnisse überprüft. Es gibt keine Schema-/Policyänderung und keine Änderung historischer Nutzerdaten durch diesen Umbau.

## Offen / Entscheidung nötig

- SL-Nachträge nach Exit: separate bewusste Produktentscheidung erforderlich. Falls gewünscht, braucht es eine getrennte Kennzeichnung als retrospektive Angabe mit Erfassungszeit, ohne Änderung des eingefrorenen Initialrisikos oder Vermischung mit live protokollierten Zeiten.
- Angemeldete praktische Abnahme auf iPhone/PC einschließlich nativer Ganzseiten-Screenshots und vollständigem Ablauf bleibt offen. Keine behauptete messbare Lernsteigerung ohne spätere Praxisdaten.
- Bestehende Sicherheits-Advisories bleiben: zwei öffentlich angemeldeten Nutzern verfügbare SECURITY-DEFINER-RPCs sowie deaktivierter Schutz gegen kompromittierte Passwörter. Keine Verkaufsfreigabe. Frühere offene Restore-/Zwei-Nutzer-/Hosting-Sicherheitsprüfungen sind hierdurch nicht erledigt.
