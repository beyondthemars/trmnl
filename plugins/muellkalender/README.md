# Müllkalender Kiel – eigenständiges TRMNL-Plugin

Dieses Plugin zeigt für eine in TRMNL hinterlegte Kieler Abholadresse **vier Abfallarten**: **Restmüll, Papier, Biomüll und Gelber Sack**. Für jede Abfallart wird der **nächste tatsächliche Abholtermin** aus den offiziellen ABKI-Kalenderdaten angezeigt. Die zeitlich nächste Leerung ist hervorgehoben.

**Abgrenzung:** Dies ist das **Originalplugin** unter `plugins/muellkalender`. Das TRMNL-X-Familienprojekt besitzt [eine eigene Kopie](../../projects/trmnl-x-familie/muellkalender/README.md), die zusätzlich die **nächsten zwei Leerungen insgesamt** bereitstellt. Beide Plugin-Ordner und ihre TRMNL-Instanzen müssen unabhängig bleiben.

## Funktionsumfang

- Vier Müllarten, jeweils mit nächstem gültigen Termin, Wochentag und verbleibenden Tagen.
- Abholung am **heutigen Tag** bleibt bis zum Tageswechsel enthalten (`Heute`).
- Berücksichtigt Feiertagsverschiebungen, soweit sie in den offiziellen ABKI-iCalendar-Einträgen enthalten sind.
- Holt im **Dezember** zusätzlich das Folgejahr, um Termine über den Jahreswechsel hinweg zu erhalten.
- Schätzt keine wöchentlichen oder zweiwöchentlichen Leerungsrhythmen; bei fehlenden Daten erscheint ein Fehler oder „Kein Termin“.
- Keine Verbindung zu Home Assistant, keine zusätzliche Software, kein eigener Server.

## Anzeige und unterstützte Layouts

| TRMNL-Ansicht | Umsetzung |
| --- | --- |
| Full (OG 800 × 480) | kontrastreiche Liste aller vier Müllarten |
| Full (TRMNL X quer/hoch) | größere Fläche und angepasste Darstellung nach Geräteprofil |
| Half horizontal | vier kompakte Termine |
| Half vertical | vier kompakte Termine |
| Quadrant | vier kompakte Termine |

Die Liquid-Vorlagen liegen in [`src/`](src/) und das gemeinsame CSS in [`src/shared.liquid`](src/shared.liquid). Es werden überwiegend Weiß, Schwarz und klar unterscheidbare Graustufen verwendet. **Die physischen OG/X- und Hochformatansichten sind noch nicht auf allen Geräten abschließend geprüft**; eine TRMNL-Vorschau ersetzt den Gerätetest nicht.

## Design – Minimal 2 (November 2026)

Alle vier Abholarten verwenden die **gleiche Zeilenstruktur**: links ein dezentes monochromes Tonnen-Symbol, mittig die Abfallart, rechts das Datum und die verbleibenden Tage. **Nur der erste Eintrag mit einem gültigen Termin** bekommt größere Schrift und etwas mehr Höhe; die übrigen drei Termine bleiben ruhiger und kleiner.

- Das bisherige **„ALS NÄCHSTES“** entfällt vollständig.
- Kein grauer Kartenhintergrund, keine senkrechte Hervorhebungsleiste und keine dicken Umrandungen.
- Nur dünne Trennlinien, Weißraum und klare Typografie.
- Alle vier Liquid-Ansichten verwenden diese Hierarchie; OG, X und Portrait bleiben unterstützt.
- Der Code zur ABKI-Abfrage und die Plugin-Einstellungen sind unverändert.

**Status:** Struktur und Markup sind geprüft. Eine Renderprüfung in TRMNL OG/X nach dem Sync ist weiterhin erforderlich.

## Datenquelle und Ablauf

Die externe Quelle ist der [Abfallwirtschaftsbetrieb Kiel (ABKI)](https://www.abki.de/dienste/entsorgung-und-recycling/beh%C3%A4lter/leerungstermine.html). Die dort bereitgestellten Angaben umfassen auch die Gelben Säcke/Tonnen, deren Abfuhr von Remondis durchgeführt wird.

1. TRMNL pollt das **ABKI-Straßenverzeichnis**, gefiltert nach dem eingegebenen Straßennamen.
2. [`src/transform.js`](src/transform.js) sucht den exakten Straßeneintrag und ermittelt über die ABKI-API die gültige Hausnummer bzw. Standort-ID.
3. Die weitere Abfrage liefert einen Kalenderdatei-Verweis; das Skript lädt die **iCalendar-Datei**.
4. `VEVENT`-Einträge mit `DTSTART` und `SUMMARY` werden auf Kalenderdatum und Müllart geprüft.
5. Für jede der vier Kategorien wird der nächste Termin **ab heute** ausgewählt und die Liste nach Tagen bis zur Abholung sortiert.
6. TRMNL gibt die Daten an die Liquid-Vorlagen weiter.

Die URL-Aufrufe erfolgen bei **TRMNL**. Das Serverless-Skript nutzt JavaScript/Node (ohne externe NPM-Pakete). Die Mehrfachabfrage hat im Code einen Abbruch-Timer von etwa **4,3 Sekunden**; ein langsamer ABKI-Dienst kann daher einen Zeitlimit-Fehler auslösen.

## Technische Einstellungen

| Feld | Konfiguration |
| --- | --- |
| Pluginname | `Müllkalender Kiel` |
| Datenstrategie | `polling` |
| Polling-URL | `https://abki.de/abki-services/strassennamen` mit Straßenfilter |
| Serverless | `node`, [`src/transform.js`](src/transform.js) |
| Aktualisierung | `refresh_interval: 720` = **alle 12 Stunden** |
| Zeitzone bei Terminen | `Europe/Berlin` |
| Formularfelder | `street` (Straße), `house_number` (Hausnummer) |
| Framework-Version | 3.4.6 |

**Datenschutz:** Trage die echte Straße und Hausnummer nur in deiner **TRMNL-Plugin-Instanz** ein. Der Quellcode enthält lediglich Platzhalter; persönliche Anschriften gehören nicht in `settings.yml`, Tests oder das GitHub-Repository.

## Einrichtung Schritt für Schritt

1. TRMNL öffnen und das gewünschte Gerät auswählen.
2. Unter **Plugins → Private Plugins** das bestehende Plugin öffnen – oder bei einer Erstinstallation **Import new** verwenden.
3. Für einen Import aus `src/` ein **flaches ZIP** erstellen: `settings.yml`, `transform.js`, `shared.liquid`, `full.liquid`, `half_horizontal.liquid`, `half_vertical.liquid`, `quadrant.liquid`. **Keinen übergeordneten Ordner** in das ZIP aufnehmen.
4. In den Plugin-Einstellungen **Straße** und **Hausnummer** des Abholstandorts hinterlegen (keine Postleitzahl erforderlich).
5. Strategie **Polling**, Serverless **Node** und die ABKI-Polling-URL kontrollieren. Dann speichern.
6. **Force Refresh** auslösen und **Edit Markup → Your Variables** öffnen.
7. Prüfen, dass `error` leer ist und dass `bins` die vier Abfallarten mit nachvollziehbarem Datum enthält. Keine echten Abholtermine aus Beispielwerten übernehmen.
8. Im Markup-Editor **Full**, **Half horizontal**, **Half vertical** und **Quadrant** anschauen; in der Vorschau passende OG-/X-Gerätegröße und gegebenenfalls Portrait ausprobieren.
9. Plugin in die TRMNL-Playlist aufnehmen und die Anzeige **am echten Gerät** verifizieren.

Wenn bereits eine TRMNL-Instanz mit GitHub Sync auf `plugins/muellkalender` eingerichtet ist, **diese Instanz weiterverwenden**. Ein Import des Familienprojekt-Müllkalenders ist **kein Update** dieses Plugins und darf dessen Sync-Zuordnung nicht ersetzen.

## Rückgabewerte

Das Serverless-Skript liefert unter anderem:

| Variable | Bedeutung |
| --- | --- |
| `bins` | Array mit **vier** Abfallarten, nach nächstem Abholtermin sortiert |
| `bins[].id` | `rest`, `paper`, `bio` oder `yellow` |
| `bins[].label` | lesbarer Name der Abfallart |
| `bins[].weekday` | Wochentag, z. B. `Di` |
| `bins[].date` | Datum ohne Jahr, z. B. `24.11.` |
| `bins[].days` | Tage bis zur nächsten Abholung; `9999` bei fehlendem Termin |
| `bins[].relative` | `Heute`, `Morgen`, `in N Tagen` oder `Kein Termin` |
| `next_days` | Tage bis zur allerersten Leerung, sonst `-1` |
| `generated_at` | Zeitpunkt der letzten Datenaufbereitung |
| `source` | Quellhinweis `ABK Kiel / Remondis` |
| `error` | leer bei Erfolg, sonst verständlicher Fehlertext |

**Nicht vorhanden:** `next_two` gehört ausschließlich zur **X-Projektkopie**, nicht zu diesem Original.

## Fehlerbehebung

| Meldung/Symptom | Prüfpunkt |
| --- | --- |
| „Bitte Straße und Hausnummer ...“ | Beide Formularfelder ausfüllen, erneut speichern |
| „Straße nicht im ABK-Verzeichnis gefunden“ | Schreibweise im ABKI-Straßenverzeichnis vergleichen |
| „Hausnummer ... nicht hinterlegt“ | Richtiges Grundstück bzw. abweichenden Behälterstandort prüfen |
| „Kein ABK-Kalender“ / „Keine ABK-Leerungen“ | ABKI-Abfrage, Kalenderjahr und Dienstverfügbarkeit prüfen |
| „Zeitlimit überschritten“ | ABKI-Server oder mehrstufige Abfrage zu langsam; später `Force Refresh` wiederholen |
| Leere Vorschau trotz Daten | `bins`, `error`, Liquid-Markup und Debug Logs prüfen |
| Leerungen scheinen veraltet | 12-Stunden-Intervall beachten; manuell refreshen und mit ABKI-Seite vergleichen |

Wenn die API ihr Format ändert, zuerst den Parser und die Mocktests prüfen; **keine Termine anhand des bisherigen Rhythmus erfinden**.

## Tests

Lokaler *Entwicklungs*-Test mit Node.js:

~~~sh
node plugins/muellkalender/tests/test.mjs
~~~

Der Test simuliert ABKI-Antworten und prüft Auswahl, Sortierung und Fehlerbehandlung. Er ist **kein Live-Abruf** und beweist nicht, dass die Website dauerhaft unverändert bleibt. Im produktiven Betrieb wird **kein Node-Prozess zu Hause** benötigt.

## Dateien und Wartung

- [`src/settings.yml`](src/settings.yml): Polling-URL, Formular und Intervall.
- [`src/transform.js`](src/transform.js): ABKI-Abfrage und Auswahl des nächsten Termins je Kategorie.
- [`src/shared.liquid`](src/shared.liquid): gemeinsames CSS.
- [`src/full.liquid`](src/full.liquid), [Half horizontal](src/half_horizontal.liquid), [Half vertical](src/half_vertical.liquid), [Quadrant](src/quadrant.liquid): Layouts.
- [`tests/test.mjs`](tests/test.mjs): Mocktests.
- [`.trmnlp.yml`](.trmnlp.yml): optionale lokale Entwicklungs-Konfiguration.

Offizielle Referenzen: [ABKI Leerungstermine](https://www.abki.de/dienste/entsorgung-und-recycling/beh%C3%A4lter/leerungstermine.html), [TRMNL Plugin-Import](https://help.trmnl.com/en/articles/10542599-importing-and-exporting-private-plugins), [TRMNL GitHub Sync](https://help.trmnl.com/en/articles/15977899-github-sync).
