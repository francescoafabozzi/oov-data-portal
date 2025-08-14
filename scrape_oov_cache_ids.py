# scrape_oov_cache_ids.py
# pip install requests
import re, json
from pathlib import Path
import requests

UA = "Mozilla/5.0"
RECORD_URL = "https://oov.som.yale.edu/search_detail_book.php?id={record_id}"
ZOOM_BASE  = "https://oov.som.yale.edu/files/new-goetzmann-by-id/zoom/{zoom_id}/"

def fetch(url):
    return requests.get(url, headers={"User-Agent": UA}, timeout=20)

def get_zoom_ids_from_cache(record_id: int):
    html = fetch(RECORD_URL.format(record_id=record_id)).text
    # find .../files/new-goetzmann-by-id/cache/<id>-results.jpg
    ids = sorted({int(m) for m in re.findall(
        r"/files/new-goetzmann-by-id/cache/(\d+)-results\.jpg", html)})
    return ids

def get_image_props(zid: int):
    r = fetch(ZOOM_BASE.format(zoom_id=zid) + "ImageProperties.xml")
    if r.status_code == 200:
        m = re.search(
            r'WIDTH=["\'](\d+)["\'].*?HEIGHT=["\'](\d+)["\'].*?TILESIZE=["\'](\d+)["\']',
            r.text)
        if m:
            return {"width": int(m.group(1)), "height": int(m.group(2)),
                    "tileSize": int(m.group(3))}
    # fallback if XML blocked
    return {"width": None, "height": None, "tileSize": 256}

def build_manifest(record_id: int):
    ids = get_zoom_ids_from_cache(record_id)
    items = []
    for zid in ids:
        props = get_image_props(zid)
        items.append({
            "zoomId": zid,
            "tilesUrl": ZOOM_BASE.format(zoom_id=zid),
            **props,
            "thumb": ZOOM_BASE.format(zoom_id=zid) + "TileGroup0/0-0-0.jpg"
        })
    data = {"recordId": record_id, "count": len(items), "items": items}
    Path(f"record_{record_id}.json").write_text(json.dumps(data, indent=2))
    print(f"record_{record_id}.json written with {len(items)} item(s): {[i['zoomId'] for i in items]}")

if __name__ == "__main__":
    build_manifest(419)
