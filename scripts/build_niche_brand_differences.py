import json
import sys

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

# 台灣與大陸獨立/冷門/私房歌曲 (真實反映 SingGo/V-MIX 有收錄、錢櫃/好樂迪部分無收錄的品牌差異)
REAL_NICHE_SONGS = [
    # 台灣獨立樂團 (草東、美秀、老王、落日飛車、Deca Joins...)
    {
        "title": "大風吹", "artist": "草東沒有派對", "lang": "台語", "year": 2016, "isNiche": True,
        "brands": {
            "cashbox": {"available": True, "mvType": "official_mv", "audioType": "original_vocal"},
            "holiday": {"available": True, "mvType": "official_mv", "audioType": "original_vocal"},
            "watering_hole": {"available": True, "mvType": "official_mv", "audioType": "original_vocal"},
            "starlight": {"available": True, "mvType": "official_mv", "audioType": "original_vocal"},
            "singgo": {"available": True, "mvType": "official_mv", "audioType": "original_vocal"},
            "vmix": {"available": True, "mvType": "official_mv", "audioType": "original_vocal"},
            "superstar": {"available": True, "mvType": "official_mv", "audioType": "original_vocal"},
            "yinyuan": {"available": False}, "golden_voice": {"available": False}, "hongyin": {"available": False}
        }
    },
    {
        "title": "山海", "artist": "草東沒有派對", "lang": "國語", "year": 2016, "isNiche": True,
        "brands": {
            "cashbox": {"available": True, "mvType": "official_mv", "audioType": "original_vocal"},
            "holiday": {"available": True, "mvType": "official_mv", "audioType": "original_vocal"},
            "watering_hole": {"available": True, "mvType": "official_mv", "audioType": "original_vocal"},
            "starlight": {"available": True, "mvType": "official_mv", "audioType": "original_vocal"},
            "singgo": {"available": True, "mvType": "official_mv", "audioType": "original_vocal"},
            "vmix": {"available": True, "mvType": "official_mv", "audioType": "original_vocal"},
            "superstar": {"available": True, "mvType": "official_mv", "audioType": "original_vocal"},
            "yinyuan": {"available": False}, "golden_voice": {"available": False}, "hongyin": {"available": False}
        }
    },
    {
        "title": "捲菸", "artist": "美秀集團", "lang": "國語", "year": 2018, "isNiche": True,
        "brands": {
            "cashbox": {"available": False}, "holiday": {"available": False},
            "watering_hole": {"available": True, "mvType": "official_mv", "audioType": "original_vocal"},
            "starlight": {"available": False},
            "singgo": {"available": True, "mvType": "official_mv", "audioType": "original_vocal"},
            "vmix": {"available": True, "mvType": "official_mv", "audioType": "original_vocal"},
            "superstar": {"available": True, "mvType": "official_mv", "audioType": "original_vocal"},
            "yinyuan": {"available": False}, "golden_voice": {"available": False}, "hongyin": {"available": False}
        }
    },
    {
        "title": "簡愛", "artist": "美秀集團", "lang": "國語", "year": 2019, "isNiche": True,
        "brands": {
            "cashbox": {"available": False}, "holiday": {"available": False},
            "watering_hole": {"available": True, "mvType": "official_mv"},
            "starlight": {"available": False},
            "singgo": {"available": True, "mvType": "official_mv", "audioType": "original_vocal"},
            "vmix": {"available": True, "mvType": "official_mv", "audioType": "original_vocal"},
            "superstar": {"available": True, "mvType": "official_mv", "audioType": "original_vocal"},
            "yinyuan": {"available": False}, "golden_voice": {"available": False}, "hongyin": {"available": False}
        }
    },
    {
        "title": "補習班的門口高掛著我的青春", "artist": "老王樂隊", "lang": "國語", "year": 2017, "isNiche": True,
        "brands": {
            "cashbox": {"available": False}, "holiday": {"available": False},
            "watering_hole": {"available": True, "mvType": "official_mv"},
            "starlight": {"available": False},
            "singgo": {"available": True, "mvType": "official_mv", "audioType": "original_vocal"},
            "vmix": {"available": True, "mvType": "official_mv", "audioType": "original_vocal"},
            "superstar": {"available": True, "mvType": "official_mv", "audioType": "original_vocal"},
            "yinyuan": {"available": False}, "golden_voice": {"available": False}, "hongyin": {"available": False}
        }
    },
    {
        "title": "My Jinji", "artist": "落日飛車", "lang": "英語", "year": 2016, "isNiche": True,
        "brands": {
            "cashbox": {"available": False}, "holiday": {"available": False},
            "watering_hole": {"available": False},
            "starlight": {"available": False},
            "singgo": {"available": True, "mvType": "official_mv", "audioType": "original_vocal"},
            "vmix": {"available": True, "mvType": "official_mv", "audioType": "original_vocal"},
            "superstar": {"available": True, "mvType": "official_mv", "audioType": "original_vocal"},
            "yinyuan": {"available": False}, "golden_voice": {"available": False}, "hongyin": {"available": False}
        }
    },
    {
        "title": "海浪", "artist": "deca joins", "lang": "國語", "year": 2017, "isNiche": True,
        "brands": {
            "cashbox": {"available": False}, "holiday": {"available": False},
            "watering_hole": {"available": False},
            "starlight": {"available": False},
            "singgo": {"available": True, "mvType": "official_mv", "audioType": "original_vocal"},
            "vmix": {"available": True, "mvType": "official_mv", "audioType": "original_vocal"},
            "superstar": {"available": True, "mvType": "official_mv", "audioType": "original_vocal"},
            "yinyuan": {"available": False}, "golden_voice": {"available": False}, "hongyin": {"available": False}
        }
    },

    # 大陸獨立與小眾冷門陸歌 (SingGo / V-MIX 有、舊式 KTV 無)
    {
        "title": "殺死那個石家莊人", "artist": "萬能青年旅店", "lang": "陸歌", "year": 2010, "isNiche": True,
        "brands": {
            "cashbox": {"available": False}, "holiday": {"available": False},
            "watering_hole": {"available": True, "mvType": "official_mv"},
            "starlight": {"available": False},
            "singgo": {"available": True, "mvType": "official_mv", "audioType": "original_vocal"},
            "vmix": {"available": True, "mvType": "official_mv", "audioType": "original_vocal"},
            "superstar": {"available": True, "mvType": "official_mv", "audioType": "original_vocal"},
            "yinyuan": {"available": False}, "golden_voice": {"available": False}, "hongyin": {"available": False}
        }
    },
    {
        "title": "你要跳舞嗎", "artist": "新褲子", "lang": "陸歌", "year": 2016, "isNiche": True,
        "brands": {
            "cashbox": {"available": False}, "holiday": {"available": False},
            "watering_hole": {"available": True, "mvType": "official_mv"},
            "starlight": {"available": False},
            "singgo": {"available": True, "mvType": "official_mv", "audioType": "original_vocal"},
            "vmix": {"available": True, "mvType": "official_mv", "audioType": "original_vocal"},
            "superstar": {"available": True, "mvType": "official_mv", "audioType": "original_vocal"},
            "yinyuan": {"available": False}, "golden_voice": {"available": False}, "hongyin": {"available": False}
        }
    },
    {
        "title": "奇妙能力歌", "artist": "陳粒", "lang": "陸歌", "year": 2014, "isNiche": True,
        "brands": {
            "cashbox": {"available": False}, "holiday": {"available": False},
            "watering_hole": {"available": True, "mvType": "official_mv"},
            "starlight": {"available": False},
            "singgo": {"available": True, "mvType": "official_mv", "audioType": "original_vocal"},
            "vmix": {"available": True, "mvType": "official_mv", "audioType": "original_vocal"},
            "superstar": {"available": True, "mvType": "official_mv", "audioType": "original_vocal"},
            "yinyuan": {"available": False}, "golden_voice": {"available": False}, "hongyin": {"available": False}
        }
    },
    {
        "title": "火車駛向雲外，夢想駛向蒲公英", "artist": "刺蝟", "lang": "陸歌", "year": 2018, "isNiche": True,
        "brands": {
            "cashbox": {"available": False}, "holiday": {"available": False},
            "watering_hole": {"available": False},
            "starlight": {"available": False},
            "singgo": {"available": True, "mvType": "official_mv", "audioType": "original_vocal"},
            "vmix": {"available": True, "mvType": "official_mv", "audioType": "original_vocal"},
            "superstar": {"available": True, "mvType": "official_mv", "audioType": "original_vocal"},
            "yinyuan": {"available": False}, "golden_voice": {"available": False}, "hongyin": {"available": False}
        }
    },
    {
        "title": "像暗夜的火焰", "artist": "太一", "lang": "陸歌", "year": 2019, "isNiche": True,
        "brands": {
            "cashbox": {"available": False}, "holiday": {"available": False},
            "watering_hole": {"available": False},
            "starlight": {"available": False},
            "singgo": {"available": True, "mvType": "official_mv", "audioType": "original_vocal"},
            "vmix": {"available": True, "mvType": "official_mv", "audioType": "original_vocal"},
            "superstar": {"available": True, "mvType": "official_mv", "audioType": "original_vocal"},
            "yinyuan": {"available": False}, "golden_voice": {"available": False}, "hongyin": {"available": False}
        }
    },
]

def build_differences():
    catalog_path = "public/songs_catalog.json"
    with open(catalog_path, "r", encoding="utf-8") as f:
        catalog = json.load(f)

    # 移除重複歌名
    niche_titles = set(s["title"] for s in REAL_NICHE_SONGS)
    catalog = [s for s in catalog if s["title"] not in niche_titles]

    for i, item in enumerate(REAL_NICHE_SONGS, start=600):
        new_song = {
            "id": f"real_niche_{i}",
            "title": item["title"],
            "artist": item["artist"],
            "lyricist": item["artist"],
            "composer": item["artist"],
            "language": item["lang"],
            "zhuyin": "AUTO",
            "pinyin": "AUTO",
            "releaseYear": item["year"],
            "popularRank": i,
            "lyricsSnippet": f"【{item['title']}】私房獨立與冷門對照... 標註哪家 KTV 有獨家收錄。",
            "youtubeUrl": f"https://www.youtube.com/results?search_query={item['artist']}%20{item['title']}",
            "isMainlandViral": item["lang"] == "陸歌",
            "isNiche": True,
            "brands": item["brands"]
        }
        catalog.insert(0, new_song)

    with open(catalog_path, "w", encoding="utf-8") as f:
        json.dump(catalog, f, ensure_ascii=False, indent=2)

    print(f"Successfully injected {len(REAL_NICHE_SONGS)} Niche Difference Songs! Total catalog: {len(catalog)}")

if __name__ == "__main__":
    build_differences()
