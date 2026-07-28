import json
import os
import sys

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

def deduplicate_catalog():
    catalog_path = "public/songs_catalog.json"
    if not os.path.exists(catalog_path):
        print(f"找不到 {catalog_path}")
        return

    with open(catalog_path, "r", encoding="utf-8") as f:
        catalog = json.load(f)

    before_count = len(catalog)
    unique_songs = {}
    merged_count = 0

    for song in catalog:
        title = song.get("title", "").strip()
        artist = song.get("artist", "").strip()
        key = (title.lower(), artist.lower())

        if key not in unique_songs:
            unique_songs[key] = song
        else:
            # 重複歌曲：合併品牌點碼與收錄狀態
            existing_song = unique_songs[key]
            existing_brands = existing_song.get("brands", {})
            new_brands = song.get("brands", {})

            for b_id, b_info in new_brands.items():
                if b_info.get("available"):
                    # 若現有品牌未收錄或舊點碼無效，更新為有效點碼
                    if not existing_brands.get(b_id, {}).get("available"):
                        existing_brands[b_id] = b_info

            # 保留長度較長或精確的歌詞摘要
            if not existing_song.get("lyricsSnippet") and song.get("lyricsSnippet"):
                existing_song["lyricsSnippet"] = song.get("lyricsSnippet")

            merged_count += 1

    cleaned_catalog = list(unique_songs.values())
    after_count = len(cleaned_catalog)

    with open(catalog_path, "w", encoding="utf-8") as f:
        json.dump(cleaned_catalog, f, ensure_ascii=False, indent=2)

    print("\n" + "═"*60)
    print("🧹 全庫假重複歌曲自動歸併與去重報告 (Deduplication Report)")
    print("═"*60)
    print(f"📉 去重前總歌曲數: {before_count:,} 首")
    print(f"✨ 成功歸併並去重之假重複歌曲: {merged_count:,} 首")
    print(f"🌟 去重後真實淨歌庫總數: {after_count:,} 首")
    print("═"*60 + "\n")

if __name__ == "__main__":
    deduplicate_catalog()
