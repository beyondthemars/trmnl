# TRMNL X – Familiendashboard für die Küche

Ein eigenständiges Projekt im Repository `beyondthemars/trmnl`. Das **TRMNL X** dient als ruhige Familienübersicht im Querformat. Hauptsächlich zeigt es die sechs Apple-Kalender; daneben folgen tageszeitbezogenes Wetter, Niederschlagswarnungen, Geburtstage und die nächsten zwei Müllabholungen.

**Status:** Der Quellcode liegt auf `main`, die Mocktests der Wetter- und Mülllogik wurden erfolgreich ausgeführt. **Eine vollständige Live-Integration mit echten Apple- und Geburtstagsdaten und ein Test auf dem physischen TRMNL X sind noch offen.** Ein Commit auf GitHub installiert nichts automatisch auf dem Gerät.

## Konzept und Grenzen

- **Gerät:** TRMNL X, Querformat, **1872 × 1404 physische Pixel**, 16 Graustufen (4 Bit). Das TRMNL-Framework arbeitet mit einem logischen Layout von ungefähr **1040 × 780**.
- **Look:** großes Datum, keine Uhr, klare serifenlose Schrift, Weiß/Grau/Schwarz, wenige Trennlinien und großzügige Abstände. Keine Schatten, dekorativen Symbole oder Mini-Diagramme.
- **Architektur:** eigenständige TRMNL-Plugins mit **Plugin Merge** als gemeinsamer Anzeigeschicht, keine zusätzliche Heimnetz-Infrastruktur.
- **Keine Ecowitt-Abfrage:** TRMNL kann private IP-Adressen im Heimnetz nicht direkt pollen; ein lokaler Übermittler ist ausdrücklich nicht gewünscht. Die „aktuelle Temperatur“ stammt daher **modellbasiert** aus Open-Meteo.
- **Privatsphäre:** Apple-Kalender und Geburtstage sind persönlich. Zugangsdaten und Geburtstagslisten bleiben in TRMNL, **nicht im GitHub-Repository**.

## Die Bausteine

| Baustein | Aufgabe | Anleitung | Status |
| --- | --- | --- | --- |
| **Apple Calendar** (offizielles TRMNL-Plugin) | sechs iCloud-Kalender und deren Termine | [Dashboard](dashboard/README.md#apple-calendar-sechs-kalender) | Eingabe und Merge-Daten noch live zu prüfen |
| **Birthday Calendar** (Recipe von Jasper) | autark verwaltete wiederkehrende Geburtstage | [Dashboard](dashboard/README.md#geburtstage) | Recipe verfügbar, Merge-Datenstruktur offen |
| **Familienwetter** (privat) | DWD-Prognose, drei Wetterperioden, Kitawege | [Wetter](wetter/README.md) | Quellcode + Mocktests vorhanden, TRMNL-Livetest offen |
| **Müllkalender Familie X** (privat) | die chronologisch nächsten zwei tatsächlichen Abholereignisse | [X-Müllkalender](muellkalender/README.md) | Quellcode + Mocktests vorhanden, TRMNL-Livetest offen |
| **Familien-Dashboard X** (privat, Plugin Merge) | gemeinsame Layoutdarstellung | [Dashboard](dashboard/README.md) | Layoutvorlage vorhanden, Felder-Mapping offen |

Das externe Rezept: [Birthday Calendar](https://trmnl.com/recipes/birthday-calendar-225941). Das offizielle Kalenderplugin: [Apple Calendar](https://trmnl.com/integrations/apple-calendar/).

### Dateien

~~~text
projects/trmnl-x-familie/
├── README.md
├── dashboard/
│   ├── README.md
│   └── src/                  # Plugin Merge, Layout
├── wetter/
│   ├── README.md
│   ├── src/                  # Open-Meteo Polling, transform.js, Layouts
│   └── tests/test.mjs
└── muellkalender/
    ├── README.md
    ├── src/                  # eigenständige ABKI-Plugin-Kopie
    └── tests/test.mjs
~~~

**Getrennte Wartung:** Die X-Projektkopie unter `muellkalender/` darf geändert werden, ohne `plugins/muellkalender/` anzufassen. Auch das bestehende `plugins/helmbo-wetter/` ist unabhängig.

## Darstellungs- und Zeitlogik

### Freigegebene Designreferenz

Die vom Nutzer ausgewählte **TRMNL-X-Vorschau „Montag, 23. November“** ist die verbindliche Stilreferenz für die spätere Anzeige. Das Dashboard verwendet eine typografisch klare **60/40-Aufteilung** in einer festen **1040 × 780 CSS-Pixel**-Fläche (physisch 1872 × 1404, 16 Graustufen):

1. Links oben: **Wochentag**, sehr großes **Datum**, **Jahr · Kalenderwoche**.
2. Rechts oben: ausschließlich **Sonnenaufgang und Sonnenuntergang** mit Zeit und einfachen, gut lesbaren Linien-Icons – **keine Begrüßung und keine „Familienübersicht“-Beschriftung**.
3. Darunter: dezente, hellgraue Geburtstagsleiste, maximal zwei Geburtstage.
4. Hauptbereich links (~60 %): bis zu sechs Familienkalender-Termine mit Uhrzeit, Titel und Kalenderkürzel.
5. Rechts (~40 %): Wetterperiode, Temperaturspanne, kurze Wetterbeschreibung, Kitaweg-Prognosen und genau zwei nächste Müllleerungen.
6. Unten: eine sehr zurückhaltende Fußzeile, keine Beispielwerte oder technischen Statusmeldungen.

Der Code liegt in [`dashboard/src/full.liquid`](dashboard/src/full.liquid) und [`dashboard/src/shared.liquid`](dashboard/src/shared.liquid). Dezente Flächen (`#eee`, `#ddd`) und klare schwarze Linien sind für das TRMNL X mit 16 Graustufen gewählt; **exakte Wirkung, Schriftlängen und Kontrast müssen auf dem physischen X kontrolliert werden**.

### Was hängt von der Tageszeit ab?

**Nicht** das grundlegende Layout und **nicht** der Kopf: Das Datum und die Sonnenzeiten erscheinen unabhängig von der Uhrzeit. Dynamisch wechseln die zugehörige Wetterperiode und die im Kalender ausgewählten Termine.

| Uhrzeit (Europe/Berlin) | Wetterperiode | Kalenderansicht |
| --- | --- | --- |
| 00:00–04:59 | Abend/Nacht der vorigen 18-Uhr-Periode | Termine des begonnenen Tages |
| 05:00–12:59 | Vormittag 05–13 | heute |
| 13:00–16:59 | Nachmittag 13–18 | heute (noch relevante Termine) |
| 17:00–17:59 | Nachmittag 13–18 | heute und morgen |
| 18:00–19:29 | Abend/Nacht 18–05 | heute und morgen |
| ab 19:30 | Abend/Nacht 18–05 | morgen |

Samstag/Sonntag bleiben im **gleichen visuellen Layout**; Wetterfenster und Kalenderfilter gelten weiter. Im Müllbereich sind aktuell auch nachts die beiden nächsten Leerungen sichtbar.

Die Kitawege werden getrennt bewertet: **07–09 Uhr** (Arbeit/Kita) und **13–15 Uhr** (Abholung). Sonnenzeiten werden über die **bereits bestehende Open-Meteo-Wetterquelle** geliefert (`daily.sunrise`, `daily.sunset`) – **kein zusätzlicher Dienst**. Alle wetterbezogenen Angaben sind Prognosen, keine Messung deiner Ecowitt-Station.

Es gibt derzeit **keine zusätzliche Abendessen-, Rezept-, PV5- oder Hausstatus-Kachel**. Die Apple-/Geburtstagsdaten müssen vor Inbetriebnahme im TRMNL-Merge weiterhin live zugeordnet werden.

### Kalender

Die gewünschte Zusammenstellung umfasst genau sechs Kalender:
**Henrike**, **Boy**, **Jarne**, **Marit**, **Marit & Jarne** und **Familie**.

Das aktuelle Template zeigt maximal **sechs Termine**, nach Möglichkeit chronologisch, mit Kürzeln `H`, `B`, `J`, `M`, `M+J`, `F`. Die Zuordnung hängt von der tatsächlichen Kalendernamen-Variable aus Apple Calendar ab; die Datenstruktur ist **noch nicht live bestätigt**.

### Geburtstage

Geburtstage sollen **unabhängig von Apple-Kontakten** im [Birthday-Calendar-Recipe](https://trmnl.com/recipes/birthday-calendar-225941) gepflegt werden. Das Template reserviert eine Zeile für **maximal zwei Einträge**. Das Recipe bietet eine Einstellung „nur zeigen innerhalb von zwei Wochen“; **das Dashboard setzt die 14-Tage-Grenze bisher nicht selbst durch**. Die Hervorhebung eines heutigen Geburtstags und die verlässliche gemeinsame Merge-Übernahme stehen noch auf der Prüfliste.

## Inbetriebnahme Reihenfolge

**Voraussetzung:** Dein TRMNL X ist einem Konto mit **Developer Edition** zugeordnet. Die Developer Edition für das X ist vorhanden. Das Gerät muss in TRMNL erreichbar sein. Richte die Datenquellen zunächst **einzeln** ein, bevor du das große Dashboard aktivierst.

1. **Gerät und Zeitzone prüfen.** In TRMNL das X wählen, Sprache/Zeitzone sinnvoll einstellen (**Europe/Berlin**). Displayformat Querformat wählen. Falls möglich, mit einem bereits funktionierenden Plugin prüfen, ob das Gerät Bilder korrekt lädt.
2. **Apple Calendar einrichten.** Die offizielle Integration hinzufügen, Zugriff auf die sechs Kalender herstellen und jeden Kalender auf richtige Termine prüfen. Sensible Anmeldedaten nicht in GitHub kopieren. [Details](dashboard/README.md#apple-calendar-sechs-kalender).
3. **Geburtstags-Recipe installieren.** [Birthday Calendar](https://trmnl.com/recipes/birthday-calendar-225941) installieren bzw. für persönliche Einstellungen forken, Geburtstage dort eintragen und die eigenständige Darstellung testen. [Details](dashboard/README.md#geburtstage).
4. **Familienwetter importieren.** Aus [`wetter/src/`](wetter/src/) ein **flaches ZIP** bauen (Inhalte direkt im ZIP-Hauptverzeichnis), in TRMNL **Import new** wählen, Wetterposition einstellen, **Force Refresh** durchführen. Die Variablen `period`, `current`, `paths` prüfen. [Details](wetter/README.md#einrichtung).
5. **Müllkalender Familie X importieren.** Nur die Dateien aus [`muellkalender/src/`](muellkalender/src/) als **separates Plugin** importieren. Straße und Hausnummer ausschließlich in TRMNL hinterlegen, **Force Refresh**, dann `next_two` prüfen. **Nicht** die bestehende Originalinstanz überschreiben. [Details](muellkalender/README.md#einrichtung).
6. **Dashboard importieren.** Aus [`dashboard/src/`](dashboard/src/) ein eigenes flaches ZIP bilden; Strategie muss **Plugin Merge** sein. Quellen über `plugin_instance_select` wählen. Falls das Auswahlfeld eine Quelle nicht zeigt, die Quelle vorübergehend einer Playlist bzw. einem Mashup hinzufügen. [Details](dashboard/README.md#einrichtung-und-datenzuordnung).
7. **Echte Variablen abgleichen.** In **Edit Markup → Your Variables** die vier eingebundenen Objekte ansehen und die tatsächlichen Schlüssel von Apple Calendar und Birthday Calendar mit den im Template erwarteten vergleichen. **Nicht** einfach eine leere oder falsche Kalenderansicht als fertig akzeptieren.
8. **Vorschau prüfen.** Full-Layout im TRMNL-X-Profil auf Überläufe, Schriftgrößen, Graustufen, lange Namen, Ganztagstermine, fehlende Geburtstage, Schnee und zwei Müllleerungen am selben Tag prüfen.
9. **Auf dem Gerät testen.** Nur die geprüfte Dashboard-Instanz zur gewünschten Playlist nehmen; Datum, tatsächliche Kalenderinhalte und zeitliche Wechsel über mehrere Refreshes beobachten.
10. **Erst danach produktiv setzen.** Vorher die bestehende Playlist nicht ersetzen. Bei Problemen einfach auf die vorherige Ansicht zurückwechseln; die Originalplugins bleiben unberührt.

**TRMNL-Sync-Regel:** In einem gemeinsamen Repository bekommt **jede Plugin-Instanz ihren eigenen Ordner**. Für das Familienprojekt daher als GitHub-Sync-Pfad z. B. `projects/trmnl-x-familie/wetter`, `projects/trmnl-x-familie/muellkalender` und `projects/trmnl-x-familie/dashboard` verwenden. GitHub → TRMNL wird manuell übernommen; TRMNL → GitHub kann bei Speichern automatisch synchronisieren. Keine Instanz auf den Ordner eines anderen Plugins legen.

## Status und Freigabe-Checkliste

- [x] X-Projekt in separatem GitHub-Ordner auf `main`.
- [x] Bestehende Originalplugins durch Projektdateien nicht überschrieben.
- [x] Mocktests für Wegwarnungen/Wetterfenster und nächste zwei Müllleerungen.
- [ ] Wetterplugin in TRMNL importiert und echte Open-Meteo-Antwort bestätigt.
- [ ] Zweiten Müllkalender in TRMNL importiert und echte ABKI-Daten bestätigt.
- [ ] Sechs Apple-Kalender vollständig auslesbar.
- [ ] Geburtstags-Recipe im Merge mit korrekten künftigen Geburtstagen verfügbar.
- [ ] Kalender- und Geburtstagsfelder anhand `Your Variables` zugeordnet.
- [ ] Keine fehlerhaften Platzhalter im X-Layout.
- [ ] Datum, Zeitzone, Layout und Graustufen auf realem TRMNL X geprüft.
- [ ] Umschaltung der Zeitfenster und Vorschau auf morgen überprüft.

## Betrieb, Wartung und Sicherheit

- **Aktualisierungsintervalle:** Wetter und Dashboard sind im Repository auf **15 Minuten** gesetzt, der Familien-Müllkalender auf **720 Minuten (12 Stunden)**. Der Gerätere­fresh kann zusätzlich begrenzen; TRMNL zeigt kein sekündlich aktualisiertes Dashboard.
- **Ausfall einer Quelle:** Vorhandene Daten können zeitweise stehen bleiben oder fehlen. Das UI hat für mehrere Fälle Platzhalter; deren Anzeige ist ein **Fehlerhinweis**, keine inhaltliche Bestätigung.
- **Datengeheimnisse:** Keine iCloud-Zugangsdaten, Geburtstagseinträge, Straßennamen/Hausnummern oder private API-URLs committen. TRMNL erhält die für das Rendering notwendigen Kalender- und Geburtstagsdaten.
- **Versionspflege:** Pro Plugin Änderungen getrennt einspielen, Preview und Test durchführen, erst danach produktive Anzeige aktualisieren.
- **Fehlersuche:** Zuerst Einzelplugin prüfen (`Force Refresh`, `Your Variables`, Health/Logs), dann die Merge-Zuordnung, zuletzt Playlist und Gerät.
- **Rollback:** Zuletzt funktionierende Plugin-Instanz bzw. Playlist wieder aktivieren; für GitHub-Änderungen den vorherigen Commit verwenden. Die alten Originalplugins nicht durch X-Projektdateien ersetzen.

## Weiterführende Links

- [Dashboard: Datenmapping, Layout, Tests](dashboard/README.md)
- [Wetter: Open-Meteo und Wegwarnungen](wetter/README.md)
- [Müllkalender X: zwei Leerungen](muellkalender/README.md)
- [TRMNL Plugin Strategies / Plugin Merge](https://help.trmnl.com/en/articles/17434705-plugin-strategies)
- [TRMNL Plugin-Import](https://help.trmnl.com/en/articles/10542599-importing-and-exporting-private-plugins)
- [TRMNL GitHub Sync](https://help.trmnl.com/en/articles/15977899-github-sync)
- [TRMNL X Guide](https://trmnl.com/framework/docs/3.4/trmnl_x_guide/)
