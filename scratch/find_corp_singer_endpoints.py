import sys
import urllib.request
import urllib.parse
import json

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

companies = ["錢櫃", "好樂迪", "享溫馨", "音圓", "金嗓", "弘音", "星據點", "銀櫃", "美華", "大唐", "瑞影"]
cusTypes = ["singerList", "singer", "searchList", "hotList", "topList", "artist", "artistList"]

print("🔍 測試台灣點歌王 API 各種 cusType 與參數組合...")

for c in companies[:3]:
    for ct in cusTypes:
        encoded_c = urllib.parse.quote(c)
        url = f"https://song.corp.com.tw/api/song.aspx?company={encoded_c}&cusType={ct}&minId=0&keyword=%E5%91%A8%E6%9D%B0%E5%80%AB"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        try:
            with urllib.request.urlopen(req, timeout=3) as resp:
                data = json.loads(resp.read().decode('utf-8', errors='ignore'))
                if isinstance(data, list) and len(data) > 0:
                    print(f"✅ 成功! company={c}, cusType={ct} -> 回傳 {len(data)} 筆資料!")
                    print(f"   範例: {data[0].get('name')} / {data[0].get('singer')}")
        except Exception as e:
            pass
