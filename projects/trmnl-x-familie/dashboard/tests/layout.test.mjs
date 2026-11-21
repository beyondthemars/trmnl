import assert from "node:assert/strict";
import fs from "node:fs";

const path = (p) => fs.readFileSync(new URL(p, import.meta.url), "utf8");
const layout = path("../src/full.liquid");
const style = path("../src/shared.liquid");
const weatherSettings = path("../../wetter/src/settings.yml");
const weatherTransform = path("../../wetter/src/transform.js");

// Reference design: single TRMNL X full layout, clearly separated 60/40 columns.
assert.match(style, /1040 x 780 logical px/);
assert.match(style, /grid-template-columns:minmax\(0,60%\) minmax\(0,40%\)/);
assert.match(style, /\.fx__birthday\{/);
assert.match(style, /\.fx__route--possible.*background:#ddd/);
assert.match(style, /\.fx__sun-item/);
assert.match(layout, /Kalenderwoche \{\{ week \}\}/);
assert.match(layout, /Heute im Familienkalender/);
assert.match(layout, /Nächste Müllabfuhr/);
assert.match(layout, /Unsere Wege/);
assert.match(layout, /sun_data\.sunrise/);
assert.match(layout, /sun_data\.sunset/);
assert.match(layout, /Sonnenaufgang/);
assert.match(layout, /Sonnenuntergang/);
assert.match(layout, /trmnl\.user\.utc_offset/);
assert.doesNotMatch(layout, /Guten Morgen|Unser Wochenende|Blick auf morgen|Familienübersicht/i);
assert.doesNotMatch(layout, /VORSCHAU MIT BEISPIELDATEN/i);
// Header's sun times must be actual weather plugin values, not fixed placeholders.
assert.match(weatherSettings, /daily=sunrise,sunset/);
assert.match(weatherTransform, /sunForDate\(input, today\)/);
assert.match(weatherTransform, /period, current, paths, sun/);
// Changing the family dashboard never changes legacy plugin source code.
console.log("TRMNL X family layout contract checks passed");
