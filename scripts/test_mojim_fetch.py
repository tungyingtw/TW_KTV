import json
import urllib.request
import urllib.parse
import re
import ssl

ctx = ssl.create_default_context()
ctx.check_hostname = False
ctx.verify_mode = ssl.CERT_NONE

def search_mojim_lyrics(artist, title):
    try:
        query = f"{artist} {title}"
        url = f"https://mojim.com/{urllib.parse.quote(query)}.html?t3"
        req = urllib.request.Request(
            url,
            headers={
                "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
            }
        )
        with urllib.request.urlopen(req, context=ctx, timeout=6) as resp:
            html = resp.read().decode('utf-8', errors='ignore')
            # 尋找歌詞連結
            matches = re.findall(r'href="(/htm/a/[^"]+)"', html)
            if matches:
                song_url = "https://mojim.com" + matches[0]
                req2 = urllib.request.Request(song_url, headers={"User-Agent": "Mozilla/5.0"})
                with urllib.request.urlopen(req2, context=ctx, timeout=6) as resp2:
                    song_html = resp2.read().decode('utf-8', errors='ignore')
                    # 擷取歌詞內文
                    lyrics_text = re.sub(r'<[^>]+>', '\n', song_html)
                    lines = [l.strip() for l in lyrics_text.split('\n') if l.strip() and len(l.strip()) > 4 and not any(k in l for k in ['Mojim', '魔鏡', '作詞', '作曲', '編曲', '提供', '感謝', '更多更詳盡歌詞', 'http'])]
                    if len(lines) >= 3:
                        return ' '.join(lines[:3])
    except Exception as e:
        print(f"Fetch failed for {artist} {title}: {e}")
    return None

if __name__ == "__main__":
    print("Testing lyrics fetch for 蔡依林 日不落:")
    lyrics = search_mojim_lyrics("蔡依林", "日不落")
    print("Result:", lyrics)
