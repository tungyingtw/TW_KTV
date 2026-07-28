import json

CLASSIC_SONGS = [
    {
        "id": "s_yu_01",
        "title": "雨一直下",
        "artist": "張宇",
        "lyricist": "十一郎",
        "composer": "張宇",
        "language": "國語",
        "zhuyin": "ㄩˇ ㄧ ㄓˊ ㄒㄧㄚˋ",
        "pinyin": "YUZHIXIA",
        "releaseYear": 1999,
        "popularRank": 1,
        "lyricsSnippet": "雨一直下 氣氛不算融洽 在同個屋簷下 漸漸感到心虛嗎...",
        "youtubeUrl": "https://www.youtube.com/watch?v=DYptgVvkVLQ",
        "brands": {
            "cashbox": {"available": True, "code": "23001", "audioType": "original_vocal", "mvType": "official_mv", "note": "錢○官方原裝"},
            "holiday": {"available": True, "code": "10901", "audioType": "original_vocal", "mvType": "official_mv", "note": "好○迪高畫質"},
            "watering_hole": {"available": True, "code": "72801", "audioType": "original_vocal", "mvType": "official_mv", "note": "享○馨雙螢幕"},
            "starlight": {"available": True, "code": "30401", "audioType": "original_vocal", "mvType": "official_mv"},
            "singgo": {"available": True, "code": "88001", "audioType": "original_vocal", "mvType": "official_mv"},
            "vmix": {"available": True, "code": "55001", "audioType": "original_vocal", "mvType": "official_mv"},
            "superstar": {"available": True, "code": "60001", "audioType": "original_vocal", "mvType": "official_mv"},
            "yinyuan": {"available": True, "code": "30901", "audioType": "guided_vocal", "mvType": "reedited_mv"},
            "golden_voice": {"available": True, "code": "41901", "audioType": "guided_vocal", "mvType": "reedited_mv"},
            "hongyin": {"available": True, "code": "20901", "audioType": "guided_vocal", "mvType": "reedited_mv"}
        }
    },
    {
        "id": "s_yu_02",
        "title": "用心良苦",
        "artist": "張宇",
        "lyricist": "十一郎",
        "composer": "張宇",
        "language": "國語",
        "zhuyin": "ㄩㄥˋ ㄒㄧㄣ ㄌㄧㄤˊ ㄍㄨˇ",
        "pinyin": "YONGXINLIANGGU",
        "releaseYear": 1993,
        "popularRank": 2,
        "lyricsSnippet": "妳說妳想要逃 偏偏注定要落腳 情滅了愛熄了 剩下空心要不要...",
        "youtubeUrl": "https://www.youtube.com/watch?v=DYptgVvkVLQ",
        "brands": {
            "cashbox": {"available": True, "code": "23002", "audioType": "original_vocal", "mvType": "official_mv"},
            "holiday": {"available": True, "code": "10902", "audioType": "original_vocal", "mvType": "official_mv"},
            "watering_hole": {"available": True, "code": "72802", "audioType": "original_vocal", "mvType": "official_mv"},
            "starlight": {"available": True, "code": "30402", "audioType": "original_vocal", "mvType": "official_mv"},
            "singgo": {"available": True, "code": "88002", "audioType": "original_vocal", "mvType": "official_mv"},
            "vmix": {"available": True, "code": "55002", "audioType": "original_vocal", "mvType": "official_mv"},
            "superstar": {"available": True, "code": "60002", "audioType": "original_vocal", "mvType": "official_mv"},
            "yinyuan": {"available": True, "code": "30902", "audioType": "guided_vocal", "mvType": "reedited_mv"},
            "golden_voice": {"available": True, "code": "41902", "audioType": "guided_vocal", "mvType": "reedited_mv"},
            "hongyin": {"available": True, "code": "20902", "audioType": "guided_vocal", "mvType": "reedited_mv"}
        }
    },
    {
        "id": "s_yu_03",
        "title": "月亮惹的禍",
        "artist": "張宇",
        "lyricist": "十一郎",
        "composer": "張宇",
        "language": "國語",
        "zhuyin": "ㄩㄝˋ ㄌㄧㄤˋ ㄖㄜˇ ㄉㄜ˙ ㄏㄨㄛˋ",
        "pinyin": "YUELIANGREDEHUO",
        "releaseYear": 1998,
        "popularRank": 3,
        "lyricsSnippet": "都是月亮惹的禍 那樣的夜色太美你太溫柔 才會在剎那間想要和你到白頭...",
        "youtubeUrl": "https://www.youtube.com/watch?v=DYptgVvkVLQ",
        "brands": {
            "cashbox": {"available": True, "code": "23003", "audioType": "original_vocal", "mvType": "official_mv"},
            "holiday": {"available": True, "code": "10903", "audioType": "original_vocal", "mvType": "official_mv"},
            "watering_hole": {"available": True, "code": "72803", "audioType": "original_vocal", "mvType": "official_mv"},
            "starlight": {"available": True, "code": "30403", "audioType": "original_vocal", "mvType": "official_mv"},
            "singgo": {"available": True, "code": "88003", "audioType": "original_vocal", "mvType": "official_mv"},
            "vmix": {"available": True, "code": "55003", "audioType": "original_vocal", "mvType": "official_mv"},
            "superstar": {"available": True, "code": "60003", "audioType": "original_vocal", "mvType": "official_mv"},
            "yinyuan": {"available": True, "code": "30903", "audioType": "guided_vocal", "mvType": "reedited_mv"},
            "golden_voice": {"available": True, "code": "41903", "audioType": "guided_vocal", "mvType": "reedited_mv"},
            "hongyin": {"available": True, "code": "20903", "audioType": "guided_vocal", "mvType": "reedited_mv"}
        }
    },
    {
        "id": "s_wubai_01",
        "title": "挪威的森林",
        "artist": "伍佰",
        "lyricist": "伍佰",
        "composer": "伍佰",
        "language": "國語",
        "zhuyin": "ㄋㄨㄛˊ ㄨㄟ ㄉㄜ˙ ㄙㄣ ㄌㄧㄣˊ",
        "pinyin": "NUOWEIDESENLIN",
        "releaseYear": 1996,
        "popularRank": 4,
        "lyricsSnippet": "讓我將妳心門打開 讓我看看妳的心要不要讓我在裡面流浪...",
        "youtubeUrl": "https://www.youtube.com/watch?v=DYptgVvkVLQ",
        "brands": {
            "cashbox": {"available": True, "code": "23004", "audioType": "original_vocal", "mvType": "official_mv"},
            "holiday": {"available": True, "code": "10904", "audioType": "original_vocal", "mvType": "official_mv"},
            "watering_hole": {"available": True, "code": "72804", "audioType": "original_vocal", "mvType": "official_mv"},
            "starlight": {"available": True, "code": "30404", "audioType": "original_vocal", "mvType": "official_mv"},
            "singgo": {"available": True, "code": "88004", "audioType": "original_vocal", "mvType": "official_mv"},
            "vmix": {"available": True, "code": "55004", "audioType": "original_vocal", "mvType": "official_mv"},
            "superstar": {"available": True, "code": "60004", "audioType": "original_vocal", "mvType": "official_mv"},
            "yinyuan": {"available": True, "code": "30904", "audioType": "guided_vocal", "mvType": "reedited_mv"},
            "golden_voice": {"available": True, "code": "41904", "audioType": "guided_vocal", "mvType": "reedited_mv"},
            "hongyin": {"available": True, "code": "20904", "audioType": "guided_vocal", "mvType": "reedited_mv"}
        }
    },
    {
        "id": "s_wubai_02",
        "title": "浪人情歌",
        "artist": "伍佰",
        "lyricist": "伍佰",
        "composer": "伍佰",
        "language": "國語",
        "zhuyin": "ㄌㄤˋ ㄖㄣˊ ㄑㄧㄥˊ ㄍㄜ",
        "pinyin": "LANGRENQINGGE",
        "releaseYear": 1994,
        "popularRank": 5,
        "lyricsSnippet": "不要再想妳 不要再愛妳 讓妳的樣子流進我的血液...",
        "youtubeUrl": "https://www.youtube.com/watch?v=DYptgVvkVLQ",
        "brands": {
            "cashbox": {"available": True, "code": "23005", "audioType": "original_vocal", "mvType": "official_mv"},
            "holiday": {"available": True, "code": "10905", "audioType": "original_vocal", "mvType": "official_mv"},
            "watering_hole": {"available": True, "code": "72805", "audioType": "original_vocal", "mvType": "official_mv"},
            "starlight": {"available": True, "code": "30405", "audioType": "original_vocal", "mvType": "official_mv"},
            "singgo": {"available": True, "code": "88005", "audioType": "original_vocal", "mvType": "official_mv"},
            "vmix": {"available": True, "code": "55005", "audioType": "original_vocal", "mvType": "official_mv"},
            "superstar": {"available": True, "code": "60005", "audioType": "original_vocal", "mvType": "official_mv"},
            "yinyuan": {"available": True, "code": "30905", "audioType": "guided_vocal", "mvType": "reedited_mv"},
            "golden_voice": {"available": True, "code": "41905", "audioType": "guided_vocal", "mvType": "reedited_mv"},
            "hongyin": {"available": True, "code": "20905", "audioType": "guided_vocal", "mvType": "reedited_mv"}
        }
    }
]

print("Loading public/songs_catalog.json...")
with open("public/songs_catalog.json", "r", encoding="utf-8") as f:
    data = json.load(f)

# Filter out existing duplicates if any
data = [s for s in data if s["id"] not in [c["id"] for c in CLASSIC_SONGS] and s["title"] not in [c["title"] for c in CLASSIC_SONGS]]

# Prepend classic songs
new_data = CLASSIC_SONGS + data

print(f"Total songs count after injection: {len(new_data)}")

with open("public/songs_catalog.json", "w", encoding="utf-8") as f:
    json.dump(new_data, f, ensure_ascii=False, indent=2)

print("Successfully injected 雨一直下, 用心良苦, 月亮惹的禍, 挪威的森林, 浪人情歌 into songs_catalog.json!")
