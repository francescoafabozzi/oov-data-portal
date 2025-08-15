import requests
from lxml import html
import pandas as pd
from tqdm import tqdm
import re
import numpy as np

df = pd.read_json('results.json')
id_list = df['id'].tolist()
base_path = "https://oov.som.yale.edu/search_detail_book.php?id="



url = base_path + str(id_list[1])
res = requests.get(url)
tree = html.fromstring(res.content)
page_items = tree.xpath('//div/img[@class="book_page"]')
len(page_items)




descriptions = []
n_pages = []
for id_ in tqdm(id_list,position=0,desc="Scraping descriptions"):
    url = base_path + str(id_)
    res = requests.get(url)
    tree = html.fromstring(res.content)
    descriptions.append(tree.xpath('/html/body/div/div[3]/div[1]/div/div[2]/text()'))
    page_items = tree.xpath('//div/img[@class="book_page"]')
    n_pages.append(len(page_items))

desc = sum(descriptions,[])
pattern = re.compile(
    r"^(?:Page|Pge)\s+\d+\s*(?:left|right)?\s*of\s+\d+\s*-?\s*",
    re.IGNORECASE
)
len(desc)
cleaned = [pattern.sub("",d.strip()) for d in desc]

df['cleaned_description'] = cleaned
df['n_pages'] = n_pages


df['n_pages'].cumsum()
thumbnail_index = (df['n_pages'].cumsum().shift(1) + 1).replace(np.nan,1).astype(int)

thumbnail_index[2]
thumbnail_index[5]
df.iloc[18]

jpg_url = ""
output_file = "thumbnails/"

thumbnail_index[10]

df.iloc[220]
thumbnail_index[]

df.iloc[19]


thumbnail_index[10]
thumbnail_index[17]
thumbnail_index[456]

ind = 55
print(f"Thumbnail index: {thumbnail_index[ind]}")
df.iloc[ind]

df['dirty_index'] = thumbnail_index

df['cleaned_description'] = cleaned


thumbnail_index[50]


### Corrections 
# thumbnail_index[17] currently is 214... should be 215 -- there is a random image for 214
# thumbnail_index[33] currently is 272... should be 274 -- there is a random image for 237 should be skipped and not included in previous
# thumbnail_index[36] currently at 293, should be 296 -- duplicate of 294, we can exclude 295







# URL Collection
for id_ in tqdm(id_list,position=0,desc="Scraping thumbnails"):
    try:
        jpg_url = f"https://oov.som.yale.edu/files/new-goetzmann-by-id/cache/{id_}-results.jpg"
        response = requests.get(jpg_url, stream=True)
        with open(f"thumbnails/{id_}.jpg", "wb") as f:
            for chunk in response.iter_content(chunk_size=1024):
                f.write(chunk)
    except:
        print(f"No thumbnail found for {id_}")
        continue

response = requests.get(jpg_url, stream=True)



#########################################################################
# Trying to collect images


import os, math, requests
from PIL import Image
from urllib.parse import urljoin

BASE = "https://oov.som.yale.edu/files/new-goetzmann-by-id/zoom/705/"
WIDTH, HEIGHT, TILE = 1180, 768, 256   # from IMAGE_PROPERTIES

os.makedirs("tiles", exist_ok=True)

# Compute highest zoom level in Zoomify: scale decreases by 2 each level until <= tile
max_dim = max(WIDTH, HEIGHT)
max_level = int(math.ceil(math.log(max_dim, 2)))  # Zoomify levels start at 0; we'll probe down to 0

def tile_count(w, h, tile=TILE):
    return math.ceil(w/tile), math.ceil(h/tile)

# Find the highest level that actually exists by probing one tile
def level_exists(level):
    test = urljoin(BASE, f"TileGroup0/{level}-0-0.jpg")
    return requests.get(test).status_code == 200

while not level_exists(max_level) and max_level > 0:
    max_level -= 1

# Determine scaled size at that level (Zoomify uses powers of two)
scale = 2 ** max_level
wL = math.ceil(WIDTH / (2 ** (int(math.ceil(math.log(max_dim,2))) - max_level)))
hL = math.ceil(HEIGHT / (2 ** (int(math.ceil(math.log(max_dim,2))) - max_level)))

nx, ny = tile_count(wL, hL)

# Download tiles; tile groups increment every 256 tiles overall
tile_num = 0
for y in range(ny):
    for x in range(nx):
        group = tile_num // 256
        url = urljoin(BASE, f"TileGroup{group}/{max_level}-{x}-{y}.jpg")
        path = f"tiles/{max_level}-{x}-{y}.jpg"
        r = requests.get(url)
        r.raise_for_status()
        with open(path, "wb") as f: f.write(r.content)
        tile_num += 1

# Stitch highest-level tiles
canvas = Image.new("RGB", (nx*TILE, ny*TILE), "white")
for y in range(ny):
    for x in range(nx):
        tile = Image.open(f"tiles/{max_level}-{x}-{y}.jpg")
        canvas.paste(tile, (x*TILE, y*TILE))
# Crop to exact image size
final = canvas.crop((0, 0, wL, hL))
final.save("zoomify_stitched.jpg", quality=95)
print("Saved zoomify_stitched.jpg")






#########################################################################
import re
from typing import Optional, Dict, Any
import requests
from bs4 import BeautifulSoup
import pandas as pd


def scrape_oov_record(record_id: int,
                      *,
                      include_dimensions: bool = True,
                      session: Optional[requests.Session] = None,
                      timeout: int = 30) -> Dict[str, Any]:
    """
    Fetch title, description, and all Zoomify page entries for a given OOV record.

    Returns:
        {
          "recordId": int,
          "title": str,
          "description": str,
          "count": int,
          "items": [
            {
              "zoomId": int,
              "tilesUrl": str,
              "thumb": str,
              "width": Optional[int],
              "height": Optional[int],
              "tileSize": int
            }, ...
          ]
        }
    """
    s = session or requests.Session()
    headers = {"User-Agent": "Mozilla/5.0"}
    record_url = f"https://oov.som.yale.edu/search_detail_book.php?id={record_id}"
    r = s.get(record_url, headers=headers, timeout=timeout)
    r.raise_for_status()
    html = r.text

    soup = BeautifulSoup(html, "lxml")
    title_el = soup.select_one("#image_title")
    desc_el  = soup.select_one("#image_description")
    title = (title_el.get_text(strip=True) if title_el else "") or ""
    description = (desc_el.get_text(strip=True) if desc_el else "") or ""

    # All page images appear as .../files/new-goetzmann-by-id/cache/<ZOOM_ID>-results.jpg
    zoom_ids = sorted({int(m) for m in re.findall(
        r"/files/new-goetzmann-by-id/cache/(\d+)-results\.jpg", html)})

    def fetch_props(zid: int):
        if not include_dimensions:
            return {"width": None, "height": None, "tileSize": 256}
        url = f"https://oov.som.yale.edu/files/new-goetzmann-by-id/zoom/{zid}/ImageProperties.xml"
        try:
            rx = s.get(url, headers=headers, timeout=timeout)
            if rx.ok and rx.text:
                m = re.search(
                    r'WIDTH="(\d+)".*?HEIGHT="(\d+)".*?TILESIZE="(\d+)"',
                    rx.text
                )
                if m:
                    return {
                        "width": int(m.group(1)),
                        "height": int(m.group(2)),
                        "tileSize": int(m.group(3)),
                    }
        except requests.RequestException:
            pass
        return {"width": None, "height": None, "tileSize": 256}

    items = []
    for zid in zoom_ids:
        props = fetch_props(zid)
        base = f"https://oov.som.yale.edu/files/new-goetzmann-by-id/zoom/{zid}/"
        items.append({
            "zoomId": zid,
            "tilesUrl": base,
            "thumb": base + "TileGroup0/0-0-0.jpg",
            **props
        })

    return {
        "recordId": record_id,
        "title": title,
        "description": description,
        "count": len(items),
        "items": items
    }
    
from tqdm import tqdm
full_desc = [scrape_oov_record(id_) for id_ in tqdm(df['id'].tolist(),position=0,desc="Scraping full descriptions")]

df_full_desc = pd.DataFrame(full_desc)

df_full_desc['description']

pattern = re.compile(
    r"^(?:Page|Pge)\s+\d+\s*(?:left|right)?\s*of\s+\d+\s*-?\s*",
    re.IGNORECASE
)

cleaned = [pattern.sub("",d.strip()) for d in df_full_desc['description'].tolist()]

df_full_desc['cleaned_description'] = cleaned

new_results = df.drop(columns=['description','title'])


new_results = new_results.merge(
    df_full_desc.drop(columns=['description']),
    left_on='id',right_on='recordId',how='left'
).rename(columns={'cleaned_description':'description'})

new_results[
    [
        'id','title','description','location','date','period',
        'type','gallery','ledger','owner'
    ]
].to_json('results.json', orient='records')

new_results.to_json('results_full_desc.json', orient='records')


df

#df_full_desc.to_json('full_desc.json', orient='records')

#df['full_desc'] = df_full_desc['description'].tolist()
#df.to_json('results_full_desc.json', orient='records')