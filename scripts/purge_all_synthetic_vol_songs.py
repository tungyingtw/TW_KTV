import json
import os
import sys
import re

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

def purge_synthetic_vol_songs():
    catalog_path = "public/songs_catalog.json"
    db_path = "server/database.json"

    if not os.path.exists(catalog_path):
        print(f"找不到 {catalog_path}")
        return

    with open(catalog_path, "r", encoding="utf-8") as f:
        catalog = json.load(f)

    before_count = len(catalog)
    purged_count = 0
    clean_catalog = []

    vol_pattern = re.compile(r'\bVol\.\d+|\bVOL\.\d+|\bvol\.\d+|\bNo\.\d+', re.I)

    for song in catalog:
        title = song.get("title", "").strip()
        song_id = str(song.get("id", ""))

        # 判斷是否為合成假歌 (帶有 Vol.x 或 No.x)
        if vol_pattern.search(title) or song_id.startswith("s100") or "Vol." in title:
            purged_count += 1
            continue

        clean_catalog.append(song)

    after_count = len(clean_catalog)

    # 同步寫入 public/songs_catalog.json 與 server/database.json
    with open(catalog_path, "w", encoding="utf-8") as f:
        json.dump(clean_catalog, f, ensure_ascii=False, indent=2)

    if os.path.exists(db_path):
        with open(db_path, "w", encoding="utf-8") as f:
            json.dump(clean_catalog, f, ensure_ascii=False, indent=2)

    print("\n" + "═"*60)
    print("🧹 清理合成假歌 - 徹底剔除 Vol.1~Vol.9 虛構歌曲報告")
    print("═"*60)
    print(f"📉 清理前資料庫筆數: {before_count:,} 首")
    print(f"🔥 徹底清除並剔除之合成假歌: {purged_count:,} 首")
    print(f"🌟 **最終留存之正統真實歌曲總數: {after_count:,} 首**")
    print("═"*60 + "\n")

if __name__ == "__main__":
    purge_synthetic_vol_songs()
