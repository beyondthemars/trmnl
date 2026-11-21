# Müllkalender für das TRMNL-X-Familiendashboard

**Unabhängige Projektkopie** von `plugins/muellkalender`, nicht der Original-Plugin-Ordner.

Die ABKI-Serverless-Abfrage liefert zusätzlich zu den bisherigen `bins` die Variable `next_two` mit den **nächsten zwei tatsächlichen Abholereignissen**. Sie berücksichtigt auch zwei Termine derselben Abfallart und mehrere Abholungen am selben Tag.

Für die Familien-Dashboard-Ansicht `next_two` verwenden; die bisherigen Vollbild-Layouts dienen als Ausgangsbasis und zeigen weiterhin vier Abfallarten. In TRMNL als eigene Plugin-Instanz importieren, damit die bisherige Müllkalender-Installation nicht verändert wird. Einstellungen für Straße und Hausnummer werden nur im TRMNL-Konto hinterlegt.

Mocktest: `node tests/test.mjs`.
