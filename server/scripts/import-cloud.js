// 一次性脚本：把 mysqldump 导出的 SQL 文件导入云托管 MySQL
// 用法（在 server 目录下）：
//   CLOUD_HOST=xxx CLOUD_PORT=3306 CLOUD_USER=root CLOUD_PASSWORD=xxx node scripts/import-cloud.js ../blog.sql
import mysql from 'mysql2/promise';
import fs from 'fs';

const sqlFile = process.argv[2];
if (!sqlFile) {
  console.error('用法: node scripts/import-cloud.js <sql文件路径>');
  process.exit(1);
}
const host = process.env.CLOUD_HOST;
const password = process.env.CLOUD_PASSWORD;
if (!host || !password) {
  console.error('请先设置环境变量 CLOUD_HOST / CLOUD_PORT / CLOUD_USER / CLOUD_PASSWORD');
  process.exit(1);
}

const sql = fs.readFileSync(sqlFile, 'utf8');
console.log(`读取 ${sqlFile} 完成（${(sql.length / 1024).toFixed(1)} KB），开始导入...`);

const conn = await mysql.createConnection({
  host,
  port: Number(process.env.CLOUD_PORT || 3306),
  user: process.env.CLOUD_USER || 'root',
  password,
  multipleStatements: true,
});
try {
  await conn.query(`CREATE DATABASE IF NOT EXISTS \`${process.env.CLOUD_DB || 'person_note_blog'}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`);
  await conn.changeUser({ database: process.env.CLOUD_DB || 'person_note_blog' });
  await conn.query(sql);
  const [rows] = await conn.query('SELECT COUNT(*) AS c FROM posts');
  console.log(`✅ 导入成功！posts 表现有 ${rows[0].c} 篇文章`);
} catch (err) {
  console.error('❌ 导入失败:', err.message);
  process.exit(1);
} finally {
  await conn.end();
}
