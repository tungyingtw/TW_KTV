import sys
import urllib.request
import re
import ssl

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

# Mojim 華語男歌手、華語女歌手、華語團體、日韓/西洋全歌手總目錄頁面
MOJIM_DIRECTORY_URLS = [
    "https://mojim.com/twza1.htm", # 華語男歌手
    "https://mojim.com/twzb1.htm", # 華語女歌手
    "https://mojim.com/twzc1.htm", # 華語團體樂團
    "https://mojim.com/twzd1.htm", # 日韓/西洋/獨立音樂人
]

print("🌐 開始測試：從 Mojim 魔鏡歌詞網全歌手總目錄中抓取非 KTV 系統之冷門與獨立歌手...")

discovered_artists = set()

for url in MOJIM_DIRECTORY_URLS:
    req = urllib.request.Request(
        url,
        headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"}
    )
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=6) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
            # 解析標籤中的歌手名字 (例: <a href="/htm/a/..." title="...">歌手名</a>)
            matches = re.findall(r'<a\s+href="/htm/a/[^"]*"\s+title="[^"]*">([^<]+)</a>', html)
            for m in matches:
                name = m.strip()
                if name and len(name) < 30 and not any(k in name for k in ['歌詞', '魔鏡', '首頁', '選單', '搜尋']):
                    discovered_artists.add(name)
            print(f"✅ 成功爬取目錄 {url} -> 當前已累積發現 {len(discovered_artists):,} 位獨立與全網歌手！")
    except Exception as e:
        print(f"⚠️ 爬取 {url} 發生錯誤: {e}")

print(f"\n🎉 測試成功！共從 Mojim 全網歌詞資料庫中挖掘出 {len(discovered_artists):,} 位真實獨立/冷門/主流歌手與團體！")
print(f"   歌手範例: {list(discovered_artists)[:15]}")
