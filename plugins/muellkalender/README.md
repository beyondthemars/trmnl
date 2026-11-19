# TRMNL Müllkalender – ABK Kiel

Eigenständiges, kontrastreiches E-Ink-Plugin für **TRMNL OG und TRMNL X**, ohne Home Assistant und ohne eigenen Server. Es zeigt für Restmüll, Papier, Bioabfall und Gelben Sack jeweils den nächsten offiziellen ABK-Termin, den Wochentag und die verbleibenden Tage. Die nächste Leerung ist hervorgehoben.

## Gestaltung – Minimal

Das Plugin verwendet ein zurückhaltendes E-Ink-Design mit viel Weißraum und klarer Typografie. Die vier Abfallarten erscheinen als schlichte Liste mit feinen Trennlinien, nicht mehr als umrahmte Karten. Die nächste Leerung wird durch eine hellgraue Fläche, eine schmale seitliche Linie und den Hinweis **„ALS NÄCHSTES“** markiert. Die Datenabfrage und Sortierung bleiben unverändert; Grautöne und Kontraste sind auch für den OG geeignet.

## Unterstützte Anzeigen

| Anzeige | Internes TRMNL-Layout | Darstellung |
|---|---:|---|
| TRMNL OG (Querformat) | 800 × 480 | Vier ruhige Listenzeilen, Datum rechts |
| TRMNL X (Querformat) | 1040 × 780 (physisch 1872 × 1404) | Größere Typografie und mehr Weißraum |
| TRMNL X (Hochformat) | 780 × 1040 (physisch 1404 × 1872) | Vier großzügige vertikale Reihen |
| Half horizontal | OG und X | Vier kompakte Termine in zwei Spalten |
| Half vertical | OG und X | Vier schlichte Zeilen |
| Quadrant | OG und X | Vier minimalistische Bereiche im 2×2-Raster |

Alle Vorlagen verwenden dieselben ABK-Daten, ohne eigene Geräteversion. Das gemeinsame CSS liegt in [src/shared.liquid](src/shared.liquid), die Liquid-Markups in [src](src). Die TRMNL-Gerätekennung bestimmt die Darstellung.

## Funktionsweise

1. TRMNL pollt das ABK-Straßenverzeichnis anhand des in den Plugin-Einstellungen angegebenen Straßennamens.
2. [src/transform.js](src/transform.js) läuft als TRMNL Serverless Node.js (20) und fragt die Hausnummern, Kalender-ID und ABK-iCalendar-Datei ab. Im Dezember wird zusätzlich das Folgejahr abgefragt.
3. Das Script ermittelt jeweils den nächsten tatsächlichen Termin und liefert die Variablen für die Liquid-Vorlagen.
4. Aktualisierung alle **12 Stunden** (`refresh_interval: 720`) oder manuell per **Force Refresh**.

Der ABK veröffentlicht auch die Abholtermine der Gelben Tonnen/Säcke durch Remondis. Feiertagsverschiebungen werden aus den offiziellen iCalendar-Einträgen übernommen. Das Plugin schätzt keine Abholrhythmen.

## Import und Test

1. In TRMNL **Plugins → Private Plugins → Import new** öffnen und ein flaches ZIP aus den Dateien in `src/` importieren: `settings.yml`, `transform.js`, `shared.liquid`, `full.liquid`, `half_horizontal.liquid`, `half_vertical.liquid` und `quadrant.liquid` (ohne Unterordner).
2. In den Plugin-Einstellungen **Straße** und **Hausnummer** des Behälterstandorts eintragen. Diese Angaben gehören **nur in TRMNL**, nicht ins öffentliche GitHub-Repository.
3. Prüfen: Strategie = **Polling**, Serverless Language = **Node**. Die Polling-URL beginnt mit `https://abki.de/abki-services/strassennamen` und enthält `{{ street | url_encode }}`.
4. **Speichern** und **Force Refresh** ausführen. Unter **Edit Markup → Your Variables** sollten `bins`, `next_days` und `generated_at` erscheinen.
5. Die **Full**-Vorschau zunächst im OG- und dann im X-Modell testen. Im X zusätzlich Portrait prüfen. Die drei kleinen Ansichten stehen in den jeweiligen Tabs bereit.
6. Plugin in die Playlist aufnehmen. Bei Fehlern unter Plugin-Einstellungen **Debug Logs** aktivieren.

**Für ein bereits verbundenes Plugin:** Repository-Ordner `plugins/muellkalender` im TRMNL-GitHub-Sync verwenden und die neuen `src/`-Dateien von `main` übernehmen; ein zweites Plugin ist nicht nötig.

### Fehlermeldungen

- `Bitte Straße und Hausnummer ...`: Beide Formfelder sind noch leer.
- `Straße nicht im ABK-Verzeichnis`: Schreibweise oder die Polling-Antwort überprüfen.
- `Hausnummer ... nicht hinterlegt`: Adresse auf der offiziellen ABK-Seite kontrollieren; gegebenenfalls abweichender Behälterstandort.
- `Zeitlimit überschritten`: Die mehrstufige ABK-Abfrage war für TRMNL Serverless zu langsam.
- `Kein Termin`: Für die Fraktion enthält die Abfrage keine künftigen Leerungen; es wird nichts geschätzt.

## Teststatus

Der Direktabruf zeigte bei einem ersten echten TRMNL-Test vier Abfalltermine und eine korrekt sortierte Vollbildansicht. Die universellen OG/X-Vorlagen sind im Repository hinterlegt, **aber noch nicht auf beiden physischen Modellen geprüft**. Ein erster Preview-Test auf OG und X inklusive Portrait ist daher sinnvoll.

## Links

- [Offizielle ABK-Leerungstermine](https://www.abki.de/dienste/entsorgung-und-recycling/beh%C3%A4lter/leerungstermine.html)
- [Waste Collection Schedule – ABK-Implementierung](https://github.com/mampfes/hacs_waste_collection_schedule/blob/master/custom_components/waste_collection_schedule/waste_collection_schedule/source/abki_de.py)
- [TRMNL X Guide](https://trmnl.com/framework/docs/3.4/trmnl_x_guide/)
- [TRMNL Plugin-Import](https://help.trmnl.com/en/articles/10542599-importing-and-exporting-private-plugins)
- [TRMNL GitHub Sync](https://help.trmnl.com/en/articles/15977899-github-sync)
