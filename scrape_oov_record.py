# scrape_oov_playwright.py
# pip install playwright requests
# python -m playwright install chromium



import re, json, time
from pathlib import Path
import requests
from playwright.sync_api import sync_playwright, TimeoutError as PwTimeout

BASE_RECORD = "https://oov.som.yale.edu/search_detail_book.php?id={record_id}"
ZOOM_BASE  = "https://oov.som.yale.edu/files/new-goetzmann-by-id/zoom/{zoom_id}/"
UA = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0 Safari/537.36"

NEXT_SELECTORS = [
    "a[title*=Next i]", "button[title*=Next i]",
    "a:has-text('Next')", "button:has-text('Next')",
    "a.next", "button.next", ".next",
    "#next", "[data-action=next]", "[aria-label*=Next i]"
]

def fetch_image_props(zoom_id: int):
    url = ZOOM_BASE.format(zoom_id=zoom_id) + "ImageProperties.xml"
    try:
        r = requests.get(url, headers={"User-Agent": UA}, timeout=20)
        if r.status_code == 200 and r.text:
            m = re.search(
                r'IMAGE_PROPERTIES[^>]+WIDTH=["\'](\d+)["\'][^>]+HEIGHT=["\'](\d+)["\'][^>]+TILESIZE=["\'](\d+)["\']',
                r.text,
            )
            if m:
                return {"width": int(m.group(1)), "height": int(m.group(2)), "tileSize": int(m.group(3))}
    except Exception:
        pass
    return {"width": None, "height": None, "tileSize": 256}

def scrape_record(record_id: int, max_pages: int = 200, wait_ms: int = 600):
    url = BASE_RECORD.format(record_id=record_id)
    out_path = Path(f"record_{record_id}.json")
    zoom_ids = set()

    def maybe_add(url: str):
        m = re.search(r"/zoom/(\d+)/", url)
        if m:
            zoom_ids.add(int(m.group(1)))

    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        ctx = browser.new_context(user_agent=UA)
        page = ctx.new_page()

        # capture any request that touches /zoom/<id>/
        page.on("request", lambda req: maybe_add(req.url))
        page.on("response", lambda resp: maybe_add(resp.url))

        page.goto(url, wait_until="domcontentloaded")

        # Wait a bit for the viewer to initialize
        try:
            page.wait_for_timeout(wait_ms)
        except PwTimeout:
            pass

        # If nothing yet, wait for a low-res tile or the navigator image to appear
        try:
            page.wait_for_selector("img[src*='/zoom/'][src*='TileGroup0/0-0-0.jpg']", timeout=3000)
        except PwTimeout:
            pass

        # Click "Next" repeatedly, harvesting new IDs as they load
        seen_count = 0
        for i in range(max_pages):
            before = len(zoom_ids)

            clicked = False
            for sel in NEXT_SELECTORS:
                try:
                    el = page.locator(sel).first
                    if awaitable_is_visible(el):
                        el.click(timeout=500)
                        clicked = True
                        break
                except Exception:
                    continue

            if not clicked:
                # Try keyboard right arrow; some galleries bind this
                try:
                    page.keyboard.press("ArrowRight")
                    clicked = True
                except Exception:
                    pass

            # If still not clicked, assume no more pages
            if not clicked:
                break

            # give time for network requests
            page.wait_for_timeout(wait_ms)

            after = len(zoom_ids)
            if after == before:
                seen_count += 1
            else:
                seen_count = 0

            if seen_count >= 2:  # two clicks with no new images -> stop
                break

        browser.close()

    zoom_ids = sorted(zoom_ids)
    items = []
    for zid in zoom_ids:
        dims = fetch_image_props(zid)
        items.append({
            "zoomId": zid,
            "tilesUrl": ZOOM_BASE.format(zoom_id=zid),
            **dims,
            "thumb": ZOOM_BASE.format(zoom_id=zid) + "TileGroup0/0-0-0.jpg"
        })

    data = {"recordId": record_id, "count": len(items), "items": items}
    out_path.write_text(json.dumps(data, indent=2))
    print(f"[ok] {out_path} with {len(items)} item(s)")
    return out_path

def awaitable_is_visible(locator):
    try:
        return locator.is_visible(timeout=200)
    except Exception:
        return False

if __name__ == "__main__":
    # Example: python scrape_oov_playwright.py
    scrape_record(419)
