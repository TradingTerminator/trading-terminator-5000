# Freigabeprotokoll V8.14.1

Basis ist die veröffentlichte V8.14. Die Änderungen betreffen ausschließlich V8. Prüfstand ist der Commit 5d93eb78483e168b9e351ef3c3492b65730c9023.

| Auftrag | Umsetzung und Prüfung |
|---|---|
| Notion-Import | Zehn eindeutige Quellen im privaten Konto. Alle sind als Testdaten gekennzeichnet und nicht freigegeben. Keine Referenzbilder oder individuellen Setup-Regeln waren in den zehn Vorlagen hinterlegt. |
| Karten | Playbook und Setup-Auswahl zeigen die Vorlagen mit Status, fehlenden Angaben, Checkliste und verknüpften Fällen. Eine visuelle Abnahme mit den zehn importierten Datensätzen auf einem physischen iPhone steht aus. |
| Testdaten entfernen | Eigene Tabelle mit Eigentümerprüfung. Die Löschung vergleicht die Vorschau-IDs mit dem aktuellen Bestand. PostgreSQL-Test mit eigenem Setup, Trade und zweitem Benutzer bestanden. |
| Vollständiger Neustart | Zwei Dialoge, manuelle Phrase, wiederholbare Löschanforderung, Storage-Bereinigung, Prüfung des Restbestands und transaktionale Bereinigung. Anmeldung bleibt erhalten. |
| Synchronisation | Test mit zwei authentifizierten Sitzungen und echtem Storage einer isolierten Supabase-Instanz bestanden. Alte Schreibversuche und veraltete Uploads wurden abgewiesen. Neue Daten ließen sich in der neuen Generation anlegen. |
| Bedienbarkeit | Chromium und emuliertes iPhone in WebKit bestanden. Die zweite Schaltfläche blieb bei falschem Text deaktiviert, auch bei einem zusätzlichen Leerzeichen. Abbruch vor Ausführung geprüft. |
| Regression | GitHub Actions Verify release, Lauf 44920292461. Alle fünf Jobs erfolgreich einschließlich PostgreSQL, Chromium, WebKit und Auth/Storage. |
| Veröffentlichung | Produktiv sind Importtabelle, zehn Vorlagen, Schreibschutz für 29 Tabellen, Storage-Generationsprüfung und die gesperrten Vorbereitungsfunktionen installiert. Der Abschluss-RPC fehlt. Vollständiges Zurücksetzen ist für angemeldete Nutzer gesperrt. Bestehender App-Zugang liefert weiterhin V8.14. |

Für die kontrollierte Fortsetzung der Migration ist nur der Abschnitt ab `CREATE FUNCTION public.tt_finish_reset_v8141` bis Dateiende in `db/v8_14_1_data.sql` erforderlich. Die bereits installierten Abschnitte dürfen nicht erneut blind angewandt werden. Vor der Freigabe die RPCs, Zugriffsrechte und den Online-Stand erneut prüfen. Aufbewahrungsfristen externer Backups sind vom jeweiligen Betreiber und Tarif abhängig. Ein vollständiger Reset wurde im Produktivkonto nicht ausgelöst.
