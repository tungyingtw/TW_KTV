# 小遊戲正式掛載規則

`public/games/` 只放已公開或準備公開給使用者看的小遊戲入口與正式遊戲檔案。

## 資料夾分工

- `public/games/index.html`：小遊戲入口列表。
- `public/games/<game-slug>/`：單一正式遊戲頁與它需要載入的素材。
- `網頁遊戲構想/<game-slug>/`：本機開發、草稿、測試與規劃文件。

## 正式遊戲資料夾格式

每款正式遊戲使用獨立資料夾：

```text
public/games/<game-slug>/
  index.html
  src/
  assets/
  README.md 或 ATTRIBUTION.md
```

## 上線規則

1. 未完成遊戲只放在 `public/games/index.html` 的「追加中」區塊，不建立可點擊的遊玩連結。
2. 正式掛載時再建立 `public/games/<game-slug>/`，並把入口卡片改成可點擊連結。
3. 不把 `docs/` 與 `tests/` 放進正式 `public/games/<game-slug>/`，除非該文件是使用者或授權查閱必需。
4. 遊戲內返回遊戲列表使用 `../`，返回主查歌頁使用 `../../`。
5. 搬移遊戲前先確認相對路徑、素材授權、手機版限制與基本測試。

## 目前狀態

- `neon-breakout/`：已正式掛載。
- `mahjong/`：已正式掛載，遊戲名稱為「雀歌開局」。
