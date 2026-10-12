function connectionString(env=process.env) {
  if (!env.DATABASE_URL) return undefined;
  const url = new URL(env.DATABASE_URL);
  if (!['postgres:', 'postgresql:'].includes(url.protocol)) throw new Error('DATABASE_URL 必須使用 PostgreSQL 連線網址');
  if (env.DATABASE_PASSWORD) url.password = encodeURIComponent(env.DATABASE_PASSWORD);
  if (!url.password || url.password.includes('YOUR-PASSWORD')) throw new Error('請設定 DATABASE_PASSWORD 為 Supabase 資料庫密碼');
  return url.toString();
}
module.exports = connectionString;
