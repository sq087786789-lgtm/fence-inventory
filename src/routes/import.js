const express = require('express');
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');
const db = require('../db/db');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// POST /api/import/excel
router.post('/excel', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: '請上傳檔案' });
  try {
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);

    const insertCat = db.prepare(`INSERT OR IGNORE INTO categories (name) VALUES (?)`);
    const getCatId = db.prepare(`SELECT id FROM categories WHERE name=?`);
    const insertCatNew = db.prepare(`INSERT INTO categories (name) VALUES (?)`);
    const insertProduct = db.prepare(`INSERT INTO products (sku, name, category_id, unit, price) VALUES (?,?,?,?,?)`);
    const getProductId = db.prepare(`SELECT id FROM products WHERE sku=?`);
    const insertInventory = db.prepare(`INSERT OR IGNORE INTO inventory (product_id, quantity) VALUES (?, 0)`);

    let imported = 0;
    for (const row of data) {
      const sku = String(row.SKU || row.sku || '').trim();
      const name = String(row.名稱 || row.name || '').trim();
      const category = String(row.分類 || row.category || '').trim();
      const unit = String(row.單位 || row.unit || '個').trim();
      const price = parseFloat(row.單價 || row.price || 0);

      if (!sku || !name) continue;

      let category_id = null;
      if (category) {
        let cat = getCatId.get(category);
        if (!cat) { insertCatNew.run(category); cat = getCatId.get(category); }
        if (cat) category_id = cat.id;
      }

      const existing = getProductId.get(sku);
      if (existing) {
        // Update
        db.prepare(`UPDATE products SET name=?, category_id=?, unit=?, price=? WHERE sku=?`).run(name, category_id, unit, price, sku);
        imported++;
      } else {
        const result = insertProduct.run(sku, name, category_id, unit, price);
        insertInventory.run(result.lastInsertRowid);
        imported++;
      }
    }
    res.json({ message: `已匯入 ${imported} 筆資料` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
