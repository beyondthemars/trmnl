import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';

const source = fs.readFileSync(new URL('../src/transform.js', import.meta.url), 'utf8');
const response = (body) => ({ ok: true, status: 200, json: async () => body, text: async () => body });
const parts = new Intl.DateTimeFormat('en-GB', { timeZone:'Europe/Berlin', year:'numeric', month:'2-digit', day:'2-digit' }).formatToParts(new Date());
const get = (name) => Number(parts.find((p) => p.type === name).value);
const date = (offset) => new Date(Date.UTC(get('year'), get('month') - 1, get('day') + offset)).toISOString().slice(0, 10).replaceAll('-', '');
const ics = [
  'BEGIN:VCALENDAR', 'VERSION:2.0',
  'BEGIN:VEVENT', 'DTSTART;VALUE=DATE:' + date(3), 'SUMMARY:Restabfall', 'END:VEVENT',
  'BEGIN:VEVENT', 'DTSTART;VALUE=DATE:' + date(1), 'SUMMARY:Papier', 'END:VEVENT',
  // A second paper pickup precedes the next different waste type.
  'BEGIN:VEVENT', 'DTSTART;VALUE=DATE:' + date(2), 'SUMMARY:Papier', 'END:VEVENT',
  'BEGIN:VEVENT', 'DTSTART;VALUE=DATE:' + date(10), 'SUMMARY:Bioabfall', 'END:VEVENT',
  'BEGIN:VEVENT', 'DTSTART;VALUE=DATE:' + date(7), 'SUMMARY:Gelbe Tonnen und', ' Säcke', 'END:VEVENT',
  'END:VCALENDAR'
].join('\r\n');
const calls = [];
const fetchMock = async (url) => {
  calls.push(String(url));
  if (String(url).includes('/streetnumber')) return response([{NUMBER:'12',id:5,IDSTANDORT:9}]);
  if (String(url).includes('/leerungen-data')) return response({dataFile:'calendar+name'});
  if (String(url).includes('/abki-leerungen-ical')) return response(ics);
  throw new Error('Unexpected fetch: ' + url);
};
const run = vm.runInNewContext(source + '\nrun', {
  Date, Intl, URLSearchParams, AbortController, setTimeout, clearTimeout, fetch: fetchMock
});
const params = { trmnl: { plugin_settings: { custom_fields_values: {
  street:'Musterweg', house_number:'12'
} } }, data:[{Strasse:'Musterweg',IDSTREET:101}] };
const result = await run(params);
assert.equal(result.error, '');
assert.deepEqual(Array.from(result.bins, (b) => b.id), ['paper','rest','yellow','bio']);
assert.deepEqual(Array.from(result.bins, (b) => b.days), [1,3,7,10]);
assert.equal(result.next_days, 1);
assert.deepEqual(Array.from(result.next_two, (b) => b.id), ['paper', 'paper']);
assert.deepEqual(Array.from(result.next_two, (b) => b.days), [1, 2]);
assert.equal(result.bins[0].relative, 'Morgen');
assert.ok(calls[0].includes('IDSTREET=101'));
assert.ok(calls[1].includes('Hausnummernwahl=5'));
assert.ok(calls[2].includes('data=calendar%2Bname'));
const noNumber = await run({ ...params, trmnl: {plugin_settings:{custom_fields_values:{street:'Musterweg',house_number:'999'}}}});
assert.match(noNumber.error, /Hausnummer/);
const noAddress = await run({ data: [] });
assert.match(noAddress.error, /eintragen/);
console.log('ABK Serverless mock tests passed');
