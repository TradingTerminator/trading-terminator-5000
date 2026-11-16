# TradingTerminator V8.09
Entwicklungsauftrag: Praxistest vom 16.11.2026. V7 bleibt unverändert.

## Änderungen
- Sichtbares separates Ideenspeichern mit wiederholsicherer Anfrage-ID, eigener Entry-Aktion, Re-Entry-Bezug und Rückkehr aus dem Playbook zum bestehenden Entwurf.
- Individuelle Emotionswarnungen, extreme Risiken ohne Mittelwertverschleierung, keine unberührten Skalen als Selbstauskunft. Nachträgliche Entry-Dokumentation ausdrücklich gekennzeichnet.
- Visuelles Playbook mit Musterbildern, geprüften Lern-/Gegenbeispielen, Ursachen und Gegenmaßnahmen. Regeln und Katalog nur in Einstellungen; historische Snapshots und Bildoriginale erhalten.
- Bildausschnitte separat von fachlichen Regeln, mit Zoom und Position; Vollbildzoom unabhängig.
- Auswertung als Einstieg der Nachbereitung: ganzer paginierter Bestand, Filter, Emotionen nach Phase und vorherigem Ergebnis, Kontext-/Setup-/Zeit-/LTF-Vergleiche, konkrete Belege und offene Daten.
- Qualität und Finanzen getrennt: finale USD-Kontobuchungen mit ausdrücklichen Gebühren, ursprünglichem Risiko und Copy-Deduplizierung. Teil-Exits im finalen Kontoergebnis enthalten; keine Schätzung oder Währungsumrechnung.
- Fehler/Ursache/Gegenmaßnahme werden im Review einmal erfasst und für Playbook und Training wiederverwendet.
- Training priorisiert Häufigkeit, dokumentierte Schwere und Regelrelevanz. Nur echte Gelegenheiten zählen; keine Gelegenheit und unklar sind getrennt. Vorher/Nachher nur bei passenden dokumentierten Fällen. Bewusster Abschluss nach Belegprüfung.
- HTF-Learning nur zu ursprünglichen Kernthesen neben tatsächlichem Verlauf. Nicht eingetretene Wenn-Bedingung ist keine falsche Konsequenz. Versionierter Learning-Text, CAS und idempotente Wiederholung. HTF-Trainingsregeln mit eigener Quellenreferenz.
- Sentiment bündelt manuelle Kontextdaten und Quellen; Yields/Bonds als eine Gruppe. Risk-on/off fasst eigene Einordnungen zusammen, interpretiert rohe Öl-/Optionsdaten nicht automatisch und behauptet keine Prognose.
- Getrennte Wenn-/Dann-Szenarien, benutzerbezogene synchronisierte Vorlagen mit Konfliktprüfung; historische Session-Thesen bleiben unverändert.
- Historische Exits können fehlende Gefühle wahrheitsgemäß als unbekannt speichern, ohne erfundene Selbstauskunft.
- Safe Areas, Keyboard-Verhalten, kollisionsfreier HTF-Überblick, Konten zuerst / Technik zuletzt, unterschiedliche vollständige Farbpaletten und verdichtetes Dashboard.

## Datenbank / Rollout
Die additive Migration liegt in V8_09_MIGRATION.sql beziehungsweise db/v8_09_learning.sql. Sie erweitert Setup-Medien, Szenariovorlagen und HTF-Trainingsquellen und fügt eng begrenzte owner-geprüfte RPCs hinzu. Bestehende Trades, Regeln und Learnings werden nicht umgeschrieben. Frontend erst nach Migration veröffentlichen.
Rollback: zuerst Frontend auf V8.08. Zusätzliche Felder können bestehen bleiben. Neue Learnings und Metadaten vor einem vollständigen Schema-Rollback exportieren; keine pauschale Löschung oder Bildbereinigung.
Die historische Exit-Erfassung dokumentiert die Erfassungszeit; sie stellt keinen Broker-Zeitnachweis her.
CSP/SRI und bestehende RLS/Storage-Benutzerpfade bleiben erhalten. Frontend enthält nur Publishable-Key.
Für das spätere Angebot an weitere Nutzer bleiben die bestehenden Auth-Einstellungen und SECURITY-DEFINER-RPCs gesondert zu prüfen.

## Prüfungen und Grenzen
Die GitHub-Workflows prüfen Build, Syntax/CSP/SRI/Prüfsummen, Node-Geschäftsregressionen, Python-Checks, kontrollierte Berechnungen, SQL-Migration in isoliertem PostgreSQL 17 und Desktop-/Mobil-Chromium-Läufe.
Browser-API-Antworten sind synthetisch und Supabase-Netzwerkzugriffe dort blockiert. SQL wird zusätzlich separat geprüft. Ein emulierter iPhone-Viewport ersetzt keine echte iPhone-/Safari-/PWA-, Zwischenablage- oder Zweitnutzer-Praxisprüfung.
Kleine Stichproben werden benannt; keine Kausalität oder wissenschaftlich nachgewiesene Trainingswirksamkeit behauptet.
Fed/ISM-Kalender bleiben teilweise manuell. Keine automatische Broker- oder ATAS-Anbindung hinzugefügt.
