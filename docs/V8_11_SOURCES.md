# V8.11 · Quellen- und Fachprüfung

Geprüft am 17.11.2026 anhand offizieller Anbieterinformationen; Kalender und LTF-Fachbegriffe durch zwei unabhängige Suchläufe mit Prüfung der Originalseiten abgeglichen.

## Kalender

- Forex Factory: https://www.forexfactory.com/notices?fr=1 — Kalenderinhalte dürfen ohne schriftliche Erlaubnis nicht kopiert/weiterverteilt werden. Eine allgemeine Erlaubnis für unser Produkt oder dessen Einbettung ist nicht nachgewiesen. Kein Scraping, kein fremdes iframe.
- Trading Economics: https://tradingeconomics.com/calendar/widget sowie https://tradingeconomics.com/terms.aspx und https://tradingeconomics.com/api/pricing.aspx — offizielle Widgets/API existieren; Nutzungsumfang und Redistribution hängen vom Vertrag ab. Kein kostenpflichtiger Vertrag oder Rechteumfang wird unterstellt.
- Umgesetzter zulässiger Fallback: direkte Links zu den Originalkalendern, kompakte manuelle Eingabe und vorhandene BLS/BEA-Teilquellen. Die Oberfläche nennt die Lücken. Keine neuen externen Skripte, Cookies oder iframe-Anbieter; CSP nicht dafür erweitert.

## LTF-Semantik

- ATAS Cluster Statistics: https://help.atas.net/en/support/solutions/articles/72000602624 — Delta als Ask minus Bid; im TT ausdrücklich auf die betrachtete Kerze bezogen.
- ATAS Cumulative Delta: https://help.atas.net/en/support/solutions/articles/72000602360 — kumulierter aggressiver Kauf-/Verkaufsfluss; Session/Zeitraum muss angegeben werden.
- ATAS Volume Profile / TPO: https://help.atas.net/en/support/solutions/articles/72000602305-volume-profile-tpo — TT verwendet Volumen-POC; Bezug und Zeitraum werden zusammen mit VWAP dokumentiert.
- Aggression (Market-Fluss) und passive Reaktion werden separat erfasst. Beobachtete Absorption behauptet keine sichere Umkehr. Stopping/Topping sind eine Selbsteinordnung des beobachteten Volumens und erzeugen keine automatische Long-/Short-Bewertung.
- Lage zum VWAP/VPOC ist eine Ortsrelation, kein Entry-Signal. Liquidität ober-/unterhalb ist eine Beobachtung, keine verlässliche Aussage über künftig verfügbare Ausführung.
- Alle Merkmale unterscheiden neutral, unklar, keines beobachtet, nicht geprüft, nicht verfügbar. Kein Pflichtwert wird aus anderen Feldern erfunden. Vollständige Analyse braucht bewusste Merkmalsauswahl; bei fehlender Analyse bleibt die echte Dokumentation über expliziten Verzicht möglich.
- Ohne spezifische, geprüfte Playbook-Regel werden keine erfundenen setupspezifischen LTF-Pflichtsignale definiert. Die vorhandenen Playbook-Regeln bleiben sichtbar. LTF-Auswertung verknüpft vorhandene Fälle/Emotionen/Review und finale Netto-R; Stichprobe, Chart-Bezug und fehlende Ergebnisse bleiben erkennbar. Keine Kausalitätsbehauptung, kein neuer Qualitätsscore.
