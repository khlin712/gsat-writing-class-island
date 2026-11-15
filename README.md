# 萬能考場作文：理論與實作

給學生與家長的 3D 課程介紹島。可平移、旋轉、縮放地圖，探索教學理念、課堂方式、學生成果及顧慮，並整理諮詢提綱。

目標網址：https://khlin712.github.io/gsat-writing-class-island/

## 本機預覽與測試

`npm start`（Python 3），開啟 http://127.0.0.1:4173/ 。

`npm test`（Node.js），不需安裝套件。

## 版面與互動

- 天空之島（dist/sky.js）：島嶼懸浮在天空中，底下是岩石倒錐、漂浮小石與兩道小瀑布；四周有天色漸層、遠方雲海、島緣雲絮和慢慢飄移的雲環。夜間配色換成深藍夜空、偏藍的雲與星星。系統設定「減少動態」時雲和小石不移動。

版面骨架對標參考站的「地圖滿版＋索引」結構（只對標行為與層級，不使用對方的程式、美術、文字或品牌）：

- 桌面：3D 地圖佔滿左側；左上品牌浮卡、其下地圖工具（放大／縮小／旋轉／名牌／關聯／暫停／日夜），右上為全景、清單、討論清單、關於、操作說明。右側是課程索引：標題與統計、探索問答卡、家長／學生／認識老師入口、搜尋、「常見問題／主題島」切換，主題列可展開了解重點。
- 詳細卡片浮在地圖左側，索引保持可見並標示目前主題；鏡頭飛到島時避開上方工具、左側卡片與下方說明列（`motion.js` 的 `mapInsets`）。「清單」可收起索引讓地圖變寬。
- 手機：地圖全螢幕，問題清單是底部面板（預設半高，可上拉全高、下拉收成細條；「清單」按鈕同樣可切換）。詳細卡片從底部升起，把手可在約1/3與全高間切換，再下拉關閉；開卡時清單暫收，關卡後恢復。
- 全景視角以投影檢查九座島都落在未被遮住的範圍內，再決定鏡頭距離；直式手機加大視角以容納整座群島。
- 拖曳像地圖（dist/gestures.js）：手指或游標按住的那塊地面會一直跟著走，放手前快速一甩會依速度再滑行一段（最多約目前視距的 18%），停住再放手就不滑。右鍵或「旋轉」模式拖曳旋轉。
- 滾輪往游標所在處平滑縮放，單次滾動最多縮放 1.5 倍。
- 手機雙指：捏合以兩指中間為中心縮放、轉動旋轉、同向滑動平移；兩指並排一起上下滑動則傾斜視角。手指落在島名上也算數，從島名開始拖曳不會誤開卡片。拖曳或滾輪會取消飛行。系統設定「減少動態」時直接切換。
- 首次造訪顯示三步導覽（`writing-island-onboarded`），不動到收藏、筆記與問題（`writing-island-course`，格式不變）。
- 手動驗收可在主控台執行 `__islandView()` 讀取鏡頭目標、距離與角度（唯讀）。

文字層級沿用 `dist/readability.css`，版面骨架在最後載入的 `dist/shell.css`。對標紀錄見 [research/SHELL-LAYOUT.md](research/SHELL-LAYOUT.md)，前輪見 [research/SURFACES-REVIEW.md](research/SURFACES-REVIEW.md)、[research/GAP-ANALYSIS.md](research/GAP-ANALYSIS.md)。

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
