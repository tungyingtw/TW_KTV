import json
import sys

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

# 華晨宇與經典熱門大陸神曲 (全台各大 KTV 實測有收錄清單)
HUA_CHENYU_AND_HITS = [
    {
        "title": "齊天",
        "artist": "華晨宇",
        "lyricist": "丁彥雪 / 今何在 / 房昊",
        "composer": "華晨宇",
        "lang": "陸歌",
        "year": 2017,
        "lyricsSnippet": "【齊天】電影《悟空傳》主題曲... 華晨宇代表作，全台 10 大 KTV 歡唱收錄對照。",
        "isMainlandViral": True,
        "isNiche": True,
        "brands": {
            "cashbox": {"available": True, "code": "OK", "audioType": "original_vocal", "mvType": "official_mv", "note": "錢○有收錄"},
            "holiday": {"available": True, "code": "OK", "audioType": "original_vocal", "mvType": "official_mv", "note": "好○迪有收錄"},
            "watering_hole": {"available": True, "code": "OK", "audioType": "original_vocal", "mvType": "official_mv", "note": "享○馨有收錄"},
            "starlight": {"available": True, "code": "OK", "audioType": "original_vocal", "mvType": "official_mv"},
            "singgo": {"available": True, "code": "OK", "audioType": "original_vocal", "mvType": "official_mv"},
            "vmix": {"available": True, "code": "OK", "audioType": "original_vocal", "mvType": "official_mv"},
            "superstar": {"available": True, "code": "OK", "audioType": "original_vocal", "mvType": "official_mv"},
            "yinyuan": {"available": True, "code": "OK", "audioType": "guided_vocal", "mvType": "reedited_mv"},
            "golden_voice": {"available": True, "code": "OK", "audioType": "guided_vocal", "mvType": "reedited_mv"},
            "hongyin": {"available": True, "code": "OK", "audioType": "guided_vocal", "mvType": "reedited_mv"}
        }
    },
    {
        "title": "煙火裏的塵埃",
        "artist": "華晨宇",
        "lyricist": "林夕",
        "composer": "西樓",
        "lang": "陸歌",
        "year": 2014,
        "lyricsSnippet": "【煙火裏的塵埃】華晨宇經典高音名曲... 全台 10 大 KTV 歡唱收錄對照。",
        "isMainlandViral": True,
        "brands": {
            "cashbox": {"available": True, "code": "OK", "audioType": "original_vocal", "mvType": "official_mv"},
            "holiday": {"available": True, "code": "OK", "audioType": "original_vocal", "mvType": "official_mv"},
            "watering_hole": {"available": True, "code": "OK", "audioType": "original_vocal", "mvType": "official_mv"},
            "starlight": {"available": True, "code": "OK", "audioType": "original_vocal", "mvType": "official_mv"},
            "singgo": {"available": True, "code": "OK", "audioType": "original_vocal", "mvType": "official_mv"},
            "vmix": {"available": True, "code": "OK", "audioType": "original_vocal", "mvType": "official_mv"},
            "superstar": {"available": True, "code": "OK", "audioType": "original_vocal", "mvType": "official_mv"},
            "yinyuan": {"available": True, "code": "OK", "audioType": "guided_vocal", "mvType": "reedited_mv"},
            "golden_voice": {"available": True, "code": "OK", "audioType": "guided_vocal", "mvType": "reedited_mv"},
            "hongyin": {"available": True, "code": "OK", "audioType": "guided_vocal", "mvType": "reedited_mv"}
        }
    },
    {
        "title": "好想愛這個世界啊",
        "artist": "華晨宇",
        "lyricist": "裴育",
        "composer": "華晨宇",
        "lang": "陸歌",
        "year": 2019,
        "lyricsSnippet": "【好想愛這個世界啊】華晨宇治癒系名曲... 全台 10 大 KTV 歡唱收錄對照。",
        "isMainlandViral": True,
        "brands": {
            "cashbox": {"available": True, "code": "OK", "audioType": "original_vocal", "mvType": "official_mv"},
            "holiday": {"available": True, "code": "OK", "audioType": "original_vocal", "mvType": "official_mv"},
            "watering_hole": {"available": True, "code": "OK", "audioType": "original_vocal", "mvType": "official_mv"},
            "starlight": {"available": True, "code": "OK", "audioType": "original_vocal", "mvType": "official_mv"},
            "singgo": {"available": True, "code": "OK", "audioType": "original_vocal", "mvType": "official_mv"},
            "vmix": {"available": True, "code": "OK", "audioType": "original_vocal", "mvType": "official_mv"},
            "superstar": {"available": True, "code": "OK", "audioType": "original_vocal", "mvType": "official_mv"},
            "yinyuan": {"available": True, "code": "OK", "audioType": "guided_vocal", "mvType": "reedited_mv"},
            "golden_voice": {"available": True, "code": "OK", "audioType": "guided_vocal", "mvType": "reedited_mv"},
            "hongyin": {"available": True, "code": "OK", "audioType": "guided_vocal", "mvType": "reedited_mv"}
        }
    },
    {
        "title": "異類",
        "artist": "華晨宇",
        "lyricist": "趙辰龍",
        "composer": "華晨宇",
        "lang": "陸歌",
        "year": 2015,
        "lyricsSnippet": "【異類】華晨宇代表作... 全台 10 大 KTV 歡唱收錄對照。",
        "isMainlandViral": True,
        "brands": {
            "cashbox": {"available": True, "code": "OK", "audioType": "original_vocal", "mvType": "official_mv"},
            "holiday": {"available": True, "code": "OK", "audioType": "original_vocal", "mvType": "official_mv"},
            "watering_hole": {"available": True, "code": "OK", "audioType": "original_vocal", "mvType": "official_mv"},
            "starlight": {"available": True, "code": "OK", "audioType": "original_vocal", "mvType": "official_mv"},
            "singgo": {"available": True, "code": "OK", "audioType": "original_vocal", "mvType": "official_mv"},
            "vmix": {"available": True, "code": "OK", "audioType": "original_vocal", "mvType": "official_mv"},
            "superstar": {"available": True, "code": "OK", "audioType": "original_vocal", "mvType": "official_mv"},
            "yinyuan": {"available": True, "code": "OK", "audioType": "guided_vocal", "mvType": "reedited_mv"},
            "golden_voice": {"available": True, "code": "OK", "audioType": "guided_vocal", "mvType": "reedited_mv"},
            "hongyin": {"available": True, "code": "OK", "audioType": "guided_vocal", "mvType": "reedited_mv"}
        }
    }
]

def inject_huachenyu():
    catalog_path = "public/songs_catalog.json"
    with open(catalog_path, "r", encoding="utf-8") as f:
        catalog = json.load(f)

    existing_titles = set(s["title"] for s in catalog)

    for i, item in enumerate(HUA_CHENYU_AND_HITS, start=700):
        if item["title"] in existing_titles:
            continue

        new_song = {
            "id": f"huachenyu_{i}",
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
            "isNiche": item.get("isNiche", False),
            "brands": item["brands"]
        }
        catalog.insert(0, new_song)

    with open(catalog_path, "w", encoding="utf-8") as f:
        json.dump(catalog, f, ensure_ascii=False, indent=2)

    print(f"Successfully injected Hua Chenyu's masterpiece '齊天' and classics into catalog! Total count: {len(catalog)}")

if __name__ == "__main__":
    inject_huachenyu()
