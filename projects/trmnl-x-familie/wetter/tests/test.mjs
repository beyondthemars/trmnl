import assert from "node:assert/strict";
import fs from "node:fs";
import vm from "node:vm";

const source = fs.readFileSync(new URL("../src/transform.js", import.meta.url), "utf8");
function forecast() {
  const hourly = {
    time: [], temperature_2m: [], precipitation_probability: [],
    precipitation: [], rain: [], snowfall: [], weather_code: [],
    wind_speed_10m: [], wind_gusts_10m: []
  };
  for (const date of ["2026-11-20", "2026-11-21", "2026-11-22"]) {
    for (let hour = 0; hour < 24; hour++) {
      const time = date + "T" + String(hour).padStart(2, "0") + ":00";
      const morningRain = date === "2026-11-21" && (hour === 7 || hour === 8);
      const pickupSnow = date === "2026-11-21" && (hour === 13 || hour === 14);
      hourly.time.push(time);
      hourly.temperature_2m.push(hour < 12 ? 3 : 7);
      hourly.precipitation_probability.push(morningRain ? 85 : pickupSnow ? 90 : 5);
      hourly.precipitation.push(morningRain ? 0.6 : pickupSnow ? 0.4 : 0);
      hourly.rain.push(morningRain ? 0.6 : 0);
      hourly.snowfall.push(pickupSnow ? 0.4 : 0);
      hourly.weather_code.push(morningRain ? 61 : pickupSnow ? 73 : 2);
      hourly.wind_speed_10m.push(13);
      hourly.wind_gusts_10m.push(21);
    }
  }
  return { hourly, current: { temperature_2m: 2.8 } };
}
function runAt(instant, data = forecast()) {
  class FakeDate extends Date {
    constructor(...args) { super(...(args.length ? args : [instant])); }
    static now() { return new Date(instant).getTime(); }
  }
  return vm.runInNewContext(source + "\nrun", { Date: FakeDate, Intl })(data);
}
const morning = runAt("2026-11-21T06:00:00Z"); // 07:00 CET
assert.equal(morning.error, "");
assert.equal(morning.period.key, "morning");
assert.equal(morning.period.hours, "05–13 Uhr");
assert.equal(morning.current.temperature, 2.8);
assert.equal(morning.current.is_model_value, true);
assert.equal(morning.paths.length, 2);
assert.equal(morning.paths[0].status, "expected");
assert.equal(morning.paths[0].kind, "rain");
assert.equal(morning.paths[1].status, "expected");
assert.equal(morning.paths[1].kind, "snow");
const pickup = runAt("2026-11-21T13:00:00Z"); // 14:00 CET
assert.equal(pickup.period.key, "afternoon");
assert.equal(pickup.paths.length, 1);
assert.equal(pickup.paths[0].name, "Abholung");
const lateAfternoon = runAt("2026-11-21T16:00:00Z");
assert.equal(lateAfternoon.paths.length, 0);
const evening = runAt("2026-11-21T17:00:00Z"); // 18:00 CET
assert.equal(evening.period.key, "night");
assert.equal(evening.paths.length, 2);
assert.equal(evening.paths[0].day, "Morgen");
assert.equal(evening.paths[0].status, "dry");
const overnight = runAt("2026-11-22T01:00:00Z"); // 02:00 CET
assert.equal(overnight.period.key, "night");
assert.equal(overnight.period.from, "2026-11-21T18:00");
assert.equal(overnight.period.to, "2026-11-22T05:00");
assert.equal(overnight.paths[0].day, "Heute");
assert.match(runAt("2026-11-21T06:00:00Z", {}).error, /Stundenwerte/);
console.log("Familienwetter mocked period and commute tests passed");
