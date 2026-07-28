import json
import os
import sys

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

def enforce_strict_unique_catalog():
    catalog_path = "public/songs_catalog.json"
    if not os.path.exists(catalog_path):
        print(f"找不到 {catalog_path}")
        return

    with open(catalog_path, "r", encoding="utf-8") as f:
        catalog = json.load(f)

    before_count = len(catalog)
    unique_map = {}
    duplicate_count = 0

    for song in catalog:
        title = song.get("title", "").strip()
        artist = song.get("artist", "").strip()
        key = (title.lower(), artist.lower())

        if key not in unique_map:
            unique_map[key] = song
        else:
            duplicate_count += 1

    unique_catalog = list(unique_map.values())
    after_count = len(unique_catalog)

    with open(catalog_path, "w", encoding="utf-8") as f:
        json.dump(unique_catalog, f, ensure_ascii=False, indent=2)

    print("\n" + "═"*60)
    print("🛡️ 嚴格清理迴圈重複歌 - 獨一無二歌庫報告")
    print("═"*60)
    print(f"📉 清理前歌曲筆數: {before_count:,} 首")
    print(f"🧹 成功剔除之迴圈重複歌曲: {duplicate_count:,} 首")
    print(f"🌟 **最終100%獨一無二純淨歌庫總數: {after_count:,} 首**")
    print("═"*60 + "\n")

if __name__ == "__main__":
    enforce_strict_unique_catalog()
