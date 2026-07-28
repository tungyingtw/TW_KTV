#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
好樂迪 KTV 歌曲查詢爬蟲
========================================
透過好樂迪 App 底層 API 查詢歌曲收錄狀態。

使用方式：
    python scripts/crawler/holiday_crawler.py --query "齊天"
    python scripts/crawler/holiday_crawler.py --query "就是哪吒"
    python scripts/crawler/holiday_crawler.py --list songs.txt  # 逐行查詢清單

輸出：
    crawler_results/holiday_<日期>.json
"""

import sys
import os
import json
import time
import argparse
import re
from datetime import datetime

# 嘗試引入 requests，若未安裝請先執行 pip install requests
try:
    import requests
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False
    print("[警告] 找不到 requests 套件，請執行: pip install requests")

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "../../crawler_results")

# ─────────────────────────────────────────────
# 好樂迪 API 端點（透過官方 App 封包分析取得）
# 注意：若 API 有所更新，需重新更新此處的 URL
# ─────────────────────────────────────────────
HOLIDAY_SEARCH_URL = "https://www.holidayktv.com.tw/song/search"
HOLIDAY_HEADERS = {
    "User-Agent": "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15",
    "Accept": "application/json",
    "Referer": "https://www.holidayktv.com.tw/",
}


def search_holiday(query: str, session: requests.Session) -> dict:
    """
    在好樂迪曲目系統搜尋單一歌曲。
    回傳格式：{ found: bool, count: int, songs: [{ title, artist, code }] }
    """
    try:
        params = {"keyword": query, "page": 1, "limit": 10}
        resp = session.get(HOLIDAY_SEARCH_URL, params=params, headers=HOLIDAY_HEADERS, timeout=10)

        if resp.status_code == 200:
            data = resp.json()
            songs = data.get("data", data.get("songs", data.get("items", [])))
            return {
                "query": query,
                "brand": "holiday",
                "found": len(songs) > 0,
                "count": len(songs),
                "songs": songs[:5],  # 只保留前 5 筆
                "raw_status": resp.status_code,
                "timestamp": datetime.now().isoformat(),
            }
        else:
            return {
                "query": query,
                "brand": "holiday",
                "found": False,
                "count": 0,
                "songs": [],
                "error": f"HTTP {resp.status_code}",
                "timestamp": datetime.now().isoformat(),
            }
    except Exception as e:
        return {
            "query": query,
            "brand": "holiday",
            "found": False,
            "count": 0,
            "songs": [],
            "error": str(e),
            "timestamp": datetime.now().isoformat(),
        }


def run_batch(queries: list) -> list:
    """批次查詢多首歌曲，回傳結果清單。"""
    if not HAS_REQUESTS:
        print("[錯誤] 缺少 requests 套件，無法執行爬蟲")
        return []

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    results = []

    with requests.Session() as session:
        for i, query in enumerate(queries):
            print(f"  [{i+1}/{len(queries)}] 查詢：{query} ...", end=" ")
            result = search_holiday(query.strip(), session)
            status = "✅ 有收錄" if result["found"] else "❌ 未收錄"
            print(f"{status} (count={result['count']})")
            results.append(result)
            time.sleep(0.8)  # 禮貌延遲，避免過快請求

    # 儲存結果
    date_str = datetime.now().strftime("%Y%m%d_%H%M")
    output_path = os.path.join(OUTPUT_DIR, f"holiday_{date_str}.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print(f"\n✅ 查詢完畢！結果儲存至：{output_path}")
    return results


def main():
    parser = argparse.ArgumentParser(description="好樂迪 KTV 歌曲查詢爬蟲")
    parser.add_argument("--query", "-q", type=str, help="查詢單一歌名")
    parser.add_argument("--list", "-l", type=str, help="包含歌名清單的文字檔（每行一首）")
    args = parser.parse_args()

    if args.query:
        queries = [args.query]
    elif args.list:
        with open(args.list, "r", encoding="utf-8") as f:
            queries = [line.strip() for line in f if line.strip()]
    else:
        # 預設測試集（常見陸歌 + 台灣獨立樂團 + 驗證基準歌曲）
        queries = [
            "齊天", "就是哪吒", "飛鳥和蟬", "踏山河",
            "大風吹", "捲菸", "晚安", "玫瑰少年",
            "稻香", "愛情轉移", "說好不哭", "告白氣球",
        ]

    print("=" * 50)
    print("好樂迪 KTV 歌曲查詢爬蟲")
    print("=" * 50)
    results = run_batch(queries)

    found = [r for r in results if r.get("found")]
    not_found = [r for r in results if not r.get("found")]
    print(f"\n📊 統計：共查 {len(results)} 首，有收錄 {len(found)} 首，未收錄 {len(not_found)} 首")


if __name__ == "__main__":
    main()
