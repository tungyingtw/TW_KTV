#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
export_artists_csv.py
======================================================
自動導出 6,434 位歌手名冊為 Excel / CSV 檔案 (UTF-8 with BOM，Excel 雙擊可開)
"""

import sys
import os
import json
import csv

sys.stdout.reconfigure(encoding='utf-8') if hasattr(sys.stdout, 'reconfigure') else None

ROOT_DIR = os.path.join(os.path.dirname(__file__), "..")
CATALOG_PATH = os.path.join(ROOT_DIR, "public/songs_catalog.json")
REGISTRY_PATH = os.path.join(ROOT_DIR, "public/artists_registry.json")
CSV_PATH = os.path.join(ROOT_DIR, "public/artists_registry.csv")

def export_csv():
    if not os.path.exists(REGISTRY_PATH):
        print(f"❌ 找不到名冊檔案: {REGISTRY_PATH}")
        return

    with open(REGISTRY_PATH, "r", encoding="utf-8") as f:
        registry = json.load(f)

    catalog = []
    if os.path.exists(CATALOG_PATH):
        try:
            with open(CATALOG_PATH, "r", encoding="utf-8") as f:
                catalog = json.load(f)
        except Exception:
            pass

    # 計算每位歌手在歌庫中已收錄的歌曲數量
    artist_song_counts = {}
    for s in catalog:
        artist = s.get("artist", "").strip()
        artist_song_counts[artist] = artist_song_counts.get(artist, 0) + 1

    print("\n" + "═" * 60)
    print(f"📊 正在導出 {len(registry):,} 位歌手大名冊至 Excel / CSV 檔案...")
    print("═" * 60)

    # 寫入 Excel 可直接雙擊開啟的 UTF-8-BOM CSV 檔案
    with open(CSV_PATH, "w", encoding="utf-8-sig", newline="") as f:
        writer = csv.writer(f)
        writer.writerow(["編號", "歌手/團體名稱", "類別標籤", "別名/譯名", "相關團體", "合唱組合", "歌庫已收錄曲數"])
        
        for idx, entry in enumerate(registry):
            primary_name = entry.get("primary_name", "")
            category = entry.get("category", "Solo / Group")
            aliases = ", ".join(entry.get("aliases", []))
            groups = ", ".join(entry.get("related_groups", []))
            collabs = ", ".join(entry.get("collaborations", []))
            song_count = artist_song_counts.get(primary_name, 0)

            writer.writerow([idx + 1, primary_name, category, aliases, groups, collabs, song_count])

    print(f"🎉 成功導出: {CSV_PATH}")
    print("👉 您可以在資料夾中直接「雙擊開起此 CSV 檔案」用 Excel / Google Sheets 檢視與搜尋！\n")

if __name__ == "__main__":
    export_csv()
