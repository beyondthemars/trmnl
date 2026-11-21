# Familien-Dashboard für TRMNL X

**Status:** Entwicklungsstand / Integrationsvorlage; noch **nicht** auf einem angemeldeten TRMNL X mit echten Apple-Kalendern und Geburtstagsdaten getestet.

Schlichtes 4:3-Familiendisplay für TRMNL X (1872 × 1404 physische Pixel, 1040 × 780 Layout-Pixel, 16 Graustufen). Kein zusätzlicher Server, kein Home Assistant, keine lokale Bridge.

## Aufbau

| Quelle | Daten | Strategie |
|---|---|---|
| TRMNL Apple Calendar (offiziell) | Sechs Kalender (Henrike, Boy, Jarne, Marit, Marit & Jarne, Familie) | native Integration |
| [Birthday Calendar](https://trmnl.com/recipes/birthday-calendar-225941) von Jasper | Eigenständig gepflegte Geburtstage | bestehendes Recipe |
| [Familienwetter](../wetter/) | DWD ICON Seamless / Open-Meteo | TRMNL-Polling + Serverless |
| [Müllkalender Kiel](../muellkalender/) | Nächste 2 tatsächliche Abholereignisse aus dem ABKI-Kalender | TRMNL-Polling + Serverless |
| **Familien-Dashboard X** | Kombinierte Ansicht | Plugin Merge |

**Keine Ecowitt-Abfrage**: Private IPs wie 192.168.x.x sind für TRMNL-Cloud-Polling nicht erreichbar; ein dafür nötiger Heimnetz-Übermittler ist ausdrücklich **nicht gewünscht**.

## Darstellung

- Datum groß, **keine Uhrzeit**.
- Geburtstage als zurückhaltende Zeile, maximal zwei.
- Links bis zu sechs chronologische Kalendereinträge; Kürzel H/B/J/M/M+J/F.
- Rechts: Temperaturspanne und Wetter für **05–13**, **13–18** oder **18–05 Uhr**.
- Separate Niederschlagsabschätzung für **07–09** und **13–15 Uhr** (Regen, Schnee, Schneeregen); nachts Vorschau auf den nächsten Morgen.
- Die nächsten **zwei realen Müllabholungen**, nicht eine pro Müllart.
- Flächen statt Effekte: Weiß, helles Grau, schmale Linien, große serifenlose Schrift; keine Schatten, keine Verläufe.

## Einrichtung bei TRMNL

**Voraussetzung:** Ein TRMNL-Konto mit *Developer Edition* bzw. entsprechender BYOD-Freischaltung, damit private Plugins und Plugin Merge bearbeitet werden können.

1. Konto-Zeitzone auf **Europe/Berlin** und Sprache auf Deutsch einstellen.
2. **Apple Calendar** verbinden und genau sechs benötigte iCloud-Kalender auswählen. Termine im Originalplugin prüfen.
3. **Birthday Calendar** von Jasper installieren und Geburtstage dort verwalten. 14-Tage-Vorschau einschalten. Es werden keine Apple-Kontakte benötigt.
4. Aus \`plugins/familienwetter/src\` ein **flaches ZIP** (Dateien direkt auf ZIP-Ebene) importieren. Die Standardkoordinaten liegen ungefähr in Kiel-Suchsdorf und können in den TRMNL-Plugin-Einstellungen geändert werden. Polling läuft direkt bei TRMNL. **Force Refresh** durchführen und die Variablen \`period\`, \`paths\`, \`current\` prüfen.
5. Die **Projektkopie Müllkalender Familie X** aus `projects/trmnl-x-familie/muellkalender/src` als **separates privates Plugin** importieren und **Force Refresh** ausführen. Den bestehenden Müllkalender Kiel nicht verändern. In **Your Variables** muss jetzt neben \`bins\` auch \`next_two\` (mit zwei Ereignissen) erscheinen.
6. Aus \`plugins/familien-dashboard/src\` ebenfalls ein flaches ZIP importieren. Strategie: **Plugin Merge**. Nach dem ersten Speichern die vier Quellen in den Dropdowns auswählen: Apple Calendar, Birthday Calendar, Familienwetter, Müllkalender. Die Quellen ggf. zunächst als Playlist-Element aktivieren, damit sie im Auswahlfeld erscheinen.
7. **Your Variables** des zusammenführenden Plugins öffnen und die tatsächliche Struktur von \`calendar_source\` und \`birthday_source\` prüfen. Erst danach die Full-Ansicht auf dem X aktivieren.
8. Als einziges sichtbares Playlist-Element das **Familien-Dashboard X** verwenden. 15-Minuten-Refresh für die Morgen- und Abholzeiten ist ein sinnvoller Startwert. Aktualisierung erfolgt **nicht minutengenau**; Wetter- und Ansichtswechsel erscheinen beim nächsten Geräte-Check-in.

## Noch offen: Live-Daten-Mapping

Im Merge-Template sind die gängigen Kalenderfelder \`events\`, \`calendar_events\` sowie \`data.events\` berücksichtigt. **Das ist eine Kompatibilitätsannahme, keine bestätigte Apple-Calendar-Datenstruktur für dieses Konto.** Auch Titel (\`summary\`/\`title\`), Startzeit (\`start_full\`/\`date_time\`/\`start_at\`/\`start\`) und Kalendername müssen anhand von *Your Variables* bestätigt werden.

Das Geburtstags-Recipe stellt seine Berechnung und Darstellung eigenständig bereit; **ob es ein Array \`upcoming_birthdays\`, \`upcoming\` oder \`birthdays\` für Merge bereitstellt, wurde noch nicht live verifiziert**. Das Template versucht diese Felder. Falls sie nicht vorhanden sind, bleibt eine sichtbare Meldung zur Datenzuordnung stehen, statt falsche Geburtstage zu erfinden. Gegebenenfalls muss das Recipe geforkt werden, um das berechnete Ergebnis als strukturierte Variable verfügbar zu machen.

TRMNL-Plugin-Merge liefert bereits aufbereitete Plugin-Daten; mit dem vorliegenden Template wird **kein eigener Serverless-JavaScript-Lauf innerhalb von Plugin Merge** vorausgesetzt. Die Verarbeitung bleibt in den beiden bestehenden Polling-Quellen.

Das gesamte Projekt liegt in einem Feature-Branch, um einen unbeabsichtigten Rollout auf das Küchendisplay zu vermeiden.

## Relevante Dokumentation

- [TRMNL Plugin Strategies](https://help.trmnl.com/en/articles/17434705-plugin-strategies)
- [Plugin-Instanzen als Formfelder](https://help.trmnl.com/en/articles/10513740-custom-plugin-form-builder)
- [TRMNL X Guide](https://trmnl.com/framework/docs/3.4/trmnl_x_guide/)
- [Private Plugin Import](https://help.trmnl.com/en/articles/10542599-importing-and-exporting-private-plugins)
