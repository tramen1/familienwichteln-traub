# Familienwichteln Traub – Weihnachten 2026

Eine kleine responsive Web-App mit serverseitiger Auslosung und persönlichen Geheimlinks.

## Enthaltene Regeln
- Teilnehmende: Papa Traub, Mama Traub, Ingrid Eberhard, Bruno Traub, Rebecca Traub, Christin Traub, Daniel Traub.
- Niemand zieht sich selbst.
- Paare sind gegenseitig ausgeschlossen: Papa/Mama, Bruno/Rebecca, Christin/Daniel.
- Ingrid Eberhard hat keinen Partner-Ausschluss.
- Jeder Geheimlink zeigt nur die eigene Ziehung.
- Die Verwaltung ist durch `ADMIN_PASSWORD` geschützt.

## Lokal testen
Benötigt Node.js 20 oder neuer.

1. Kopiere `.env.example` zu `.env` und setze ein starkes Admin-Passwort.
2. Installiere Abhängigkeiten: `npm install`
3. Starte: `ADMIN_PASSWORD='dein-langes-passwort' npm start`
4. Öffne `http://localhost:3000` und dann `/admin`.

Die Admin-Seite ist lokal nur zum Testen. `PUBLIC_URL` muss beim Online-Betrieb auf die echte HTTPS-Adresse zeigen.

## Online veröffentlichen
Dieses Paket ist der Quellcode; es ist **noch nicht öffentlich im Internet veröffentlicht**. Dafür brauchst du einen Hosting-Anbieter, der Node.js ausführen kann und dauerhaften privaten Speicher unterstützt.

- Lade diese Dateien in ein privates Git-Repository oder direkt beim Hosting-Anbieter hoch.
- Setze `ADMIN_PASSWORD` als geheime Umgebungsvariable (lang und zufällig).
- Setze `PUBLIC_URL` auf die HTTPS-Adresse deiner App.
- Konfiguriere `DATA_FILE` auf einen dauerhaften Speicherpfad, wenn der Anbieter flüchtige Dateisysteme nutzt.
- Aktiviere HTTPS und schütze das Admin-Passwort.
- Führe zuerst einen Testlauf mit erfundenen Namen durch, bevor du die echte Ziehung machst.

## Datenschutz & wichtige Hinweise
- Die Zuordnungen werden serverseitig gespeichert und nicht an die öffentliche Startseite ausgeliefert.
- Ein Geheimlink ist wie ein Schlüssel: Wer ihn erhält, kann die Ziehung dieser Person sehen. Teile Links nur privat und nicht in Familiengruppen.
- Die Admin-Seite zeigt die Liste der persönlichen Links. Die organisierende Person sollte daher die Links nicht öffnen, wenn sie die Ziehungen ebenfalls geheim halten möchte.
- Die Daten liegen in `data.json`. Sichere diesen Speicher und beschränke den Zugriff darauf.
- Setze die Ziehung nicht zurück, nachdem Links verschickt wurden, außer du willst alle Links ungültig machen.
- Für eine echte Nutzung sollten Hosting und dauerhafte Speicherung korrekt eingerichtet sein. Dieses Projekt führt selbst kein Hosting durch und verschickt keine WhatsApp-Nachrichten automatisch.
