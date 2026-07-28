import sys
import urllib.request
import re
import ssl

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

pages = ["https://mojim.com/twzindex.htm", "https://mojim.com/twa1.htm", "https://mojim.com/twb1.htm", "https://mojim.com/twc1.htm"]

for p in pages:
    req = urllib.request.Request(p, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"})
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=5) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
            links = re.findall(r'<a\s+href="(/htm/a/[^"]+)"[^>]*>([^<]+)</a>', html)
            print(f"✅ {p} -> 成功解析出 {len(links)} 位歌手！ 範例: {links[:5]}")
    except Exception as e:
        print(f"❌ {p} 失敗: {e}")
