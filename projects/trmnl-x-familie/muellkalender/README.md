# Müllkalender Familie X – nächste zwei Leerungen

Das **separate Müllkalender-Plugin für das TRMNL-X-Familiendashboard**. Es fragt die offiziellen ABKI-Daten für eine in TRMNL hinterlegte Kieler Abholadresse ab und stellt zusätzlich eine kompakte Liste der **zwei zeitlich nächsten tatsächlichen Leerungen insgesamt** bereit.

**Sehr wichtig:** Dies ist eine **unabhängige Projektkopie** des Originalplugins unter [`plugins/muellkalender/`](../../../plugins/muellkalender/README.md). Die Originaldateien und die bestehende TRMNL-Plugin-Instanz dürfen **nicht überschrieben** werden. Das Familien-Dashboard verwendet ausschließlich die neue Instanz **Müllkalender Familie X**.

## Was zeigt das Modul?

| Abfallart | Bezeichnung im Plugin |
| --- | --- |
| Restmüll | `Restmüll` |
| Blaue Tonne | `Papier` |
| Braune Tonne | `Biomüll` |
| Gelber Sack / Gelbe Tonne | `Gelber Sack` |

Es gibt zwei Ausgaben aus derselben ABKI-Datenquelle:

1. **`bins`:** Die **vier** Müllarten, jeweils mit ihrem nächsten Termin – aus Kompatibilitätsgründen von der Originalversion übernommen.
2. **`next_two`:** Die **nächsten zwei tatsächlichen Leerungsereignisse**, über **alle** vier Arten hinweg. **Das ist die für das Familiendashboard maßgebliche Variable.**

Beispiel (nur Illustration, keine ABKI-Livedaten):

~~~text
Mo, 23.11.   Papier
Mi, 25.11.   Restmüll
~~~

Wenn die nächsten zwei Ereignisse zweimal dieselbe Müllart betreffen, zeigt `next_two` beide. Finden Papier und Bio am selben Tag statt, können beide angezeigt werden. Wiederholte iCalendar-Einträge derselben Abfallart am selben Kalendertag werden innerhalb von `next_two` dedupliziert.

**Das Modul enthält derzeit keine eigene Logik „Tonne schon rausgestellt“ und keine Push-Erinnerung**; es liefert nur verlässliche Termine und relative Zeitangaben. Eine Hervorhebung am Vorabend müsste in einem späteren Layoutschritt ergänzt werden.

## Datenquelle und Verarbeitung

Ausgangsdaten: [ABKI-Leerungstermine](https://www.abki.de/dienste/entsorgung-und-recycling/beh%C3%A4lter/leerungstermine.html), einschließlich der dort eingepflegten Leerungen für Gelbe Säcke/Tonnen (Remondis).

1. TRMNL pollt das ABKI-Straßenverzeichnis mit dem in den Plugin-Einstellungen gespeicherten Straßennamen.
2. Das Serverless-Skript [`src/transform.js`](src/transform.js) ermittelt Straßen-ID, gültigen Hausnummern-Eintrag und Standort-ID.
3. Es fragt die zugehörige ABKI-iCalendar-Datei ab und liest gültige `VEVENT`-Termine aus.
4. Alle Ereignisse werden einer der vier Müllarten zugeordnet.
5. Für `next_two` werden nur **heutige und zukünftige** Termine behalten, nach Datum und bei Gleichstand nach Abfallart sortiert, dann die ersten **zwei** ausgewählt.
6. Das Plugin berechnet Wochentag, `days` und `relative` und stellt die Daten für Plugin Merge bereit.

Im **Dezember** wird zusätzlich das Folgejahr abgefragt. Gibt die Quelle keine künftigen Termine her, werden sie **nicht geraten**.

### Intervall und Technisches

| Einstellung | Stand im Repository |
| --- | --- |
| Pluginname | `Müllkalender Familie X` |
| Strategie | `polling` |
| Serverless | `node` |
| Polling-URL | ABKI-Straßensuche unter `https://abki.de/abki-services/strassennamen` |
| Refresh | `720` Minuten = **12 Stunden** |
| Zeitzone für Datum | `Europe/Berlin` |
| Formularfelder | `street`, `house_number` |
| HTML/CSS | Liquid-Layouts + [`src/shared.liquid`](src/shared.liquid) |
| Framework | 3.4.6 |

Die mehrstufige ABKI-Abfrage hat einen Abbruch-Timer von ungefähr **4,3 Sekunden**. Bei langsamer API kann sie fehlschlagen; das ist kein Grund, Leerungsdaten zu schätzen.

## Einrichtung

1. In TRMNL eine **neue private Plugin-Instanz** anlegen. **Nicht** die bisherige `Müllkalender Kiel`-Instanz editieren.
2. Aus **`projects/trmnl-x-familie/muellkalender/src/`** ein **flaches ZIP** erstellen: `settings.yml`, `transform.js`, `shared.liquid`, `full.liquid`, `half_horizontal.liquid`, `half_vertical.liquid`, `quadrant.liquid`. ZIP **ohne darüberliegenden Verzeichnisordner** packen.
3. In **Plugins → Private Plugins → Import new** dieses ZIP importieren.
4. Name **Müllkalender Familie X**, **Polling**, **Node Serverless** und die ABKI-URL kontrollieren.
5. In den Plugin-Einstellungen **Straße** und **Hausnummer** des Abholstandorts eintragen. **Nur in TRMNL** speichern, nicht in GitHub.
6. Speichern und **Force Refresh** auslösen.
7. **Edit Markup → Your Variables** öffnen und sicherstellen, dass `error` leer ist, `bins` vorhanden ist und `next_two` zwei plausible kommende Ereignisse enthält (bei sehr wenigen offiziellen Daten entsprechend weniger).
8. Die beiden nächsten Daten mit dem [ABKI-Kalender](https://www.abki.de/dienste/entsorgung-und-recycling/beh%C3%A4lter/leerungstermine.html) vergleichen.
9. In [Familien-Dashboard X](../dashboard/README.md#einrichtung-und-datenzuordnung) dieses **neue** Plugin unter `trash_source` auswählen. Falls die Auswahl leer bleibt, die neue Instanz vorübergehend in eine Playlist oder ein Mashup aufnehmen.
10. Das Dashboard im X-Preview und am Gerät kontrollieren. **Das Originalplugin bleibt unverändert und kann parallel weiterlaufen.**

Ein GitHub-Sync, falls gewünscht, muss auf **`projects/trmnl-x-familie/muellkalender`** zeigen; nicht auf `plugins/muellkalender`.

## Variablen für das Dashboard

Das Ergebnis von `run(input)` enthält bei Erfolg:

| Variable | Typ/Bedeutung |
| --- | --- |
| `bins` | Array der vier Kategorien mit ihrem jeweils nächsten Termin |
| `next_two` | **Array der ersten zwei tatsächlichen Abholereignisse**, chronologisch sortiert |
| `next_two[].id` | `rest` / `paper` / `bio` / `yellow` |
| `next_two[].label` | lesbare Müllart |
| `next_two[].weekday` | Wochentag, z. B. `Mo` |
| `next_two[].date` | Datum ohne Jahreszahl, z. B. `23.11.` |
| `next_two[].iso_date` | Datum mit Jahr, z. B. `2026-11-23` |
| `next_two[].days` | ganze Tage bis zur Leerung, `0` = heute |
| `next_two[].relative` | `Heute`, `Morgen` oder `in N Tagen` |
| `next_days` | Tage bis zur insgesamt nächsten Leerung |
| `generated_at` | Uhrzeit der Aufbereitung |
| `source` | `ABK Kiel / Remondis` |
| `error` | Fehlertext, wenn ABKI-Abfrage scheitert |

Das Dashboard nutzt aktuell `label`, `weekday` und `date`. Die anderen Felder stehen für spätere relative Erinnerungen zur Verfügung.

### Beispiel einer Ausgabe

~~~json
{
  "next_two": [
    {
      "id": "paper",
      "label": "Papier",
      "weekday": "Mo",
      "date": "23.11.",
      "iso_date": "2026-11-23",
      "days": 2,
      "relative": "in 2 Tagen"
    },
    {
      "id": "rest",
      "label": "Restmüll",
      "weekday": "Mi",
      "date": "25.11.",
      "iso_date": "2026-11-25",
      "days": 4,
      "relative": "in 4 Tagen"
    }
  ],
  "error": ""
}
~~~

Alle Daten sind **Beispiele** und dürfen nicht als aktuelle ABKI-Termine übernommen werden.

## Tests

Der Mocktest im Repository:

~~~sh
node projects/trmnl-x-familie/muellkalender/tests/test.mjs
~~~

Er simuliert den ABKI-Ablauf, Sortierung der Abfallarten, wiederholte Papierleerungen und Fehler bei einer unbekannten Hausnummer. Die Funktion `buildDisplay` wurde zusätzlich mit zwei Abholungen am selben Tag sowie einem Jahreswechsel geprüft. Der Mocktest ist **kein Live-API- oder Geräteabnahmetest**.

**Praktische Abnahme nach dem Import:** die ersten beiden Treffer bei ABKI mit `next_two` vergleichen, eine Abholung am selben Tag prüfen und im Dezember/Januar kontrollieren, ob Daten aus dem Folgejahr vorhanden sind.

## Fehlerbehebung

| Symptom | Prüfung |
| --- | --- |
| `error` meldet fehlende Straße/Hausnummer | Formularwerte im **neuen** Plugin hinterlegen |
| Straße/Hausnummer nicht gefunden | ABKI-Suche und Standort prüfen |
| „Zeitlimit überschritten“ | ABKI-Dienst überlastet; später `Force Refresh` wiederholen |
| `bins` hat Daten, `next_two` fehlt | möglicherweise versehentlich **Originalplugin** ausgewählt oder falsche Version importiert |
| `next_two` enthält weniger als zwei Einträge | ABKI-Kalender enthält für die Abfrage zu wenige zukünftige Ereignisse |
| Dashboard zeigt alle vier Müllarten statt zwei | falsches Layout oder `bins` statt `next_two` verwendet |
| Altes Datum nach einem Abholtag | 12-Stunden-Intervall / letzten `generated_at` prüfen; ggf. `Force Refresh` |
| Original-Müllkalender ändert sich mit | GitHub-Sync-Pfade prüfen: X-Instanz darf nicht auf Originalordner zeigen |

## Dateien

- [`src/settings.yml`](src/settings.yml): Polling, Formular und Intervall.
- [`src/transform.js`](src/transform.js): ABKI-Abfrage, `bins`, `next_two`.
- [`src/shared.liquid`](src/shared.liquid): gemeinsames CSS.
- [`src/full.liquid`](src/full.liquid) und kompakte Layoutdateien: eigene Darstellung des Müllplugins. Diese übernommenen Einzelansichten stellen weiterhin vier Abfallarten dar; das **Dashboard** nutzt `next_two`.
- [`tests/test.mjs`](tests/test.mjs): Mocktests.
- [`.trmnlp.yml`](.trmnlp.yml): optionale lokale Entwicklungs-Konfiguration.

Referenzen: [Original-Müllkalender](../../../plugins/muellkalender/README.md), [ABKI Leerungstermine](https://www.abki.de/dienste/entsorgung-und-recycling/beh%C3%A4lter/leerungstermine.html), [TRMNL Plugin Merge](https://help.trmnl.com/en/articles/17434705-plugin-strategies), [TRMNL GitHub Sync](https://help.trmnl.com/en/articles/15977899-github-sync).
