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
