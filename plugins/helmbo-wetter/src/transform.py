# TRMNL → Markup bearbeiten → Serverless → Python
import bisect
import datetime as dt
import json
import math
import urllib.parse
import urllib.request

OM = 'https://api.open-meteo.com/v1/forecast'

def url(base, **params):
    return base + '?' + urllib.parse.urlencode(params)

def local_datetime(stamp):
    """Copenhagen using the EU rule: last Sunday March/October at 01:00 UTC.

    No system timezone database or third-party tzdata package needed.
    Intended for current weather dates (EU rule in force since 1996).
    """
    utc = dt.datetime.fromtimestamp(stamp, dt.timezone.utc)
    def transition(month):
        last = dt.datetime(utc.year, month, 31, 1, tzinfo=dt.timezone.utc)
        return last - dt.timedelta(days=(last.weekday() + 1) % 7)
    summer = transition(3) <= utc < transition(10)
    return utc.astimezone(dt.timezone(dt.timedelta(hours=2 if summer else 1)))

THRESHOLDS = [.3, 1.6, 3.4, 5.5, 8, 10.8, 13.9, 17.2, 20.8, 24.5, 28.5, 32.7]


def number(value):
    return value if isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value) else None


def epoch(value):
    if number(value) is not None:
        return float(value)
    try:
        parsed = dt.datetime.fromisoformat(value.replace('Z', '+00:00'))
        return parsed.timestamp() if parsed.tzinfo else None
    except (ValueError, TypeError, AttributeError):
        return None


def fmt(value, decimals=1):
    return '–' if number(value) is None else f'{value:.{decimals}f}'.replace('.', ',')


def bft(value):
    return bisect.bisect_right(THRESHOLDS, value) if number(value) is not None and value >= 0 else None


DIRECTIONS = ('N', 'NNO', 'NO', 'ONO', 'O', 'OSO', 'SO', 'SSO',
              'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW')


def compass(degrees):
    """16 German cardinal points; the bearing indicates where wind comes from."""
    return DIRECTIONS[int((degrees % 360 + 11.25) // 22.5) % 16] if number(degrees) is not None else '–'


def representative_direction(degrees, speeds):
    """Speed-weighted circular mean, accounting for 0/360 degrees wrapping."""
    if not degrees or not speeds or len(degrees) != len(speeds):
        return None
    north = sum(speed * math.cos(math.radians(deg)) for deg, speed in zip(degrees, speeds))
    east = sum(speed * math.sin(math.radians(deg)) for deg, speed in zip(degrees, speeds))
    if math.hypot(north, east) < 0.01:
        return None
    return math.degrees(math.atan2(east, north)) % 360


def latest_sample(document, parameter, now, max_age=7200):
    candidates = []
    for feature in document.get('features', []):
        p = feature.get('properties', {})
        value, stamp = number(p.get('value')), epoch(p.get('observed'))
        if p.get('parameterId') == parameter and value is not None and stamp is not None and -300 <= now-stamp <= max_age:
            candidates.append((stamp, value))
    return max(candidates, default=(None, None))


def latest(document, parameter, now, max_age=7200):
    return latest_sample(document, parameter, now, max_age)[1]


PLACES = {
    'Rindby Strand': (55.42033, 8.37439),
    'Nordby': (55.446, 8.397),
    'Blåvand': (55.555, 8.13),
}
FIELDS = 'temperature_2m', 'precipitation', 'cloud_cover', 'wind_speed_10m', 'wind_gusts_10m', 'wind_direction_10m'
MODEL = 'dmi_harmonie_arome_europe'


def forecast(place, model=MODEL):
    lat, lon = PLACES[place]
    return url(OM, latitude=lat, longitude=lon, timezone='Europe/Copenhagen', timeformat='unixtime',
               forecast_days=3 if model == MODEL else 4, wind_speed_unit='ms', models=model, hourly=','.join(FIELDS),
               current='temperature_2m,relative_humidity_2m,wind_speed_10m,wind_gusts_10m')


def hours(doc):
    hourly = doc.get('hourly', {})
    return {
        stamp: {key: number(hourly[key][i]) if i < len(hourly.get(key, [])) else None
                for key in FIELDS}
        for i, stamp in enumerate(hourly.get('time', [])) if number(stamp) is not None
    }


def current(doc, now):
    values = doc.get('current', {})
    stamp = epoch(values.get('time'))
    return values if stamp is not None and 0 <= now-stamp <= 3600 else {}


def boundary(day, hour):
    wall = dt.datetime.combine(day, dt.time(), dt.timezone.utc) + dt.timedelta(hours=hour)
    # The displayed date boundaries are 00:00, 06:00, 12:00 and 18:00.
    offset = local_datetime(wall.timestamp() - 7200).utcoffset()
    return int((wall - offset).timestamp())


def interval(rows, start, end, key, trailing=False):
    # Open-Meteo precipitation at a timestamp covers the preceding hour.
    offset = 3600 if trailing else 0
    values = [rows.get(stamp, {}).get(key) for stamp in range(start+offset, end+offset, 3600)]
    return values if values and all(value is not None for value in values) else []


def window(rows, start, end, label, detail, alternate=None):
    def data(source):
        temp = interval(source, start, end, FIELDS[0])
        rain = interval(source, start, end, FIELDS[1], trailing=True)
        cloud = interval(source, start, end, FIELDS[2])
        wind = interval(source, start, end, FIELDS[3])
        gust = interval(source, start, end, FIELDS[4])
        direction = interval(source, start, end, FIELDS[5])
        return temp, rain, cloud, wind, gust, direction

    temp, rain, cloud, wind, gust, direction = data(rows)
    mixed = False
    if alternate and not all((temp, rain, cloud, wind, gust, direction)):
        replacement = data(alternate)
        primary = temp, rain, cloud, wind, gust, direction
        mixed = any(not original and fallback for original, fallback in zip(primary, replacement))
        temp, rain, cloud, wind, gust, direction = (original or fallback for original, fallback in zip(primary, replacement))
    # At the forecast horizon the final midnight precipitation can be missing.
    return dict(
        label=label, detail=detail, mixed=mixed,
        temp=f'{fmt(min(temp), 0)} bis {fmt(max(temp), 0)} °C' if temp else '–',
        rain=f'{fmt(sum(rain))} mm' if rain else '–',
        sky=('Niederschlag' if rain and sum(rain) >= .1 else
             ('Klar' if sum(cloud)/len(cloud) < 25 else
              'Wolkig' if sum(cloud)/len(cloud) < 75 else 'Bedeckt') if cloud else '–'),
        wind=(f'{bft(max(wind))} / {bft(max(gust))} Bft · '
              f'{compass(representative_direction(direction, wind))}' if wind and gust else '–'),
        incomplete=not all((temp, rain, cloud, wind, gust, direction)),
    )


def tide_time(document, kind, now):
    candidates = []
    for feature in document.get('features', []):
        p = feature.get('properties', {})
        stamp = epoch(p.get('predictionTime'))
        if p.get('predictionType') == kind and stamp is not None and stamp >= now:
            candidates.append(stamp)
    if not candidates:
        return '–', ''
    when = local_datetime(min(candidates))
    return when.strftime('%H:%M'), when.strftime('%d.%m.') if when.date() != local_datetime(now).date() else 'heute'


def build(raw, now, place='Rindby Strand'):
    here = local_datetime(now)
    day = here.date()
    doc = raw.get('model', {})
    rows, alternate = hours(doc), hours(raw.get('extended', {}))
    values = current(doc, now)
    sources = []
    observed_fields = {'temperature_2m': 'temp_dry', 'relative_humidity_2m': 'humidity',
                       'wind_speed_10m': 'wind_speed', 'wind_gusts_10m': 'wind_max',
                       'wind_direction_10m': 'wind_dir'}
    values = {key: number(values.get(key)) for key in observed_fields}
    if any(values[key] is None for key in ('temperature_2m', 'wind_speed_10m', 'wind_gusts_10m', 'wind_direction_10m')):
        for name, label in [('nordby', 'Nordby'), ('blavand', 'Blåvandshuk')]:
            used = False
            for key, parameter in observed_fields.items():
                value = latest(raw.get(name, {}), parameter, now, max_age=3600)
                if values[key] is None and value is not None:
                    values[key] = value
                    used = True
            if used:
                sources.append(label)
    temp, rh, wind, gust, direction = (values[k] for k in observed_fields)
    if wind is not None and wind < 0.3:
        direction = None
    model_current = current(doc, now)
    if any(model_current.get(key) is not None for key in ('temperature_2m', 'wind_speed_10m', 'wind_gusts_10m')):
        sources.insert(0, f'DMI-Modell {place}')
    feels = None
    if temp is not None and rh is not None and 0 <= rh <= 100 and wind is not None and wind >= 0:
        feels = temp + .33*(rh/100*6.105*math.exp(17.27*temp/(237.7+temp))) - .7*wind - 4
    start = int(now)//3600*3600
    rain4 = interval(rows, start, start+4*3600, 'precipitation', trailing=True)
    # The four hourly bins begin at the current full hour.
    rain_label = local_datetime(start).strftime('%H:%M') + '–' + local_datetime(start+4*3600).strftime('%H:%M')
    today = [window(rows, boundary(day, start_hour), boundary(day, end_hour), label, detail)
             for start_hour, end_hour, label, detail in [(6,12,'Vormittag','06–12 Uhr'),
                                                        (12,18,'Nachmittag','12–18 Uhr'),
                                                        (18,24,'Abend','18–24 Uhr')]]
    days = []
    for offset, label in [(1,'Morgen'), (2,'Übermorgen')]:
        date = day + dt.timedelta(days=offset)
        days.append(window(rows, boundary(date, 0), boundary(date, 24),
                           label, date.strftime('%d.%m.'), alternate))
    water_stamp, water = latest_sample(raw.get('water', {}), 'tw', now, max_age=6*3600)
    water_time = local_datetime(water_stamp).strftime('%H:%M') if water_stamp else ''
    ebb, ebb_day = tide_time(raw.get('tide', {}), 'minimum', now)
    flood, flood_day = tide_time(raw.get('tide', {}), 'maximum', now)
    missing = [label for label, value in [('Temperatur', temp), ('Gefühlt', feels),
               ('Wind', bft(wind)), ('Böen', bft(gust)), ('Windrichtung', direction), ('Wasser', water),
               ('Niederschlag', rain4 or None), ('Ebbe', ebb if ebb != '–' else None),
               ('Flut', flood if flood != '–' else None)] if value is None]
    missing.extend(row['label'] for row in today+days if row['incomplete'])
    return dict(place=place, updated=here.strftime('%d.%m. · %H:%M'), today=today, days=days,
                temp=fmt(temp), feels=fmt(feels), wind=fmt(bft(wind),0), gust=fmt(bft(gust),0),
                wind_dir=compass(direction), wind_deg=round(direction) if number(direction) is not None else None,
                rain=fmt(sum(rain4)) if rain4 else '–', rain_label=rain_label,
                water=fmt(water), water_time=water_time, ebb=ebb, ebb_day=ebb_day, flood=flood, flood_day=flood_day,
                current_source=' + '.join(sources) or 'Aktuell keine Wetterdaten',
                mixed=any(row['mixed'] for row in days), missing=missing)



def document(value):
    if isinstance(value, str):
        try:
            value = json.loads(value)
        except ValueError:
            return {}
    return value if isinstance(value, dict) and not value.get('error') else {}


def run(input):
    now = dt.datetime.now(dt.timezone.utc).timestamp()
    names = ('rindby_model', 'nordby_model', 'blavand_model', 'nordby', 'blavand', 'water', 'tide')
    raw = {name: document(input.get(f'IDX_{index}')) for index, name in enumerate(names)}
    place = 'Rindby Strand'
    raw['model'] = raw['rindby_model']
    for label, key in zip(PLACES, names[:3]):
        if any(row['temperature_2m'] is not None for row in hours(raw[key]).values()):
            place, raw['model'] = label, raw[key]
            break
    result = build(raw, now, place)
    if any(row['incomplete'] for row in result['days']):
        # Only this optional forecast extension needs a request inside Serverless.
        try:
            with urllib.request.urlopen(forecast(place, 'best_match'), timeout=2) as response:
                raw['extended'] = document(json.load(response))
        except (OSError, ValueError):
            return result
        result = build(raw, now, place)
    return result
