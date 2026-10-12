# 免費進銷存部署

Render Free Web Service 執行 Node.js／Express，Supabase Free 保存 PostgreSQL 資料。新系統從空白開始，舊 Railway 不刪除。

1. Supabase 建立 Free 專案，停用 Data API，選亞太地區。資料庫密碼由管理者設定。
2. 複製 Connect 中 Session pooler 的 PostgreSQL 連線字串（通常 5432，支援 IPv4）。填入資料庫密碼後，僅保存於 Render 的 DATABASE_URL，不提交 GitHub。
3. Render 連接本儲存庫 main，使用 render.yaml，選 Free，設定 ADMIN_PASSWORD（12–128 字元，管理者自行輸入）。JWT_SECRET 自動產生；資料表建立在 inventory_app schema。
4. 啟動會建立尚不存在的資料表與首位 admin，不重設既有密碼、不清空訂單或庫存。
5. 等待 /ready 通過，開啟 Render 提供的 HTTPS 網址 /admin，以 admin 及自行設定的密碼登入。
6. main 更新會自動部署。正式網址確認後才更新 GitHub Website 與工具入口。

管理員可下載業務資料 JSON 備份；不含密碼或登入權杖。備份含交易資料，請保存於私人位置。舊資料之後另行匯入，新舊資料不要直接混合。

免費限制：Render 閒置 15 分鐘會休眠，開啟時須等待；Supabase Free 低活動約 7 日可能暫停，須到控制台恢復。額度與政策以平台公告為準，不建立假流量保活，不啟用付費方案。Render Free PostgreSQL 30 日會到期，本部署不使用它。
