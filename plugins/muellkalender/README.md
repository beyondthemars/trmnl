# TRMNL Müllkalender – ABK Kiel

Eigenständiges Schwarz-Weiß-Plugin für das 4,2-Zoll-E-Ink-CrowPanel. Zeigt die nächste Restmüll-, Papier-, Bio- und Gelber-Sack-Leerung, sortiert nach dem nächsten Termin. Je Zeile erscheinen Wochentag, Datum und Countdown; die nächste Abholung wird hervorgehoben.

**Keine Home-Assistant-Installation, kein eigener Server und kein Webhook erforderlich.**

## Funktionsweise

1. TRMNL pollt das ABK-Straßenverzeichnis anhand des in den Plugin-Einstellungen angegebenen Straßennamens.
2. [src/transform.js](src/transform.js) läuft als TRMNL Serverless Node.js (20) und fragt die Hausnummern, Kalender-ID und ABK-iCalendar-Datei ab. Im Dezember wird zusätzlich das Folgejahr abgefragt.
3. Das Script ermittelt jeweils den nächsten tatsächlichen Termin und gibt kompakte Variablen für [src/full.liquid](src/full.liquid) zurück.
4. Refresh alle **12 Stunden** (`refresh_interval: 720`) oder manuell per **Force Refresh**.

Der ABK veröffentlicht auch die Abholtermine der Gelben Tonnen/Säcke durch Remondis. Feiertagsverschiebungen stammen aus den offiziellen iCalendar-Einträgen. Keine Rhythmus-Schätzung.

## Import und erster Test

1. TRMNL → **Plugins → Private Plugins → Import new** öffnen und ein **flaches ZIP** aus `src/settings.yml`, `src/full.liquid`, `src/transform.js` importieren (ohne Unterordner).
2. In den Plugin-Einstellungen **Straße** und **Hausnummer** für deinen Behälterstandort eintragen. Die Werte gehören **nur in TRMNL**, nicht ins öffentliche GitHub-Repository.
3. Prüfen: Strategie = **Polling**, Serverless Language = **Node**. Die Polling-URL muss auf `abki.de/abki-services/strassennamen` zeigen und den Platzhalter `{{ street | url_encode }}` enthalten.
4. Speichern und **Force Refresh** betätigen. Unter **Edit Markup → Your Variables** sollten `bins`, `next_days` und `generated_at` erscheinen.
5. **Full**-Vorschau prüfen, dann das Plugin in die Playlist aufnehmen. Bei Problemen die **Debug Logs** in den Plugin-Einstellungen aktivieren.

### Fehlermeldungen

- `Bitte Straße und Hausnummer ...`: Beide Formfelder sind noch leer.
- `Straße nicht im ABK-Verzeichnis`: Schreibweise oder die Polling-Antwort überprüfen.
- `Hausnummer ... nicht hinterlegt`: Adresse auf der offiziellen ABK-Seite überprüfen, möglicherweise abweichender Behälterstandort.
- `Zeitlimit überschritten`: Die dreistufige ABK-Abfrage war für das 5-Sekunden-Limit von TRMNL Serverless zu langsam.
- `Kein Termin`: Für diese Fraktion enthalten die abgefragten Daten keinen künftigen Termin; nichts wird geraten.

## GitHub-Synchronisierung

Repository `beyondthemars/trmnl`, **Folder in the repository** = `plugins/muellkalender`. TRMNL liest dann Änderungen unter `plugins/muellkalender/src/` und bietet den manuellen Import an.

## Teststatus

Das Serverless-Script wurde lokal mit nachgebildeten ABK-Antworten gegen Termine, iCalendar-Zeilenfaltung, Fraktionserkennung, Jahreswechsel und ungültige Adressauswahl getestet. **Ein vollständiger Live-Test auf der TRMNL-Plattform steht noch aus.**

## Links

- [ABK Kiel – Leerungstermine](https://www.abki.de/dienste/entsorgung-und-recycling/beh%C3%A4lter/leerungstermine.html)
- [Waste Collection Schedule – ABK-Implementierung](https://github.com/mampfes/hacs_waste_collection_schedule/blob/master/custom_components/waste_collection_schedule/waste_collection_schedule/source/abki_de.py)
- [TRMNL – Serverless](https://help.trmnl.com/en/articles/14130649-serverless)
- [TRMNL – Plugin ZIP-Import](https://help.trmnl.com/en/articles/10542599-importing-and-exporting-private-plugins)
- [TRMNL – GitHub Sync](https://help.trmnl.com/en/articles/15977899-github-sync)
