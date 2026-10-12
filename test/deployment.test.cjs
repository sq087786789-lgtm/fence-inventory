const test=require('node:test'),assert=require('node:assert/strict'),jwt=require('jsonwebtoken');
process.env.JWT_SECRET='local-test-only-secret-with-over-32-characters';
delete process.env.DATABASE_URL;
const {app}=require('../src/index');
let server,base;
test.before(async()=>{server=app.listen(0,'127.0.0.1');await new Promise(r=>server.once('listening',r));base='http://127.0.0.1:'+server.address().port;});
test.after(()=>new Promise(r=>server.close(r)));
const request=(p,opts={})=>fetch(base+p,opts);
const token=role=>jwt.sign({id:1,role},process.env.JWT_SECRET);
test('all business APIs reject unauthenticated access before database access',async()=>{
  for(const p of ['products','inventory','orders','purchases','categories','import/excel','backup']) assert.equal((await request('/api/'+p)).status,401,p);
  assert.equal((await request('/api/auth/register',{method:'POST',headers:{'Content-Type':'application/json'},body:'{"username":"attacker","role":"admin"}'})).status,401);
});
test('invalid tokens reject business access and staff cannot register or backup',async()=>{
  assert.equal((await request('/api/products',{headers:{Authorization:'Bearer invalid'}})).status,401);
  for(const p of ['/api/backup','/api/auth/register']) assert.equal((await request(p,{method:p.includes('register')?'POST':'GET',headers:{Authorization:'Bearer '+token('staff')}})).status,403);
});
test('public database initialization, destructive cleanup and diagnostic endpoints disabled',async()=>{
  for(const p of ['/api/init-db','/api/admin/dedupe-categories','/api/admin/locks']) assert.equal((await request(p)).status,404);
});
test('health does not claim database readiness; login page available',async()=>{
  assert.equal((await request('/health')).status,200);
  assert.equal((await request('/ready')).status,503);
  assert.equal((await request('/api/products',{headers:{Authorization:'Bearer '+token('admin')}})).status,503);
  const page=await request('/admin');assert.equal(page.status,200);assert.match(await page.text(),/下載資料備份/);
  const root=await request('/',{redirect:'manual'});assert.equal(root.headers.get('location'),'/tools.html');
  assert.match(await (await request('/tools.html')).text(),/上慶工具入口/);
});
test('repeated deploy preserves existing administrator password',async()=>{
  const dbPath=require.resolve('../src/db/db');const calls=[];
  const original=require.cache[dbPath].exports;
  require.cache[dbPath].exports={connect:async()=>({query:async(sql)=>{calls.push(sql);return {rows:sql.includes("role='admin'")?[{id:1}]:[]};},release(){}})};
  delete require.cache[require.resolve('../src/db/seed')];
  try {await require('../src/db/seed')();assert.equal(calls.some(x=>x.includes('INSERT INTO users')),false);}
  finally {require.cache[dbPath].exports=original;delete require.cache[require.resolve('../src/db/seed')];}
});
