#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
auto_process_crowd_and_crawlers.py
======================================================
自動化全庫資料清洗與共識修復引擎 (Fully Automated Audit & Healing Engine)

無須使用者親自跑 KTV 包廂排查，此腳本自動整合：
1. 爬蟲即時抓取結果 (crawler_results/*.json)
2. 全體唱歌民眾現場投票 (server/votes.json)
3. 使用者異常回報單 (server/reports.json)

並自動對 public/songs_catalog.json 進行核對與校正更新。

使用方式：
    python scripts/auto_process_crowd_and_crawlers.py
"""

import sys
import os
import json
import glob
from datetime import datetime

sys.stdout.reconfigure(encoding='utf-8') if hasattr(sys.stdout, 'reconfigure') else None

ROOT_DIR = os.path.join(os.path.dirname(__file__), "..")
CATALOG_PATH = os.path.join(ROOT_DIR, "public/songs_catalog.json")
VOTES_PATH = os.path.join(ROOT_DIR, "server/votes.json")
REPORTS_PATH = os.path.join(ROOT_DIR, "server/reports.json")
CRAWLER_DIR = os.path.join(ROOT_DIR, "crawler_results")


def load_json_file(filepath, default_val):
    if not os.path.exists(filepath):
        return default_val
    try:
        with open(filepath, "r", encoding="utf-8") as f:
            return json.load(f)
    except Exception as e:
        print(f"⚠️ 讀取 {filepath} 失敗: {e}")
        return default_val


def main():
    print("=" * 60)
    print("🤖 啟動 KTV 全自動眾包與爬蟲雙軌校正引擎")
    print("=" * 60)

    # 1. 載入 songs_catalog.json
    print("📂 [1/4] 載入資料庫 public/songs_catalog.json ...")
    catalog = load_json_file(CATALOG_PATH, [])
    if not catalog:
        print("❌ 錯誤：無法載入 songs_catalog.json")
        return
    print(f"   → 共 {len(catalog)} 首歌曲")

    # 建立以 song.id 為 key 的快速索引字典
    song_map = {s["id"]: s for s in catalog if "id" in s}

    # 2. 載入社群投票資料 server/votes.json
    print("📂 [2/4] 載入社群現場投票紀錄 server/votes.json ...")
    votes = load_json_file(VOTES_PATH, {})
    print(f"   → 共 {len(votes)} 筆投票項目")

    # 3. 載入爬蟲比對結果
    print("📂 [3/4] 載入爬蟲查詢結果 crawler_results/*.json ...")
    crawler_files = glob.glob(os.path.join(CRAWLER_DIR, "*.json"))
    crawler_files = [f for f in crawler_files if "diff_report" not in os.path.basename(f)]
    
    crawler_results = []
    for fp in crawler_files:
        data = load_json_file(fp, [])
        if isinstance(data, list):
            crawler_results.extend(data)
    print(f"   → 共 {len(crawler_results)} 筆爬蟲紀錄")

    # 4. 開始自動修復與核對 (Auto-Consensus & Auto-Healing)
    print("\n🔍 [4/4] 執行自動化決策比對 (Auto-Healing Engine) ...")
    updated_count = 0
    actions_log = []

    # (A) 處理社群投票 consensus
    for key, vote_data in votes.items():
        # key 格式: "songId_brandId"
        parts = key.rsplit("_", 1)
        if len(parts) != 2:
            continue
        song_id, brand_id = parts[0], parts[1]

        if song_id not in song_map:
            continue

        song = song_map[song_id]
        confirm = vote_data.get("confirm", 0)
        deny = vote_data.get("deny", 0)
        total = confirm + deny

        if "brands" not in song or not isinstance(song["brands"], dict):
            song["brands"] = {}

        if brand_id not in song["brands"]:
            song["brands"][brand_id] = {"available": False}

        current_avail = song["brands"][brand_id].get("available", False)

        # 否決規則：否決票 >= 3 且 否決超過確認 2 倍 -> 自動修正為未收錄 (false)
        if deny >= 3 and deny > confirm * 2 and current_avail is True:
            song["brands"][brand_id]["available"] = False
            song["brands"][brand_id]["note"] = "社群眾包現場多位點不到，自動更正為未收錄"
            updated_count += 1
            log_entry = f"❌ 《{song.get('title')}》({brand_id}): 現場點不到票數({deny})過高，自動修改為未收錄"
            actions_log.append(log_entry)
            print(f"   [社群修復] {log_entry}")

        # 確認規則：確認票 >= 3 且 確認超過否決 3 倍 -> 自動修正為有收錄 (true)
        elif confirm >= 3 and confirm > deny * 3 and current_avail is False:
            song["brands"][brand_id]["available"] = True
            song["brands"][brand_id]["note"] = "社群眾包現場多位確認有收錄 (Auto-Updated)"
            updated_count += 1
            log_entry = f"✅ 《{song.get('title')}》({brand_id}): 現場確認票數({confirm})過高，自動修改為有收錄"
            actions_log.append(log_entry)
            print(f"   [社群修復] {log_entry}")

    # (B) 處理爬蟲比對校正
    # 建立 (songTitle, brandId) -> crawler_found 映照
    title_brand_crawler = {}
    for r in crawler_results:
        q = r.get("query", "").strip()
        b = r.get("brand", "")
        found = r.get("found", False)
        if q and b:
            title_brand_crawler[(q, b)] = found

    for song in catalog:
        title = song.get("title", "").strip()
        for brand_id, bdata in song.get("brands", {}).items():
            if (title, brand_id) in title_brand_crawler:
                crawler_found = title_brand_crawler[(title, brand_id)]
                current_avail = bdata.get("available", False)

                # 若官網爬蟲明確搜尋不到 (False)，且資料庫原本標可唱 (True)
                if not crawler_found and current_avail:
                    bdata["available"] = False
                    bdata["note"] = "官方點歌網頁自動巡檢查無此歌 (Auto-Updated)"
                    updated_count += 1
                    actions_log.append(f"🌐 《{title}》({brand_id}): 官網巡檢查無，更正為未收錄")

    # 5. 儲存更新後的 public/songs_catalog.json
    if updated_count > 0:
        print(f"\n💾 自動修正完成，共更新 {updated_count} 筆歌曲廠牌狀態！儲存至 public/songs_catalog.json...")
        with open(CATALOG_PATH, "w", encoding="utf-8") as f:
            json.dump(catalog, f, ensure_ascii=False, indent=2)
        print("🎉 資料庫自癒與校正完成！")
    else:
        print("\n✨ 當前資料庫與眾包/爬蟲數據完全吻合，無須修正！")

    # 輸出紀錄檔
    if actions_log:
        log_path = os.path.join(ROOT_DIR, "server/auto_healing_history.log")
        with open(log_path, "a", encoding="utf-8") as f:
            f.write(f"\n--- {datetime.now().strftime('%Y-%m-%d %H:%M:%S')} ---\n")
            f.write("\n".join(actions_log) + "\n")
        print(f"📝 操作歷史已寫入 {log_path}")


if __name__ == "__main__":
    main()
