import mysql from 'mysql2/promise';
import bcrypt from 'bcryptjs';

const config = {
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT || 3306),
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || 'root',
};
const DB_NAME = process.env.DB_NAME || 'person_note_blog';

export let pool = null;

/**
 * Create the database and tables automatically on first startup,
 * then seed a default admin account and a welcome post.
 */
export async function initDatabase() {
  // Connect without selecting a database so we can create it if missing
  const conn = await mysql.createConnection(config);
  await conn.query(
    `CREATE DATABASE IF NOT EXISTS \`${DB_NAME}\` DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
  );
  await conn.end();

  pool = mysql.createPool({
    ...config,
    database: DB_NAME,
    waitForConnections: true,
    connectionLimit: 10,
  });

  await pool.query(`
    CREATE TABLE IF NOT EXISTS users (
      id INT PRIMARY KEY AUTO_INCREMENT,
      username VARCHAR(50) UNIQUE NOT NULL,
      password VARCHAR(100) NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS posts (
      id INT PRIMARY KEY AUTO_INCREMENT,
      title VARCHAR(200) NOT NULL,
      summary VARCHAR(500) NOT NULL DEFAULT '',
      content TEXT NOT NULL,
      tags VARCHAR(255) NOT NULL DEFAULT '',
      published TINYINT(1) NOT NULL DEFAULT 1,
      difficulty INT NOT NULL DEFAULT 50,
      views INT NOT NULL DEFAULT 0,
      likes INT NOT NULL DEFAULT 0,
      cover VARCHAR(500) NOT NULL DEFAULT '',
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `);

  // Migration: add difficulty column to old tables
  const [[{ c: hasDifficulty }]] = await pool.query(
    `SELECT COUNT(*) AS c FROM information_schema.columns
     WHERE table_schema = ? AND table_name = 'posts' AND column_name = 'difficulty'`,
    [DB_NAME]
  );
  if (hasDifficulty === 0) {
    await pool.query('ALTER TABLE posts ADD COLUMN difficulty INT NOT NULL DEFAULT 50');
  }

  // Migration: add views / likes / cover columns to old tables
  const [postCols] = await pool.query(
    `SELECT column_name FROM information_schema.columns
     WHERE table_schema = ? AND table_name = 'posts'`,
    [DB_NAME]
  );
  const cols = new Set(postCols.map((r) => r.COLUMN_NAME || r.column_name));
  if (!cols.has('views')) {
    await pool.query('ALTER TABLE posts ADD COLUMN views INT NOT NULL DEFAULT 0');
  }
  if (!cols.has('likes')) {
    await pool.query('ALTER TABLE posts ADD COLUMN likes INT NOT NULL DEFAULT 0');
  }
  if (!cols.has('cover')) {
    await pool.query("ALTER TABLE posts ADD COLUMN cover VARCHAR(500) NOT NULL DEFAULT ''");
  }

  await pool.query(`
    CREATE TABLE IF NOT EXISTS comments (
      id INT PRIMARY KEY AUTO_INCREMENT,
      post_id INT NOT NULL,
      nickname VARCHAR(50) NOT NULL,
      content VARCHAR(1000) NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      INDEX idx_post_id (post_id)
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS site_settings (
      \`key\` VARCHAR(50) PRIMARY KEY,
      value TEXT NOT NULL
    )
  `);

  await pool.query(`
    CREATE TABLE IF NOT EXISTS messages (
      id INT PRIMARY KEY AUTO_INCREMENT,
      nickname VARCHAR(50) NOT NULL,
      content VARCHAR(500) NOT NULL,
      created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Default site texts (editable from the admin panel)
  const defaultSettings = {
    site_name: '我的博客',
    nickname: 'ぃ你若不离丶',
    slogan: '记录学习、技术与生活',
    motto: '输出是最好的输入',
    identity: '前端开发学习者 / 终身学习者',
    intro:
      '你好，欢迎来到我的个人博客！这里记录我的学习笔记、技术总结和生活随笔。相信输出是最好的输入，写下来才能真正想明白。',
    hero_title: '你好，欢迎来到我的博客 👋',
    hero_desc: '这里记录我的学习笔记、技术总结和生活随笔。写作是思考的延伸，希望这里能成为我成长路上的见证。',
    typing_words: '记录学习、技术与生活 ✦|探索前端与 JavaScript 的世界|输出是最好的输入|Stay hungry, stay foolish',
    gitee: 'https://gitee.com/wangyu-0312',
    email: '1224234724@qq.com',
    location: '江苏南京',
    job_title: '前端开发/全栈',
    job_status: '已离职寻找工作中',
  };
  // Insert only missing keys so admin edits are never overwritten on restart
  for (const [key, value] of Object.entries(defaultSettings)) {
    await pool.query(
      'INSERT INTO site_settings (`key`, value) SELECT ?, ? WHERE NOT EXISTS (SELECT 1 FROM site_settings WHERE `key` = ?)',
      [key, value, key]
    );
  }

  // Default admin account: wangyu / hhxxttxs (please change after deployment)
  const [[{ c: userCount }]] = await pool.query('SELECT COUNT(*) AS c FROM users');
  if (userCount === 0) {
    await pool.query('INSERT INTO users (username, password) VALUES (?, ?)', [
      'wangyu',
      bcrypt.hashSync('hhxxttxs', 10),
    ]);
  }

  // Welcome post for first-time visitors
  const [[{ c: postCount }]] = await pool.query('SELECT COUNT(*) AS c FROM posts');
  if (postCount === 0) {
    await pool.query(
      'INSERT INTO posts (title, summary, content, tags) VALUES (?, ?, ?, ?)',
      [
        '欢迎来到我的博客',
        '这是我的第一篇博客文章，记录一下这个博客的搭建过程和接下来的写作计划。',
        `# 欢迎来到我的博客

这个博客使用前后端分离架构搭建：

- **前端**：React + Vite + Tailwind CSS
- **后端**：Node.js + Express + MySQL
- **认证**：JWT 登录

## 关于这里

这里会记录我的学习笔记、技术总结和生活随笔。

\`\`\`js
console.log('Hello, World!');
\`\`\`

> 写作是思考的延伸，希望这里能成为我成长路上的见证。
`,
        '随笔,博客',
      ]
    );
  }
}
