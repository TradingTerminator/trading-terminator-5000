# Freigabeprotokoll V8.14.1

Basis ist die veröffentlichte V8.14. Die Änderungen betreffen ausschließlich V8. Der initiale Prüfstand war 5d93eb78483e168b9e351ef3c3492b65730c9023. Die Freigabeprüfung läuft für jeden nachfolgenden Commit erneut.

| Auftrag | Umsetzung und Prüfung |
|---|---|
| Notion-Import | Zehn eindeutige Quellen im privaten Konto. Alle sind als Testdaten gekennzeichnet und nicht freigegeben. Keine Referenzbilder oder individuellen Setup-Regeln waren in den zehn Vorlagen hinterlegt. |
| Karten | Playbook und Setup-Auswahl zeigen die Vorlagen mit Status, fehlenden Angaben, Checkliste und verknüpften Fällen. Eine visuelle Abnahme mit den zehn importierten Datensätzen auf einem physischen iPhone steht aus. |
| Testdaten entfernen | Eigene Tabelle mit Eigentümerprüfung. Die Löschung vergleicht die Vorschau-IDs mit dem aktuellen Bestand. PostgreSQL-Test mit eigenem Setup, Trade und zweitem Benutzer bestanden. |
| Vollständiger Neustart | Zwei Dialoge, manuelle Phrase, wiederholbare Löschanforderung, Storage-Bereinigung, Prüfung des Restbestands und transaktionale Bereinigung. Anmeldung bleibt erhalten. |
| Synchronisation | Test mit zwei authentifizierten Sitzungen und echtem Storage einer isolierten Supabase-Instanz bestanden. Alte Schreibversuche und veraltete Uploads wurden abgewiesen. Neue Daten ließen sich in der neuen Generation anlegen. |
| Bedienbarkeit | Chromium und emuliertes iPhone in WebKit bestanden. Die zweite Schaltfläche blieb bei falschem Text deaktiviert, auch bei einem zusätzlichen Leerzeichen. Abbruch vor Ausführung geprüft. |
| Regression | GitHub Actions Verify release, Lauf 44920292461. Alle fünf Jobs erfolgreich einschließlich PostgreSQL, Chromium, WebKit und Auth/Storage. |
| Produktive Datenbank | Am 22.11.2026 wurden die Abschlussfunktion und die Testdatenbereinigung installiert. Die Rechteprüfung bestätigte sieben Funktionen mit Ausführungsrecht für angemeldete Nutzer und ohne anonymes Ausführungsrecht. Zehn Testvorlagen lagen vor. Es wurde kein produktiver Reset ausgelöst. |

Der Löschabschluss verwendet für jede der 29 Tabellen eine explizite, auf den aktuellen Nutzer eingeschränkte DELETE-Anweisung. Eine abschließende Prüfung auf verbliebene Datensätze gehört zur gleichen Transaktion. Die konkrete Aufbewahrungsfrist externer Backups wurde nicht geprüft. Die Abnahme auf einem physischen iPhone und Windows-PC ist offen.
