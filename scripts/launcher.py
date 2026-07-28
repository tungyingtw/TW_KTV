import os
import sys

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

def main():
    while True:
        print("\n" + "=" * 65)
        print("🎤 台灣 KTV 歌庫 - 多源校驗、歌手智慧對照與資料庫更新系統")
        print("=" * 65)
        print()
        print("【全自動管線模式】")
        print("  [1] 🌟 三階段一條龍總掃描 (Pass 1大點名 ➔ Pass 2&3歌冊與點碼寫入)")
        print("  [2] 🎤 獨立 Pass 1：僅掃描全網新歌手/團體 (快速更新歌手大名冊)")
        print("  [3] 🎵 獨立 Pass 2&3：僅依現有歌手名冊反查新歌與門市點碼")
        print()
        print("【歌手名冊與 Excel 導出工具】")
        print("  [4] 📊 導出 6,434 位歌手大名冊為 Excel / CSV 檔案 (雙擊用 Excel 檢視)")
        print("  [5] 👤 歌手/團體專屬對照查詢 (獨唱/團體/合唱智慧三分類)")
        print("  [6] ➕ 新增/編輯歌手與團體對照關聯記憶庫")
        print()
        print("【資料庫管理與稽核】")
        print("  [7] 🔍 極速本機歌庫品質稽核 (1秒檢視資料有無瑕疵)")
        print("  [8] 🧹 清空歌庫歌曲 (只重置歌曲筆數為0，100%保留歌手大名冊)")
        print("  [9] 離開系統")
        print()
        print("=" * 65)

        choice = input("請輸入功能號碼 [1-9]: ").strip()

        if choice == "1":
            print("\n🚀 啟動【三階段一條龍總掃描】...\n")
            os.system("python scripts/master_ktv_crawler_pipeline.py --mode all")
        elif choice == "2":
            print("\n🚀 啟動【獨立 Pass 1：僅掃描全網新歌手/團體大點名】...\n")
            os.system("python scripts/master_ktv_crawler_pipeline.py --mode pass1")
        elif choice == "3":
            print("\n🚀 啟動【獨立 Pass 2&3：僅依現有歌手名冊反查新歌與門市點碼】...\n")
            os.system("python scripts/master_ktv_crawler_pipeline.py --mode pass2")
        elif choice == "4":
            os.system("python scripts/export_artists_csv.py")
        elif choice == "5":
            os.system("python scripts/artist_search_manager.py")
        elif choice == "6":
            from scripts.artist_search_manager import add_new_artist_registry
            add_new_artist_registry()
        elif choice == "7":
            print("\n🚀 正在執行本機歌庫品質稽核...\n")
            os.system("python scripts/audit_lyrics_content.py")
        elif choice == "8":
            os.system("python scripts/reset_catalog_database.py")
        elif choice == "9":
            print("\n感謝使用，系統已安全關閉。")
            sys.exit(0)
        else:
            print("❌ 無效的選項，請重新輸入。")

if __name__ == "__main__":
    main()
