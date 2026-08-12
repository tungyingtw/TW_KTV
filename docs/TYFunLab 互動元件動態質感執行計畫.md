# TYFunLab 互動元件動態質感執行計畫

## 執行目標

1. 將 TYFunLab 的按鈕、chip、tab、icon button、搜尋框、彈窗與地圖操作控制補上克制的微互動。
2. 讓互動狀態看起來有設計感，但不得讓網站變成特效展示頁。
3. 保持 KTV 查詢工具的掃讀效率、點擊準確度與日夜模式清晰度。
4. 不新增大型 UI 套件，不導入 Framer Motion，不重寫元件架構。
5. 優先使用 CSS transition、transform、box-shadow、pseudo-element 與既有 CSS variables。

## 參考來源

1. 參考 shadcn/ui Button：採用清楚的 button variant、size、disabled、focus-visible、loading 狀態概念。
2. 參考 shadcn.io Animated Buttons：只吸收 shine、glow border、icon active glow、loading、success 類型，不搬整套元件。
3. 參考 Animate UI Button：採用 hover scale 與 tap scale 的微互動節奏。
4. 參考 Origin UI：採用控制元件的穩定狀態、tabs、switch、tooltip、input hover/focus 表現。
5. 參考 Uilib：採用 React/Tailwind 元件在表單、卡片與按鈕上的互動層級觀念。
6. 參考 Shadcnblocks Button：只吸收 button glow、text slide、async feedback 的表現方式。

## 動態總規則

1. 將互動時間控制在 120ms 至 220ms。
2. 將 hover 位移控制在 1px 至 2px。
3. 將 tap scale 控制在 `scale(0.98)` 至 `scale(0.99)`。
4. 將 hover scale 控制在 `scale(1.01)` 以下。
5. 將 glow 僅用於主要 CTA、active 狀態、地圖選取與成功回饋。
6. 將 shine 僅用於主要 CTA 與品牌重點按鈕。
7. 使用 `prefers-reduced-motion: reduce` 關閉非必要 transform、animation 與 shine。
8. 不讓 hover、active、focus 改變元件寬高。
9. 不讓動畫影響表格列高、chip 高度、modal 尺寸與行距。
10. 不使用 confetti、magnetic、liquid、粒子爆炸、長時間循環發光。

## 元件決策表

| 元件 | 採用效果 | 禁止效果 | 執行指令 |
|---|---|---|---|
| 主要 CTA：提供建議 | glow border、極淡 shine、tap scale | confetti、強烈霓虹、長循環掃光 | 補 `action-primary` 與 `.btn-primary` 互動狀態。 |
| 一般文字按鈕 | hover border tint、tap scale | shine、放大、跳動 | 補 `.btn-secondary`、`.nav-action-link`、`.action-text-link`。 |
| icon button | active glow、hover surface tint | 粒子、旋轉、彈跳 | 補 `.action-icon`、view switch icon、modal close。 |
| 搜尋框 | focus ring、border color、陰影收斂 | 打字時閃爍、背景動畫 | 補 `.search-input`、`.mobile-search-input`。 |
| filter chip | selected lift、hover tint、tap scale | 變高、換行抖動、過亮漸層 | 補 `.filter-chip`、`.quality-filter-chip`。 |
| toggle row | selected glow、icon/label 同步變色 | switch 彈跳、過大滑塊 | 補 `.quality-toggle-row`、`.bottom-sheet-toggle`。 |
| brand chip | selected border glow、hover tint | 使用狀態色覆蓋品牌色 | 補 `.brand-chip` 與 overflow arrow。 |
| table row | hover row tint、狀態 badge focus | 整列位移、放大、閃爍 | 補 `.data-table tr`、`.matrix-data-table tr`。 |
| status badge | hover clarity、focus ring | 動畫循環、顏色混用 | 補 `.status-label` 與 badge 類別。 |
| modal/drawer | overlay fade、content settle | 彈性過衝、大幅縮放 | 補 `.app-modal-content`、`.drawer-content`、`.song-detail-modal-content`。 |
| 地圖操作按鈕 | hover tint、active press、selected glow | 地圖整體閃光、路徑抖動 | 補 `.taiwan-demo-map-tools button`、`.taiwan-demo-ranking button`。 |
| theme toggle | sun/moon icon state transition | 翻轉、過度旋轉、延遲切換 | 補 `.nav-action-link` 內 icon 過渡即可。 |

## 分階段執行

### 第一階段：建立互動基礎 token

1. 在 `src/index.css` 新增互動 token。
2. 定義 `--motion-fast`、`--motion-normal`、`--motion-ease`、`--interactive-lift`、`--interactive-press`。
3. 定義日夜模式下的 `--interactive-ring`、`--interactive-glow`、`--interactive-surface-hover`。
4. 新增 `@media (prefers-reduced-motion: reduce)` 規則。
5. 不修改 JSX。
6. 執行 `npm.cmd run lint`。
7. 執行 `npm.cmd run build`。
8. 建立單獨 commit。

### 第二階段：主要按鈕與導覽互動

1. 修改 `.btn-primary`、`.btn-secondary`、`.action-primary`、`.nav-action-link`、`.action-icon`。
2. 讓主要 CTA 具備 glow border 與克制 shine。
3. 讓一般按鈕只使用 hover tint 與 tap scale。
4. 讓 icon button active 狀態有明確 glow。
5. 檢查桌機與手機 navbar 不得跳動。
6. 執行 `npm.cmd run lint`。
7. 執行 `npm.cmd run build`。
8. 建立單獨 commit。

### 第三階段：搜尋、篩選、chip 與 toggle

1. 修改 `.search-input`、`.mobile-search-input`、`.filter-chip`、`.quality-filter-chip`、`.quality-toggle-row`、`.bottom-sheet-toggle`。
2. 讓 focus ring 清楚但不刺眼。
3. 讓 selected chip 有穩定層級，不改變高度。
4. 讓 bottom sheet 控制在手機上維持 40px 以上可點擊高度。
5. 執行 `npm.cmd run lint`。
6. 執行 `npm.cmd run build`。
7. 建立單獨 commit。

### 第四階段：表格、badge、卡片結果

1. 修改 `.data-table`、`.matrix-data-table`、`.status-label`、`.badge`、`.song-card`。
2. 讓 row hover 只改變 tint，不位移、不放大。
3. 讓 `有收錄`、`MV`、`導唱` badge 維持語意色分離。
4. 讓收藏與預覽 icon button 有 hover/focus 明確回饋。
5. 執行 `npm.cmd run lint`。
6. 執行 `npm.cmd run build`。
7. 建立單獨 commit。

### 第五階段：modal、drawer、地圖操作

1. 修改 `.app-modal-content`、`.drawer-content`、`.bottom-sheet-content`、`.song-detail-modal-content`。
2. 修改 `.taiwan-demo-map-tools button`、`.taiwan-demo-ranking button`、`.taiwan-demo-map-action`、`.taiwan-demo-join-button`。
3. 讓 modal/drawer 使用短進場與清楚 focus。
4. 讓地圖操作按鈕在日光與夜間模式都能辨識。
5. 不修改地圖資料、不修改 API、不改互動流程。
6. 執行 `npm.cmd run lint`。
7. 執行 `npm.cmd run build`。
8. 建立單獨 commit。

### 第六階段：視覺 QA

1. 檢查 390px 手機日光。
2. 檢查 390px 手機夜間。
3. 檢查 1440px 桌機日光。
4. 檢查 1440px 桌機夜間。
5. 檢查首頁、搜尋結果、列表/小卡切換、提供建議、歌曲詳情、收藏抽屜、底部篩選、歌友熱度分布、小遊戲入口。
6. 確認 hover、focus、active 不造成 layout shift。
7. 確認 reduced motion 下沒有非必要動畫。
8. 執行 `npm.cmd run lint`。
9. 執行 `npm.cmd run build`。
10. 回報尚未完成項目與下一步。

## 禁止事項

1. 不新增 Framer Motion。
2. 不新增 shadcn runtime。
3. 不新增 Tailwind。
4. 不使用無限循環的閃爍動畫。
5. 不讓所有按鈕都有 shine。
6. 不讓表格列、chip、badge 因 hover 改變尺寸。
7. 不改搜尋演算法。
8. 不改歌曲資料。
9. 不改品牌資料。
10. 不改後端 API。
