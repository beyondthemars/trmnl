// TRMNL Serverless (Node 20) – ABK Kiel. No Home Assistant, no external packages.
// The TRMNL Polling URL has already fetched the street candidates into input.data.
const ABK_BASE = "https://abki.de/abki-services";
const CATEGORIES = [
  { id: "rest", label: "Restmüll", matches: /\b(restabfall|restmüll|restmuell|resttonne)\b/i },
  { id: "paper", label: "Papier", matches: /\b(papier|altpapier|papiertonne|papierabfall)\b/i },
  { id: "bio", label: "Biomüll", matches: /\b(bioabfall|biomüll|biotonne|biomuell)\b/i },
  { id: "yellow", label: "Gelber Sack", matches: /\b(gelbe|gelber|gelben|gelbes|gelb|wertstoffverpackungen)\b/i }
];
const WEEKDAYS = ["So", "Mo", "Di", "Mi", "Do", "Fr", "Sa"];

function berlinDate(now) {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Berlin", year: "numeric", month: "2-digit", day: "2-digit"
  }).formatToParts(now);
  const get = (type) => Number(parts.find((x) => x.type === type).value);
  return { year: get("year"), month: get("month"), day: get("day") };
}

function dayIndex(year, month, day) {
  return Math.floor(Date.UTC(year, month - 1, day) / 86400000);
}

function normalize(value) {
  return String(value ?? "").trim().toLocaleLowerCase("de-DE")
    .normalize("NFKC").replace(/\s+/g, " ");
}

function normalizeHouse(value) {
  return normalize(value).replace(/[\s\-]/g, "");
}

function arrayFrom(value) {
  if (Array.isArray(value)) return value;
  if (Array.isArray(value?.data)) return value.data;
  if (Array.isArray(value?.results)) return value.results;
  return [];
}

async function fetchChecked(url, signal) {
  const response = await fetch(url, { signal, headers: { accept: "application/json, text/calendar, */*" } });
  if (!response.ok) throw new Error(`ABK antwortet mit HTTP ${response.status}`);
  return response;
}

async function fetchJson(url, signal) {
  return (await fetchChecked(url, signal)).json();
}

// Unfold RFC 5545 lines and pick the date/summary from each VEVENT.
function parseIcal(text) {
  if (!/BEGIN:VCALENDAR/i.test(text)) throw new Error("ABK lieferte keinen iCalendar");
  const unfolded = text.replace(/\r?\n[ \t]/g, "");
  const events = [];
  const blocks = unfolded.split(/BEGIN:VEVENT\r?\n/i).slice(1);
  for (const block of blocks) {
    const content = block.split(/\r?\nEND:VEVENT/i)[0];
    const dateLine = content.match(/(?:^|\r?\n)DTSTART(?:;[^:\r\n]*)?:(\d{8})/i);
    const summaryLine = content.match(/(?:^|\r?\n)SUMMARY(?:;[^:\r\n]*)?:([^\r\n]*)/i);
    if (!dateLine || !summaryLine) continue;
    const raw = dateLine[1];
    const year = Number(raw.slice(0, 4));
    const month = Number(raw.slice(4, 6));
    const day = Number(raw.slice(6, 8));
    if (month < 1 || month > 12 || day < 1 || day > 31) continue;
    const check = new Date(Date.UTC(year, month - 1, day));
    if (check.getUTCFullYear() !== year || check.getUTCMonth() + 1 !== month || check.getUTCDate() !== day) continue;
    const summary = summaryLine[1].replace(/\\[nN]/g, " ").replace(/\\([,;\\])/g, "$1");
    events.push({ year, month, day, summary });
  }
  return events;
}

async function fetchCalendarYear(year, street, streetId, locationId, houseId, signal) {
  const params = new URLSearchParams({
    Zeitraum: String(year),
    Strasse_input: street,
    Strasse: String(streetId),
    IDSTANDORT_input: "2",
    IDSTANDORT: String(locationId),
    Hausnummernwahl: String(houseId)
  });
  const details = await fetchJson(`${ABK_BASE}/leerungen-data?${params}`, signal);
  const file = details?.dataFile;
  if (typeof file !== "string" || !file) throw new Error(`Kein ABK-Kalender für ${year}`);
  const ics = await fetchChecked(`${ABK_BASE}/abki-leerungen-ical?${new URLSearchParams({ data: file })}`, signal);
  return parseIcal(await ics.text());
}

function buildDisplay(events, today, generatedAt) {
  const todayIndex = dayIndex(today.year, today.month, today.day);
  const bins = CATEGORIES.map((category) => {
    const matching = events
      .filter((event) => category.matches.test(event.summary))
      .map((event) => ({ ...event, days: dayIndex(event.year, event.month, event.day) - todayIndex }))
      .filter((event) => event.days >= 0)
      .sort((a, b) => a.days - b.days);
    const next = matching[0];
    if (!next) {
      return { id: category.id, label: category.label, weekday: "", date: "–", days: 9999, relative: "Kein Termin" };
    }
    const date = new Date(Date.UTC(next.year, next.month - 1, next.day));
    return {
      id: category.id, label: category.label,
      weekday: WEEKDAYS[date.getUTCDay()],
      date: `${String(next.day).padStart(2, "0")}.${String(next.month).padStart(2, "0")}.`,
      days: next.days,
      relative: next.days === 0 ? "Heute" : next.days === 1 ? "Morgen" : `in ${next.days} Tagen`
    };
  });
  bins.sort((a, b) => a.days - b.days);
  const nextDays = bins[0]?.days < 9999 ? bins[0].days : -1;
  return { bins, next_days: nextDays, generated_at: generatedAt, source: "ABK Kiel / Remondis", error: "" };
}

async function run(input) {
  const now = new Date();
  const today = berlinDate(now);
  // Locale-Daten sind in manchen Node-Runtimes reduziert. Immer explizit DE formatieren.
  const timeParts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Europe/Berlin", hour: "2-digit", minute: "2-digit", hour12: false
  }).formatToParts(now);
  const part = (name) => timeParts.find((item) => item.type === name)?.value ?? "00";
  const generatedAt =
    `${String(today.day).padStart(2, "0")}.${String(today.month).padStart(2, "0")}.${today.year} · ${part("hour")}:${part("minute")}`;
  const settings = input?.trmnl?.plugin_settings?.custom_fields_values ?? {};
  const street = String(settings.street ?? "").trim();
  const houseNumber = String(settings.house_number ?? "").trim();
  if (!street || !houseNumber) {
    return { bins: [], error: "Bitte Straße und Hausnummer in den Plugin-Einstellungen eintragen.", generated_at: generatedAt };
  }
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4300);
  try {
    // Polling of the ABK street lookup happens before this script runs.
    const streets = arrayFrom(input?.data ?? input?.IDX_0 ?? input);
    const streetRow = streets.find((entry) => normalize(entry.Strasse) === normalize(street));
    if (!streetRow?.IDSTREET) throw new Error("Straße nicht im ABK-Verzeichnis gefunden");

    const numbers = arrayFrom(await fetchJson(
      `${ABK_BASE}/streetnumber?${new URLSearchParams({ IDSTREET: String(streetRow.IDSTREET) })}`,
      controller.signal
    ));
    const numberRow = numbers.find((entry) => normalizeHouse(entry.NUMBER) === normalizeHouse(houseNumber));
    if (!numberRow || numberRow.id == null || numberRow.IDSTANDORT == null) {
      throw new Error("Hausnummer ist für diese Straße beim ABK nicht hinterlegt");
    }

    const years = [today.year];
    if (today.month === 12) years.push(today.year + 1);
    const results = await Promise.allSettled(years.map((year) => fetchCalendarYear(
      year, street, streetRow.IDSTREET, numberRow.IDSTANDORT, numberRow.id, controller.signal
    )));
    const events = results.flatMap((result) => result.status === "fulfilled" ? result.value : []);
    if (!events.length) {
      const firstError = results.find((result) => result.status === "rejected");
      throw new Error(firstError ? firstError.reason.message : "Keine ABK-Leerungen gefunden");
    }
    return buildDisplay(events, today, generatedAt);
  } catch (error) {
    return {
      bins: [], generated_at: generatedAt,
      error: `ABK-Abfrage fehlgeschlagen: ${error?.name === "AbortError" ? "Zeitlimit überschritten" : (error?.message || "Unbekannter Fehler")}`
    };
  } finally {
    clearTimeout(timeout);
  }
}
