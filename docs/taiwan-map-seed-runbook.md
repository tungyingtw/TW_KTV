# 台灣地區熱度 Seed Runbook

此 runbook 用於把既有「累積查詢」總數初始化到地區熱度的 `seed_count`。正式執行時必須讀取線上最新 `ktv:totalVisits`，不得沿用舊的手動數字。

## 前置檢查

1. 在正式環境設定 `UPSTASH_REDIS_REST_URL`。
2. 在正式環境設定 `UPSTASH_REDIS_REST_TOKEN`。
3. 在正式環境設定 `VISIT_REGION_STATS_PATH`，並確認該路徑是持久化位置。
4. 在正式環境設定 `VISIT_STATS_HASH_SECRET`，並使用長隨機字串。
5. 若本版不啟用 GeoIP 自動分配，不要設定或宣稱 `GEOIP_CITY_DB_PATH` 已啟用。
6. 確認正式統計檔尚未 seed；若已 seed，只能使用 top-up。

## Dry Run

1. 先讀取唯讀累積查詢總數：

```bash
curl https://tw-ktv.onrender.com/api/stats/total
```

2. 確認 `totalVisits` 是目前前台顯示的累積查詢數。
3. 執行 dry-run：

```bash
node scripts/seedVisitRegionStats.js --dry-run
```

4. 確認輸出的 `source` 是 Redis，而不是手動或本機 fallback。
5. 確認 `seedBaselineTotal` 等於 `/api/stats/total` 回傳的 `totalVisits`。
6. 確認 `regionCount` 等於 `22`。
7. 確認 `totalSeedCount` 等於 `seedBaselineTotal`。
8. 若線上累積查詢數不是預期值，停止並先查 Redis key `ktv:totalVisits`。

## 正式 Seed

1. 只在 dry-run 正確後執行正式 seed：

```bash
node scripts/seedVisitRegionStats.js --apply
```

2. 不要在正式 seed 使用 `--baseline-total`。
3. 不要在正式 seed 使用 `--force`。
4. 執行後讀取：

```bash
curl https://tw-ktv.onrender.com/api/visit-region-stats
```

5. 確認 `total_seed_count` 等於 seed 時的線上累積查詢數。
6. 確認 `total_live_count` 等於 `0`。

## Top-Up

1. 若正式 seed 後、正式開入口前，線上累積查詢數又增加，執行 top-up：

```bash
node scripts/seedVisitRegionStats.js --apply --top-up
```

2. 確認 top-up 只分配差額。
3. 確認 `live_count` 仍維持 `0`。

## 停止條件

1. 若缺少 Redis env，停止。
2. 若 `VISIT_REGION_STATS_PATH` 不是持久化路徑，停止。
3. 若腳本要求 `--force` 才能繼續，停止並先備份正式統計檔。
4. 若 `total_seed_count` 與線上累積查詢不一致，停止並回滾。
5. 若正式環境未設定 `VISIT_STATS_HASH_SECRET`，停止啟用修正 API。
