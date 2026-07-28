import json
import sys

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

def fix_qitian():
    catalog_path = "public/songs_catalog.json"
    with open(catalog_path, "r", encoding="utf-8") as f:
        catalog = json.load(f)

    for song in catalog:
        if song["title"] == "齊天" and "華晨宇" in song["artist"]:
            song["brands"] = {
                "cashbox": {"available": False, "note": "錢○實測未收錄"},
                "holiday": {"available": False, "note": "好○迪App實測未收錄"},
                "watering_hole": {"available": True, "code": "OK", "audioType": "original_vocal", "mvType": "official_mv"},
                "starlight": {"available": False, "note": "星○點未收錄"},
                "singgo": {"available": True, "code": "OK", "audioType": "original_vocal", "mvType": "official_mv"},
                "vmix": {"available": True, "code": "OK", "audioType": "original_vocal", "mvType": "official_mv"},
                "superstar": {"available": True, "code": "OK", "audioType": "original_vocal", "mvType": "official_mv"},
                "yinyuan": {"available": False},
                "golden_voice": {"available": False},
                "hongyin": {"available": False}
            }
            print("Successfully corrected 齊天 (華晨宇) brand availability according to real-world Holiday App test!")

    with open(catalog_path, "w", encoding="utf-8") as f:
        json.dump(catalog, f, ensure_ascii=False, indent=2)

if __name__ == "__main__":
    fix_qitian()
