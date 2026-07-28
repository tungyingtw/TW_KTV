import json
import os
import sys

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

VIRAL_MAINLAND_HITS = [
    {"artist": "任然", "title": "飛鳥和蟬", "year": 2020},
    {"artist": "于文文", "title": "體面", "year": 2017},
    {"artist": "薛之謙", "title": "演員", "year": 2015},
    {"artist": "薛之謙", "title": "醜八怪", "year": 2013},
    {"artist": "李榮浩", "title": "烏梅子醬", "year": 2022},
    {"artist": "陳雪凝", "title": "綠色", "year": 2019},
    {"artist": "柳爽", "title": "漠河舞廳", "year": 2020},
    {"artist": "七叔", "title": "踏山河", "year": 2020},
    {"artist": "七叔", "title": "半生雪", "year": 2021},
    {"artist": "音闕詩聽", "title": "芒種", "year": 2019},
    {"artist": "夢然", "title": "少年", "year": 2019},
    {"artist": "阿悠悠", "title": "舊夢一場", "year": 2020},
    {"artist": "張紫豪", "title": "可不可以", "year": 2018},
    {"artist": "廣東雨神", "title": "廣東愛情故事", "year": 2017},
]

def inject_viral():
    catalog_path = "public/songs_catalog.json"
    with open(catalog_path, "r", encoding="utf-8") as f:
        catalog = json.load(f)

    for i, item in enumerate(VIRAL_MAINLAND_HITS, start=300):
        new_song = {
            "id": f"viral_{i}",
            "title": item["title"],
            "artist": item["artist"],
            "lyricist": item["artist"],
            "composer": item["artist"],
            "language": "陸歌",
            "zhuyin": "AUTO",
            "pinyin": "AUTO",
            "releaseYear": item["year"],
            "popularRank": i,
            "lyricsSnippet": f"【{item['title']}】抖音與陸劇爆紅熱門陸歌... 10 大 KTV 收錄狀態對照。",
            "youtubeUrl": f"https://www.youtube.com/results?search_query={item['artist']}%20{item['title']}",
            "isMainlandViral": True,
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
        }
        catalog.insert(0, new_song)

    with open(catalog_path, "w", encoding="utf-8") as f:
        json.dump(catalog, f, ensure_ascii=False, indent=2)

    print(f"Successfully injected {len(VIRAL_MAINLAND_HITS)} Mainland Viral songs! Total count: {len(catalog)}")

if __name__ == "__main__":
    inject_viral()
