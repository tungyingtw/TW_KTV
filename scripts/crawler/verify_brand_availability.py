#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
KTV 資料庫差異比對與廠牌準確度驗證腳本
========================================
比對爬蟲查詢結果（crawler_results/*.json）與現有 public/songs_catalog.json 資料庫，
輸出差異報告 crawler_results/diff_report_<日期>.json。

使用方式：
    python scripts/crawler/verify_brand_availability.py

差異報告格式：
[
  {
    "songTitle": "齊天",
    "artist": "華晨宇",
    "brandId": "holiday",
    "catalogSays": false,    # 資料庫標記
    "crawlerSays": true,     # 爬蟲結果
    "discrepancy": "crawler_has_song_catalog_says_no",
    "action": "需更新 catalog → 好樂迪：有收錄"
  },
  ...
]
"""

import sys
import os
import json
import glob
from datetime import datetime

sys.stdout.reconfigure(encoding='utf-8') if hasattr(sys.stdout, 'reconfigure') else None

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "../../crawler_results")
CATALOG_PATH = os.path.join(os.path.dirname(__file__), "../../public/songs_catalog.json")


def load_catalog() -> list:
    with open(CATALOG_PATH, "r", encoding="utf-8") as f:
        return json.load(f)


def load_crawler_results() -> list:
    """載入 crawler_results/ 目錄下所有最新的爬蟲 JSON 結果。"""
    pattern = os.path.join(OUTPUT_DIR, "*.json")
    all_files = sorted(glob.glob(pattern))
    
    # 排除 diff_report 本身
    result_files = [f for f in all_files if "diff_report" not in os.path.basename(f)]
    
    all_results = []
    for fp in result_files:
        with open(fp, "r", encoding="utf-8") as f:
            data = json.load(f)
            if isinstance(data, list):
                all_results.extend(data)

    return all_results


def find_song_in_catalog(catalog: list, query: str) -> list:
    """在 catalog 中尋找歌名相符的歌曲（模糊匹配）。"""
    q = query.strip()
    return [s for s in catalog if q in s.get("title", "") or s.get("title", "") == q]


def build_diff_report(catalog: list, crawler_results: list) -> list:
    """
    比對爬蟲結果與 catalog 的廠牌可用性差異。
    回傳差異清單。
    """
    diffs = []

    for result in crawler_results:
        query = result.get("query", "")
        brand_id = result.get("brand", "")
        crawler_found = result.get("found", False)

        if not query or not brand_id:
            continue

        matched_songs = find_song_in_catalog(catalog, query)

        if not matched_songs:
            if crawler_found:
                diffs.append({
                    "songTitle": query,
                    "artist": "（爬蟲找到但 catalog 完全缺少此歌）",
                    "brandId": brand_id,
                    "catalogSays": "MISSING",
                    "crawlerSays": True,
                    "discrepancy": "song_missing_in_catalog",
                    "action": f"需新增歌曲至 catalog，並標記 {brand_id}：有收錄",
                    "timestamp": result.get("timestamp", ""),
                })
            continue

        for song in matched_songs:
            catalog_available = song.get("brands", {}).get(brand_id, {}).get("available", False)

            if catalog_available == crawler_found:
                continue  # 資料吻合，無差異

            discrepancy_type = (
                "crawler_has_song_catalog_says_no" if crawler_found
                else "catalog_says_yes_crawler_says_no"
            )
            action = (
                f"需更新 catalog → {brand_id}：有收錄" if crawler_found
                else f"需更新 catalog → {brand_id}：未收錄（可能已下架）"
            )

            diffs.append({
                "songId": song.get("id"),
                "songTitle": song.get("title"),
                "artist": song.get("artist"),
                "brandId": brand_id,
                "catalogSays": catalog_available,
                "crawlerSays": crawler_found,
                "discrepancy": discrepancy_type,
                "action": action,
                "timestamp": result.get("timestamp", ""),
            })

    return diffs


def main():
    print("=" * 55)
    print("KTV 資料庫差異比對驗證工具")
    print("=" * 55)

    # 載入資料
    print("📂 載入 public/songs_catalog.json ...")
    catalog = load_catalog()
    print(f"   → 共 {len(catalog)} 首歌曲")

    print("📂 載入爬蟲查詢結果 ...")
    crawler_results = load_crawler_results()
    print(f"   → 共 {len(crawler_results)} 筆查詢紀錄")

    if not crawler_results:
        print("\n⚠️  尚無爬蟲結果可供比對。")
        print("   請先執行：")
        print("     python scripts/crawler/holiday_crawler.py")
        print("     python scripts/crawler/cashbox_crawler.py")
        return

    # 比對差異
    print("\n🔍 開始比對差異 ...")
    diffs = build_diff_report(catalog, crawler_results)

    if not diffs:
        print("✅ 恭喜！爬蟲結果與 catalog 資料庫完全吻合，無差異！")
    else:
        print(f"\n⚠️  發現 {len(diffs)} 筆差異：")
        for i, d in enumerate(diffs[:20]):  # 只顯示前 20 筆
            print(f"  [{i+1}] 《{d['songTitle']}》{d['artist']}")
            print(f"       {d['brandId']}：catalog={d['catalogSays']}，爬蟲={d['crawlerSays']}")
            print(f"       📌 {d['action']}")

        # 儲存完整差異報告
        os.makedirs(OUTPUT_DIR, exist_ok=True)
        date_str = datetime.now().strftime("%Y%m%d_%H%M")
        report_path = os.path.join(OUTPUT_DIR, f"diff_report_{date_str}.json")
        with open(report_path, "w", encoding="utf-8") as f:
            json.dump(diffs, f, ensure_ascii=False, indent=2)

        print(f"\n📄 完整差異報告儲存至：{report_path}")
        print("   請審查後手動或執行更新腳本修正 catalog 資料庫。")


if __name__ == "__main__":
    main()
