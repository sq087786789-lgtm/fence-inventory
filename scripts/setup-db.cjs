require('dotenv').config();
const pool=require('../src/db/db');
(async()=>{
  if(!pool)throw new Error('請設定 DATABASE_URL');
  await require('../src/db/init')();
  await require('../src/db/seed')();
})().catch(err=>{console.error(err.message);process.exitCode=1;}).finally(()=>pool?.end());
