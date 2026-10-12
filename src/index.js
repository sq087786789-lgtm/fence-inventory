require('dotenv').config();
const express = require('express');
const path = require('node:path');
const auth = require('./middleware/auth');
const pool = require('./db/db');
const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '1mb' }));
app.use(express.static(path.join(__dirname, '../public')));
app.use('/api/auth', require('./routes/auth'));
for (const name of ['products','inventory','orders','purchases','categories','import']) app.use('/api/' + name, auth, require('./routes/' + name));
for (const name of ['/api/init-db','/api/admin/dedupe-categories','/api/admin/locks']) app.all(name,(req,res)=>res.status(404).json({error:'維護接口已停用'}));
app.get('/health', (req,res) => res.json({status:'ok'}));
app.get('/ready', async (req,res) => {
  if (!pool) return res.status(503).json({error:'資料庫尚未設定'});
  try { await pool.query('SELECT 1'); res.json({status:'ready'}); }
  catch { res.status(503).json({error:'資料庫尚未就緒，請稍後再試'}); }
});
app.get('/api/backup', auth, async (req,res) => {
  if (req.user.role !== 'admin') return res.status(403).json({error:'需要管理員權限'});
  if (!pool) return res.status(503).json({error:'資料庫尚未設定'});
  let client;
  try {
    client = await pool.connect();
    await client.query('BEGIN ISOLATION LEVEL REPEATABLE READ READ ONLY');
    const tables = {};
    for (const name of ['categories','products','inventory','orders','order_items','purchase_records']) tables[name] = (await client.query('SELECT * FROM ' + name + ' ORDER BY id')).rows;
    await client.query('COMMIT');
    res.set('Content-Disposition','attachment; filename="inventory-backup.json"');
    res.json({format:'hongsing-inventory-backup',version:1,exportedAt:new Date().toISOString(),tables});
  } catch (err) {
    if (client) await client.query('ROLLBACK').catch(()=>{});
    console.error('Backup failed:',err.message);
    res.status(500).json({error:'備份失敗，請稍後再試'});
  } finally { if (client) client.release(); }
});
app.get('/', (req,res) => res.redirect('/tools.html'));
app.get('/admin', (req,res) => res.sendFile(path.join(__dirname,'../public/admin.html')));
async function start() {
  if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) throw new Error('請設定至少 32 字元的 JWT_SECRET');
  if (!pool) throw new Error('請設定 DATABASE_URL');
  if (process.env.AUTO_INIT_DB === 'true') {
    await require('./db/init')();
    await require('./db/seed')();
  }
  await pool.query('SELECT 1');
  const server = app.listen(process.env.PORT || 3000,'0.0.0.0',()=>console.log('Inventory service ready'));
  process.on('SIGTERM',()=>server.close(()=>pool.end().finally(()=>process.exit(0))));
  return server;
}
if (require.main === module) start().catch(err=>{console.error('Startup failed:',err.message);process.exitCode=1; if(pool)pool.end();});
module.exports = {app,start};
