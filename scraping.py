import requests
from lxml import html
import pandas as pd
from tqdm import tqdm
import re
import numpy as np

df = pd.read_json('results.json')
base_path = "https://oov.som.yale.edu/search_detail_book.php?id="
id_list = df['id'].tolist()


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

