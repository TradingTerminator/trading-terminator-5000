# Zweiter Testbenutzer – TradingTerminator V8.08

## Tatsächlich vorhandene Anmeldung

Die Anwendung unterstützt Passwortanmeldung sowie einen E-Mail-Anmeldecode mit `signInWithOtp({options:{shouldCreateUser:false}})` und anschließender Codebestätigung. Das Anfordern eines Codes legt **keinen** neuen Benutzer an. Der Code wird an die E-Mail-Adresse des jeweiligen Benutzers gesendet. Es gibt in der Anwendung kein eigenes Passwort-Reset-Formular.

## Benutzer anlegen

1. Zuerst Freigabe und genaue eigene E-Mail-Adresse des zweiten Testers einholen. Es wurde bisher kein zusätzlicher echter Benutzer angelegt.
2. Als Projektadministrator im Supabase-Dashboard das Projekt „TradingTerminator 5000“ öffnen: Authentication → Users → Add user. Entweder einen Benutzer anlegen und ein nur ihm bekanntes Startpasswort sicher vereinbaren oder nach Freigabe die Einladungsfunktion nutzen. Einladungen senden E-Mails; nicht ohne ausdrücklichen Auftrag versenden.
3. Für die einfachste Anmeldung den Benutzer zuerst anlegen; danach öffnet er die freigegebene App-URL, trägt **seine** E-Mail ein und fordert einen neuen Anmeldecode an. Vollständigen Code in derselben App bestätigen. Das vorhandene E-Mail-Template muss `{{ .Token }}` enthalten; ein reiner Magic-Link ist kein einzutippender Code.
4. Passwortanmeldung funktioniert mit dem für diesen Benutzer gesetzten Passwort. Wird stattdessen nur OTP benutzt, ist kein Passwort erforderlich.
5. Bei verlorenem Passwort kann der Tester weiterhin den Anmeldecode verwenden, sofern er Zugriff auf sein Postfach hat. Ein Passwort-Reset über das Supabase-Dashboard benötigt einen bestätigten funktionierenden Recovery-Rückweg; die aktuelle App implementiert keinen separaten Recovery-Dialog. Deshalb keinen ungetesteten Reset-Link als fertigen App-Workflow versprechen. Für den Test zuerst OTP verwenden; eine Passwortänderung bei Bedarf über den Administrator sicher organisieren.

Offizielle Dokumentation: https://supabase.com/docs/guides/auth/auth-email-passwordless

## Sicher getrennt testen

- Zwei eigene Benutzeridentitäten, zwei getrennte Browserprofile oder Geräte. Keine gemeinsam genutzte Anmeldung.
- Auf gemeinsam genutzten Geräten „Angemeldet bleiben“ abwählen; nach dem Test abmelden.
- Jeder Tester legt eigene Konten, Sessions und ausschließlich synthetische Trades an. Benutzer B darf weder Sessions noch Trades, Screenshots, Konten, HTF-Stände, Einstellungen oder lokale Entwürfe von Benutzer A sehen.
- Fremde Trade-/Session-/Bild-IDs dürfen über direkte Anfragen und RPCs keinen Zugriff erlauben. Auch Bearbeiten und Löschen zwischen den Benutzern testen.
- Screenshots nur mit synthetischen Charts prüfen. Accountwechsel, Reload und erneute Anmeldung testen.
- Es werden keine Admin-, Secret- oder Service-Role-Schlüssel an Tester weitergegeben oder im Frontend ergänzt. Die vorhandene Client-Verbindung und RLS bleiben maßgeblich.
- Testdaten nach erfolgreichem Test nur im jeweiligen Testkonto gezielt entfernen. Keine echten Handelsdaten für einen Test löschen.

## Bereits geprüft / noch offen

SQL-Prüfungen mit zwei synthetischen, anschließend zurückgerollten Identitäten sind enthalten. Der vollständige Praxistest mit zwei echten Anmeldungen und hochgeladenen Bildern ist noch offen und benötigt die freigegebenen Testeradressen.
