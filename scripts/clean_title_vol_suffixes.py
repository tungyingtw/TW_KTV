import json
import os
import sys
import re

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

def clean_vol_suffixes():
    catalog_path = "public/songs_catalog.json"
    if not os.path.exists(catalog_path):
        print(f"找不到 {catalog_path}")
        return

    with open(catalog_path, "r", encoding="utf-8") as f:
        catalog = json.load(f)

    cleaned_count = 0
    vol_pattern = re.compile(r'\s*(Vol\.\d+|VOL\.\d+|vol\.\d+|VCD|DVD|CD\d+|\(Vol\.\d+\))$', re.IGNORECASE)

    for song in catalog:
        title = song.get("title", "")
        if vol_pattern.search(title):
            new_title = vol_pattern.sub('', title).strip()
            if new_title:
                song["title"] = new_title
                cleaned_count += 1

    with open(catalog_path, "w", encoding="utf-8") as f:
        json.dump(catalog, f, ensure_ascii=False, indent=2)

    print("\n" + "═"*60)
    print("🧹 全庫歌名 Vol.1 / Vol.2 / VCD 發行後綴淨化報告")
    print("═"*60)
    print(f"✅ 歌庫總歌曲數: {len(catalog):,} 首")
    print(f"✨ 成功清理並淨化 Vol/VCD 後綴歌名: {cleaned_count:,} 首")
    print("═"*60 + "\n")

if __name__ == "__main__":
    clean_vol_suffixes()
