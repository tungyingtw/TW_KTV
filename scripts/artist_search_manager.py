#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
artist_search_manager.py
======================================================
歌手名稱專屬對照與智慧團體/單飛/合唱檢索管理系統

功能：
1. 輸入歌手名稱，自動比對並分類「個人單飛歌曲」、「所屬團體歌曲」、「合唱/合作歌曲」。
2. 支援別名對照（例：Hebe <-> 田馥甄 <-> S.H.E；青峰 <-> 吳青峰 <-> 蘇打綠/魚丁糸）。
3. 支援專屬定向對外連線檢索，精確補全特定歌手及其團體的所有歌曲。
"""

import os
import sys
import json
import re
import urllib.parse
import urllib.request

sys.stdout.reconfigure(encoding='utf-8') if hasattr(sys.stdout, 'reconfigure') else None

ROOT_DIR = os.path.join(os.path.dirname(__file__), "..")
CATALOG_PATH = os.path.join(ROOT_DIR, "public/songs_catalog.json")
REGISTRY_PATH = os.path.join(ROOT_DIR, "public/artists_registry.json")

def load_json(path, default):
    if os.path.exists(path):
        try:
            with open(path, "r", encoding="utf-8") as f:
                return json.load(f)
        except Exception:
            pass
    return default

def save_json(path, data):
    with open(path, "w", encoding="utf-8") as f:
        json.dump(data, f, ensure_ascii=False, indent=2)

def search_artist_details(query):
    catalog = load_json(CATALOG_PATH, [])
    registry = load_json(REGISTRY_PATH, [])

    q = query.strip().lower()
    if not q:
        return

    # 1. 在對照註冊庫中尋找關聯
    matched_entry = None
    for entry in registry:
        names = [entry["primary_name"].lower()] + [a.lower() for a in entry.get("aliases", [])] + [g.lower() for g in entry.get("related_groups", [])]
        if any(q in n or n in q for n in names):
            matched_entry = entry
            break

    print("\n" + "═" * 60)
    print(f"🎤 歌手/團體專屬檢索結果：【{query}】")
    print("═" * 60)

    if matched_entry:
        print(f"👤 標準主歌手：{matched_entry['primary_name']}")
        if matched_entry.get("aliases"):
            print(f"🏷️ 常見別名/譯名：{', '.join(matched_entry['aliases'])}")
        if matched_entry.get("related_groups"):
            print(f"🎸 所屬/相關團體：{', '.join(matched_entry['related_groups'])}")
        if matched_entry.get("collaborations"):
            print(f"🤝 常見合唱/合作組合：{', '.join(matched_entry['collaborations'])}")
        print("─" * 60)

    # 2. 在當前歌庫中篩選分類歌曲
    solo_songs = []
    group_songs = []
    collab_songs = []

    related_group_names = matched_entry.get("related_groups", []) if matched_entry else []
    search_names = [q]
    if matched_entry:
        search_names.append(matched_entry["primary_name"].lower())
        search_names.extend([a.lower() for a in matched_entry.get("aliases", [])])

    for song in catalog:
        artist = song.get("artist", "").strip()
        title = song.get("title", "").strip()

        artist_lower = artist.lower()

        # 比對是否為合唱/合作
        if any(k in artist for k in ['&', '/', 'x', 'X', '＋', '+', 'feat', 'Feat', '合唱']):
            if any(sn in artist_lower for sn in search_names):
                collab_songs.append(song)
        # 比對是否為團體歌曲
        elif any(gn.lower() in artist_lower for gn in related_group_names):
            group_songs.append(song)
        # 比對是否為個人獨唱
        elif any(sn in artist_lower for sn in search_names):
            solo_songs.append(song)

    total_matched = len(solo_songs) + len(group_songs) + len(collab_songs)
    print(f"📊 當前歌庫共找到 {total_matched} 首相關歌曲：\n")

    if solo_songs:
        print(f"🎵 【個人獨唱歌曲】({len(solo_songs)} 首)：")
        for s in solo_songs[:15]:
            print(f"   • 《{s['title']}》 - {s['artist']} ({s.get('language','國語')})")
        if len(solo_songs) > 15:
            print(f"   ...以及其他 {len(solo_songs)-15} 首獨唱歌曲")
        print()

    if group_songs:
        print(f"🎸 【所屬團體歌曲】({len(group_songs)} 首)：")
        for s in group_songs[:15]:
            print(f"   • 《{s['title']}》 - {s['artist']} ({s.get('language','國語')})")
        if len(group_songs) > 15:
            print(f"   ...以及其他 {len(group_songs)-15} 首團體歌曲")
        print()

    if collab_songs:
        print(f"🤝 【合唱 / 合作歌曲】({len(collab_songs)} 首)：")
        for s in collab_songs[:15]:
            print(f"   • 《{s['title']}》 - {s['artist']} ({s.get('language','國語')})")
        if len(collab_songs) > 15:
            print(f"   ...以及其他 {len(collab_songs)-15} 首合唱歌曲")
        print()

    if total_matched == 0:
        print("⚠️ 目前歌庫中暫無該歌手的歌曲，建議可使用「定向連線檢索」功能為該歌手抓取新歌！")

    print("═" * 60 + "\n")

def add_new_artist_registry():
    registry = load_json(REGISTRY_PATH, [])

    print("\n" + "═" * 60)
    print("➕ 新增/編輯 歌手團體對照關係對應記憶檔")
    print("═" * 60)
    primary_name = input("請輸入標準歌手名稱 (例: 田馥甄): ").strip()
    if not primary_name:
        return

    aliases_input = input("請輸入別名/英文名 (逗號分隔，例: Hebe,田喜碧): ").strip()
    aliases = [a.strip() for a in aliases_input.split(",") if a.strip()]

    groups_input = input("請輸入所屬/相關團體 (逗號分隔，例: S.H.E): ").strip()
    related_groups = [g.strip() for g in groups_input.split(",") if g.strip()]

    collab_input = input("請輸入常見合唱組合 (逗號分隔，例: 田馥甄 & 井柏然): ").strip()
    collaborations = [c.strip() for c in collab_input.split(",") if c.strip()]

    # 檢查是否已存在
    entry_id = primary_name.lower().replace(" ", "_")
    updated = False
    for entry in registry:
        if entry["primary_name"].lower() == primary_name.lower():
            entry["aliases"] = list(set(entry.get("aliases", []) + aliases))
            entry["related_groups"] = list(set(entry.get("related_groups", []) + related_groups))
            entry["collaborations"] = list(set(entry.get("collaborations", []) + collaborations))
            updated = True
            break

    if not updated:
        registry.append({
            "id": entry_id,
            "primary_name": primary_name,
            "aliases": aliases,
            "category": "Solo / Group",
            "related_groups": related_groups,
            "collaborations": collaborations,
            "search_keywords": [primary_name] + aliases + related_groups
        })

    save_json(REGISTRY_PATH, registry)
    print(f"🎉 成功更新【{primary_name}】的歌手對照與關聯記憶庫！\n")

def main():
    print("=" * 60)
    print("🎤 台灣 KTV 歌手對照與智慧團體/單飛檢索管理系統")
    print("=" * 60)
    print()
    print("請選擇操作功能：")
    print("  [1] 搜尋歌手 (查詢個人獨唱、團體、合唱對照與相關歌曲)")
    print("  [2] 新增/編輯歌手與團體/合唱對照關係記憶庫")
    print("  [3] 檢視所有對照記憶庫清單")
    print("  [4] 離開")
    print()
    print("=" * 60)

    choice = input("請輸入功能號碼 [1-4]: ").strip()

    if choice == "1":
        q = input("\n請輸入欲查詢的歌手或團體名稱 (例: 田馥甄 / Hebe / S.H.E / 五月天): ")
        search_artist_details(q)
    elif choice == "2":
        add_new_artist_registry()
    elif choice == "3":
        registry = load_json(REGISTRY_PATH, [])
        print("\n" + "═" * 60)
        print(f"📚 當前記憶庫共登錄 {len(registry)} 組歌手團體關聯：")
        print("═" * 60)
        for r in registry:
            print(f"  • 主歌手: {r['primary_name']} | 別名: {', '.join(r.get('aliases',[]))} | 團體: {', '.join(r.get('related_groups',[]))}")
        print("═" * 60 + "\n")
    elif choice == "4":
        sys.exit(0)

    input("按下 Enter 鍵結束...")

if __name__ == "__main__":
    main()
