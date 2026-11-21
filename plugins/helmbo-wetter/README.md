# Helmbo-Wetter – Fanø

Ein eigenständiges TRMNL-Wetterplugin für **Fanø (Dänemark)**. Es stellt regionale Wettervorhersagen und aktuelle bzw. modellbasierte Wetterwerte mit Küsteninformationen auf einer übersichtlichen E-Paper-Seite dar. Es verwendet **keinen lokalen Dienst, keine Home-Assistant-Instanz und keinen Heimnetz-Zugriff**.

> **Stand laut Code:** Es gibt ein **Full-Layout für 800 × 480 px**, nicht automatisch eine fertige TRMNL-X- oder Mashup-Ansicht. Der Code enthält keinen eigenständigen automatisierten Test. Ob das Plugin auf einem konkreten Gerät vollständig korrekt dargestellt wird, ist separat im TRMNL-Editor bzw. auf Hardware zu prüfen.

## Anzeige

Die Datei [`src/full.liquid`](src/full.liquid) erzeugt fünf Bereiche:

1. **Kopf:** „Fanø“, der ausgewählte Ort, Sonnenaufgang/-untergang, Datum und letzte Datenaktualisierung.
2. **Aktuell:** Temperatur, gefühlte Temperatur, Wind und Böen in Beaufort, Windrose/Windrichtung sowie die **prognostizierte Niederschlagsmenge der nächsten vier Stunden**. Dieser Niederschlagswert ist **keine gemessene Regenmenge**.
3. **Vorhersagetabelle:** Vormittag (06–12), Nachmittag (12–18) und Abend (18–24 Uhr) sowie morgen und übermorgen; jeweils Bewölkungsbeschreibung, Temperaturbereich, Niederschlag/-wahrscheinlichkeit, Wind/Böen.
4. **Küste:** Nächste Ebbe und Flut für Nordby, Wassertemperatur bei Esbjerg Havn.
5. **Fußzeile:** Herkunft der verwendeten Daten, Hinweise auf Modellmix oder Datenlücken.

Die Oberfläche ist bewusst kontrastreich und primär schwarz/weiß gehalten. Die Werte können je nach Datenlage durch `–` ersetzt werden.

## Datenquellen und Auswahl

Die TRMNL-Cloud ruft über **Polling** mehrere externe HTTPS-URLs ab. In [`src/settings.yml`](src/settings.yml) stehen **acht URLs**, die in [`src/transform.py`](src/transform.py) als `IDX_0` bis `IDX_7` verarbeitet werden.

| Index | Datenquelle | Verwendung |
| --- | --- | --- |
| `IDX_0` | Open-Meteo mit DMI HARMONIE-AROME, Rindby Strand | bevorzugte Modellprognose |
| `IDX_1` | Open-Meteo mit DMI-Modell, Nordby | Ersatz-Modellstandort |
| `IDX_2` | Open-Meteo mit DMI-Modell, Blåvand | weiterer Ersatzstandort |
| `IDX_3` | DMI metObs, Station 06088 | ergänzende aktuelle Beobachtungen (Nordby) |
| `IDX_4` | DMI metObs, Station 06081 | ergänzende Beobachtungen (Blåvandshuk) |
| `IDX_5` | DMI oceanObs, Station 25151 | Wassertemperatur Esbjerg Havn |
| `IDX_6` | DMI Gezeitenvorhersage, Station 25139 | nächste Ebbe/Flut Nordby |
| `IDX_7` | Open-Meteo, Rindby/Best-Match | Niederschlagswahrscheinlichkeit und Sonnenzeiten |

**Ablauf der Datenaufbereitung:**

1. `transform.py` sucht das erste Modell mit verfügbaren Stunden-Temperaturen: Rindby → Nordby → Blåvand.
2. Für aktuelle Werte verwendet es das Modell und ergänzt fehlende Felder gegebenenfalls aus jüngeren DMI-Beobachtungen. Der angezeigte `current_source`-Text gibt Auskunft über verwendete Quellen.
3. Die Vorhersage wird für die Zeitblöcke berechnet. Windangaben in m/s werden in Beaufortstufen umgerechnet; Richtung in deutsche Kompasskürzel.
4. Fehlen Werte für morgen oder übermorgen, versucht das Skript optional eine ergänzende **Open-Meteo-Best-Match-Abfrage**. Bei Ausfall bleiben die verfügbaren Werte erhalten.
5. Gezeiten sind **Vorhersagen**, Wassertemperatur ist eine **Messung** mit Zeitstempel, sofern die DMI-Quelle einen ausreichend aktuellen Wert liefert.

**Wichtig:** Die Reihenfolge der acht Polling-URLs nicht ohne gleichzeitige Anpassung der `IDX_*`-Zuordnung ändern. Sie gehört zur Schnittstelle zwischen TRMNL und `transform.py`.

## Technische Konfiguration

| Einstellung | Wert im Repository |
| --- | --- |
| Pluginname | `Wetter Fanø` |
| Strategie | `polling` |
| Serverless-Laufzeit | `python` |
| Intervall | `refresh_interval: 60` (60 Minuten) |
| Untergrenze | `refresh_interval_floor: '60'` |
| Design | `full.liquid`, festes Raster 800 × 480 |
| Zeitzone | `Europe/Copenhagen` für Prognose; EU-Sommerzeit im Skript berücksichtigt |
| API-Schlüssel | im Code derzeit keiner hinterlegt |

Der Code verwendet nur Python-Standardbibliotheken innerhalb des TRMNL-Serverless-Skripts. **Du musst zu Hause keine Python-Anwendung starten.**

### Dateien

| Datei | Funktion |
| --- | --- |
| [`src/settings.yml`](src/settings.yml) | Plugin-Settings und acht Polling-Adressen |
| [`src/transform.py`](src/transform.py) | Parsing, Plausibilitätschecks, Fallbacks und berechnete Darstellungswerte |
| [`src/full.liquid`](src/full.liquid) | Layout, CSS und Liquid-Ausgabe |
| [`.trmnlp.yml`](.trmnlp.yml) | optionale lokale TRMNL-Entwicklungs-Konfiguration; **nicht** für den Cloudbetrieb nötig |

## Einrichtung in TRMNL

1. In TRMNL das gewünschte Gerät auswählen und **Plugins → Private Plugins** öffnen.
2. Ist das Plugin bereits angelegt und mit GitHub Sync verbunden, **die bestehende Instanz** öffnen. Keine zweite Instanz erforderlich.
3. Bei einer Neuinstallation nur die Dateien aus `src/` in ein **flaches ZIP** packen: `settings.yml`, `transform.py`, `full.liquid`.
4. **Import new** verwenden und das ZIP hochladen. Im Plugin prüfen: Name `Wetter Fanø`, Strategie **Polling**, Serverless **Python** und acht Polling-URLs.
5. Speichern, **Force Refresh** auslösen und im Markup-Editor unter **Your Variables** die Daten prüfen.
6. Die **Full**-Vorschau öffnen, insbesondere Sonnenzeiten, Aktualisierungsdatum, Vorhersagetabelle und Küstenbereich kontrollieren.
7. Plugin zur Geräte-Playlist hinzufügen und auf der physischen Anzeige prüfen. Die Ansicht ist **nicht als TRMNL-X-spezifisches Layout** entwickelt worden.

Wenn die Quelle oder das Datenformat geändert wird, vor einer Übernahme zunächst in einer separaten Entwicklungsinstanz testen.

## Wichtige Ausgabevariablen

| Variable | Bedeutung |
| --- | --- |
| `place`, `updated_date`, `updated_time` | Ort und Datum/Uhrzeit des Datendurchlaufs |
| `temp`, `feels` | Temperatur / gefühlt, als formatiertes deutsches Textfeld |
| `wind`, `gust`, `wind_dir`, `wind_deg` | Beaufort, Richtung und Winkel für die Windrose |
| `rain`, `rain_label` | prognostizierte Niederschlagsmenge für vier Stunden und Zeitraum |
| `today`, `days` | vorberechnete Vorhersage-Zeilen für die Tabelle |
| `sunrise`, `sunset` | lokale Sonnenzeiten |
| `ebb`, `ebb_day`, `flood`, `flood_day` | nächste Niedrig-/Hochwasserzeit mit Tagesangabe |
| `water`, `water_time` | Wassertemperatur und Messzeit |
| `current_source`, `mixed`, `missing` | Quellenhinweise, ergänzte Modellfelder und Datenlücken |

Der Formatter erzeugt vielfach **bereits formatierte Strings** (z. B. mit deutschem Komma). In Liquid daher nicht pauschal noch einmal die Einheit oder Dezimalstellen umrechnen.

## Tests und Fehlersuche

**Manueller Testplan:**

1. `Force Refresh` ausführen. Sind die acht Polling-Antworten bzw. die resultierenden Variablen vorhanden?
2. Vorhersage an einem normalen Tag prüfen: fünf Zeitabschnitte einschließlich morgen/übermorgen.
3. Daten eines fehlenden DMI-Sensors prüfen: Es muss `–` oder ein anderer vorhandener Datenwert erscheinen, keine erfundene Messung.
4. Gezeiten- und Wassertemperaturfelder prüfen; DMI-Messwerte können fehlen oder verzögert sein.
5. Auf fehlende Regenwahrscheinlichkeit bzw. `missing`-Einträge achten.
6. Das Vollbild auf dem tatsächlich verwendeten Gerät prüfen.

| Symptom | Mögliche Ursache / Prüfung |
| --- | --- |
| Ganze Anzeige leer | Polling fehlgeschlagen, Format geändert oder Python-Serverless-Fehler; Debug Logs prüfen |
| `–` bei Wasser/Gezeiten | keine frischen DMI-Daten, falsche Station oder API-Ausfall |
| Modellmix-Hinweis | für Teile der Vorhersage wurde Best Match als Ergänzung verwendet |
| Werte wirken veraltet | letzten Refresh und Quell-Zeitstempel prüfen; Intervall beträgt 60 Minuten |
| Unvollständige Tagesprognose | Datenende des DMI-Modells oder API-Ausfall; automatisch ergänztes Best Match prüfen |

## Weiterentwicklung

Dieses Plugin ist **getrennt** vom [Familienwetter des TRMNL X](../../projects/trmnl-x-familie/wetter/README.md). Eine Änderung hier darf nicht stillschweigend das Familienprojekt verändern.

### Quellen

- [Open-Meteo Forecast API](https://open-meteo.com/en/docs)
- [DMI Open Data](https://opendatadocs.dmi.govcloud.dk/)
- [TRMNL Private Plugin Import](https://help.trmnl.com/en/articles/10542599-importing-and-exporting-private-plugins)
- [TRMNL GitHub Sync](https://help.trmnl.com/en/articles/15977899-github-sync)
