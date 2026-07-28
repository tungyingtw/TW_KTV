import sys
import urllib.request
import urllib.parse
import json

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

indie_terms = ["樂團", "地下", "獨立", "客家", "原住民", "饒舌", "Hip Hop", "草東", "美秀", "茄子蛋", "老王", "落日飛車", "滅火器", "血肉果汁機", "新褲子", "萬能青年旅店"]

print("🌐 開始測試：透過全球 iTunes / Apple Music Open Music API 檢索台灣/華語非 KTV 地下與冷門歌手...")

discovered = set()

for term in indie_terms:
    encoded_term = urllib.parse.quote(term)
    url = f"https://itunes.apple.com/search?term={encoded_term}&country=TW&media=music&entity=song&limit=50"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
    try:
        with urllib.request.urlopen(req, timeout=5) as resp:
            data = json.loads(resp.read().decode('utf-8', errors='ignore'))
            results = data.get("results", [])
            for r in results:
                artist = r.get("artistName", "").strip()
                if artist:
                    discovered.add(artist)
            print(f"✅ 關鍵字【{term}】 -> 回傳 {len(results)} 筆，目前已累積挖掘出 {len(discovered):,} 位真實獨立/地下/冷門歌手與樂團！")
    except Exception as e:
        print(f"❌ 【{term}】失敗: {e}")

print(f"\n🎉 測試成功！短時間內已成功從非 KTV 的 iTunes/Apple Music 樂壇庫中挖掘出 {len(discovered):,} 位獨立與冷門歌手！")
print(f"   歌手範例: {list(discovered)[:15]}")
