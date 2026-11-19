# TRMNL Müllkalender Kiel

Monochromer Müllkalender für ein kleines E-Ink-Display: nächste Leerung von Restmüll (schwarz), Papier (blau), Bio (braun) und Gelbem Sack. Jeweils mit deutschem Wochentag, Datum und Resttagen. Die zuerst anstehende Abholung ist hervorgehoben.

**Datenfluss:** ABK Kiel / Remondis → [Waste Collection Schedule](https://github.com/mampfes/hacs_waste_collection_schedule) in Home Assistant → Home-Assistant-Kalender → lokaler REST-Befehl → TRMNL-Webhook. Home Assistant muss dafür **nicht** aus dem Internet erreichbar sein.

## Installation

1. In TRMNL ein privates Plugin mit **Webhook**-Strategie importieren. Die Dateien in [src](src) heißen `settings.yml` und `full.liquid`; alternativ beides als flaches ZIP verpacken und über **Plugins → Private Plugins → Import new** importieren.
2. [Waste Collection Schedule](https://github.com/mampfes/hacs_waste_collection_schedule) in Home Assistant installieren (HACS). Über **Einstellungen → Geräte & Dienste → Integration hinzufügen** den Anbieter **Abfallwirtschaftsbetrieb Kiel (ABK)** auswählen (`abki_de`). Die eigene Straße und Hausnummer **nur lokal** hinterlegen. Als Kalendernamen **ABK Kiel** wählen und die Entity-ID kontrollieren: erwartet wird `calendar.abk_kiel`.
3. Falls du statt GUI YAML nutzt, kannst du dies **lokal** in deiner `configuration.yaml` hinterlegen (nicht parallel zur GUI-Konfiguration):

   ```yaml
   waste_collection_schedule:
     sources:
       - name: abki_de
         args:
           street: DEINE_STRASSE
           number: "DEINE_HAUSNUMMER"
         calendar_title: ABK Kiel
   ```

4. In der **lokalen** Home-Assistant-Datei `secrets.yaml` hinterlegen:

   ```yaml
   trmnl_muellkalender_webhook_url: DEINE_EXAKTE_TRMNL_WEBHOOK_URL
   ```

   Die URL steht in den Einstellungen deines TRMNL-Plugins. **Nicht** ins öffentliche Repo committen.

5. Den Inhalt von [homeassistant/rest_commands.yaml](homeassistant/rest_commands.yaml) in die **bestehende** `rest_commands.yaml` **anhängen**, den Inhalt von [homeassistant/automations.yaml](homeassistant/automations.yaml) in die **bestehende** `automations.yaml` **anhängen**. Nicht die gesamten Dateien ersetzen. In `configuration.yaml` sind bereits die entsprechenden `!include`-Anweisungen erforderlich. Stimmen die Entity-IDs nicht, `calendar.abk_kiel` in allen drei Vorkommen anpassen.
6. Konfiguration überprüfen, Home Assistant neu starten und die Automation **TRMNL Müllkalender: ABK-Termine senden** einmal manuell ausführen.

## Betrieb

Home Assistant fragt mit `calendar.get_events` den Kalender für 90 Tage ab. Die Automation sendet um **06:10**, **12:10** sowie nach einem Neustart von Home Assistant die nächsten vier Abholtermine an TRMNL. Bei einem leeren Kalender findet kein Push statt. Fehlt eine Müllart in den ermittelten Terminen, wird **Kein Termin** angezeigt.

Die ABK-Quelle enthält auch die Gelbe Tonne/den Gelben Sack (Remondis) und berücksichtigt Feiertage. Betriebliche Ausfälle werden nicht live bestätigt. Event-Namen werden anhand der Textteile `rest`, `papier`, `bio` und `gelb` erkannt. Die Home-Assistant-Zeitzone sollte `Europe/Berlin` sein.

**Wichtig:** Bei der Entwicklung konnten die konkreten Live-Leerungstermine für eine Adresse nicht online verifiziert werden. Es werden **keine** mutmaßlichen Leerungstage oder Intervalle als echte Daten eingesetzt.

## GitHub-Sync

Beim Verknüpfen in TRMNL für dieses Repository im Feld **Folder in the repository** den Ordner `plugins/muellkalender` wählen. TRMNL speichert die Plugin-Dateien dann unter `plugins/muellkalender/src/` und kann neue GitHub-Änderungen zum manuellen Import anbieten. Die `homeassistant/`-Dateien gehören zur Dokumentation und werden nicht von TRMNL importiert.

## Offizielle Dokumentation

- [ABK Kiel – Leerungstermine](https://www.abki.de/dienste/entsorgung-und-recycling/beh%C3%A4lter/leerungstermine.html)
- [Waste Collection Schedule – ABK Kiel](https://github.com/mampfes/hacs_waste_collection_schedule/blob/master/doc/source/abki_de.md)
- [TRMNL – Plugin-ZIP-Import](https://help.trmnl.com/en/articles/10542599-importing-and-exporting-private-plugins)
- [TRMNL – GitHub Sync](https://help.trmnl.com/en/articles/15977899-github-sync)
