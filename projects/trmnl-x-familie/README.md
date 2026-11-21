# TRMNL X – Familiendashboard

Eigenständiges Projekt für das Küchen-TRMNL-X in **1872 × 1404 px**, 16 Graustufen, Querformat. Die Originalplugins unter `plugins/helmbo-wetter` und `plugins/muellkalender` werden nicht verändert.

## Projektstruktur

- `dashboard/`: Hauptansicht auf dem TRMNL X (großes Datum, sechs Apple-Kalender, Geburtstage, Wetter, die nächsten zwei Mülltermine)
- `wetter/`: Eigene TRMNL-Polling-Quelle für Open-Meteo / DWD ICON Seamless, Zeitfenster und Kitaweg-Warnungen
- `muellkalender/`: **Separate Projektkopie** des bestehenden ABKI-Plugins mit zusätzlicher Variable `next_two`; die Originalversion bleibt unabhängig
- `tests/`: Tests können in den jeweiligen Modulen liegen; automatisierte Tests werden durch GitHub Actions ausgeführt

## Verwendete TRMNL-Plugins

1. Offizielles Apple-Calendar-Plugin für sechs Kalender: Henrike, Boy, Jarne, Marit, Marit & Jarne, Familie.
2. Externes TRMNL-Recipe [Birthday Calendar](https://trmnl.com/recipes/birthday-calendar-225941), Geburtstage autark direkt in TRMNL.
3. Projektkopie `wetter` als neues **privates TRMNL-Plugin**.
4. Projektkopie `muellkalender` als **neues** privates Plugin, getrennt vom bisherigen Müllkalender.
5. `dashboard` als TRMNL **Plugin Merge** auf dem TRMNL X.

Die für das X gekaufte **Developer Edition** kann für private Plugins und Plugin Merge verwendet werden.

## Vorgaben

- Keine zusätzlichen Dienste, Proxmox-Container oder Home-Assistant-Abhängigkeiten.
- Keine Ecowitt-Anbindung aus dem Heimnetz; modellbasierte Temperatur via Open-Meteo.
- Wetter **05–13 / 13–18 / 18–05 Uhr**, Warnung für Wege **07–09 / 13–15 Uhr**.
- Müllkalender immer nur die **nächsten zwei tatsächlichen Leerungen**.
- Große Datumsanzeige ohne Uhr, reduzierte Grafik, serifenlose Schrift, klarer Graustufenkontrast.

## Stand und Integration

Entwicklungsstand auf Feature-Branch; **nicht** mit echten Kalender-/Geburtstagsdaten im TRMNL-Konto getestet.

Importiere die Inhalte der jeweiligen `src/`-Verzeichnisse als **getrennte private Plugins** (flache ZIPs), richte Apple Calendar und Birthday Calendar ein und verbinde die Plugin-Instanzen mit der Hauptansicht. Die tatsächlichen Datenfelder der beiden bestehenden Integrationen müssen vor Freigabe im TRMNL-Editor unter *Your Variables* geprüft und bei Bedarf im `dashboard/src/full.liquid` gemappt werden. TRMNL Merge darf nicht voraussetzen, dass eine externe Recipe-Datenstruktur automatisch dem Beispiel-Mapping entspricht.

**Wichtig:** Änderungen am Original-Müllkalender unter `plugins/muellkalender` werden für dieses Projekt nicht benötigt; dessen bestehender Sync kann unverändert bleiben.

