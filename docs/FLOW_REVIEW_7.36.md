# V7.36 – Rückmeldung aus dem iPhone-Praxistest

## Behobener Ablauf

Session-Konten sind nur verfügbare Konten. Keine Leader-/Follower-Auswahl, Mengen- oder SL-Pflicht beim Sessionstart. Pro Trade ohne Copy-Modus genau ein Konto; mehrere unabhängige Trades können dieselbe Session verwenden. Copy-Modus benötigt mindestens zwei beteiligte Konten und ein Quellkonto. Mengen und SL gelten je Trade/Konto. Ein Copy-Trade bleibt eine Entscheidung mit mehreren Kontozuordnungen.

Session-Vorbereitung und Tradeformular werden nacheinander angezeigt. Nach der Vorbereitung führt eine einzige Weiter-Aktion zum Trade. Reihenfolge: Setup, Richtung/Markt, Idee, Konto/Copy und Initialrisiko, Verfassung, Entry. Die redundante Neuer-Trade-Unteraktion entfällt. Fehlendes Setup fokussiert die sichtbare Setupauswahl.

Neue Ideen werden mit dem Entry in einer Datenbanktransaktion angelegt; Vormerken ist optional und aufklappbar. Die Metadaten unterscheiden eine mit dem Entry erfasste von einer zuvor gespeicherten Idee. Re-Entry wählt eine bereits gespeicherte Idee und übernimmt Setup, Richtung und Markt. Die bestehenden Warnungen für wiederholte Versuche bleiben erhalten. Spontane Trades bleiben dokumentierbar.

## Ansicht und Entwürfe

Eine erneute erfolgreiche Anmeldeprüfung desselben Benutzers baut die geladene App nicht neu auf. Benutzerwechsel und Abmeldung leeren weiterhin private Daten. Zusätzlich benutzergebundener lokaler Arbeitsstand mit aktiver Ansicht, Scrollposition, aufgeklappten Details, Session-/Entry-Eingaben und Request-ID. Cold-Reload-Wiederherstellung nur für dieselbe Session; maximal 24 Stunden. Bei „Angemeldet bleiben“ localStorage, sonst sessionStorage. Das ist eine lokale Wiederaufnahme, keine Synchronisierung ungespeicherter Entwürfe zwischen Geräten. SL-Eingaben bleiben beim erneuten Rendern und Konto-Umschalten erhalten und werden mit dem Entry atomar gespeichert.

## Verfassung und HTF

Zwei primäre Session-Skalen: Fokus und innere Anspannung, jeweils 1–10. Müdigkeit und Handelsdrang optional aufklappbar. Entry, während des Trades und Exit verwenden ebenfalls getrennte Intensitätsskalen; zunächst ausdrücklich nicht bewertet. Keine erfundenen Zahlen aus alten kategorialen Daten und keine automatische Gleichsetzung von niedriger Emotion mit guter Ausführung. Zahlenwerte beim Entry und Exit werden zusammen mit dem jeweiligen Vorgang gespeichert.

Vier HTF-Zeilen verbinden Prüf-Haken mit jeweils einem Notizfeld: Struktur/Extrempunkte; Zonen/Liquidität/Volumen; News/Makro; Tagesrisiko/Trade-Limit. Vorhandener Freitext bleibt erhalten.

## Validierung und Grenzen

51 Node-/DOM-/Gatewaytests sowie 6 Python-Archivtests bestanden. Neun neue Tests betreffen Kontenmodell, SL-Erhaltung, Auth-Wiederprüfung, Wiederaufnahme, gezielte Ideenvalidierung, atomaren Entry-Payload, Skalen/Exit-Entwurf und tatsächliche Formularreihenfolge sowie die Wiederaufnahme ausgefüllter Re-Entry-Warnfragen. 11 zusätzliche Datenbank-Prüffälle mit Rollback bestanden: neue Idee/Entry/Risiko, Retry, getrennte Konten, Copy-Zuordnungen/Risikosumme, unzulässige Mehrkonten-Einzeltrades, abweichender Retry, unveränderliche Entry-Bewertung, Zahlenvalidierung, Exit und Bewertungen, laufende Bewertungen sowie Fremdzugriff.

Migration `entry_flow_and_emotion_scales_v736` additiv angewendet. Bestehende APIs bleiben während des Rollouts kompatibel. Keine neue SECURITY-DEFINER-Funktion; neue Endpunkte verwenden RLS und die bereits geprüfte Erfassungsfunktion.

Die Tests sind keine Abnahme am echten iPhone. Safari-Appwechsel, Tastatur/Scrollen, Touchbedienung und der angemeldete vollständige Ablauf bleiben mit dem Nutzer nach Veröffentlichung zu prüfen. Es werden keine Brokerorders gesendet. Die separaten offenen Punkte aus V7.35 (Restore, Header-Gateway, Passwortschutz, Branch-Schutz) werden hier nicht als erledigt erklärt.
