# Familienwetter Kiel – TRMNL

Eigene Wetterdatenquelle vollständig in TRMNL, ohne lokale Dienste.

- Vorhersage: [Open-Meteo DWD ICON API](https://open-meteo.com/en/docs/dwd-api), Defaultmodell **ICON Seamless**.
- Aktuelle Temperatur ist **modellbasiert**, nicht von einer privaten Wetterstation gemessen.
- Wetterperioden nach **Europe/Berlin**: 05–13 Uhr, 13–18 Uhr, 18–05 Uhr.
- Wegwarnungen: 07–09 Uhr (Arbeit/Kita), 13–15 Uhr (Kita-Abholung). Nach 18 Uhr nächste Morgenprognose; nachts bis 05 Uhr weiterhin nächster Morgen.
- Risiko: **erwartet** bei mindestens 0,3 mm/Stunde oder 0,2 cm Schnee/Stunde bzw. hoher Regenwahrscheinlichkeit mit vorhergesagtem Niederschlag; **möglich** ab 35 % oder erkennbarer Menge; sonst **voraussichtlich trocken**. Ohne Prognosedaten **unbekannt**, nicht fälschlich trocken.
- Polling alle 15 Minuten. Zeitbasierte Umschaltung am nächsten TRMNL-Refresh, **nicht sekundengenau**.
- Datenformat: \`period\`, \`current\`, \`paths\`, \`generated_at\`.

Importiere \`src/\` als flaches ZIP mit \`settings.yml\`, \`transform.js\` und den Liquid-Dateien. Voreingestellte ungefähre Koordinaten Kiel-Suchsdorf; in TRMNL einstellbar. Mit **Force Refresh** Daten im Bereich *Your Variables* prüfen.

Automatisierte Mocktests: \`node tests/test.mjs\` (benötigt Node.js nur zum **Entwickeln/Testen**, nicht im Betrieb).
