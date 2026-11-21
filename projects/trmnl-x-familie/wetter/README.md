# Familienwetter Kiel – TRMNL-X-Projekt

Eigenständiges privates TRMNL-Plugin für das Wetter in **Kiel-Suchsdorf**. Es bereitet die Vorhersage für den aktuellen Tagesabschnitt und das Niederschlagsrisiko auf euren Wegen zur Arbeit und zur Kita auf.

**Läuft ausschließlich über TRMNL.** Die Daten kommen von **Open-Meteo mit DWD ICON**, nicht von Ecowitt, Home Assistant, einem Proxmox-Container oder einem lokalen Skript. Die aktuelle Temperatur ist **ein Modellwert** und darf nicht als Messung der heimischen Wetterstation bezeichnet werden.

Das Plugin kann allein angezeigt oder als Datenquelle von [Familien-Dashboard X](../dashboard/README.md) per **Plugin Merge** verwendet werden.

## Funktionsumfang

| Bereich | Definition im Code | Anzeige |
| --- | --- | --- |
| Vormittag | 05:00 bis vor 13:00 | Temperaturspanne, zusammengefasste Wetterlage, Regenrisiko und Wind für **05–13 Uhr** |
| Nachmittag | 13:00 bis vor 18:00 | dieselben Werte für **13–18 Uhr** |
| Abend / Nacht | 18:00 bis vor 05:00 am nächsten Tag | Werte für die zusammenhängende Periode **18–05 Uhr** |
| Hinweg | 07:00–09:00 | Prognose Regen/Schnee/Schneeregen für den Weg zur Arbeit und Kita |
| Abholung | 13:00–15:00 | Prognose für Weg zur Kita und Rückweg |

**Wann erscheinen die Wege?**

- **05–12:59 Uhr:** Beide Wegfenster von heute.
- **13–14:59 Uhr:** Nur die Kita-Abholung von heute.
- **15–17:59 Uhr:** Bereits vergangene Wegfenster werden nicht angezeigt.
- **Ab 18 Uhr:** Beide Wegfenster **für morgen**.
- **00–04:59 Uhr:** Beide Wegfenster **für den begonnenen Tag**, bevor um 05 Uhr die Vormittagsperiode beginnt.

Die Umschaltung ist **kein Live-Countdown**: Sie erfolgt bei der nächsten Datenaktualisierung bzw. beim nächsten TRMNL-Geräteabruf.

## Wetterdaten

### Externe API

Die Polling-URL steht in [`src/settings.yml`](src/settings.yml) und beginnt mit:

~~~text
https://api.open-meteo.com/v1/dwd-icon
~~~

Übergeben werden ungefähr die Koordinaten von Kiel-Suchsdorf (in den TRMNL-Einstellungen anpassbar), die Zeitzone `Europe/Berlin`, ein vergangener Prognosetag und drei Vorhersagetage.

**Angeforderte Werte:**

| JSON-Feld von Open-Meteo | Verwendung |
| --- | --- |
| `current.temperature_2m` | aktuelle **modellbasierte** Temperatur |
| `hourly.time` | Stunden mit Datum und lokaler Uhrzeit |
| `hourly.temperature_2m` | Minimum/Maximum im aktuellen Zeitfenster |
| `hourly.precipitation_probability` | größter stündlicher Wahrscheinlichkeitswert je Weg/Periode |
| `hourly.precipitation` | Niederschlagsmenge pro Stunde |
| `hourly.rain` | Regen zur Niederschlagsart-Zuordnung |
| `hourly.snowfall` | Schneefall zur Niederschlagsart-Zuordnung |
| `hourly.weather_code` | zusammenfassende Wetterlage |
| `hourly.wind_speed_10m` | größter Stundenwind im Zeitfenster |
| `hourly.wind_gusts_10m` | größte Böe im Zeitfenster |

Die Prognose wird von **Open-Meteo/DWD ICON** geliefert. Die API gehört nicht zum eigenen Repository und kann sich ändern. Wind und Böen werden als km/h verwendet, Temperaturen als °C; `precipitation` / `rain` als mm und `snowfall` als cm gemäß der angefragten Open-Meteo-Variablen.

### Wie berechnet das Plugin den Tagesabschnitt?

[`src/transform.js`](src/transform.js) verarbeitet die JSON-Stundenwerte mit `Europe/Berlin`, filtert alle Stunden des aktuellen Abschnitts und ermittelt:

- kleinste und größte prognostizierte Temperatur im **gesamten** Abschnitt;
- einen kurzen Wettertext aus Niederschlag/Schnee und Wettercodes;
- den höchsten stündlichen Wert der Niederschlagswahrscheinlichkeit;
- die Niederschlagssumme über den Zeitraum;
- maximale Windgeschwindigkeit und Böe.

Hinweis: Wenn du um 12:30 Uhr auf das Display schaust, bezieht sich „05–13“ trotzdem auf den **gesamten Abschnitt** einschließlich der bereits vergangenen Stunden. Das ist aktuell so implementiert.

## Niederschlagswarnungen für die Kitawege

Das Plugin bewertet die **stündliche Prognose** innerhalb des jeweiligen Wegfensters. Es unterscheidet:

| Ausgabe `status` | Aktuelle Regel im Code | Bedeutung |
| --- | --- | --- |
| `expected` | z. B. mindestens **0,3 mm** prognostizierter Niederschlag in einer Stunde, mindestens **0,2 cm** Schnee in der betrachteten Summe oder ≥70 % Niederschlagschance zusammen mit ≥0,1 mm | „Regen/Schnee/Schneeregen erwartet“ |
| `possible` | mindestens **0,05 mm**, mindestens **0,05 cm** Schnee oder ≥35 % Wahrscheinlichkeit | „Niederschlag möglich“ |
| `dry` | weder `expected` noch `possible` | „Voraussichtlich trocken“ |
| `unknown` | **keine Stundenwerte** im gesamten Wegfenster | „Keine Prognose“ |

Die Art (`kind`) wird anhand der Werte für Regen und Schnee als `rain`, `snow` oder `sleet` ermittelt. Das ist eine **vereinfachte Heuristik**, kein amtlicher Wetteralarm.

**Wichtige Einschränkungen:**

- Der angezeigte maximale Stundenwert ist **nicht** die statistische Wahrscheinlichkeit, irgendwann während des gesamten zweistündigen Wegs nass zu werden.
- Ein Zeitfenster mit vorhandenen Stundenzeilen, aber **fehlenden Niederschlagsfeldern**, kann nach der derzeitigen Logik noch als `dry` gelten. Vor dem produktiven Einsatz sollte dieser Grenzfall zusätzlich getestet bzw. abgesichert werden.
- Leichter, sehr lokaler Niederschlag, Glatteis oder kräftige Böen können von der Prognose abweichen. Die Aussage „trocken“ ist **keine Garantie** und kein Warnsystem für gefährliche Wetterlagen.
- Warnungen erscheinen erst beim nächsten TRMNL-Refresh; es gibt **keinen Push-Alarm**.

## Einstellungen

| Feld | Wert im Repository |
| --- | --- |
| Name | `Familienwetter Kiel` |
| Strategie | `polling` |
| Serverless | `node` |
| Refresh | `15` Minuten, abhängig vom TRMNL-Tarif und Geräteintervall |
| `latitude` | voreingestellte ungefähre Suchsdorf-Koordinate (Breitengrad) |
| `longitude` | voreingestellte ungefähre Suchsdorf-Koordinate (Längengrad) |
| Zeitzone | `Europe/Berlin` |
| Darstellungen | Full, Half horizontal, Half vertical, Quadrant |
| Framework | 3.4.6 |

`latitude` und `longitude` werden **als TRMNL-Formularfelder** in die Polling-URL eingesetzt. Die Voreinstellung ist lediglich eine Stadtteilposition; **keine genaue Wohnadresse**.

## Einrichtung

1. In TRMNL **Plugins → Private Plugins → Import new** öffnen.
2. Aus `projects/trmnl-x-familie/wetter/src/` ein **flaches ZIP** erstellen, das unmittelbar `settings.yml`, `transform.js`, `shared.liquid`, `full.liquid`, `half_horizontal.liquid`, `half_vertical.liquid` und `quadrant.liquid` enthält.
3. ZIP importieren, Namen **Familienwetter Kiel**, Strategie **Polling** und Serverless **Node** kontrollieren.
4. Die ungefähren Koordinaten prüfen oder im Plugin die gewünschte Wetterposition eintragen. **Keine Heimnetz-IP** verwenden.
5. Speichern und **Force Refresh** ausführen.
6. Unter **Edit Markup → Your Variables** prüfen, ob `error` leer ist und `period`, `current`, `paths` enthalten sind.
7. Full-Ansicht kontrollieren: Tagesperiode, Temperaturspanne, Wetterbeschreibung und Wegwarnungen plausibel?
8. Die kleineren Layouts bei Bedarf prüfen. Danach das Plugin im [Familien-Dashboard X](../dashboard/README.md#einrichtung-und-datenzuordnung) als **Wetterdatenquelle** auswählen.
9. Erst nach Test mit echten Wetterwerten und dem richtigen TRMNL-X-Profil in die produktive Ansicht übernehmen.

Das Plugin wird in der Cloud verarbeitet. **Node.js muss auf keinem eigenen Rechner dauerhaft laufen.**

## Ausgabe für Plugin Merge

Das Serverless-Skript `run(input)` liefert:

~~~json
{
  "error": "",
  "source": "Open-Meteo / DWD ICON Seamless",
  "updated_date": "YYYY-MM-DD",
  "generated_at": "ISO-8601-Zeitstempel",
  "period": {
    "key": "morning | afternoon | night",
    "title": "Vormittag | Nachmittag | Abend / Nacht",
    "hours": "05–13 Uhr",
    "temperature_range": "3–8 °C",
    "precipitation_probability": 60,
    "precipitation_total": 1.2,
    "max_wind_kmh": 20
  },
  "current": { "temperature": 4.2, "is_model_value": true },
  "paths": [
    {
      "name": "Hinweg",
      "hours": "07–09 Uhr",
      "status": "possible",
      "kind": "rain",
      "text": "Niederschlag möglich",
      "probability": 60,
      "day": "Heute"
    }
  ]
}
~~~

**Achtung:** Das sind **Beispielwerte zur Erklärung der Felder**, keine echten Mess- oder Prognosedaten. `paths` kann leer sein; bei Fehlern kann `period` null sein. Das kombinierte Dashboard verwendet insbesondere `period`, `current.temperature` und `paths`.

## Tests

Mocktests mit Node.js, nur beim Entwickeln:

~~~sh
node projects/trmnl-x-familie/wetter/tests/test.mjs
~~~

Geprüft werden: Morgen-/Nachmittag-/Nachtfenster, Tageswechsel 18–05 Uhr, Regen am Hinweg, Schnee bei Abholung, unterdrückte vergangene Wege und fehlende Stundenwerte. **Nicht abgedeckt:** echte API-Ausfälle, wechselnde Open-Meteo-Datenstrukturen, vollständige Feldlücken innerhalb vorhandener Stunden oder Bildschirm-Überläufe.

Für die Abnahme auf TRMNL zusätzlich **Force Refresh**, die tatsächlichen Variablen und die Anzeige auf dem X prüfen.

## Fehlerbehebung

| Problem | Ursache / Maßnahme |
| --- | --- |
| `error: Open-Meteo liefert keine Stundenwerte` | Polling fehlgeschlagen oder `hourly.time` fehlt; URL, API-Antwort und Debug Logs kontrollieren |
| `period.temperature_range` = `–` | keine gültigen Temperaturen im passenden Fenster |
| Hinweg-/Abholwarnung fehlt | außerhalb des beabsichtigten Zeitfensters, `paths` leer oder keine Daten |
| Warnung sagt „trocken“, obwohl es regnet | Prognoseunsicherheit oder fehlende Felder; Einzelwerte vergleichen |
| Zeitfenster wirkt um eine Stunde verschoben | Zeitzone `Europe/Berlin`, Sommerzeit und Geräte-/Cloud-Aktualisierung prüfen |
| Wetterdaten bleiben lange gleich | letzten `generated_at`-Wert, TRMNL-Polling-Gesundheit und Geräte-Refresh prüfen |
| Plugin Merge zeigt keine Wetterwerte | im Hauptplugin die Wetterinstanz auswählen und tatsächliche Variablennamen prüfen |

## Dateien und Referenzen

- [`src/settings.yml`](src/settings.yml): Open-Meteo-URL, Koordinatenformular, 15-Minuten-Intervall.
- [`src/transform.js`](src/transform.js): Prognoseparsing und Wegwarnungen.
- [`src/shared.liquid`](src/shared.liquid): E-Paper-Stile.
- [`src/full.liquid`](src/full.liquid) und kompakte Vorlagen: eigenständige Wetterdarstellung.
- [`tests/test.mjs`](tests/test.mjs): Mocktests.

Quellen: [Open-Meteo DWD API](https://open-meteo.com/en/docs/dwd-api), [TRMNL Plugin-Strategien](https://help.trmnl.com/en/articles/17434705-plugin-strategies), [Private Plugin Import](https://help.trmnl.com/en/articles/10542599-importing-and-exporting-private-plugins).
