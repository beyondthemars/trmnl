// TRMNL Serverless (Node.js 20). All times are local Europe/Berlin.
// Data: Open-Meteo DWD ICON Seamless; no LAN calls, no extra services.
const TZ = "Europe/Berlin";
const WEEKDAYS = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

function localParts(date) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: TZ, year: "numeric", month: "2-digit", day: "2-digit",
    hour: "2-digit", hourCycle: "h23"
  }).formatToParts(date);
  const n = (key) => Number(parts.find((p) => p.type === key)?.value);
  return { year: n("year"), month: n("month"), day: n("day"), hour: n("hour") };
}
function isoDate(parts, addDays = 0) {
  return new Date(Date.UTC(parts.year, parts.month - 1, parts.day + addDays)).toISOString().slice(0, 10);
}
function numberOrNull(value) {
  return value === null || value === undefined || value === "" || !Number.isFinite(Number(value)) ? null : Number(value);
}
function maxOf(values) {
  const good = values.filter((x) => x !== null && Number.isFinite(x));
  return good.length ? Math.max(...good) : null;
}
function sumOf(values) {
  const good = values.filter((x) => x !== null && Number.isFinite(x));
  return good.length ? good.reduce((a, b) => a + b, 0) : null;
}
function round(value, decimals = 0) {
  return value == null ? null : Math.round(value * (10 ** decimals)) / (10 ** decimals);
}
function weatherSummary(rows) {
  if (!rows.length) return "Keine Prognose";
  const codes = rows.map((r) => r.code).filter((n) => n !== null);
  const snow = sumOf(rows.map((r) => r.snow));
  const rain = sumOf(rows.map((r) => r.rain));
  if (snow !== null && snow > 0.15 && rain !== null && rain > 0.1) return "Schneeregen";
  if (snow !== null && snow > 0.15) return "Schnee";
  if (codes.some((c) => c >= 95)) return "Gewitter möglich";
  if ((rain !== null && rain > 0.3) || codes.some((c) => c >= 51 && c <= 67 || c >= 80 && c <= 82)) return "Regen möglich";
  if (codes.some((c) => c >= 45 && c <= 48)) return "Nebel";
  if (codes.some((c) => c >= 3)) return "Bewölkt";
  if (codes.some((c) => c === 1 || c === 2)) return "Leicht bewölkt";
  return codes.length ? "Überwiegend klar" : "Keine Prognose";
}
function rowsInWindow(rows, start, end) {
  return rows.filter((r) => r.time >= start && r.time < end);
}
function riskForWindow(rows, start, end, name, hours, dayLabel) {
  const window = rowsInWindow(rows, start, end);
  if (!window.length) {
    return { name, hours, day: dayLabel, status: "unknown", kind: "unknown", text: "Keine Prognose", probability: null };
  }
  const prob = maxOf(window.map((r) => r.prob));
  const precip = maxOf(window.map((r) => r.precip));
  const rain = sumOf(window.map((r) => r.rain));
  const snow = sumOf(window.map((r) => r.snow));
  const hasSnow = snow !== null && snow >= 0.05;
  const hasRain = rain !== null && rain >= 0.1;
  const kind = hasSnow && hasRain ? "sleet" : hasSnow ? "snow" : "rain";
  const type = kind === "sleet" ? "Schneeregen" : kind === "snow" ? "Schnee" : "Regen";
  const expected = (precip !== null && precip >= 0.3) || (snow !== null && snow >= 0.2)
    || (prob !== null && prob >= 70 && precip !== null && precip >= 0.1);
  const possible = (precip !== null && precip >= 0.05) || (snow !== null && snow >= 0.05)
    || (prob !== null && prob >= 35);
  const status = expected ? "expected" : possible ? "possible" : "dry";
  const text = status === "expected" ? type + " erwartet"
    : status === "possible" ? "Niederschlag möglich" : "Voraussichtlich trocken";
  return { name, hours, day: dayLabel, status, kind: status === "dry" ? "none" : kind, text, probability: prob };
}
function parseRows(data) {
  const h = data?.hourly ?? {};
  if (!Array.isArray(h.time)) return [];
  const fields = (key, i) => numberOrNull(h[key]?.[i]);
  return h.time.map((time, i) => ({
    time: String(time).slice(0, 16),
    temp: fields("temperature_2m", i),
    prob: fields("precipitation_probability", i),
    precip: fields("precipitation", i),
    rain: fields("rain", i),
    snow: fields("snowfall", i),
    wind: fields("wind_speed_10m", i),
    gust: fields("wind_gusts_10m", i),
    code: fields("weather_code", i)
  })).filter((r) => /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(r.time));
}
function run(input) {
  const now = localParts(new Date());
  const today = isoDate(now);
  const tomorrow = isoDate(now, 1);
  const yesterday = isoDate(now, -1);
  const rows = parseRows(input);
  if (!rows.length) return { error: "Open-Meteo liefert keine Stundenwerte", period: null, paths: [] };

  let periodName, start, end, title, shortHours;
  if (now.hour >= 5 && now.hour < 13) {
    periodName = "morning"; title = "Vormittag"; shortHours = "05–13 Uhr";
    start = today + "T05:00"; end = today + "T13:00";
  } else if (now.hour >= 13 && now.hour < 18) {
    periodName = "afternoon"; title = "Nachmittag"; shortHours = "13–18 Uhr";
    start = today + "T13:00"; end = today + "T18:00";
  } else {
    periodName = "night"; title = "Abend / Nacht"; shortHours = "18–05 Uhr";
    start = (now.hour < 5 ? yesterday : today) + "T18:00";
    end = (now.hour < 5 ? today : tomorrow) + "T05:00";
  }
  const periodRows = rowsInWindow(rows, start, end);
  const temps = periodRows.map((r) => r.temp).filter((x) => x !== null);
  const min = temps.length ? Math.min(...temps) : null;
  const max = temps.length ? Math.max(...temps) : null;
  const period = {
    key: periodName, title, hours: shortHours,
    from: start, to: end,
    min: round(min), max: round(max),
    temperature_range: min === null ? "–" : String(round(min)) + "–" + String(round(max)) + " °C",
    description: weatherSummary(periodRows),
    precipitation_probability: maxOf(periodRows.map((r) => r.prob)),
    precipitation_total: round(sumOf(periodRows.map((r) => r.precip)), 1),
    max_wind_kmh: round(maxOf(periodRows.map((r) => r.wind))),
    max_gust_kmh: round(maxOf(periodRows.map((r) => r.gust)))
  };
  const currentTemp = numberOrNull(input?.current?.temperature_2m);
  const current = {
    temperature: currentTemp === null ? null : round(currentTemp, 1),
    is_model_value: true
  };
  // Keep the morning prediction for the next morning after 18:00 and overnight.
  // During 05–13 show both journeys; 13–15 show only the pickup.
  // After 15:00 the completed journeys are intentionally hidden.
  const commuteDate = now.hour >= 18 ? tomorrow : today;
  const dayLabel = now.hour >= 18 ? "Morgen" : "Heute";
  const allPaths = [
    riskForWindow(rows, commuteDate + "T07:00", commuteDate + "T09:00", "Hinweg", "07–09 Uhr", dayLabel),
    riskForWindow(rows, commuteDate + "T13:00", commuteDate + "T15:00", "Abholung", "13–15 Uhr", dayLabel)
  ];
  const paths = now.hour >= 18 || now.hour < 13 ? allPaths
    : now.hour < 15 ? allPaths.slice(1) : [];
  return {
    error: "",
    source: "Open-Meteo / DWD ICON Seamless",
    updated_date: today,
    generated_at: new Date().toISOString(), // refresh source to update time-dependent merged layout
    period, current, paths
  };
}
