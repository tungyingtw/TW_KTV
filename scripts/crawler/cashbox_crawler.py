#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
錢櫃 KTV 歌曲查詢爬蟲
========================================
透過錢櫃官網查歌系統查詢歌曲收錄狀態。

使用方式：
    python scripts/crawler/cashbox_crawler.py --query "齊天"
    python scripts/crawler/cashbox_crawler.py --list songs.txt

輸出：
    crawler_results/cashbox_<日期>.json
"""

import sys
import os
import json
import time
import argparse
from datetime import datetime

try:
    import requests
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False
    print("[警告] 找不到 requests 套件，請執行: pip install requests")

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "../../crawler_results")

# ─────────────────────────────────────────────
# 錢櫃 API 端點（透過官網查歌系統分析取得）
# ─────────────────────────────────────────────
CASHBOX_SEARCH_URL = "https://www.cashboxparty.com/song/search"
CASHBOX_HEADERS = {
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/120.0.0.0 Safari/537.36",
    "Accept": "application/json, text/html",
    "Referer": "https://www.cashboxparty.com/",
    "Accept-Language": "zh-TW,zh;q=0.9",
}


def search_cashbox(query: str, session: requests.Session) -> dict:
    """
    在錢櫃曲目系統搜尋單一歌曲。
    回傳格式：{ found: bool, count: int, songs: [{ title, artist, code }] }
    """
    try:
        params = {"keyword": query, "type": "song", "page": 1}
        resp = session.get(CASHBOX_SEARCH_URL, params=params, headers=CASHBOX_HEADERS, timeout=10)

        if resp.status_code == 200:
            # 嘗試解析 JSON
            try:
                data = resp.json()
                songs = data.get("data", data.get("songs", data.get("result", [])))
            except Exception:
                # 若為 HTML 回應，用簡易 regex 比對歌名
                songs = []
                import re
                matches = re.findall(r'class="song[^"]*">([^<]+)</[^>]+>', resp.text)
                if any(query in m for m in matches):
                    songs = [{"title": m} for m in matches if query in m]

            return {
                "query": query,
                "brand": "cashbox",
                "found": len(songs) > 0,
                "count": len(songs),
                "songs": songs[:5],
                "raw_status": resp.status_code,
                "timestamp": datetime.now().isoformat(),
            }
        else:
            return {
                "query": query,
                "brand": "cashbox",
                "found": False,
                "count": 0,
                "songs": [],
                "error": f"HTTP {resp.status_code}",
                "timestamp": datetime.now().isoformat(),
            }
    except Exception as e:
        return {
            "query": query,
            "brand": "cashbox",
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
            result = search_cashbox(query.strip(), session)
            status = "✅ 有收錄" if result["found"] else "❌ 未收錄"
            print(f"{status} (count={result['count']})")
            results.append(result)
            time.sleep(1.0)

    date_str = datetime.now().strftime("%Y%m%d_%H%M")
    output_path = os.path.join(OUTPUT_DIR, f"cashbox_{date_str}.json")
    with open(output_path, "w", encoding="utf-8") as f:
        json.dump(results, f, ensure_ascii=False, indent=2)

    print(f"\n✅ 查詢完畢！結果儲存至：{output_path}")
    return results


def main():
    parser = argparse.ArgumentParser(description="錢櫃 KTV 歌曲查詢爬蟲")
    parser.add_argument("--query", "-q", type=str, help="查詢單一歌名")
    parser.add_argument("--list", "-l", type=str, help="包含歌名清單的文字檔（每行一首）")
    args = parser.parse_args()

    if args.query:
        queries = [args.query]
    elif args.list:
        with open(args.list, "r", encoding="utf-8") as f:
            queries = [line.strip() for line in f if line.strip()]
    else:
        queries = [
            "齊天", "就是哪吒", "飛鳥和蟬", "踏山河",
            "大風吹", "捲菸", "晚安", "玫瑰少年",
            "稻香", "愛情轉移", "說好不哭", "告白氣球",
        ]

    print("=" * 50)
    print("錢櫃 KTV 歌曲查詢爬蟲")
    print("=" * 50)
    results = run_batch(queries)

    found = [r for r in results if r.get("found")]
    not_found = [r for r in results if not r.get("found")]
    print(f"\n📊 統計：共查 {len(results)} 首，有收錄 {len(found)} 首，未收錄 {len(not_found)} 首")


if __name__ == "__main__":
    main()
