# 小遊戲入口整合計畫

## 目標

建立低干擾的小遊戲入口，讓使用者可從主站前往遊戲列表，再點選不同純網頁遊戲遊玩。小遊戲不得影響查歌、回報、後台審核、資料庫與 Render 免費額度治理。

## 正式檔案結構

必須使用以下結構：

1. 將遊戲大廳放在 `public/games/index.html`。
2. 將每款遊戲放在 `public/games/{game-slug}/index.html`。
3. 每款遊戲的素材必須放在自己的資料夾內，不得共用模糊命名的全域素材。
4. 開發草稿仍可放在 `網頁遊戲構想/`，但該資料夾必須維持 `.gitignore` 排除。
5. 要上線遊戲時，必須將完成版覆蓋到 `public/games/{game-slug}/`。

## 入口規則

1. 在桌面導覽列加入低干擾「小遊戲」入口。
2. 在手機導覽列加入同樣入口，但不得擠壓查歌、提供建議、收藏與檢視模式。
3. 入口必須連到 `./games/`，不得直接連到單一遊戲。
4. 遊戲頁必須提供返回主查歌頁的連結。

## 遊戲上線規則

1. 第一款正式範例使用 `網頁遊戲構想/neon_breakout.html` 複製到 `public/games/neon-breakout/index.html`。
2. 每新增一款遊戲，必須先建立專屬 slug，再把遊戲加入 `public/games/index.html` 清單。
3. 純前端遊戲不得呼叫後台管理 API。
4. 純前端遊戲不得寫入 `server/database.json`、Redis、回報、投票或審核紀錄。
5. 預設不得加入排行榜、登入、積分或永久統計。
6. 若未來需要排行榜，必須另開計畫並先評估 Render 與資料成長負擔。

## 遊戲列表維護規則

1. 已可遊玩的遊戲必須放在「已上線」區塊，並連到對應資料夾。
2. 尚未完成的想法不得預先列出具名遊戲；只能保留中性的「追加中」佔位。
3. 若遊戲更新，必須只覆蓋該遊戲資料夾內檔案，例如 `public/games/neon-breakout/index.html`。
4. 更新單一遊戲時，不得連帶修改其他遊戲資料夾。
5. 遊戲大廳文案必須保持簡短，以列表辨識與進入遊玩為主。

## 目前遊戲列表

已上線：

1. `neon-breakout`：霓虹星際反彈，路徑 `public/games/neon-breakout/index.html`。

追加中：

1. 保留中性「更多小遊戲追加中」佔位，不預告特定遊戲。

## 驗證規則

1. 執行 `npm run build`。
2. 確認 `dist/games/index.html` 存在。
3. 確認 `dist/games/neon-breakout/index.html` 存在。
4. 確認桌面與手機導覽列的小遊戲入口連到 `./games/`。
5. 確認工作區未把 `網頁遊戲構想/` 加入 Git。

## 目前執行範圍

1. 建立 `public/games/index.html`。
2. 建立 `public/games/neon-breakout/index.html`。
3. 將主站桌面與手機導覽列加入「小遊戲」入口。
4. 不調整遊戲本體邏輯。
5. 不新增後端 API。
