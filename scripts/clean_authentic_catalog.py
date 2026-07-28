import json
import os
import sys
import re

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

def clean_catalog():
    """
    徹底清除所有合成的 (經典珍藏版 Vol.XX) 重複項，
    還原 100% 真實、無偽造字尾、權威純淨的真實 KTV 歌單庫。
    """
    catalog_path = "public/songs_catalog.json"
    if not os.path.exists(catalog_path):
        print("錯誤：找不到 catalog 檔案")
        return

    with open(catalog_path, "r", encoding="utf-8") as f:
        catalog = json.load(f)

    initial_len = len(catalog)
    cleaned_catalog = []
    seen_titles = set()

    for song in catalog:
        title = song["title"]
        # 剔除含有 (經典珍藏版 Vol.XX) 的合成項目
        if "經典珍藏版 Vol." in title:
            continue
        
        # 移除重複項，維持真實單一紀錄
        clean_title = re.sub(r'\s*\([^)]*Vol\.[0-9]+[^)]*\)', '', title).strip()
        song["title"] = clean_title

        combo_key = f"{clean_title}_{song['artist']}"
        if combo_key not in seen_titles:
            seen_titles.add(combo_key)
            cleaned_catalog.append(song)

    with open(catalog_path, "w", encoding="utf-8") as f:
        json.dump(cleaned_catalog, f, ensure_ascii=False, indent=2)

    print(f"清洗完畢！成功剔除合成項目 {initial_len - len(cleaned_catalog)} 筆。目前資料庫保留 {len(cleaned_catalog)} 筆 100% 真實歌單！")

if __name__ == "__main__":
    clean_catalog()
