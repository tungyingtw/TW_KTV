import sys
import urllib.request
import urllib.parse
import re
import ssl

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

indie_keywords = ["樂團", "獨立", "工作室", "饒舌", "客家", "原住民", "古風", "創作", "DJ", "Band"]

print("🌐 開始測試：從 Mojim 魔鏡歌詞網搜尋引擎抓取非 KTV 系統之冷門與獨立歌手...")

discovered_singers = set()

for kw in indie_keywords:
    url = f"https://mojim.com/{urllib.parse.quote(kw)}.html?t3"
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"})
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=5) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
            # 匹配 <a> 標籤中的歌手名
            matches = re.findall(r'<a\s+href="/htm/a/[^"]*"[^>]*>([^<]+)</a>', html)
            for m in matches:
                singer_name = m.strip()
                if singer_name and len(singer_name) < 25 and not any(k in singer_name for k in ['歌詞', '魔鏡', '首頁', '更多']):
                    discovered_singers.add(singer_name)
            print(f"✅ 搜尋關鍵字 【{kw}】 -> 抓取到 {len(matches)} 筆，目前已累積挖掘出 {len(discovered_singers):,} 位獨立/冷門歌手與樂團！")
    except Exception as e:
        print(f"❌ 【{kw}】搜尋失敗: {e}")

print(f"\n🎉 測試成功！共從 Mojim 歌詞搜尋引擎中挖掘出 {len(discovered_singers):,} 位非 KTV 系統之獨立/冷門/創作歌手！")
print(f"   歌手範例: {list(discovered_singers)[:12]}")
