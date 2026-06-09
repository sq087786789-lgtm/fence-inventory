require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

process.on('unhandledRejection', (err) => {
  console.error('UNHANDLED REJECTION:', err);
});
process.on('uncaughtException', (err) => {
  console.error('UNCAUGHT EXCEPTION:', err);
});

console.log('=== Boot diagnostics ===');
console.log('NODE_ENV:', process.env.NODE_ENV);
console.log('PORT:', process.env.PORT);
console.log('PWD:', process.cwd());
console.log('process.pid:', process.pid);
console.log('DATABASE_URL set:', !!process.env.DATABASE_URL);
if (process.env.DATABASE_URL) {
  const masked = process.env.DATABASE_URL.replace(/:[^:@]+@/, ':***@');
  console.log('DATABASE_URL:', masked);
}
console.log('JWT_SECRET set:', !!process.env.JWT_SECRET);
console.log('========================');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');
const inventoryRoutes = require('./routes/inventory');
const orderRoutes = require('./routes/orders');
const purchaseRoutes = require('./routes/purchases');
const categoryRoutes = require('./routes/categories');
const importRoutes = require('./routes/import');
const initDb = require('./db/init');
const seedDb = require('./db/seed');

app.use('/api/auth', authRoutes);
app.use('/api/products', productRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/purchases', purchaseRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/import', importRoutes);

app.get('/api/init-db', async (req, res) => {
  try {
    await initDb();
    await seedDb();
    res.json({ message: 'Database initialized and seeded' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Health check for Railway
app.get('/health', (req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✓ 進銷存系統已啟動 http://0.0.0.0:${PORT}`);
  console.log(`  管理後台 http://0.0.0.0:${PORT}/admin`);
});
