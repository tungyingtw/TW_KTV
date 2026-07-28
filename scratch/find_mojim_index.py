import sys
import urllib.request
import re
import ssl

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

url = "https://mojim.com"
req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})

try:
    with urllib.request.urlopen(req, context=ctx, timeout=6) as resp:
        html = resp.read().decode('utf-8', errors='ignore')
        # 尋找所有選單與目錄連結
        links = re.findall(r'href="([^"]+)"', html)
        artist_links = [l for l in links if 'a' in l or 'htm' in l or 'singer' in l]
        print(f"找到 {len(links)} 個連結！範例歌手目錄連結:")
        for l in artist_links[:20]:
            print(f"  • {l}")
except Exception as e:
    print(f"錯誤: {e}")
