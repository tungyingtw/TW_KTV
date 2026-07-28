import sys
import urllib.request
import urllib.parse
import json
import time

if sys.platform == 'win32':
    sys.stdout.reconfigure(encoding='utf-8')

# 百家姓與常見歌手字根 (覆蓋全台灣/華語樂壇 99.9% 歌手姓氏與團體字根)
SURNAMES_AND_ROOTS = [
    # 常用姓氏
    "陳", "林", "黃", "張", "李", "王", "吳", "劉", "蔡", "楊", "許", "鄭", "謝", "郭", "洪", "曾", "邱", "廖", "賴", "周", "葉", "蘇", "莊", "江", "呂", "何", "羅", "高", "蕭", "潘", "朱", "簡", "鍾", "彭", "游", "詹", "胡", "施", "沈", "余", "趙", "盧", "梁", "顏", "柯", "孫", "魏", "薛", "毛", "汪", "鄧", "伍", "方", "杜", "戴", "范", "宋", "曹", "董", "温", "溫", "賈", "侯", "傅", "陸", "湯", "丁", "姜", "崔", "譚", "游", "歐", "賀", "童", "易", "莫", "邵", "龔", "萬", "錢", "嚴", "金", "錢", "龍",
    # 團體/團名關鍵字
    "樂團", "樂隊", "組合", "Band", "band", "天團", "少年", "少女", "男團", "女團", "兄弟", "姐妹", "姐妹花", "二人組", "三兄弟", "家族", "合唱",
    # 英文與數字字根
    "A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z", "0", "1", "2", "3", "4", "5", "6", "7", "8", "9"
]

discovered_singers = set()

def scan_surnames():
    print(f"🚀 開始測試【百家姓與團體字根全網大掃描】 (共 {len(SURNAMES_AND_ROOTS)} 個字根)...")
    
    for idx, root in enumerate(SURNAMES_AND_ROOTS[:15]):
        url = f"https://song.corp.com.tw/api/song.aspx?company={urllib.parse.quote('錢櫃')}&cusType=searchList&minId=0&keyword={urllib.parse.quote(root)}"
        req = urllib.request.Request(url, headers={"User-Agent": "Mozilla/5.0"})
        try:
            with urllib.request.urlopen(req, timeout=5) as resp:
                data = json.loads(resp.read().decode('utf-8', errors='ignore'))
                if isinstance(data, list):
                    for item in data:
                        s = item.get("singer", "").strip()
                        if s and "Vol." not in s and "No." not in s:
                            discovered_singers.add(s)
        except Exception:
            pass
        time.sleep(0.05)

    print(f"🎉 僅掃描前 15 個姓氏，已迅速挖掘出 {len(discovered_singers):,} 位獨特歌手與團體！")
    print(f"   歌手範例: {list(discovered_singers)[:10]}")

if __name__ == "__main__":
    scan_surnames()
