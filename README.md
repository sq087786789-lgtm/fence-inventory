# 圍籬進銷存系統

## 功能

- 📦 **庫存管理** - 即時庫存查詢、低庫存警示
- 🔧 **配件管理** - 新增/刪除配件，支援 Excel 匯入
- 📋 **訂單管理** - 開立訂單、庫存自動扣減、歷史訂單查詢
- 🚚 **進貨管理** - 直接入庫、進貨記錄
- 🔐 **登入驗證** - JWT Token
- 📱 **REST API** - 供你的 App 串接

## 快速開始

### 1. 安裝依賴

```bash
cd fence-inventory
npm install
```

### 2. 設定環境變數

```bash
cp .env.example .env
# 編輯 .env，填入 DATABASE_URL
```

**Railway 設定示範：**
```
DATABASE_URL=postgres://postgres:密碼@資料庫主機:5432/fence_inventory
PORT=3000
JWT_SECRET=任意随机字符串
```

### 3. 初始化資料庫

```bash
npm run db:init
npm run db:seed   # 建立 admin 帳號
```

### 4. 啟動

```bash
npm start
# 開啟 http://localhost:3000/admin
```

**預設帳號：** `admin` / `admin123`

---

## API 文件

Base URL: `https://your-app.railway.app/api`

### 認證

```
POST /auth/login
Body: { "username": "admin", "password": "admin123" }
Response: { "token": "xxx", "user": {...} }
```

### 庫存

```
GET  /inventory          # 庫存列表
GET  /inventory/low-stock  # 低庫存警示
PUT  /inventory/:productId  # 更新庫存
```

### 配件

```
GET    /products         # 配件列表
POST   /products         # 新增配件
DELETE /products/:id     # 刪除配件
```

### 訂單

```
GET  /orders            # 訂單列表
GET  /orders/:id        # 訂單明細
POST /orders            # 新建訂單（自動扣庫存）
```

**新建訂單格式：**
```json
{
  "customer_name": "客戶名稱",
  "notes": "備註",
  "items": [
    { "product_id": 1, "quantity": 10, "price": 150 }
  ]
}
```

### 進貨

```
GET  /purchases         # 進貨記錄
POST /purchases         # 新增進貨（直接入庫）
```

**進貨格式：**
```json
{
  "product_id": 1,
  "quantity": 100,
  "price": 80,
  "supplier": "供應商名稱",
  "notes": "備註"
}
```

### Excel 匯入

```
POST /import/excel
Content-Type: multipart/form-data
Field: file (.xlsx)
```

Excel 欄位：`SKU`, `名稱`, `分類`, `單位`, `單價`

---

## 部署 Railway

1. GitHub Push 後，在 Railway 新增 Project → 連接 `fence-inventory` repo
2. 新增 PostgreSQL 資料庫
3. 在 Variables 設定 `DATABASE_URL`、`JWT_SECRET`、`PORT=3000`
4. 點 Deploy

---

## 你的 App 串接方式

在你的 Capacitor App 中，用 fetch 呼叫 API：

```javascript
// 查庫存
const res = await fetch('https://your-api.railway.app/api/inventory');
const data = await res.json();

// 下單
await fetch('https://your-api.railway.app/api/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + token },
  body: JSON.stringify({ customer_name: '客戶', items: [...] })
});
```
