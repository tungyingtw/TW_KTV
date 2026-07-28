import json
import os
import sys
import re

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

def normalize_title(title):
    if not title:
        return ''
    # 移除 (Live), (Remix), (DJ版), (伴奏), (高清), (3D), (新版) 等括號
    clean = re.sub(r'[\(\（].*?[\)\）]', '', title)
    # 移除所有非中英文字元與空白，統一小寫
    clean = re.sub(r'[^\w\u4e00-\u9fa5]', '', clean).lower()
    return clean

def normalize_artist(artist):
    if not artist:
        return ''
    # 移除非中英文字元
    clean = re.sub(r'[^\w\u4e00-\u9fa5]', '', artist).lower()
    return clean

def deep_fuzzy_deduplicate():
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
        raw_title = song.get("title", "").strip()
        raw_artist = song.get("artist", "").strip()

        norm_t = normalize_title(raw_title)
        norm_a = normalize_artist(raw_artist)

        # 若正規化後為空，使用原始字串
        key = (norm_t or raw_title.lower(), norm_a or raw_artist.lower())

        if key not in unique_songs:
            # 清理原始標題中的多餘空白與括號後綴
            clean_title = re.sub(r'[\(\（].*?[\)\）]', '', raw_title).strip()
            song["title"] = clean_title or raw_title
            unique_songs[key] = song
        else:
            # 重複歌曲：匯集品牌點歌號碼與收錄狀態
            existing_song = unique_songs[key]
            existing_brands = existing_song.get("brands", {})
            new_brands = song.get("brands", {})

            for b_id, b_info in new_brands.items():
                if b_info.get("available"):
                    # 若現有品牌未收錄或舊點碼無效，更新為有效點碼
                    if not existing_brands.get(b_id, {}).get("available") or existing_brands.get(b_id, {}).get("code") == "OK":
                        existing_brands[b_id] = b_info

            # 保留長度較長或真實歌詞摘要
            current_snippet = existing_song.get("lyricsSnippet", "")
            new_snippet = song.get("lyricsSnippet", "")
            if (not current_snippet and new_snippet) or (new_snippet and len(new_snippet) > len(current_snippet)):
                existing_song["lyricsSnippet"] = new_snippet

            merged_count += 1

    cleaned_catalog = list(unique_songs.values())
    after_count = len(cleaned_catalog)

    with open(catalog_path, "w", encoding="utf-8") as f:
        json.dump(cleaned_catalog, f, ensure_ascii=False, indent=2)

    print("\n" + "═"*60)
    print("🧹 全庫深度模糊去重與點碼全量匯集報告 (Deep Deduplication Report)")
    print("═"*60)
    print(f"📉 歸併前總歌曲數: {before_count:,} 首")
    print(f"✨ 成功歸併並去重之衍生/重複歌曲: {merged_count:,} 首")
    print(f"🌟 歸併後真實純淨歌庫總數: {after_count:,} 首")
    print("═"*60 + "\n")

if __name__ == "__main__":
    deep_fuzzy_deduplicate()
