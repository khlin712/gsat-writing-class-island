# 萬能考場作文：理論與實作

給學生與家長的 3D 課程介紹島。可平移、旋轉、縮放地圖，探索教學理念、課堂方式、學生成果及顧慮，並整理諮詢提綱。

目標網址：https://khlin712.github.io/gsat-writing-class-island/

## 本機預覽與測試

`npm start`（Python 3），開啟 http://127.0.0.1:4173/ 。

`npm test`（Node.js），不需安裝套件。

## 地圖互動與首次導覽

- 點島或點右側問題時，鏡頭以約 0.8 秒頭尾放緩的飛行移到該島，並避開詳細卡片遮住的範圍；拖曳或滾輪會立即交還鏡頭控制。系統設定「減少動態」時直接切換、不飛行。
- 左鍵／單指拖曳平移，右鍵或「旋轉」模式拖曳旋轉，滾輪／雙指縮放；「⌂ 全景」飛回起點。
- 首次造訪顯示三步導覽，看過後以 `writing-island-onboarded` 記錄，不動到收藏、筆記與問題（`writing-island-course`）。
- 手動驗收可在主控台執行 `__islandView()` 讀取鏡頭目標、距離與角度（唯讀）。

## 整體介面與閱讀

首頁、角色入口、問題清單、搜尋分類、地圖標籤、導覽、詳細卡片、諮詢表單及提綱共用 `dist/readability.css` 的文字層級。主要內文與輸入框16px，主要操作15–16px、島名14px、輔助說明13px；手機保留清單優先，卡片可展開閱讀。頁首「操作說明」可重看三步導覽。

整體對標、採用判斷與實測限制見 [research/SURFACES-REVIEW.md](research/SURFACES-REVIEW.md)，前輪鏡頭與標籤證據見 [research/GAP-ANALYSIS.md](research/GAP-ANALYSIS.md)。

## GitHub Pages

儲存庫 Settings → Pages → Source 選 Deploy from a branch，使用 gh-pages 分支與 /(root)。main 保存完整原始碼，gh-pages 保存 dist/ 的網站內容。所有網站資源使用相對路徑，可在 /gsat-writing-class-island/ 下運作。

修改後先執行 npm test，再提交 main 並推送；發布網站使用：

```sh
git push origin main
git subtree push --prefix dist origin gh-pages
```

目前帳號的自訂 GitHub Actions 工作因付款／額度狀態無法啟動，因此使用 Pages 原生分支發布，未變更帳務設定。

## 內容與授權

教師經歷、價格、理念原文、課程服務及真實案例按使用者指示留白，現階段為介紹架構草稿。訪客的筆記與問題僅存於瀏覽器，不會代發訊息。

Three.js 0.180.0 與附屬模組隨站提供；第三方 MIT 授權位於 dist/vendor/LICENSE。此儲存庫不含研究用參考站原始碼、Sites 識別設定或訪客資料。
