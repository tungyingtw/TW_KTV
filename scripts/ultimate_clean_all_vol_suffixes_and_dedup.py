import json
import os
import sys
import re

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

# 正則比對：匹配各種 Vol.1, Vol 1, Vol1, .1, .2, .3, VCD, DVD, CD1, Live, Remix 等後綴
PATTERN = re.compile(
    r'(\s*Vol\s*\.?\s*\d+|\s*VOL\s*\.?\s*\d+|\s*vol\s*\.?\s*\d+|\s*\.\s*\d+|\s*VCD|\s*DVD|\s*CD\s*\d+|\s*\(Live\)|\s*\(Remix\)|\s*\(DJ版\)|\s*\(伴奏\)|\s*\(高清\)|\s*\(3D\)|\s*（Live）|\s*（Remix）|\s*（DJ版）|\s*（伴奏）|\s*（高清）|\s*（3D）|\s*\(Vol\.\d+\)|\s*（Vol\.\d+）)$',
    re.IGNORECASE
)

def ultimate_clean_and_deduplicate():
    catalog_path = "public/songs_catalog.json"
    if not os.path.exists(catalog_path):
        print(f"找不到 {catalog_path}")
        return

    with open(catalog_path, "r", encoding="utf-8") as f:
        catalog = json.load(f)

    before_count = len(catalog)
    cleaned_titles_count = 0
    unique_songs = {}
    merged_count = 0

    for song in catalog:
        raw_title = song.get("title", "").strip()
        raw_artist = song.get("artist", "").strip()

        # 1. 徹底抹平 Vol.1, Vol.2, .1, .2, VCD 等後綴
        clean_title = raw_title
        while PATTERN.search(clean_title):
            clean_title = PATTERN.sub('', clean_title).strip()

        if clean_title != raw_title:
            cleaned_titles_count += 1

        song["title"] = clean_title or raw_title

        # 2. 歸併 key (小寫去標點)
        norm_t = re.sub(r'[^\w\u4e00-\u9fa5]', '', song["title"]).lower()
        norm_a = re.sub(r'[^\w\u4e00-\u9fa5]', '', raw_artist).lower()
        key = (norm_t or song["title"].lower(), norm_a or raw_artist.lower())

        if key not in unique_songs:
            unique_songs[key] = song
        else:
            # 歸併品牌點碼與收錄狀態
            existing_song = unique_songs[key]
            existing_brands = existing_song.get("brands", {})
            new_brands = song.get("brands", {})

            for b_id, b_info in new_brands.items():
                if b_info.get("available"):
                    if not existing_brands.get(b_id, {}).get("available") or existing_brands.get(b_id, {}).get("code") == "OK":
                        existing_brands[b_id] = b_info

            # 保留較優良歌詞
            current_snippet = existing_song.get("lyricsSnippet", "")
            new_snippet = song.get("lyricsSnippet", "")
            if (not current_snippet and new_snippet) or (new_snippet and len(new_snippet) > len(current_snippet)):
                existing_song["lyricsSnippet"] = new_snippet

            merged_count += 1

    final_catalog = list(unique_songs.values())
    after_count = len(final_catalog)

    with open(catalog_path, "w", encoding="utf-8") as f:
        json.dump(final_catalog, f, ensure_ascii=False, indent=2)

    print("\n" + "═"*60)
    print("🧹 全庫 Vol.1 / Vol.2 / .1 / .2 完全抹平與深度去重終極報告")
    print("═"*60)
    print(f"📉 處理前總歌曲數: {before_count:,} 首")
    print(f"✨ 成功修正與抹平 Vol/後綴歌名數: {cleaned_titles_count:,} 首")
    print(f"✨ 成功歸併並去重之重複歌曲數: {merged_count:,} 首")
    print(f"🌟 **最終極致純淨歌庫總數: {after_count:,} 首**")
    print("═"*60 + "\n")

if __name__ == "__main__":
    ultimate_clean_and_deduplicate()
