import urllib.request, json, urllib.parse

query = """[out:json];
(
  node(around:2000, 27.2139, 75.7011);
  way(around:2000, 27.2139, 75.7011);
);
out center tags;"""

url = 'https://overpass-api.de/api/interpreter?data=' + urllib.parse.quote(query)
req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)'})
try:
    with urllib.request.urlopen(req, timeout=10) as resp:
        data = json.loads(resp.read().decode())
        elements = data.get('elements', [])
        print(f"Total elements found: {len(elements)}")
        for el in elements:
            tags = el.get('tags', {})
            name = tags.get('name', '')
            if 'UEM' in name.upper() or 'ENGINEERING' in name.upper() or 'GURUKUL' in name.upper() or 'GUARD' in name.upper() or 'GATE' in name.upper():
                lat = el.get('lat') or el.get('center', {}).get('lat')
                lon = el.get('lon') or el.get('center', {}).get('lon')
                print(f"MATCH: {name} | tags: {tags} | coords: ({lat}, {lon})")
except Exception as e:
    print('Overpass error:', e)
