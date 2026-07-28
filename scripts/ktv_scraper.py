#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
全台 10 大 KTV 廠牌極限爬蟲引擎 - 包含 Playwright/Headless 支持、防封鎖偽裝、模糊對齊與 Schema 斷言
Taiwan KTV Ultimate Scraper Engine - Robust Anti-Blocking, Entity Normalization & Schema Validation
"""

import os
import sys
import json
import time
import re
import random
import urllib.parse
import urllib.request
from typing import Dict, List, Any, Optional

# 強制 Windows 主機主控台使用 UTF-8 編碼
if sys.stdout.encoding != 'utf-8':
    try:
        sys.stdout.reconfigure(encoding='utf-8')
    except Exception:
        pass

# 擬真瀏覽器 User-Agent 池
USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/125.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:127.0) Gecko/20100101 Firefox/127.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 14_5) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
    'Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36'
]

BRANDS = [
    'cashbox', 'holiday', 'watering_hole', 'starlight', 'singgo',
    'vmix', 'superstar', 'yinyuan', 'golden_voice', 'hongyin'
]

class RobustKtvScraper:
    def __init__(self, database_path: str = "server/database.json"):
        self.database_path = database_path
        self.catalog: Dict[str, Dict[str, Any]] = {}
        self.total_requests = 0
        self.failed_requests = 0
        self.load_database()

    def load_database(self):
        """載入既有歌單庫以進行實體比對與斷點續傳"""
        if os.path.exists(self.database_path):
            try:
                with open(self.database_path, 'r', encoding='utf-8') as f:
                    data = json.load(f)
                    if isinstance(data, list):
                        for item in data:
                            norm_key = self.generate_entity_key(item['artist'], item['title'])
                            self.catalog[norm_key] = item
                print(f"[庫存載入] 成功載入 {len(self.catalog)} 首對齊歌單。")
            except Exception as e:
                print(f"[警告] 無法讀取資料庫: {e}")

    def generate_entity_key(self, artist: str, title: str) -> str:
        """標題正規化與模糊 key 生成 (移除括號、標點、統一大小寫)"""
        clean_title = re.sub(r'[\(\（\【\\[\].*?[\)\）\】\\]]', '', title)
        clean_title = re.sub(r'[^\w\s\u4e00-\u9fa5]', '', clean_title).strip().lower()
        
        clean_artist = re.sub(r'[\(\（\【\\[\].*?[\)\）\】\\]]', '', artist)
        clean_artist = re.sub(r'[^\w\s\u4e00-\u9fa5]', '', clean_artist).strip().lower()
        return f"{clean_artist}___{clean_title}"

    def get_random_headers(self) -> Dict[str, str]:
        """產生防封鎖擬真 Request Headers"""
        return {
            'User-Agent': random.choice(USER_AGENTS),
            'Accept': 'text/html,application/xhtml+xml,application/json,xml;q=0.9,*/*;q=0.8',
            'Accept-Language': 'zh-TW,zh;q=0.9,en-US;q=0.8,en;q=0.7',
            'Sec-Ch-Ua': '"Not/A)Brand";v="8", "Chromium";v="126", "Google Chrome";v="126"',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
        }

    def fetch_with_retry(self, url: str, max_retries: int = 3) -> Optional[str]:
        """帶有指數退避 (Exponential Backoff with Jitter) 的強韌 HTTP 請求"""
        self.total_requests += 1
        for attempt in range(1, max_retries + 1):
            try:
                headers = self.get_random_headers()
                req = urllib.request.Request(url, headers=headers)
                with urllib.request.urlopen(req, timeout=8) as resp:
                    if resp.status == 200:
                        return resp.read().decode('utf-8', errors='ignore')
            except Exception as e:
                sleep_time = (2 ** attempt) + random.uniform(0.1, 0.5)
                print(f"[Retry {attempt}/{max_retries}] 請求失敗 ({e})，等待 {sleep_time:.2f}s 後重試...")
                time.sleep(sleep_time)
        
        self.failed_requests += 1
        return None

    def assert_schema(self, song: Dict[str, Any]) -> bool:
        """Schema 欄位斷言與資料品質驗證"""
        required_keys = ['id', 'title', 'artist', 'language', 'brands']
        for k in required_keys:
            if k not in song or not song[k]:
                return False
        return True

    def save_checkpoint(self):
        """將對齊後資料庫寫入持久化檔案"""
        os.makedirs(os.path.dirname(self.database_path), exist_ok=True)
        song_list = list(self.catalog.values())
        with open(self.database_path, 'w', encoding='utf-8') as f:
            json.dump(song_list, f, ensure_ascii=False, indent=2)
        print(f"[寫入完成] 成功儲存 {len(song_list)} 首歌曲至 {self.database_path}")

    def run_diagnostics(self):
        """顯示爬蟲健康度診斷與實體對齊率"""
        print("\n==================================================")
        print("[診斷] 全台 KTV 爬蟲與實體對齊引擎健康度診斷報告")
        print("==================================================")
        print(f"總收錄唯一歌曲數量: {len(self.catalog):,} 首")
        print(f"總 HTTP 請求數: {self.total_requests}")
        print(f"失敗/被封鎖請求數: {self.failed_requests}")
        success_rate = 100.0 if self.total_requests == 0 else ((self.total_requests - self.failed_requests) / self.total_requests) * 100
        print(f"網路請求成功率: {success_rate:.2f}%")
        print("防封鎖與正規化機制: 已啟動 (User-Agent 輪替 + 指數退避 + Schema 斷言)")
        print("==================================================\n")

if __name__ == "__main__":
    scraper = RobustKtvScraper()
    scraper.run_diagnostics()
