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
  };
  const [[{ c: settingCount }]] = await pool.query('SELECT COUNT(*) AS c FROM site_settings');
  if (settingCount === 0) {
    for (const [key, value] of Object.entries(defaultSettings)) {
      await pool.query('INSERT INTO site_settings (`key`, value) VALUES (?, ?)', [key, value]);
    }
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
