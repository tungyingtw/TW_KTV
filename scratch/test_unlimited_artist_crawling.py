import sys
import urllib.request
import urllib.parse
import json
import time

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

# 完整 37 個注音全符號
FULL_BOPOMOFO = ["ㄅ", "ㄆ", "ㄇ", "ㄈ", "ㄉ", "ㄊ", "ㄋ", "ㄌ", "ㄍ", "ㄎ", "ㄏ", "ㄐ", "ㄑ", "ㄒ", "ㄓ", "ㄔ", "ㄕ", "ㄖ", "ㄗ", "ㄘ", "ㄙ", "ㄚ", "ㄛ", "ㄜ", "ㄝ", "ㄞ", "ㄟ", "ㄠ", "ㄡ", "ㄢ", "ㄣ", "ㄤ", "ㄥ", "ㄦ", "ㄧ", "ㄨ", "ㄩ"]
ENGLISH_ALPHABET = [chr(i) for i in range(ord('A'), ord('Z')+1)]
DIGITS = [str(i) for i in range(10)]

ALL_BRANDS = ["錢櫃", "好樂迪", "享溫馨", "音圓", "金嗓", "弘音", "星據點", "銀櫃"]

discovered_singers = set()

def fetch_all_until_empty(company_name, keyword, max_limit_pages=15):
    min_id = 0
    total_found = 0
    for p in range(max_limit_pages):
        url = f"https://song.corp.com.tw/api/song.aspx?company={urllib.parse.quote(company_name)}&cusType=searchList&minId={min_id}&keyword={urllib.parse.quote(keyword)}"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        try:
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = json.loads(resp.read().decode('utf-8', errors='ignore'))
                if isinstance(data, list) and len(data) > 0:
                    total_found += len(data)
                    for item in data:
                        s = item.get("singer", "").strip()
                        if s and "Vol." not in s and "No." not in s:
                            discovered_singers.add(s)
                    last_id = data[-1].get("id")
                    if last_id and last_id != min_id:
                        min_id = last_id
                    else:
                        break
                else:
                    break
        except Exception:
            break
        time.sleep(0.05)
    return total_found

print("🚀 開始測試：無窮 minId 迴圈 + 全注音/英文/數字 + 多品牌 深度爬取歌手名冊...")

# 測試前 5 個注音
for bop in FULL_BOPOMOFO[:5]:
    for brand in ALL_BRANDS[:2]:
        cnt = fetch_all_until_empty(brand, bop, max_limit_pages=10)
        print(f"   [{brand}] 首字【{bop}】爬取完成 -> 目前累積發現 {len(discovered_singers):,} 位獨特歌手/團體！")

print(f"\n🎉 測試完成！短時間內已發現 {len(discovered_singers):,} 位獨特歌手與團體！")
