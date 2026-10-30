# 上慶工具入口與進銷存交接

## 2026-10-30：工作室入口改連目前維護版本

- 使用者從上慶工具入口開啟工作室時仍是舊版。已讀取正式 `https://hongsing-inventory.onrender.com/tools.html`，確認「圍籬配置工作室」連到舊 `hongsing-fence-planner/`，不是瀏覽器快取的推測。
- 使用者接著明確選擇「一個GitHub總入口集中管理連結，各工具保留自己的專案」。總入口為 `https://sq087786789-lgtm.github.io/shangching-fence-survey/tools.html`，唯一清單來源是該儲存庫 `tools.json`。本專案 `public/tools.html` 改成自動轉址與可點擊備援連結，不再維護另一份工具清單；`/admin`保留原登入。已先正常快轉到遠端 `ef3acfb`，原入口的勘查、庫存、裝車、尺寸與名片工具全部收入新清單，工作室改連目前維護版本，舊版收合標示。
- 工作室原始碼與細部交接在 `E:\GPT\shangching-fence-survey\HANDOFF.md`；不要修改或重新發布舊 `hongsing-fence-planner` 來替代新版。入口連結的修改與工作室本體的發布是兩個儲存庫／部署。
- 只調整公開導航，進銷存帳密、資料庫及各工具案件不改；不同來源的本機案件仍需使用者自行匯出／匯入，沒有自動搬移。
- 檢查：原有6項部署／API保護測試通過（第一次受本機連線限制，允許本機連線後全部通過）。部署：先發布GitHub總入口、核對可讀，再推送本儲存庫main觸發既有Render自動部署；待核對正式入口轉址，不宣稱未驗證的狀態。
- GitHub總入口已上線：來源提交 `be4118ca7c89e00266bd9bbce53c5466d8b69461`、Pages執行 `41019028571` completed/success，tools.html／tools.js／tools.json正式檔案HTTP200且SHA-256與已測試來源一致。Chrome桌機與實際390 CSS px本機預覽通過，卡片可開啟新版studio。
- **轉址已上線：** 本專案提交 `965a4c859dd1633951c63ccd896f4de35ec2702a` 已自動部署，正式tools.html HTTP200且SHA-256與本機轉址來源一致，/ready HTTP200。Chrome重新整理使用者原工具入口分頁後，已實際自動前往GitHub總入口，7張常用卡片完整載入；進銷存仍連 /admin。正式總入口分頁留給使用者。
- 後續不要在本專案增加工具卡片；只到shangching-fence-survey/tools.json更新唯一清單。每次完成任務須在相應專案寫交接事項，避免下一個AI再改錯入口。
