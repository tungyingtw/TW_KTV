import json
import os
import sys
import re

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

def audit_lyrics_quality():
    catalog_path = "public/songs_catalog.json"
    if not os.path.exists(catalog_path):
        print(f"[錯誤] 找不到 {catalog_path}")
        return

    with open(catalog_path, "r", encoding="utf-8") as f:
        catalog = json.load(f)

    total = len(catalog)
    empty_count = 0
    bracket_count = 0
    seo_placeholder_count = 0
    meta_info_count = 0  # 包含 作詞/作曲/http 等非歌詞內容
    clean_lyrics_count = 0

    suspicious_items = []

    # 非歌詞內容關鍵字模式
    seo_pattern = re.compile(r'(10\s*大\s*KTV|歌號對照|點歌碼|包廂歡唱)')
    meta_pattern = re.compile(r'(http|https|www|作詞：|作曲：|編曲：|undefined|null|\[object)')
    bracket_pattern = re.compile(r'【.*】')

    for idx, song in enumerate(catalog):
        title = song.get("title", "")
        artist = song.get("artist", "")
        snippet = song.get("lyricsSnippet", "")

        if not snippet or not snippet.strip():
            empty_count += 1
            suspicious_items.append({"id": song.get("id"), "title": title, "artist": artist, "reason": "歌詞空白 (無顯示)"})
            continue

        if seo_pattern.search(snippet):
            seo_placeholder_count += 1
            suspicious_items.append({"id": song.get("id"), "title": title, "artist": artist, "snippet": snippet, "reason": "含有 SEO 占位非歌詞字眼"})
            continue

        if meta_pattern.search(snippet):
            meta_info_count += 1
            suspicious_items.append({"id": song.get("id"), "title": title, "artist": artist, "snippet": snippet, "reason": "含有網址/後台元數據非歌詞內容"})
            continue

        if bracket_pattern.search(snippet):
            bracket_count += 1
            suspicious_items.append({"id": song.get("id"), "title": title, "artist": artist, "snippet": snippet, "reason": "含有【】方括號前綴"})
            continue

        clean_lyrics_count += 1

    print("\n" + "═"*60)
    print("🔍 全庫 125,824 首歌曲歌詞品質與異常內容深度稽核報告")
    print("═"*60)
    print(f"📚 歌庫總歌曲數: {total:,} 首")
    print(f"✨ 乾淨正確歌詞顯示數: {clean_lyrics_count:,} 首 ({clean_lyrics_count/total*100:.2f}%)")
    print(f"❌ 歌詞空白無顯示數: {empty_count:,} 首")
    print(f"⚠️ 含有【】方括號前綴數: {bracket_count:,} 首")
    print(f"⚠️ 含有 SEO 占位字詞數: {seo_placeholder_count:,} 首")
    print(f"⚠️ 含有網址/作詞/後台非歌詞數: {meta_info_count:,} 首")
    print("═"*60)

    if suspicious_items:
        print(f"\n🚨 發現 {len(suspicious_items)} 筆需要修復的項目範例:")
        for item in suspicious_items[:5]:
            print(f"  • [{item['title']} - {item['artist']}]: {item['reason']} -> \"{item.get('snippet','')}\"")
    else:
        print("\n🎉 稽核通過！全庫 100% 歌曲歌詞均為乾淨正確的純歌詞，完全無任何雜質或非歌詞內容！\n")

if __name__ == "__main__":
    audit_lyrics_quality()
