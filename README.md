# TRMNL – Plugins und Projekte

Dieses Repository enthält unabhängige Plugins und ein eigenes Familiendashboard für TRMNL-E-Paper-Displays. Es ist **kein einzelnes installierbares Gesamtpaket**: Jedes Plugin hat einen separaten TRMNL-Eintrag und eine eigene Datenquelle. Das TRMNL-X-Familiendashboard kombiniert mehrere dieser Quellen.

Die Datenbeschaffung läuft im Regelbetrieb über **TRMNL Cloud** und die jeweiligen externen APIs. Für diese Projekte sind **weder Home Assistant noch Proxmox, eigene Container, Cronjobs oder ein öffentlich erreichbarer Server** vorgesehen. Entwicklungswerkzeuge auf einem Rechner sind optional und laufen nur bei Bedarf.

## Orientierung

| Ordner | Aufgabe | Datenquelle | Zielgerät / Stand |
| --- | --- | --- | --- |
| [`plugins/helmbo-wetter/`](plugins/helmbo-wetter/README.md) | Wetter und Küsteninformationen für Fanø | Open-Meteo (DMI-Modell), DMI-Beobachtungen und Gezeiten | eigenständige 800 × 480-Ansicht; TRMNL-Livetest nach Einrichtung erforderlich |
| [`plugins/muellkalender/`](plugins/muellkalender/README.md) | Klassischer Kieler Müllkalender: je Abfallart der nächste Termin | ABKI, einschließlich dort veröffentlichter Gelber-Sack-Termine | TRMNL OG und X; Originalplugin |
| [`projects/trmnl-x-familie/`](projects/trmnl-x-familie/README.md) | Familienzentrale in der Küche, mit Kalendern, Geburtstagen, Wetter und zwei Müllleerungen | Apple Calendar, Birthday Calendar, Open-Meteo und ABKI | TRMNL X, Querformat; Integration noch nicht vollständig live getestet |

### Verzeichnisstruktur

~~~text
trmnl/
├── README.md
├── plugins/
│   ├── helmbo-wetter/
│   │   └── src/
│   └── muellkalender/
│       ├── src/
│       └── tests/
├── projects/
│   └── trmnl-x-familie/
│       ├── dashboard/       # Zusammengeführte TRMNL-X-Ansicht
│       ├── wetter/          # Eigenes Wetter-Polling-Plugin
│       └── muellkalender/   # Unabhängige Projektkopie des ABKI-Plugins
└── .github/workflows/
    └── trmnl-plugins-tests.yml
~~~

**Wichtig:** `plugins/muellkalender` und `projects/trmnl-x-familie/muellkalender` sind zwei **unabhängige** Plugins. Änderungen am Familienprojekt dürfen den normalen Müllkalender nicht unbeabsichtigt verändern.

## Was brauche ich?

- Ein eingerichtetes TRMNL-Gerät und ein TRMNL-Konto.
- Für eigene/private Plugins und Plugin Merge: **TRMNL Developer Edition/Add-on** oder eine geeignete BYOD-Berechtigung. Für das TRMNL X ist die Developer Edition vorhanden.
- Internetzugang des Geräts bzw. der TRMNL-Cloud für die Datenabfragen.
- Für einzelne Integrationen die jeweils unter ihrem README genannten Einstellungen.

Es gibt **keine zentrale `.env`-Datei** und keine projektweit zu startende Anwendung. Persönliche Daten, Zugangsdaten, iCloud-Passwörter und Hausadressen gehören in die **TRMNL-Plugin-Einstellungen**, nicht in GitHub.

## Schnellstart – welches Plugin möchte ich einrichten?

1. **Fanø-Wetter:** Lies [Helmbo-Wetter – Einrichtung](plugins/helmbo-wetter/README.md#einrichtung-in-trmnl).
2. **Normaler Müllkalender:** Lies [Müllkalender Kiel – Einrichtung](plugins/muellkalender/README.md#einrichtung-schritt-für-schritt).
3. **Küchen-Dashboard auf TRMNL X:** Beginne bei [Familiendashboard – Inbetriebnahme](projects/trmnl-x-familie/README.md#inbetriebnahme-reihenfolge) und richte die Komponenten in der dort angegebenen Reihenfolge ein.

Ein privates Plugin kann über **Plugins → Private Plugins → Import new** aus einem **flachen ZIP** importiert werden. Ein flaches ZIP enthält `settings.yml`, die benötigten `.liquid`-Dateien und gegebenenfalls `transform.js` oder `transform.py` unmittelbar im ZIP-Hauptverzeichnis. **Nicht den gesamten GitHub-Ordner zippen**. Alternativ kann eine einzelne Plugin-Instanz über TRMNL **GitHub Sync** mit ihrem eigenen Unterordner verbunden werden.

## Wie arbeiten die Plugins?

- **Polling:** TRMNL ruft öffentlich erreichbare Wetter- oder ABKI-URLs ab.
- **Serverless:** TRMNL verarbeitet die Antwort mit JavaScript oder Python und stellt vorbereitete Variablen bereit. Die Dateien `transform.js` und `transform.py` laufen **bei TRMNL**, nicht im Heimnetz.
- **Liquid/HTML/CSS:** Die Vorlagen `full.liquid`, `half_*.liquid`, `quadrant.liquid` und `shared.liquid` erzeugen das E-Paper-Bild.
- **Plugin Merge:** Das Familien-Dashboard verwendet die Daten anderer TRMNL-Plugin-Instanzen, ohne deren eigene Datenabrufe noch einmal zu implementieren.

TRMNL lädt Daten und rendert Bildschirme in **Intervallen**; Uhrzeitgrenzen und Niederschlagswarnungen erscheinen deshalb nicht sekundengenau. Bei Problemen zuerst **Force Refresh**, **Edit Markup → Your Variables** und gegebenenfalls die Plugin-Health-/Debug-Anzeige prüfen.

## Dokumentation und Änderungen

Jeder Plugin-Ordner hat eine eigene README mit Zweck, Datenquelle, Konfiguration, Import, Variablen, Test und Fehlersuche. Eine Änderung wird zuerst im passenden Ordner vorgenommen; die jeweils andere Plugin-Kopie bleibt unangetastet.

Für die Familienmodule gibt es Mocktests:

~~~sh
node projects/trmnl-x-familie/wetter/tests/test.mjs
node projects/trmnl-x-familie/muellkalender/tests/test.mjs
~~~

Für den normalen Müllkalender:

~~~sh
node plugins/muellkalender/tests/test.mjs
~~~

Node.js wird **nur für Tests beim Entwickeln** benötigt. GitHub Actions prüft die beiden Familienmodule bei passenden Commits/Pull Requests. Diese Tests simulieren Daten; sie ersetzen **keinen** TRMNL-Import, keine Live-API-Prüfung und keinen Displaytest.

## Projektstatus

Die Familienmodule und das Layout liegen auf `main`. **„Auf main“ bedeutet nicht „im TRMNL-Konto eingerichtet“.** Die tatsächlichen Variablennamen des nativen Apple-Calendar-Plugins und des externen Geburtstags-Recipes sowie die Ansicht am physischen TRMNL X müssen noch abschließend kontrolliert werden. Einzelheiten stehen in der [Dashboard-README](projects/trmnl-x-familie/dashboard/README.md).

## Offizielle Referenzen

- [TRMNL Private Plugins](https://help.trmnl.com/en/articles/9510536-private-plugins)
- [Private Plugins importieren/exportieren](https://help.trmnl.com/en/articles/10542599-importing-and-exporting-private-plugins)
- [Plugin-Strategien / Plugin Merge](https://help.trmnl.com/en/articles/17434705-plugin-strategies)
- [Plugin-Formularfelder](https://help.trmnl.com/en/articles/10513740-custom-plugin-form-builder)
- [GitHub Sync](https://help.trmnl.com/en/articles/15977899-github-sync)
- [TRMNL-X-Framework-Guide](https://trmnl.com/framework/docs/3.4/trmnl_x_guide/)
