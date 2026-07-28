#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
corp_song_verifier.py
======================================================
「台灣點歌王 (song.corp.com.tw)」自動化交叉驗證與點碼補全工具

功能：
1. 透過 song.corp.com.tw API 批次反查我們的 songs_catalog.json 歌曲。
2. 自動校驗 錢櫃、好樂迪、音圓、金嗓、弘音、享溫馨 等廠牌收錄狀態。
3. 自動補全實體點碼 (Song Code) 與 Youtube MV ID。

使用方式：
    python scripts/crawler/corp_song_verifier.py --limit 100
"""

import sys
import os
import json
import time
import urllib.request
import urllib.parse
from datetime import datetime

sys.stdout.reconfigure(encoding='utf-8') if hasattr(sys.stdout, 'reconfigure') else None

ROOT_DIR = os.path.join(os.path.dirname(__file__), "../..")
CATALOG_PATH = os.path.join(ROOT_DIR, "public/songs_catalog.json")

# 廠牌名稱對照表 (Our brand ID -> song.corp.com.tw company name)
BRAND_MAP = {
    'cashbox': '錢櫃',
    'holiday': '好樂迪',
    'starlight': '星據點',
    'watering_hole': '享溫馨',
    'yinyuan': '音圓',
    'golden_voice': '金嗓',
    'hongyin': '弘音',
    'singgo': '銀櫃',
}

# 反向對照表 (song.corp.com.tw company name -> Our brand ID)
REVERSE_BRAND_MAP = {v: k for k, v in BRAND_MAP.items()}


def fetch_corp_song(company_name: str, keyword: str) -> list:
    """呼叫台灣點歌王 API 查詢歌曲"""
    encoded_company = urllib.parse.quote(company_name)
    encoded_keyword = urllib.parse.quote(keyword.strip())
    url = f"https://song.corp.com.tw/api/song.aspx?company={encoded_company}&cusType=searchList&minId=0&keyword={encoded_keyword}"

    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
    )
    try:
        with urllib.request.urlopen(req, timeout=8) as resp:
            content = resp.read().decode('utf-8', errors='ignore')
            data = json.loads(content)
            return data if isinstance(data, list) else []
    except Exception as e:
        # print(f"⚠️ 查詢 API 失敗 [{company_name}-{keyword}]: {e}")
        return []


def verify_and_enrich_catalog(catalog: list, limit: int = 50):
    print(f"🔍 開始向「台灣點歌王」進行 {limit} 首歌曲的交叉校驗與點碼補全 ...\n")
    
    updated_count = 0
    checked_count = 0

    for song in catalog[:limit]:
        title = song.get("title", "").strip()
        artist = song.get("artist", "").strip()
        if not title:
            continue

        checked_count += 1
        print(f"[{checked_count}/{limit}] 正在校驗：《{title}》 - {artist}")

        # 針對錢櫃、好樂迪等重點廠牌查詢
        for brand_id, corp_company in BRAND_MAP.items():
            results = fetch_corp_song(corp_company, title)
            
            # 比對歌手或歌名
            matched = False
            found_code = None
            found_yt = None

            for item in results:
                item_name = item.get("name", "").strip()
                item_singer = item.get("singer", "").strip()
                
                # 歌名完全匹配，且歌手包含或相似
                if item_name == title:
                    if not artist or artist in item_singer or item_singer in artist:
                        matched = True
                        found_code = item.get("code")
                        found_yt = item.get("youtubeID")
                        break
            
            # 更新 catalog 狀態
            if "brands" not in song:
                song["brands"] = {}

            current_bdata = song["brands"].get(brand_id, {"available": False})
            
            if matched:
                if not current_bdata.get("available") or (found_code and current_bdata.get("code") != found_code):
                    song["brands"][brand_id] = {
                        "available": True,
                        "code": found_code or current_bdata.get("code", "OK"),
                        "audioType": current_bdata.get("audioType", "original_vocal"),
                        "mvType": current_bdata.get("mvType", "official_mv"),
                        "note": "經台灣點歌王 API 自動驗證並補全點碼"
                    }
                    updated_count += 1
                    print(f"   ✨ [{corp_company}] 成功校驗：有收錄 (點碼: {found_code})")
            
            time.sleep(0.1) # 友善間隔

    return updated_count


def main():
    import argparse
    parser = argparse.ArgumentParser(description="台灣點歌王驗證與補全工具")
    parser.add_argument("--limit", type=int, default=10, help="要驗證的歌曲數量")
    args = parser.parse_args()

    print("=" * 60)
    print("🇹🇼 台灣點歌王 (song.corp.com.tw) 雙向校驗與點碼補全引擎")
    print("=" * 60)

    if not os.path.exists(CATALOG_PATH):
        print("❌ 找不到 public/songs_catalog.json")
        return

    with open(CATALOG_PATH, "r", encoding="utf-8") as f:
        catalog = json.load(f)

    limit = len(catalog) if args.limit <= 0 else args.limit
    print(f"📂 成功載入現有 {len(catalog):,} 首歌曲，準備執行 {limit:,} 首對外連線校驗...")

    updated = verify_and_enrich_catalog(catalog, limit=limit)

    print("\n" + "=" * 60)
    print(f"🎉 驗證完成！共校驗 {limit:,} 首歌曲，完成 {updated:,} 項點碼與收錄狀態更新。")
    print("=" * 60)


if __name__ == "__main__":
    main()
