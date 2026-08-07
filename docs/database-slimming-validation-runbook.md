# database.json 瘦身驗證 Runbook

## 執行前檢查

1. 執行 `git status --short`，必須確認沒有不相關修改。
2. 執行 `node -e "JSON.parse(require('fs').readFileSync('server/database.json','utf8')); console.log('database ok')"`。
3. 記錄 `server/database.json` 與 `public/songs_catalog.bin` 的大小。
4. 下載或建立全站備份，確認備份包含 catalog、reports、votes、review actions 與 archives。

## 只讀稽核指令

執行欄位分布統計：

```powershell
node -e "const fs=require('fs');const db=JSON.parse(fs.readFileSync('server/database.json','utf8'));const songs=Array.isArray(db)?db:(db.songs||[]);const stats={songs:songs.length,brandTotal:0,brandNonEmpty:{code:0,note:0,audioType:0,mvType:0},songNonEmpty:{lyricist:0,composer:0,lyricsSnippet:0,youtubeUrl:0,zhuyin:0,pinyin:0,releaseYear:0,isMainlandViral:0},mv:{},audio:{}};for(const s of songs){for(const k of Object.keys(stats.songNonEmpty)) if(s[k]) stats.songNonEmpty[k]++;for(const b of Object.values(s.brands||{})){stats.brandTotal++;for(const k of Object.keys(stats.brandNonEmpty)) if(b[k]) stats.brandNonEmpty[k]++;if(b.mvType) stats.mv[b.mvType]=(stats.mv[b.mvType]||0)+1;if(b.audioType) stats.audio[b.audioType]=(stats.audio[b.audioType]||0)+1;}}console.log(JSON.stringify(stats,null,2));"
```

執行欄位節省估算：

```powershell
node -e "const fs=require('fs');const songs=JSON.parse(fs.readFileSync('server/database.json','utf8'));function size(v){return Buffer.byteLength(JSON.stringify(v),'utf8')}const base=size(songs);for(const field of ['note','audioType','mvType','available']){const clone=JSON.parse(JSON.stringify(songs));for(const s of clone) for(const b of Object.values(s.brands||{})) delete b[field];console.log(field, ((base-size(clone))/1024/1024).toFixed(2)+' MB');}"
```

## 候選檔驗證

1. 產生候選檔時，必須輸出到 `scratch/`、`C:\tmp\` 或其他非正式路徑。
2. 不得直接覆寫 `server/database.json`。
3. 對候選檔執行 JSON parse。
4. 對候選檔執行欄位分布統計。
5. 比對歌曲總數與品牌狀態總數，必須與正式檔一致。
6. 比對前台搜尋常用關鍵字，結果數不得異常下降。
7. 使用候選檔建置 `songs_catalog.bin`，必須通過。

## brand.note 第一批候選指令

產生 minified 候選檔：

```powershell
node scripts/createSlimNoteCandidate.js --out C:\tmp\database.slim-note.json
```

檢查候選檔：

```powershell
node --check scripts/createSlimNoteCandidate.js
node --check scripts/validateSlimNoteCandidate.js
node scripts/validateSlimNoteCandidate.js --candidate C:\tmp\database.slim-note.json
```

正式套用前必須確認：

1. `sourceSongs` 必須等於 `candidateSongs`。
2. `sourceBrands` 必須等於 `candidateBrands`.
3. `nonNoteBrandChanges` 必須等於 0。
4. `idTitleMismatches` 必須等於 0。
5. 候選檔必須保留所有包含 `點歌碼衝突` 的 note。
6. `frontendShapeMatches` 必須為 true。
7. `sampleSearchMatches` 每個查詢的正式檔與候選檔數量必須一致。
8. `sampleFilterMatches` 每個篩選的正式檔與候選檔數量必須一致。

## 前台驗證

1. 搜尋常見歌曲、歌手、作詞、作曲與辨識提示。
2. 切換桌面列表模式與小卡模式。
3. 切換手機列表模式。
4. 套用 `原版 MV` 篩選，必須只列出 `official_mv`。
5. 套用 `有導唱` 篩選，必須只列出 `guided_vocal`。
6. 開啟歌曲詳情，缺少 `mvType` 或 `audioType` 時不得誤顯示為已確認狀態。

## 後台驗證

1. 開啟歌曲管理。
2. 搜尋任一歌曲並編輯品牌狀態。
3. 設定 `原版 MV`，儲存後必須寫入 `official_mv`。
4. 設定 `伴唱畫面`，儲存後必須寫入 `reedited_mv`。
5. 清空 MV 類型，儲存後必須移除 `mvType`。
6. 設定 `有導唱`，儲存後必須寫入 `guided_vocal`。
7. 清空音訊類型，儲存後必須移除 `audioType`。
8. 從待處理採納新歌建議，必須只寫入建議中明確選定的 MV 與導唱值。

## Render 驗證

1. 部署後第一次開啟前台，必須看到載入或喚醒狀態，不得先顯示真正 0 筆結果。
2. 冷啟動完成後，歌曲列表必須正常出現。
3. 後台統計頁不得因資料檔大小變化明顯變慢。
4. 後台備份匯出必須成功。
5. 後台封存摘要必須仍可讀取。

## 回復方式

1. 若候選檔尚未套用，直接刪除候選檔。
2. 若已套用但未 push，使用 Git 回復該 commit。
3. 若已上線，先停止後續資料清理，再用上一版備份匯入。
4. 回復後必須重新執行 `npm run build`。
