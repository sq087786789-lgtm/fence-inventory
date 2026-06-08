const express = require('express');
const router = express.Router();
const multer = require('multer');
const xlsx = require('xlsx');
const pool = require('../db/db');

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// POST /api/import/excel - Excel 匯入配件
router.post('/excel', upload.single('file'), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: '請上傳檔案' });
  const client = await pool.connect();
  try {
    const workbook = xlsx.read(req.file.buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);

    await client.query('BEGIN');
    let imported = 0;
    for (const row of data) {
      const sku = String(row.SKU || row.sku || '').trim();
      const name = String(row.名稱 || row.name || '').trim();
      const category = String(row.分類 || row.category || '').trim();
      const unit = String(row.單位 || row.unit || '個').trim();
      const price = parseFloat(row.單價 || row.price || 0);

      if (!sku || !name) continue;

      // 找分類ID
      let category_id = null;
      if (category) {
        const cat = await client.query(`SELECT id FROM categories WHERE name=$1`, [category]);
        if (cat.rows.length > 0) {
          category_id = cat.rows[0].id;
        } else {
          const newCat = await client.query(`INSERT INTO categories (name) VALUES ($1) RETURNING id`, [category]);
          category_id = newCat.rows[0].id;
        }
      }

      // 新增配件 + 庫存
      try {
        const r = await client.query(
          `INSERT INTO products (sku, name, category_id, unit, price) VALUES ($1,$2,$3,$4,$5) ON CONFLICT (sku) DO UPDATE SET name=EXCLUDED.name, category_id=EXCLUDED.category_id, unit=EXCLUDED.unit, price=EXCLUDED.price RETURNING id`,
          [sku, name, category_id, unit, price]
        );
        await client.query(`INSERT INTO inventory (product_id, quantity) VALUES ($1, 0) ON CONFLICT (product_id) DO NOTHING`, [r.rows[0].id]);
        imported++;
      } catch (e) { /* skip duplicates */ }
    }
    await client.query('COMMIT');
    res.json({ message: `已匯入 ${imported} 筆資料` });
  } catch (err) {
    await client.query('ROLLBACK');
    res.status(500).json({ error: err.message });
  } finally {
    client.release();
  }
});

module.exports = router;
