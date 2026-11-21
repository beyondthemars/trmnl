# Familien-Dashboard X – gemeinsames Displaylayout

Dieses private TRMNL-Plugin ist die **Anzeigeschicht** des [Familiendashboard-Projekts](../README.md). Es beschafft **keine Wetter-, Abfall-, Kalender- oder Geburtstagsdaten selbst**, sondern führt die Daten vier anderer TRMNL-Plugin-Instanzen per **Plugin Merge** in einem einheitlichen Layout zusammen.

Das Ziel ist eine **ruhige, schnell erkennbare Küchenübersicht** auf dem **TRMNL X im Querformat**: großes Datum, sechs Apple-Kalender, kompakte Geburtstage, Wetter für die laufende Tagesperiode und die nächsten zwei Müllleerungen. Keine Uhrzeitanzeige, kein lokaler Dienst.

> **Wichtiger Status:** Das Layout ist als Entwicklungs-/Integrationsvorlage im Repository vorhanden. Die reale Datenstruktur von **Apple Calendar** und **Birthday Calendar** ist für dieses Konto noch **nicht geprüft**. Deshalb ist die Installation ein **Integrationstest**, nicht schon ein fertiger produktiver Rollout.

## Aufbau

| Bereich | Layout | Datenherkunft |
| --- | --- | --- |
| Datum/Wochentag/Kalenderwoche | ganz oben, groß | Zeit-/Zeitzonenwerte im TRMNL-Liquid-Template |
| Sonnenaufgang/-untergang | rechts oben, zwei Zeiten mit einfachen Icons | Open-Meteo über `weather_source.sun` |
| Geburtstage | schmale Zeile unter dem Datum | externes Birthday-Calendar-Recipe |
| Familienkalender | ca. 60 % der Hauptfläche, maximal sechs Termine | offizielle TRMNL-Apple-Calendar-Integration |
| Familienwetter | obere rechte Spalte | [Wetterplugin](../wetter/README.md) |
| Müllabfuhr | untere rechte Spalte | [separates X-Müllplugin](../muellkalender/README.md) |

**Visuelle Referenz:** die vom Nutzer ausgewählte TRMNL-X-Vorschau vom 23. November 2026. Das Layout verwendet bewusst **keinen Begrüßungs- oder Familienübersichtstext rechts oben**, sondern Sonnenaufgang und Sonnenuntergang. Der Hintergrund ist weiß, Geburtstage und Regenhinweise sind hellgrau, Kalender und Müll erscheinen als ruhige Zeilen. Die Sonnenzeiten sind dynamische Daten; in den Plugin-Dateien stehen **keine fest hinterlegten Beispielzeiten**.

Das Full-Layout ist in [`src/full.liquid`](src/full.liquid) enthalten; Gestaltung und Graustufen in [`src/shared.liquid`](src/shared.liquid). Die Datei [`src/settings.yml`](src/settings.yml) deklariert Plugin Merge und die vier Quell-Auswahlfelder.

Aktuell existiert nur **`full.liquid`** als Ansicht: **keine Half-/Quadrant-Vorlagen** für das gemeinsame Dashboard. Es ist für das TRMNL X (physisch **1872 × 1404 px**, 4 Bit/16 Graustufen) im Querformat vorgesehen; das Framework-Layout verwendet ungefähr **1040 × 780**. Die grafische Darstellung auf dem realen X ist noch zu prüfen.

## Quellen und Plugin-Merge-Einstellungen

Die Datei `src/settings.yml` enthält vier `plugin_instance_select`-Felder:

| Schlüssel im Dashboard | Soll-Quelle | Typ im bestehenden YAML |
| --- | --- | --- |
| `calendar_source` | Apple Calendar, sechs ausgewählte Kalender | `plugin_keyname: apple_calendar` |
| `birthday_source` | Birthday Calendar (Jasper) | `plugin_keyname: private_plugin` |
| `weather_source` | Familienwetter Kiel | `plugin_keyname: private_plugin` |
| `trash_source` | Müllkalender Familie X | `plugin_keyname: private_plugin` |

Die Felder sind TRMNL-seitig **Auswahlfelder für eine konkrete Plugin-Instanz**, nicht selbst die API und auch keine hart codierten IDs. Die tatsächlichen Quellinstanzen **müssen vorhanden sein und Daten besitzen**.

**Wichtig bei der Auswahl:** Nach TRMNL-Dokumentation werden im Instanz-Auswahlfeld nur Plugins angezeigt, die derzeit **in einer Playlist oder einem Mashup** sind. Für die Einrichtung daher die Quellplugins bei Bedarf vorübergehend einer Playlist zuordnen. Nach Auswahl und erfolgreichem Test kann die Playlist wieder bereinigt werden; Plugin Merge kann ausgewählte Quellen weiterhin laden.

Die Beispiele `calendar_source.events` und `birthday_source.birthdays` sind **Annahmen**, keine durch deine Instanzen bestätigten Datenfelder. Die Namen können bei nativen Integrationen und Recipes abweichen.

## Apple Calendar: sechs Kalender

Die gewünschte Quelle ist das [offizielle Apple-Calendar-Plugin](https://trmnl.com/integrations/apple-calendar/).

| Kalender | Kürzel im Entwurf |
| --- | --- |
| Henrike | `H` |
| Boy | `B` |
| Jarne | `J` |
| Marit | `M` |
| Marit & Jarne | `M+J` |
| Familie | `F` |

**Einrichtung:**

1. In TRMNL die offizielle Apple-Calendar-Integration öffnen und verbinden. Verwende die dort angebotenen und zu deinem Apple-Konto passenden Authentifizierungsoptionen.
2. Die sechs Familienkalender auswählen. Prüfen, dass Termine aus **allen sechs** Kalendern im Originalplugin erscheinen.
3. Ganztagstermine, doppelt belegte Uhrzeiten, Termine über Mitternacht, wiederkehrende Termine und den nächsten Tag testen.
4. Die Apple-Calendar-Instanz im Dashboard über `calendar_source` auswählen.
5. Im **Dashboard → Edit Markup → Your Variables** die tatsächlich gelieferten Datenfelder öffnen: Wo liegt das **Ereignisarray**? Wie heißen **Titel**, **Startzeit**, **Ganztagskennzeichen** und **Kalendername**?
6. Diese Schlüssel mit [`src/full.liquid`](src/full.liquid) abgleichen. Der Entwurf probiert für das Ereignisarray `events`, `data.events`, `calendar_events` und `data.calendar_events`; bei den einzelnen Terminen weitere Feldnamen. Falls die Quelle anders strukturiert ist, **Markup gezielt anpassen**.
7. Erst danach die Kürzel und die chronologische Sortierung mit echten Beispielen aller sechs Kalender überprüfen.

**Aktueller Code:** Es werden höchstens **sechs passende Termine** gerendert. Ganztagstermine erhalten „Ganzt.“. Fehlt eine Kalendernamen-Zuordnung oder lautet der Name anders, erscheint statt `H`/`B` usw. das Ersatzkürzel `–`. Mit `+ N weitere Termine` wird auf Überlauf hingewiesen.

**Nicht als bestätigt ansehen:** Ob ein Termin direkt mit `calendar_name` geliefert wird, ob das native Plugin alle sechs Namen ausgibt und ob der aktuelle Filter bei sämtlichen Zeit-/Ganztagsformaten passt.

## Geburtstage

Geburtstage werden bewusst **nicht** aus Apple-Kontakten abgeleitet. Als eigenständige Quelle dient das [Birthday-Calendar-Recipe von Jasper](https://trmnl.com/recipes/birthday-calendar-225941).

**Pflege im Recipe:** Das Recipe verlangt eine Geburtstagsliste im Format `Name ; YYYY-MM-DD` (mit Geburtsjahr) oder `Name ; MM-DD` (ohne Jahr) und bietet eine Altersanzeige sowie die Auswahl „nur innerhalb der nächsten zwei Wochen“, drei Wochen usw. **Keine echten Geburtsdaten im öffentlichen GitHub committen.**

**Schritte:**

1. Recipe in TRMNL installieren, bei Bedarf für eine bearbeitbare eigene Instanz **forken**.
2. Geburtstage **nur dort** eintragen und jährliche Wiederholung im **eigenständigen Recipe** prüfen.
3. Altersanzeige und gewünschten Zwei-Wochen-Zeitraum im Recipe einstellen.
4. Die Instanz im Dashboard unter `birthday_source` auswählen.
5. Im Merge unter **Your Variables** prüfen, ob die berechneten zukünftigen Geburtstage überhaupt als **strukturierte Array-Daten** verfügbar sind. Das reine gerenderte Kuchenmotiv des Recipes ist keine verwendbare Datenliste.
6. Falls eine Liste vorhanden ist, tatsächliche Felder für **Name**, **nächster Geburtstag**, **Tage bis Geburtstag** und ggf. **Alter** ermitteln und die Liquid-Vorlage daran anpassen. Falls keine strukturierte Ausgabe existiert, muss das Recipe ggf. **im eigenen Fork erweitert** oder eine andere TRMNL-interne statische Datenquelle gewählt werden – **kein eigener Server**.

**Was der aktuelle Entwurf wirklich kann:** Er zeigt maximal **zwei Einträge**, sofern ein Array unter `upcoming_birthdays`, `upcoming`, `birthdays` oder entsprechender `data.*`-Struktur vorhanden ist.

**Was noch nicht umgesetzt bzw. verifiziert ist:** Der Dashboard-Code filtert Geburtstage **nicht selbst auf 14 Tage**, hebt einen Geburtstag **heute nicht gesondert hervor** und garantiert keine bereits berechnete Sortierung nach dem nächsten Datum. Das sind Abnahmepunkte für die spätere Integration. Die Recipe-Einstellung „nicht zeigen, wenn kein Geburtstag ansteht“ kann zudem die Verfügbarkeit als Merge-Quelle beeinflussen und muss mit echter Instanz getestet werden.

## Wetter und Müll

### Familienwetter

Das eigenständige [Familienwetter-Plugin](../wetter/README.md) ruft Open-Meteo/DWD ab. Das Dashboard erwartet unter `weather_source` insbesondere:

- `period.title`, `period.hours`, `period.temperature_range`, `period.description`, `period.precipitation_probability`
- `current.temperature` – **Modellwert**, keine Ecowitt-Messung; als Quelle verfügbar, aber in der gewählten Referenzansicht nicht zusätzlich zur Temperaturspanne dargestellt
- `paths[]` mit `hours`, `status` und `text` für die Kitawege

Die Wetterperioden **05–13**, **13–18** und **18–05 Uhr** sowie die Sonnenzeiten kommen vom selben Familienwetter-Plugin. Der Kopf zeigt `weather_source.sun.sunrise` und `weather_source.sun.sunset` als Ortszeiten (HH:MM). Fehlen Daten, erscheinen `–:–` statt erfundener Zeiten. Die Sonnenzeiten werden aus `daily.sunrise`/`daily.sunset` für das **aktuelle lokale Datum** berechnet.

### Müllkalender Familie X

Die [separate ABKI-Projektkopie](../muellkalender/README.md) liefert `next_two`: die **zwei chronologisch nächsten tatsächlichen Abholungen insgesamt**, nicht je Abfallart eine. Das Dashboard zeigt `label`, `weekday` und `date` an.

**Achtung:** Der Müllblock steht im derzeitigen Full-Template **unabhängig von der Tageszeit** im rechten unteren Bereich. Eine ausdrücklich auf Morgen, Nachmittag und Abend begrenzte Sichtbarkeit ist **noch nicht als Bedingung programmiert**.

## Zeitabhängiges Verhalten im Code

Datum, Kalenderwoche und Tagesfilter leitet das Template in Liquid aus `now` und `trmnl.user.utc_offset` ab. Die Sonnenzeiten kommen aus dem Wetterplugin, dessen Auswertung `Europe/Berlin` verwendet. Ein Realtest einschließlich Sommerzeitwechsel bleibt erforderlich.

| Zeitraum | Kalender |
| --- | --- |
| 00:00–04:59 | Termine des begonnenen Tages |
| 05:00–12:59 | heutige Termine |
| 13:00–16:59 | heute noch relevante Termine |
| 17:00–19:29 | heute und morgen |
| ab 19:30 | morgige Termine |
| Wochenende | identisches Layout, gleicher Zeitfilter |

Die Gestaltung bleibt **zu allen Uhrzeiten gleich**: keine wechselnde Begrüßung, kein zusätzlicher Header. Das Wetter-Plugin wählt unabhängig die Prognoseperiode 05–13, 13–18 oder 18–05. Die Anzeige wird beim nächsten TRMNL-Refresh aktualisiert; bei gleichzeitigen oder langen Terminen ist das Ergebnis auf dem echten X zu prüfen.

### Layout-Abnahme

- **Datum** groß und lesbar, auch bei langen deutschen Monatsnamen.
- **Kopf rechts** mit Sonnenaufgang und Sonnenuntergang, falls bekannt; bei fehlenden Daten deutliche Platzhalter statt Beispielzeiten.
- **Geburtstage** als eine hellgraue Leiste, kein verspielter Kuchen.
- **Termine** als ruhige tabellarische Zeilen, sechs sichtbare maximal, Kürzel in hellgrauen Feldern.
- **Wetter/Kitawege/Müll** auf der rechten Seite ohne überlappende Texte; mögliche oder erwartete Niederschläge in hellgrauer Zeile.
- **Graustufen** (16 Stufen), Schriftkanten, Zeilenhöhen und Trennlinien auf TRMNL X im Querformat prüfen.

Der Strukturtest `node projects/trmnl-x-familie/dashboard/tests/layout.test.mjs` kontrolliert die wesentlichen CSS- und Datenbindungen. Er ersetzt **keinen echten Rendering- oder Gerätetest**.

## Einrichtung und Datenzuordnung

1. Die vier Quellplugins wie in der [Projekt-README](../README.md#inbetriebnahme-reihenfolge) beschrieben einrichten, unabhängig testen und `Force Refresh` auslösen.
2. Aus **`projects/trmnl-x-familie/dashboard/src/`** ein **flaches ZIP** mit `settings.yml`, `full.liquid` und `shared.liquid` erstellen.
3. In TRMNL eine **neue private Plugin-Instanz** importieren. Sie muss `Familien-Dashboard X` heißen und Strategie **Plugin Merge** nutzen.
4. Nach dem Import die vier `plugin_instance_select`-Auswahlfelder befüllen. Wenn eine Instanz fehlt, diese vorübergehend in eine Playlist/ein Mashup aufnehmen.
5. **Edit Markup → Your Variables** öffnen. Prüfen, ob unter `calendar_source`, `birthday_source`, `weather_source` und `trash_source` tatsächlich Objekte mit Daten erscheinen.
6. **Zuerst Wetter und Müll prüfen:** `period`, `paths`, `next_two`. Für Kalender und Geburtstage die echten Datenfelder notieren und die oben beschriebenen Mapping-Stellen in `full.liquid` entsprechend ändern.
7. In der Vorschau **TRMNL X, Full, Querformat** auswählen. Datum, lange Termintexte, Kürzel, Geburtstage, Wetterwarnungen, zwei Mülltermine und Fehlerzustände kontrollieren.
8. Die Anzeige auf dem **physischen X** prüfen – insbesondere Kontrast der Graustufen, Abstand, Lesbarkeit aus etwa zwei Metern und abgeschnittene Wörter.
9. Prüfen, wie sich das Layout morgens, 13 Uhr, 18 Uhr, nach 19:30 Uhr und am Wochenende verhält. Ein Test am Übergang zur Sommer-/Winterzeit ist für die Datumslogik sinnvoll.
10. Erst nach erfolgreicher Abnahme das Dashboard in der gewünschten Playlist sichtbar machen. Vorherige Playlist beibehalten, um einfach zurückwechseln zu können.

**GitHub Sync:** Für die neue Dashboard-Instanz ausschließlich den Ordner `projects/trmnl-x-familie/dashboard` verwenden. Nicht mit `plugins/muellkalender`, `plugins/helmbo-wetter` oder einem anderen Plugin-Ordner verbinden.

## Fehlersuche

| Symptom | Prüfen |
| --- | --- |
| Geburtstagszeile meldet „Datenzuordnung prüfen“ | Ist das Recipe verbunden? Gibt es ein strukturiertes Array? `Your Variables` ansehen |
| Kalender leer, Originalplugin zeigt Termine | Merge-Keyname oder Eventarray/Datumsfelder weichen ab; nicht blind alle Feldnamen ersetzen |
| Termine haben Kürzel `–` | tatsächliche Kalendernamen prüfen und `case event_owner` anpassen |
| Termine am falschen Tag | Zeitformat, Zeitzone, `utc_offset`, Ganztagskennzeichen und Sommerzeit prüfen |
| Wetter-/Müllbereich leer | Einzelplugin laden, `Force Refresh`, dann Merge-Zuordnung kontrollieren |
| „Müllkalender verbinden / Plugin aktualisieren“ | versehentlich **Original** statt X-Projektkopie ausgewählt oder `next_two` fehlt |
| Sonnenzeiten fehlen im Kopf | Wetterplugin mit `daily=sunrise,sunset` aktualisieren, `weather_source.sun` und Quelle prüfen |
| Text abgeschnitten | Full-Vorschau im X-Format, maximale Terminzahlen, CSS in `shared.liquid` prüfen |
| Daten trotz erfolgreichem Quellplugin veraltet | Polling-Intervall, Plugin Health und TRMNL-Geräteabruf prüfen |

## Abnahme- und Sicherheitskriterien

Die Anzeige ist erst produktionsreif, wenn **alle vier** Quellen verbunden sind, die sechs Kalender korrekt gekennzeichnet werden, Geburtstage korrekt sortiert sind, die Wetterwarnungen plausible Werte liefern, die nächsten zwei Müllleerungen stimmen und das Bild auf dem echten TRMNL X sauber aussieht.

In dieses Repository **keine Apple-Zugangsdaten, Familientermine, Geburtstagslisten oder Straßenadresse** eintragen. Die Cloud sieht die für die Anzeige übertragenen Daten; das ist bei der Entscheidung für TRMNL als alleinige Laufzeit bewusst zu berücksichtigen.

## Referenzen

- [TRMNL Plugin-Strategien / Plugin Merge](https://help.trmnl.com/en/articles/17434705-plugin-strategies)
- [TRMNL Formularfelder / plugin_instance_select](https://help.trmnl.com/en/articles/10513740-custom-plugin-form-builder)
- [Remix a Native Plugin](https://help.trmnl.com/en/articles/17506902-remix-a-native-plugin)
- [Birthday Calendar Recipe](https://trmnl.com/recipes/birthday-calendar-225941)
- [TRMNL X Framework](https://trmnl.com/framework/docs/3.4/trmnl_x_guide/)
