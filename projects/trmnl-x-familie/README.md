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

### Was ist wo zu sehen?

Das aktuelle Layout [`dashboard/src/full.liquid`](dashboard/src/full.liquid) enthält **einen** zusammenhängenden Bildschirm: oben Wochentag, großes Datum und ein Gruß; darunter Geburtstage; links Termine, rechts Wetter und die zwei nächsten Abholungen.

| Uhrzeit (Europe/Berlin) | Begrüßung bzw. Fokus im aktuellen Template | Wetterperiode |
| --- | --- | --- |
| 05:00–07:59 | Guten Morgen | Vormittag 05–13 |
| 08:00–12:59 | Unser Tag | Vormittag 05–13 |
| 13:00–13:59 | Kita-Abholung | Nachmittag 13–18 |
| 14:00–16:59 | Familienzeit | Nachmittag 13–18 |
| 17:00–19:29 | Feierabend | Nachmittag bis 18, danach Abend/Nacht |
| ab 19:30 | Blick auf morgen | Abend/Nacht 18–05 |
| 00:00–04:59 | Nacht/Termine für heute | Abend/Nacht der vorausgehenden 18-Uhr-Periode |
| Sa/So | Unser Wochenende (Gruß hat Vorrang) | Wetter nach denselben Uhrzeiten |

**Wichtig:** Das ist die aktuelle Programmlogik, nicht die Fertigmeldung aller ursprünglich diskutierten Ideen. Es gibt derzeit **keine eigene Abendessen-, Rezept-, PV5- oder Hausstatus-Kachel**. Der Müllbereich ist im Template derzeit **auch nachts** sichtbar. Eine zukünftige Anzeige nur morgens/nachmittags/abends wäre eine **separate Codeänderung**, keine Einstellung in TRMNL.

Die Wetterwarnungen folgen eigenständigen Wegfenstern: **07–09 Uhr** (Arbeit/Kita) und **13–15 Uhr** (Kita-Abholung). Regen, Schnee und Schneeregen werden als **Prognose** ausgewertet, nicht als Echtzeit-Niederschlagsmeldung.

### Kalender

Die gewünschte Zusammenstellung umfasst genau sechs Kalender:
**Henrike**, **Boy**, **Jarne**, **Marit**, **Marit & Jarne** und **Familie**.

Das aktuelle Template zeigt maximal **sechs Termine**, nach Möglichkeit chronologisch, mit Kürzeln `H`, `B`, `J`, `M`, `M+J`, `F`. Die Zuordnung hängt von der tatsächlichen Kalendernamen-Variable aus Apple Calendar ab; die Datenstruktur ist **noch nicht live bestätigt**.

### Geburtstage

Geburtstage sollen **unabhängig von Apple-Kontakten** im [Birthday-Calendar-Recipe](https://trmnl.com/recipes/birthday-calendar-225941) gepflegt werden. Das Template reserviert eine Zeile für **maximal zwei Einträge**. Das Recipe bietet eine Einstellung „nur zeigen innerhalb von zwei Wochen“; **das Dashboard setzt die 14-Tage-Grenze bisher nicht selbst durch**. Die Hervorhebung eines heutigen Geburtstags und die verlässliche gemeinsame Merge-Übernahme stehen noch auf der Prüfliste.

## Inbetriebnahme – Reihenfolge

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
