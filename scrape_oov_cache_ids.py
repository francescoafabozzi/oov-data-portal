# scrape_oov_cache_ids.py
# pip install requests
import re, json
from pathlib import Path
import requests
import sys
import pandas as pd
import time

UA = "Mozilla/5.0"
RECORD_URL = "https://oov.som.yale.edu/search_detail_book.php?id={record_id}"
ZOOM_BASE  = "https://oov.som.yale.edu/files/new-goetzmann-by-id/zoom/{zoom_id}/"
RECORDS_DIR = "records"

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
    print(f"Processing record {record_id}...")
    
    try:
        ids = get_zoom_ids_from_cache(record_id)
        if not ids:
            print(f"  No zoom IDs found for record {record_id}")
            return False
            
        items = []
        for zid in ids:
            print(f"  Processing zoom ID {zid}...")
            props = get_image_props(zid)
            items.append({
                "zoomId": zid,
                "tilesUrl": ZOOM_BASE.format(zoom_id=zid),
                **props,
                "thumb": ZOOM_BASE.format(zoom_id=zid) + "TileGroup0/0-0-0.jpg"
            })
        
        data = {"recordId": record_id, "count": len(items), "items": items}
        
        # Ensure records directory exists
        Path(RECORDS_DIR).mkdir(exist_ok=True)
        
        # Save to records directory
        output_file = Path(RECORDS_DIR) / f"record_{record_id}.json"
        output_file.write_text(json.dumps(data, indent=2))
        
        print(f"  ✓ record_{record_id}.json written with {len(items)} item(s): {[i['zoomId'] for i in items]}")
        return True
        
    except Exception as e:
        print(f"  ✗ Error processing record {record_id}: {e}")
        return False

def batch_process(start_id: int, end_id: int):
    """Process a range of record IDs"""
    print(f"Batch processing records {start_id} to {end_id}...")
    
    success_count = 0
    total_count = end_id - start_id + 1
    
    for record_id in range(start_id, end_id + 1):
        if build_manifest(record_id):
            success_count += 1
        print()  # Empty line for readability
    
    print(f"Batch complete: {success_count}/{total_count} records processed successfully")

def process_specific_ids(id_list):
    """Process a specific list of record IDs"""
    print(f"Processing specific IDs: {id_list}")
    
    success_count = 0
    total_count = len(id_list)
    
    for record_id in id_list:
        if build_manifest(record_id):
            success_count += 1
        print()  # Empty line for readability
    
    print(f"Processing complete: {success_count}/{total_count} records processed successfully")

def process_all_from_results():
    """Process all IDs from results.json"""
    try:
        print("Reading IDs from results.json...")
        df = pd.read_json('results.json')
        id_list = df['id'].tolist()
        print(f"Found {len(id_list)} IDs to process")
        
        # Ask for confirmation before processing all
        if len(id_list) > 100:
            response = input(f"This will process {len(id_list)} records. Continue? (y/N): ")
            if response.lower() != 'y':
                print("Cancelled.")
                return
        
        success_count = 0
        total_count = len(id_list)
        
        for i, record_id in enumerate(id_list, 1):
            print(f"\n[{i}/{total_count}] ", end="")
            if build_manifest(record_id):
                success_count += 1
            
            # Add a small delay to be respectful to the server
            if i < total_count:
                time.sleep(0.5)
        
        print(f"\n🎉 All done! {success_count}/{total_count} records processed successfully")
        
    except FileNotFoundError:
        print("❌ Error: results.json not found in current directory")
    except Exception as e:
        print(f"❌ Error reading results.json: {e}")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        command = sys.argv[1]
        
        if command == "batch" and len(sys.argv) == 4:
            # python scrape_oov_cache_ids.py batch 1 100
            start_id = int(sys.argv[2])
            end_id = int(sys.argv[3])
            batch_process(start_id, end_id)
            
        elif command == "list" and len(sys.argv) > 2:
            # python scrape_oov_cache_ids.py list 419 705 1000
            id_list = [int(x) for x in sys.argv[2:]]
            process_specific_ids(id_list)
            
        elif command == "single" and len(sys.argv) == 3:
            # python scrape_oov_cache_ids.py single 419
            record_id = int(sys.argv[2])
            build_manifest(record_id)
            
        elif command == "all":
            # python scrape_oov_cache_ids.py all
            process_all_from_results()
            
        else:
            print("Usage:")
            print("  python scrape_oov_cache_ids.py all                    # Process ALL IDs from results.json")
            print("  python scrape_oov_cache_ids.py single <id>           # Process single record")
            print("  python scrape_oov_cache_ids.py batch <start> <end>   # Process range")
            print("  python scrape_oov_cache_ids.py list <id1> <id2> ... # Process specific IDs")
            print("  python scrape_oov_cache_ids.py                       # Process record 419 (default)")
    else:
        # Default: process record 419
        build_manifest(419)
