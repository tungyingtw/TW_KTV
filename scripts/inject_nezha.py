import json
import sys

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

NEZHA_SONGS = [
    {
        "title": "就是哪吒",
        "artist": "顏人中 / 華晨宇",
        "lyricist": "顏人中",
        "composer": "顏人中",
        "lang": "陸歌",
        "year": 2019,
        "lyricsSnippet": "【就是哪吒】電影《哪吒之魔童降世》熱門推廣曲 / 抖音爆紅熱歌... 10 大 KTV 收錄狀態對照。",
        "isMainlandViral": True,
        "isNiche": True,
        "brands": {
            "cashbox": {"available": False, "note": "錢櫃未收錄"},
            "holiday": {"available": False, "note": "好樂迪未收錄"},
            "watering_hole": {"available": True, "code": "OK", "audioType": "original_vocal", "mvType": "official_mv"},
            "starlight": {"available": False},
            "singgo": {"available": True, "code": "OK", "audioType": "original_vocal", "mvType": "official_mv"},
            "vmix": {"available": True, "code": "OK", "audioType": "original_vocal", "mvType": "official_mv"},
            "superstar": {"available": True, "code": "OK", "audioType": "original_vocal", "mvType": "official_mv"},
            "yinyuan": {"available": False},
            "golden_voice": {"available": False},
            "hongyin": {"available": False}
        }
    },
    {
        "title": "哪吒",
        "artist": "GAI 阿岳 / 雙笙",
        "lyricist": "GAI",
        "composer": "GAI",
        "lang": "陸歌",
        "year": 2019,
        "lyricsSnippet": "【哪吒】電影《哪吒之魔童降世》主題曲... 全台 10 大 KTV 收錄對照。",
        "isMainlandViral": True,
        "isNiche": True,
        "brands": {
            "cashbox": {"available": False},
            "holiday": {"available": False},
            "watering_hole": {"available": True, "code": "OK", "audioType": "original_vocal", "mvType": "official_mv"},
            "starlight": {"available": False},
            "singgo": {"available": True, "code": "OK", "audioType": "original_vocal", "mvType": "official_mv"},
            "vmix": {"available": True, "code": "OK", "audioType": "original_vocal", "mvType": "official_mv"},
            "superstar": {"available": True, "code": "OK", "audioType": "original_vocal", "mvType": "official_mv"},
            "yinyuan": {"available": False},
            "golden_voice": {"available": False},
            "hongyin": {"available": False}
        }
    }
]

def inject_nezha():
    catalog_path = "public/songs_catalog.json"
    with open(catalog_path, "r", encoding="utf-8") as f:
        catalog = json.load(f)

    existing_titles = set(s["title"] for s in catalog)

    for i, item in enumerate(NEZHA_SONGS, start=1000):
        if item["title"] in existing_titles:
            continue

        new_song = {
            "id": f"nezha_{i}",
            "title": item["title"],
            "artist": item["artist"],
            "lyricist": item["lyricist"],
            "composer": item["composer"],
            "language": item["lang"],
            "zhuyin": "AUTO",
            "pinyin": "AUTO",
            "releaseYear": item["year"],
            "popularRank": i,
            "lyricsSnippet": item["lyricsSnippet"],
            "youtubeUrl": f"https://www.youtube.com/results?search_query={item['artist']}%20{item['title']}",
            "isMainlandViral": True,
            "isNiche": True,
            "brands": item["brands"]
        }
        catalog.insert(0, new_song)

    with open(catalog_path, "w", encoding="utf-8") as f:
        json.dump(catalog, f, ensure_ascii=False, indent=2)

    print(f"Successfully injected '就是哪吒' into catalog! Total count: {len(catalog)}")

if __name__ == "__main__":
    inject_nezha()
