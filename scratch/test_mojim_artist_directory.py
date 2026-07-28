import sys
import urllib.request
import urllib.parse
import json
import re
import ssl

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

print("🔍 測試抓取 Mojim 魔鏡歌詞網全歌手目錄與多 KTV 品牌大名冊...")

discovered = set()

# 1. 測試點歌王多品牌交叉查詢
companies = ["錢櫃", "好樂迪", "享溫馨", "音圓", "金嗓", "弘音", "星據點", "銀櫃"]
test_roots = ["阿", "小", "大", "老", "新", "金", "黑", "紅", "藍", "夜", "風", "雨", "星", "海", "樂", "愛", "心", "夢", "影", "歌", "聲", "音", "團"]

for brand in companies[:4]:
    for r in test_roots[:5]:
        url = f"https://song.corp.com.tw/api/song.aspx?company={urllib.parse.quote(brand)}&cusType=searchList&minId=0&keyword={urllib.parse.quote(r)}"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        try:
            with urllib.request.urlopen(req, context=ctx, timeout=3) as resp:
                data = json.loads(resp.read().decode('utf-8', errors='ignore'))
                if isinstance(data, list):
                    for item in data:
                        s = item.get("singer", "").strip()
                        if s and "Vol." not in s and "No." not in s:
                            discovered.add(s)
        except Exception:
            pass

print(f"✅ 點歌王多品牌 + 詞根交叉測試，成功挖掘出 {len(discovered):,} 位獨特歌手/團體！")
print(f"   範例: {list(discovered)[:10]}")
