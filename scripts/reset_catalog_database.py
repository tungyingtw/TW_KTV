#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
reset_catalog_database.py
======================================================
一鍵重置與清空歌庫資料庫 (Reset Catalog Database)
"""

import sys
import os
import json
import re

sys.stdout.reconfigure(encoding='utf-8') if hasattr(sys.stdout, 'reconfigure') else None

ROOT_DIR = os.path.join(os.path.dirname(__file__), "..")
CATALOG_PATH = os.path.join(ROOT_DIR, "public/songs_catalog.json")
SERVER_DB_PATH = os.path.join(ROOT_DIR, "server/database.json")
API_SERVICE_PATH = os.path.join(ROOT_DIR, "src/services/apiService.ts")

def reset_database():
    print("\n" + "═" * 60)
    print("🧹 正在執行歌庫資料庫一鍵清空與重置...")
    print("═" * 60)

    # 1. 清空 public/songs_catalog.json
    with open(CATALOG_PATH, "w", encoding="utf-8") as f:
        json.dump([], f, ensure_ascii=False, indent=2)
    print("✅ 已清空 public/songs_catalog.json (數據重置為 0 首)")

    # 2. 清空 server/database.json
    if os.path.exists(SERVER_DB_PATH):
        with open(SERVER_DB_PATH, "w", encoding="utf-8") as f:
            json.dump([], f, ensure_ascii=False, indent=2)
        print("✅ 已清空 server/database.json (後端數據重置為 0 首)")

    # 3. 自動自動升級 IndexedDB 快取版本號 (促使前台瀏覽器 F5 自動清空快取)
    if os.path.exists(API_SERVICE_PATH):
        with open(API_SERVICE_PATH, "r", encoding="utf-8") as f:
            content = f.read()

        match = re.search(r"const KEY_NAME = 'full_catalog_v(\d+)';", content)
        if match:
            curr_v = int(match.group(1))
            new_v = curr_v + 1
            new_content = content.replace(f"const KEY_NAME = 'full_catalog_v{curr_v}';", f"const KEY_NAME = 'full_catalog_v{new_v}';")
            with open(API_SERVICE_PATH, "w", encoding="utf-8") as f:
                f.write(new_content)
            print(f"✅ 前端 IndexedDB 快取版本已自動升級至 v{new_v} (強制瀏覽器重置快取)")

    print("\n" + "═" * 60)
    print("🎉 資料庫已成功 100% 完全清空！現在歌庫筆數為 0 首。")
    print("👉 您現在可以點擊 [2] 驗證從 0 首開始自動連線爬取的全過程！")
    print("═" * 60 + "\n")

if __name__ == "__main__":
    reset_database()
