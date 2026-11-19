# TradingTerminator V8.12 · Reparaturversion

Ausgangsversion V8.11. Ausschließlich Reparatur von Fußleiste, neutraler Initialisierung und Fortschrittsanzeige. V7 unverändert.

## Tatsächliche Ursachen

Die auf 1180 px begrenzte Fußleiste erbte weiterhin seitliche Innenabstände aus der vollständigen Fensterbreite. Auf einem 3840-px-Bildschirm ergab das rund 1406 px Abstand je Seite innerhalb eines wesentlich schmaleren Containers. Die verbleibende Fläche für Buttons kollabierte; allgemeines `overflow-wrap:anywhere` brach Beschriftungen bis auf einzelne Buchstaben um. Frühere Tests bis 1440 px erfassten diesen Fehler nicht. Die neue Zoom-Abnahme fand zusätzlich starre Mindestspalten der oberen Navigation; auch diese verwenden jetzt verfügbare Containerbreite und kontrollierten Zeilenwechsel.

„Wo steht der Markt?“ hat optionale Bilder. Eine leere Pflichtfeldliste wurde als bereits abgeschlossener Schritt behandelt. Die Logik unterschied nicht zwischen „keine blockierende Pflichtangabe“ und „bewusst bearbeitet“. Zusätzlich wurde der temporäre Bildspeicher nicht vollständig an jeder Session-Grenze geleert.

## Reparatur

- Eine gemeinsame Fußleiste mit Innenabständen innerhalb ihres Containers, ausreichenden Buttonbreiten, kontrolliertem Wortumbruch und eindeutiger primärer Aktion. Kein individueller Button-Patch.
- Die tatsächlich gemessene Footerhöhe reserviert Platz im Dokument. Sie reagiert auf Ansichten, Schrift, Zoom, Umbruch und Safe-Area; letzte Inhalte bleiben erreichbar.
- Ein optionaler Abschnitt bleibt ohne Bearbeitung offen. Ein gespeichertes Bild oder bewusstes Weitergehen aus dem Marktüberblick zählt als Bearbeitung; es entsteht kein zusätzlicher Pflichtbutton.
- Eine Session-Grenze wird über Benutzer und Session-ID erkannt. Temporäre Bewertungen, Bestätigungen und ausgewählte, noch ungespeicherte Bilder werden verworfen. Dauerhafte Standards und vorhandene gespeicherte Session-Pläne bleiben erhalten.
- Entwürfe werden nur für denselben Benutzer und dieselbe Session wiederhergestellt. Alte Entwürfe ohne Session-Zuordnung werden beim Beginn einer neuen Session nicht als verlässliche neue Entscheidungen übernommen.
- Die bewusste Bearbeitung des Marktüberblicks wird beim regulären Bestätigen im bestehenden Session-Snapshot gespeichert. Dafür ist keine neue Datenbankmigration notwendig. Noch unbestätigte lokale Entwürfe bleiben gerätebezogen; bestätigte Pläne sind über Supabase verfügbar.

## Installation und Download

Das vollständige ZIP enthält die fertige `v8.html`, Assets, Quellcode, bestehende Migrationen, Tests und Dokumentation. Bei bestehender V8.11 ist keine weitere Migration nötig. Statische Dateien zusammen veröffentlichen; keine einzelnen Assets mischen. Bei Neuinstallation die bisherige chronologische SQL-Kette bis V8.11 verwenden. Keine Test-Bootstraps in Produktion ausführen.

Abnahme: [V8_12_ACCEPTANCE.md](V8_12_ACCEPTANCE.md). Die ausgelieferte Version wird erst nach grünen automatisierten Abnahmetests veröffentlicht. Physisches iPhone und echter Kontologin auf zwei Geräten sind separat im Praxistest zu prüfen.
