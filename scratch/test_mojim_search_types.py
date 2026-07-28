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

kw = "周杰倫"
urls = [
    f"https://mojim.com/{urllib.parse.quote(kw)}.html?t1",
    f"https://mojim.com/{urllib.parse.quote(kw)}.html?t2",
    f"https://mojim.com/{urllib.parse.quote(kw)}.html?t3",
    f"https://mojim.com/{urllib.parse.quote(kw)}.html",
]

for url in urls:
    req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64)"})
    try:
        with urllib.request.urlopen(req, context=ctx, timeout=4) as resp:
            print(f"✅ 成功連線: {url} -> Status {resp.status}")
    except Exception as e:
        print(f"❌ 失敗: {url} -> {e}")
