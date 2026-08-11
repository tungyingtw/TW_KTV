# 全台 KTV 歌友到訪紀錄工程計畫書

本文件定義「全台 KTV 歌友到訪紀錄」從試作頁進入正式功能的實作順序。執行 AI 必須依照本文件分階段處理，不得自行擴大成會員系統、精準定位、排行榜競賽或個人追蹤功能。

## 目前狀態

- 已確認 `MapSVG/TaiwanMap.svg` 具有 22 個縣市分區 `<path>`，可用於互動式台灣地圖。
- 已新增獨立試作頁 `/taiwan-map-demo`，目前使用假資料顯示熱度分布。
- 尚未建立後端統計 API。
- 尚未建立縣市推估與正式追加紀錄。
- 尚未把地圖整合到正式首頁或累積查詢標籤。

## 目標

建立一個輕量、低個資風險的趣味統計功能：

1. 顯示「全台 KTV 歌友到訪」或「全台歌友熱度」累積數。
2. 讓使用者點擊標籤後查看各縣市分布。
3. 使用既有累積查詢數初始化 `seed_count`。
4. 之後的新到訪或查詢使用 IP 推估縣市，追加到 `live_count`。
5. 不長期保存原始 IP。

## 非目標

- 不建立使用者身分識別。
- 不保存精準 GPS 位置。
- 不顯示個別使用者紀錄。
- 不把 IP 原文寫入永久資料。
- 不讓前端直接決定縣市計數。
- 不在第一版引入大型資料庫，除非現有部署限制導致 JSON 檔案不可行。

## 資料模型

先使用後端 JSON 檔案保存統計。建立類似以下結構：

```json
{
  "version": 1,
  "seededAt": "2026-08-11T00:00:00.000Z",
  "liveStartedAt": "2026-08-11T00:00:00.000Z",
  "seedBaselineTotal": 120000,
  "seedBaselineCapturedAt": "2026-08-11T00:00:00.000Z",
  "seedWeightVersion": "tw-population-metro-v1",
  "totalSeedCount": 120000,
  "regions": {
    "TWTPE": { "name": "台北市", "seed_count": 15680, "live_count": 0 },
    "TWNWT": { "name": "新北市", "seed_count": 18420, "live_count": 0 }
  },
  "dailyDedup": {
    "2026-08-11": {
      "hash1": {
        "city_code": "TWTXG",
        "source": "auto_joined",
        "corrected": false,
        "updated_at": "2026-08-11T00:00:00.000Z"
      }
    }
  }
}
```

執行時必須用 `seed_count + live_count` 作為前端顯示總數。不得把早期估算值混入 `live_count`。

每日去重資料必須保存匿名 hash 目前被計入的縣市。使用者按「我在這裡」修正地區時，後端必須將原縣市 `live_count - 1`，新縣市 `live_count + 1`，並更新該 hash 的 `city_code` 與 `corrected`。不得只增加新縣市，避免總數被修正流程灌高。

## 縣市代碼對照

必須使用 SVG 既有 `id` 作為唯一縣市代碼：

| SVG id | 顯示名稱 |
|---|---|
| TWTPE | 台北市 |
| TWNWT | 新北市 |
| TWTAO | 桃園市 |
| TWHSQ | 新竹縣 |
| TWHSZ | 新竹市 |
| TWMIA | 苗栗縣 |
| TWTXG | 台中市 |
| TWCHA | 彰化縣 |
| TWNAN | 南投縣 |
| TWYUN | 雲林縣 |
| TWCYQ | 嘉義縣 |
| TWCYI | 嘉義市 |
| TWTNN | 台南市 |
| TWKHH | 高雄市 |
| TWPIF | 屏東縣 |
| TWILA | 宜蘭縣 |
| TWHUA | 花蓮縣 |
| TWTTT | 台東縣 |
| TWKEE | 基隆市 |
| TWPEN | 澎湖縣 |
| TWKIN | 金門縣 |
| TWLIE | 連江縣 |

## AI 執行斷點規則

執行 AI 必須把本計畫拆成小階段處理。每次只執行使用者指定的小階段，不得自行跨到下一個小階段。每個小階段完成後，必須回報完成項目、修改檔案、驗證結果、尚未完成項目與下一步建議。

若執行中遇到以下情況，必須停在當前小階段並回報，不得硬接下一階段：

- 需要 production 最新資料或線上憑證。
- 需要決定 GeoIP 供應方式。
- 需要新增環境變數或部署設定。
- `npm run build` 或後端 smoke test 失敗。
- Render 免費方案不支援 Persistent Disk；正式地區熱度必須沿用 Upstash Redis。
- 使用者介面方向與目前 demo 定案規格衝突。

## 小階段拆分總表

| 小階段 | 目標 | 停點 |
|---|---|---|
| Phase 1A | 清理 demo 假資料與正式文案 | demo 仍可獨立預覽 |
| Phase 1B | 抽出 `TaiwanHeatMap` | 地圖互動與拖曳驗收通過 |
| Phase 1C | 抽出 `VisitStatsPanel` 並重接 demo | demo 視覺與互動完整 |
| Phase 2A | 建立統計 JSON schema 與讀寫 helper | 可建立/讀取/補齊 22 縣市 |
| Phase 2B | 建立 atomic write、備份與每日清理 | 壞檔不會讓 API 掛掉 |
| Phase 3A | 確認 production 累積查詢總數來源 | 取得可重現讀取方式 |
| Phase 3B | 建立 seed 腳本 dry-run | 可輸出分配結果但不寫正式檔 |
| Phase 3C | 寫入 seed 與處理上線前差額 | `seed_count` 加總吻合線上基準 |
| Phase 4A | 建立 `GET /api/visit-region-stats` | 前端可讀統計 |
| Phase 4B | 建立 `POST /record` 與匿名去重 | 同日重複不灌水 |
| Phase 4C | 建立 `POST /correct-region` | 修正時原縣市扣回、新縣市增加 |
| Phase 5A | 決定 GeoIP 方案 | 明確使用本地資料庫或外部 API |
| Phase 5B | 建立縣市正規化對照 | 可映射到 22 個 SVG id |
| Phase 5C | 建立未知/海外/VPN fallback | 失敗不影響查歌 |
| Phase 6A | 新增前端統計 API service | 前端可讀/記錄/修正 |
| Phase 6B | 建立正式 modal/drawer 入口 | 首頁不被大型地圖壓住 |
| Phase 6C | 接上「我在這裡」修正 UI | 地圖、排行、地區卡同步更新 |
| Phase 7A | 本機驗證與測試補齊 | build 與 API 測試通過 |
| Phase 7B | 上線與 24 小時觀察 | 可回滾、無異常爆量 |

## Phase 1：整理試作頁為可重用元件

1. 將 `TaiwanMapDemo` 中的假資料移到獨立 mock 檔案。
2. 建立 `TaiwanHeatMap` 元件，只負責地圖渲染、hover、click、selected region、拖曳平移與縮放。
3. 建立 `VisitStatsPanel` 元件，只負責總數、目前選取縣市、Top 地區列表。
4. 讓地圖預設以台灣本島為主，但必須保留完整 SVG 視窗，使澎湖、金門、連江可透過拖曳查看。
5. 保留 `/taiwan-map-demo` 作為開發預覽入口。
6. 不在 Phase 1 接後端。

### Phase 1 地圖互動規格

1. 使用縣市色塊作為主要資料視覺，不要常駐顯示縣市文字、拉線或小點。
2. 在桌機使用 hover tooltip 顯示縣市名稱與人數。
3. 在手機不要依賴 hover，也不要使用長按；使用單點縣市後在資訊卡顯示縣市名稱與人數。
4. 點擊縣市時，讓該縣市浮起並帶輕微厚度陰影，其他縣市灰階暗下去。
5. 點擊地圖空白處時，取消選取並回到全台總覽。
6. 拖曳地圖時不要誤觸發縣市選取；放開前若位移超過拖曳門檻，必須視為拖曳。
7. 拖曳時必須直接更新 transform 或使用等效效能策略，不要在每個 pointer move 造成卡頓。
8. 保留縮放、左右偏移與重設控制作為輔助操作，不得只依賴按鈕平移。
9. 顯示目前加入的「你的歌友地區」。
10. 使用者選取縣市後，必須在地圖面板內顯示清楚的「我在這裡」操作，不得只藏在側欄深處。
11. 使用者點擊「我在這裡」後，必須將原縣市 `-1`、新縣市 `+1`，並播放短暫 `+1 / -1` 視覺回饋。
12. 若選取縣市已是目前加入地區，操作必須顯示「已在這裡」且不可重複送出。

驗收標準：

- `/taiwan-map-demo` 視覺與目前效果一致或更穩定。
- `npm run build` 必須通過。
- 手機寬度不得出現文字重疊或地圖超出畫面。
- 未選取狀態不得出現常駐縣市文字、拉線或小點。
- 澎湖、金門、連江不得因預設本島視角被永久裁切。
- 地圖拖曳必須順暢，且拖曳與點選不互相誤觸。
- 選取縣市後，「我在這裡」必須清楚可見。
- 修正地區時必須有明確 `+1 / -1` 回饋。

## Phase 2：建立後端統計儲存層

1. 在 `server/index.js` 建立地區熱度資料讀寫 helper。
2. 正式環境必須使用 Upstash Redis key `ktv:visitRegionStats` 保存地區熱度，不得要求 Render 免費方案啟用 Disk。
3. 實作 atomic write：先寫暫存檔，再覆蓋正式檔，避免寫入中斷造成 JSON 損壞。
4. 建立預設 22 縣市資料，缺欄位時自動補齊。
5. 加入每日去重資料清理，只保留最近 7 天。

驗收標準：

- 後端啟動時 Redis 統計資料不存在也能回傳空白資料。
- Redis 統計資料格式錯誤時不得讓 API 全站掛掉。
- 不得在統計資料保存原始 IP。

## Phase 3：建立 seed 初始化腳本

1. 找出目前線上累積查詢總數的正式來源，不得用目測數字硬寫。
2. 在執行 seed 前，先同步或查詢 production 最新累積查詢總數，並記錄 `seedBaselineTotal` 與 `seedBaselineCapturedAt`。
3. 建立 `scripts/seedVisitRegionStats.js`。
4. 使用固定權重分配 `seedBaselineTotal`，讓都會區較高、離島較低。
5. 加入少量可重現擾動，使用固定 seed，避免每次重跑結果不同。
6. 讓腳本預設只能在 `seed_count` 全部為 0 時執行。
7. 若必須重跑，要求明確傳入 `--force`。
8. seed 完成後，將既有未分區累積人數全部寫入各縣市 `seed_count`，不得留下未分配差額。
9. 正式上線前再次讀取線上最新累積查詢總數；若最新值大於 `seedBaselineTotal`，必須將差額依同一套權重補分配到 `seed_count`，或先完成 live record 啟用後再切換入口，二者必須擇一明確執行。
10. 上線後不得再把新的即時到訪混入 `seed_count`；所有新紀錄只能進 `live_count`。

### Phase 3A 來源確認結果

production 累積查詢總數的正式來源必須使用 Upstash Redis key `ktv:totalVisits`。地區熱度統計的正式來源必須使用 Upstash Redis key `ktv:visitRegionStats`。現有程式在 `server/index.js` 內以 `STATS_REDIS_TOTAL_KEY = 'ktv:totalVisits'` 定義累積查詢 key；正式環境設定 `UPSTASH_REDIS_REST_URL` 與 `UPSTASH_REDIS_REST_TOKEN` 時，`/api/stats/ping` 會以 Redis 原子遞增此 key，並把結果作為前台累積查詢顯示。

不得使用 `/api/stats/ping` 作為 seed 讀取來源，因為此 API 會進行 12 小時去重與可能遞增 `ktv:totalVisits`。seed 腳本必須直接讀取 Upstash Redis REST 的 `GET ktv:totalVisits`，或讀取一個無副作用的後台唯讀 API。若沒有 Redis 環境變數，腳本必須拒絕 production seed；只有本機 dry-run 可以退回讀取 `server/stats.json`。

Phase 3B 必須實作以下讀取順序：

1. 若提供 `--baseline-total`，只允許 dry-run 使用，正式寫入不得使用手填數字。
2. 若存在 `UPSTASH_REDIS_REST_URL` 與 `UPSTASH_REDIS_REST_TOKEN`，使用 Upstash REST 讀取 `ktv:totalVisits`。
3. 若是本機 dry-run 且 Redis 環境變數不存在，讀取 `server/stats.json` 的 `totalVisits`。
4. 讀取成功後立即記錄 `seedBaselineTotal` 與 `seedBaselineCapturedAt`。
5. 若讀取結果不是正整數，立即停止，不得產生 seed 檔。

Phase 3B 已建立 `scripts/seedVisitRegionStats.js`。執行 dry-run：

```bash
node scripts/seedVisitRegionStats.js --dry-run
```

本機測試任意基準值：

```bash
node scripts/seedVisitRegionStats.js --dry-run --baseline-total=12345
```

腳本必須輸出 `dryRun: true`、`writesFile: false`、來源、`seedBaselineTotal`、`seedBaselineCapturedAt`、`seedWeightVersion`、22 縣市分配結果與 `totalSeedCount`。Phase 3B 不得寫入 `server/visit_region_stats.json`。

Phase 3C 已擴充正式寫入模式。production seed 必須執行：

```bash
node scripts/seedVisitRegionStats.js --apply
```

若 seed 已寫入，但正式入口尚未切換且 `ktv:totalVisits` 又增加，必須執行：

```bash
node scripts/seedVisitRegionStats.js --apply --top-up
```

`--apply` 不得搭配 `--baseline-total`。正式寫入缺少 `UPSTASH_REDIS_REST_URL` 或 `UPSTASH_REDIS_REST_TOKEN` 時必須停止。Redis key `ktv:visitRegionStats` 已有 `seed_count` 時不得重複 seed；若只是補上線前差額，必須使用 `--top-up`；若要重寫，必須明確使用 `--force` 並先備份正式 Redis key。

建議初始權重：

```text
新北、台北、桃園、台中、高雄：高權重
台南、彰化、新竹縣市、苗栗、屏東：中高權重
雲林、南投、宜蘭、花蓮、嘉義縣市、基隆、台東：中低權重
澎湖、金門、連江：低權重
```

驗收標準：

- 所有縣市 `seed_count` 加總必須等於 `seedBaselineTotal`，若上線前有補分配差額，則必須等於補分配後的最新線上累積查詢總數。
- `live_count` 必須維持 0。
- 腳本必須輸出每個縣市分配結果與總和檢查。
- 腳本必須輸出 `seedBaselineTotal`、`seedBaselineCapturedAt`、分配權重版本與是否補分配差額。
- 不得發生「線上既有累積人數大於縣市 seed_count 加總」的狀態。

## Phase 4：建立統計 API

1. 新增 `GET /api/visit-region-stats`。
2. 回傳每個縣市的 `city_code`、`city_name`、`seed_count`、`live_count`、`total_count`。
3. 回傳 `total_count`、`seeded_at`、`live_started_at`。
4. 新增 `POST /api/visit-region-stats/record`。
5. 在 `POST` 內由後端取得 client IP，不得接受前端傳入 IP。
6. 對同一 IP 的同一天紀錄做 hash 去重。
7. 去重 hash 必須使用 `VISIT_STATS_HASH_SECRET`；若環境變數不存在，必須在開發環境用固定 fallback，正式環境拒絕啟用正式紀錄。
8. 新增 `POST /api/visit-region-stats/correct-region`，讓使用者把自己的匿名到訪紀錄改到指定縣市。
9. `correct-region` 不得接受前端傳入 IP 或 hash；必須由後端使用同一套 request IP 與 secret 重新計算 hash。
10. `correct-region` 必須限制同一 hash 每日修正次數；第一版建議最多 3 次。
11. 若該 hash 今日尚未建立紀錄，`correct-region` 必須採用明確策略：直接建立到指定縣市，或要求先完成 record。第一版建議直接建立到指定縣市，降低使用者操作失敗率。

驗收標準：

- `GET` 可被前端公開讀取。
- `POST` 不回傳 IP、hash 或任何可識別資料。
- 同一 IP 同一天重複呼叫不得重複增加 `live_count`。
- API 必須套用既有 rate limit。
- 修正地區時，原縣市必須扣回，新縣市才可增加。
- 修正 API 不得造成全站總數增加，除非該 hash 今日尚未被記錄且規格明確允許補建紀錄。

## Phase 5：加入 IP 縣市推估

1. Render 免費方案不得要求本地 GeoIP 資料庫。
2. 使用 server-side 外部 GeoIP API，且只在累積查詢真的新增時計算。
3. 外部 GeoIP API 必須加上 timeout 與失敗 fallback。
4. 將 GeoIP 回傳縣市正規化成 SVG id。
5. 無法判斷時不增加地區熱度；非台灣 IP 記錄到「其他國家」，不得硬分配到台灣地圖。

### Phase 5A GeoIP 方案決策

第一版正式採用 ipwhois.io free endpoint 作為 server-side GeoIP 來源，不得在瀏覽器端查詢。

採用本地 MMDB 的原因：

Render 免費方案不能放置 MMDB 檔，正式版必須使用 server-side 外部 GeoIP 查詢，不得在瀏覽器端查詢。預設使用 ipwhois.io free endpoint，只在 `/api/stats/ping` 的 Redis 12 小時去重成功新增累積查詢時呼叫一次。

```text
VISIT_REGION_AUTO_GEOIP=true
VISIT_REGION_GEOIP_ENDPOINT=https://ipwho.is
VISIT_REGION_GEOIP_TIMEOUT_MS=1800
```

外部 API 必須具備以下保護：

1. API 失敗時不得阻塞查歌或統計 API。
2. timeout 或超量時不得硬分配到任一縣市。
3. 回傳非台灣地區時必須記錄到「其他國家」。
4. 不得把外部 API 的原始 response 存進統計資料。

GeoIP 結果只能作為「初始推估」。正式 UI 必須保留「我在這裡」讓使用者修正；修正後以使用者選擇為準。

### Phase 5B 縣市正規化對照

後端必須使用 `normalizeTaiwanVisitRegionCode` 將 GeoIP 結果轉成 22 個 SVG id。正規化必須依序讀取以下欄位：

1. `subdivisions[].isoCode`
2. `subdivisions[].name`
3. `subdivisions[].names.zh-TW`、`zh-CN`、`en`
4. `subdivision.isoCode`、`subdivision.name`、`subdivision.names`
5. `region`、`regionName`、`region_name`
6. `city.name`、`city.names`
7. `city`

若 GeoIP 回傳 `country.isoCode`、`country_code` 或等效欄位，且值不是 `TW`，必須回傳「其他國家」，不得硬分配到台灣縣市。

必須支援以下格式：

1. SVG id：`TWTPE`
2. ISO subdivision code：`TPE`
3. ISO subdivision code with country prefix：`TW-TPE`
4. 中文縣市名：`台北市`、`臺北市`
5. 英文縣市名：`Taipei City`、`New Taipei City`

### Phase 5C GeoIP fallback

後端必須使用 `resolveVisitRegionGeoIpResult` 統一處理 GeoIP 結果。此 helper 必須回傳：

```json
{ "cityCode": null, "shouldRecord": false, "reason": "geoip_missing" }
```

第一版 fallback 規則如下：

1. GeoIP 查詢失敗、timeout 或回傳空值時，回傳 `geoip_missing` 或對應 reason，不得增加任何縣市 `live_count`。
2. GeoIP 回傳非台灣 country code 時，回傳 `other_country` 並記錄到「其他國家」，不得硬分配到台灣縣市。
3. GeoIP 回傳 VPN、proxy、Tor、hosting 或匿名網路標記時，回傳 `anonymous_network`，不得硬分配到台灣縣市。
4. GeoIP 回傳台灣但無法對應 22 縣市時，回傳 `unknown_taiwan_region`，不得硬分配到鄰近縣市。
5. GeoIP 沒有 country code 且無法對應縣市時，回傳 `unknown_country`，不得硬分配。
6. 只有 `shouldRecord: true` 且 `cityCode` 為 22 個 SVG id 或「其他國家」代碼時，才允許進入 `recordVisitRegionStatsLocal` 增加 `live_count`。

fallback reason 只允許作為暫時計算流程或除錯日誌，不得寫入永久統計資料，不得回傳 IP 或匿名 hash。

驗收標準：

- 台灣縣市名稱必須能正確對應到 22 個 SVG id。
- VPN、海外、未知 IP 不得造成 API error。
- 不得把 GeoIP 原始結果完整存入永久資料。

## Phase 6：前端正式整合

1. 在 `src/services/apiService.ts` 新增讀取統計與記錄到訪的 API 函式。
2. 在首頁既有「累積查詢」或相近位置加入可點擊的「全台歌友熱度」標籤。
3. 點擊標籤時開啟 modal 或 drawer，不要直接把大型地圖塞進首頁第一屏。
4. 將 `TaiwanHeatMap` 接上正式 API 資料。
5. 保留 `/taiwan-map-demo`，直到正式頁穩定後再由使用者決定是否移除。
6. 讓 `POST record` 在使用者首次進站或首次查詢後觸發一次；第一版建議在首次成功載入 catalog 後觸發。
7. 將文字資訊集中在右側面板、目前選取卡片與 Top 地區列表；不要在地圖上常駐 22 個縣市標籤。
8. 從統計 API 回應取得目前匿名使用者被加入的縣市，顯示為「你的歌友地區」。
9. 使用者選取縣市時，在地圖面板內顯示「我在這裡」操作。
10. 使用者點擊「我在這裡」時，呼叫 `correct-region`，成功後更新地圖色塊、目前加入地區、目前選取卡片與 Top 地區列表。
11. 修正成功時播放 `+1 / -1` 短動畫；API 失敗時顯示溫和錯誤，不得影響查歌。

驗收標準：

- 首頁主搜尋流程不得變慢。
- API 失敗時地圖入口仍可顯示「暫時無法讀取熱度」，不得影響查歌。
- 使用者一天內重整頁面不得一直灌高同縣市數字。
- 手機版 modal 或 drawer 必須可關閉、可捲動、不遮住主要按鈕。
- 地圖不得因常駐文字、拉線或小點造成視覺噪音；縣市資料必須透過 hover、點選卡片與排行呈現。
- 手機版選取縣市後，必須能清楚看到「我在這裡」操作，不得藏在需要大量捲動的位置。
- 使用者修正地區後，UI 顯示的人數、排行與「你的歌友地區」必須同步更新。

## Phase 7：驗證與上線

1. 執行 `npm run build`。
2. 執行既有後端 smoke test；若沒有覆蓋統計 API，新增最小 API 測試腳本。
3. 手動測試 `/taiwan-map-demo`。
4. 手動測試首頁入口。
5. 手動測試 API 重複紀錄去重。
6. 在 staging 或本機使用假 IP header 測試縣市對應。
7. 上線後觀察 24 小時，確認 `live_count` 正常增加且沒有單一地區異常爆量。

驗收標準：

- 正式功能不影響查歌、品牌篩選、收藏、建議歌曲與回報流程。
- Redis 統計資料可被備份與還原。
- 上線後發現 GeoIP 異常時，可快速關閉 `POST record`，保留 `GET` 顯示既有 seed 資料。

上線前必須另外執行 `docs/taiwan-map-visit-stats-release-checklist.md`。地區熱度必須配合既有 `/api/stats/ping` 的 `tw_ktv_vid` 與 12 小時去重規則，不得建立獨立的 IP 自動計數流程。自動 GeoIP 只能在 `/api/stats/ping` 實際新增累積查詢的同一事件後追加地區熱度；使用者仍可在地圖頁透過「我在這裡」修正同一筆到訪的地區。

## 隱私與文案規則

1. 前端文案使用「熱度分布」或「到訪紀錄」，不要寫「精準人數」。
2. 在隱私權政策或說明頁補充：網站可能使用 IP 推估粗略縣市，用於匿名統計。
3. 不顯示「你的所在地」這類會讓使用者覺得被定位的文案。
4. 不保存原始 IP。
5. 去重 hash 僅用於短期防灌水，最多保留 7 天。

## 使用者介面文案規則

正式頁面必須使用完成品語氣，不得出現開發中、工程中、內部流程或資料初始化字眼。執行 AI 必須把技術細節留在程式與文件，不得放到使用者會看到的 UI。

禁止出現在正式 UI 的字眼：

- demo
- 試作
- 模擬資料
- 假資料
- 開發預覽
- seed
- live_count
- seed_count
- GeoIP
- IP 推估
- API
- POST record
- 初始化
- 權重分配
- 估算分配
- 修正 hash
- 扣回

允許出現在正式 UI 的字眼：

- 全台歌友熱度
- 歌友分布
- 到訪紀錄
- 全台總覽
- 目前選取
- 熱門地區
- 人數較多
- 人數較少
- 今日/累積歌友
- 你的歌友地區
- 我在這裡
- 已在這裡
- 已更新你的歌友地區

正式 UI 建議文案：

```text
全台歌友熱度
看看最近有哪些地區的歌友正在查歌。

全台總覽
點選縣市查看該地區的歌友分布。

熱門地區
依累積歌友人數排序。

暫時無法讀取熱度
稍後再試一次，不影響查歌功能。

你的歌友地區
如果不在這裡，點選你的縣市後按「我在這裡」。

我在這裡

已在這裡

已更新你的歌友地區
```

正式 UI 不得寫：

```text
目前為模擬資料
此資料由 seed_count + live_count 產生
依 IP 推估縣市
GeoIP 判斷失敗
POST record 已送出
已扣回原縣市
hash 修正成功
```

若需要說明資料不是精準定位，必須放在隱私權政策或說明頁，不要放在主要互動面板。正式 UI 可以使用「熱度」降低精準人數暗示；後台或文件才允許使用 `seed_count`、`live_count` 等工程字眼。

## 回滾策略

1. 若 API 有問題，先在前端關閉紀錄觸發，只保留入口或隱藏入口。
2. 若 GeoIP 對應異常，停止 `POST record` 的 live 追加。
3. 若 Redis 統計資料異常，先備份目前 key 值；若沒有可用備份，使用 seed 腳本重建 seed，再將 live_count 歸零並註記。
4. 不要刪除 SVG 或 demo 元件，除非使用者確認不再採用此功能。

## 建議執行順序

1. 先依序執行 Phase 1A、Phase 1B、Phase 1C，將 demo 拆成可重用元件。
2. 再依序執行 Phase 2A、Phase 2B，建立穩定 Redis 統計資料層。
3. 再依序執行 Phase 4A、Phase 4B、Phase 4C，先完成不含 GeoIP 的讀取、記錄與修正 API。
4. 再執行 Phase 3A。取得 production 累積查詢總數來源後，才執行 Phase 3B、Phase 3C。
5. 再依序執行 Phase 5A、Phase 5B、Phase 5C，加入 IP 粗略縣市推估。
6. 最後依序執行 Phase 6A、Phase 6B、Phase 6C、Phase 7A、Phase 7B，把功能掛回首頁並驗證。

## 目前執行狀態

- Phase 1A：已完成。Demo 主要文案已移除開發中與假資料字眼。
- Phase 1B：已完成。已抽出 `TaiwanHeatMap`。
- Phase 1C：已完成。已抽出 `VisitStatsPanel`。
- Phase 2A：已完成。已建立統計 JSON schema、22 縣市初始資料與本機讀寫 helper。
- Phase 2B：已完成。已建立 Redis 優先的統計資料層與每日去重清理；本機 JSON 僅作開發 fallback。
- Phase 4A：已完成。已建立 `GET /api/visit-region-stats` 公開讀取 API。
- Phase 4B：已完成。已建立 `POST /api/visit-region-stats/record` 與匿名每日去重。
- Phase 4C：已完成。已建立 `POST /api/visit-region-stats/correct-region`，修正時扣回原縣市並增加新縣市。
- Phase 3A：已完成。已確認正式累積查詢總數來源為 Upstash Redis key `ktv:totalVisits`，且不得用 `/api/stats/ping` 當 seed 讀取來源。
- Phase 3B：已完成。已建立 `scripts/seedVisitRegionStats.js` dry-run 分配腳本。
- Phase 3C：已完成。已建立正式寫入、重複 seed 防護與上線前差額 `--top-up` 模式。
- Phase 5A：已完成。已決定第一版 GeoIP 採用 ipwhois.io free endpoint，並限制只在累積查詢新增事件呼叫。
- Phase 5B：已完成。已建立台灣縣市正規化對照，可將 GeoIP 結果轉成 22 個 SVG id。
- Phase 5C：已完成。已建立 GeoIP unknown、境外、匿名網路 fallback；境外記錄到「其他國家」，無法判斷時不硬分配到縣市。
- Phase 6A：已完成。已新增前端統計 API service，封裝讀取統計、記錄到訪與修正縣市。
- Phase 6B：已完成。已將既有「累積查詢」標籤改為可點擊入口，點擊後開啟全台歌友熱度 modal；桌機與手機導覽列都使用同一個 modal，不新增獨立入口按鈕。
- Phase 6C：已完成。已將「我在這裡」接到正式 modal，選取縣市後可送出修正，成功後更新統計並顯示 `+1 / -1` 回饋。
- Phase 7A：已完成。已完成 `npm run build`、API smoke test 與瀏覽器互動驗證；已驗證既有「累積查詢」標籤可開啟 modal、可選縣市、可送出「我在這裡」，送出後 API 統計會同步更新。
- Phase 7B：上線準備文件已完成。已新增正式上線檢查清單，明確列出 seed/top-up、必要環境變數、GeoIP 阻擋條件、回滾方式與 24 小時觀察項目；已修正地區熱度策略，要求配合既有累積查詢 `tw_ktv_vid` 與 12 小時去重規則，不另建 IP 計數；實際 24 小時觀察必須等正式部署後執行。
- Seed dry-run：已用線上累積查詢 `134` 執行 `node scripts/seedVisitRegionStats.js --dry-run --baseline-total=134`，確認不寫入檔案且 22 縣市 `seed_count` 加總為 134。
- Seed preflight：已嘗試正式寫入前檢查，確認正式 seed 必須使用 `UPSTASH_REDIS_REST_URL`、`UPSTASH_REDIS_REST_TOKEN` 與 `VISIT_STATS_HASH_SECRET`；腳本已正確拒絕 `--apply --baseline-total=134`，因此尚未寫入正式 seed。地區熱度正式資料改存 Upstash Redis key `ktv:visitRegionStats`，不需要 Render Disk。
- Stats total API：已新增 `GET /api/stats/total` 作為累積查詢唯讀 API。已驗證連續讀取不會遞增累積查詢，只有 `/api/stats/ping` 仍依既有 12 小時去重規則計數。
- Commit readiness：已新增 `docs/taiwan-map-commit-readiness-plan.md`，列出 commit 前必修項目、已定案事項、驗證項目、可延後項目與停止條件。

## 下一階段建議任務

先依照 `docs/taiwan-map-commit-readiness-plan.md` 完成 commit 前檢整。檢整完成並通過 build、API smoke test 與瀏覽器互動測試後，再進行 commit。正式部署環境設定與 production seed 依照 `docs/taiwan-map-seed-runbook.md` 於部署後執行。

下一次處理完成後必須回報：

- 完成項目
- 修改檔案
- 驗證結果
- 尚未完成項目
- 下一步建議
