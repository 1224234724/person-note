import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool, initDatabase } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

app.use(cors());
app.use(express.json({ limit: '5mb' }));
// 上传的图片通过 /uploads/xxx 访问
app.use('/uploads', express.static(UPLOAD_DIR));

// 图片上传：限制 5MB、仅图片类型，文件名加时间戳防冲突
const upload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, UPLOAD_DIR),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).slice(0, 10) || '.png';
      cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (/^image\/(png|jpe?g|gif|webp|svg\+xml)$/.test(file.mimetype)) cb(null, true);
    else cb(new Error('只支持图片文件'));
  },
});

// ---------- Auth middleware ----------

function getToken(req) {
  const header = req.headers.authorization || '';
  return header.startsWith('Bearer ') ? header.slice(7) : null;
}

function authRequired(req, res, next) {
  const token = getToken(req);
  if (!token) return res.status(401).json({ error: '未登录' });
  try {
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: '登录已过期，请重新登录' });
  }
}

function authOptional(req, _res, next) {
  const token = getToken(req);
  if (token) {
    try {
      req.user = jwt.verify(token, JWT_SECRET);
    } catch {
      req.user = null;
    }
  }
  next();
}

function serializePost(post) {
  return { ...post, tags: post.tags ? post.tags.split(',') : [] };
}

// ---------- Auth routes ----------

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body || {};
  if (!username || !password) {
    return res.status(400).json({ error: '请输入用户名和密码' });
  }
  const [rows] = await pool.query('SELECT * FROM users WHERE username = ?', [username]);
  const user = rows[0];
  if (!user || !bcrypt.compareSync(password, user.password)) {
    return res.status(401).json({ error: '用户名或密码错误' });
  }
  const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, {
    expiresIn: '7d',
  });
  res.json({ token, username: user.username });
});

app.get('/api/auth/me', authRequired, (req, res) => {
  res.json({ username: req.user.username });
});

app.put('/api/auth/password', authRequired, async (req, res) => {
  const { oldPassword, newPassword } = req.body || {};
  if (!oldPassword || !newPassword || newPassword.length < 6) {
    return res.status(400).json({ error: '新密码至少 6 位' });
  }
  const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
  const user = rows[0];
  if (!bcrypt.compareSync(oldPassword, user.password)) {
    return res.status(401).json({ error: '原密码错误' });
  }
  await pool.query('UPDATE users SET password = ? WHERE id = ?', [
    bcrypt.hashSync(newPassword, 10),
    user.id,
  ]);
  res.json({ ok: true });
});

// ---------- Post routes ----------

// Public: published posts only; with a valid token, returns everything
app.get('/api/posts', authOptional, async (req, res) => {
  const sql = req.user
    ? 'SELECT * FROM posts ORDER BY created_at DESC'
    : 'SELECT * FROM posts WHERE published = 1 ORDER BY created_at DESC';
  const [rows] = await pool.query(sql);
  res.json(rows.map(serializePost));
});

app.get('/api/posts/:id', authOptional, async (req, res) => {
  const [rows] = await pool.query('SELECT * FROM posts WHERE id = ?', [req.params.id]);
  const post = rows[0];
  if (!post || (!post.published && !req.user)) {
    return res.status(404).json({ error: '文章不存在' });
  }
  res.json(serializePost(post));
});

app.post('/api/posts', authRequired, async (req, res) => {
  const {
    title,
    summary = '',
    content = '',
    tags = [],
    published = 1,
    difficulty = 50,
    cover = '',
  } = req.body || {};
  if (!title?.trim()) return res.status(400).json({ error: '标题不能为空' });
  const tagStr = Array.isArray(tags) ? tags.join(',') : String(tags);
  const [result] = await pool.query(
    'INSERT INTO posts (title, summary, content, tags, published, difficulty, cover) VALUES (?, ?, ?, ?, ?, ?, ?)',
    [title.trim(), summary, content, tagStr, published ? 1 : 0, Number(difficulty) || 50, cover]
  );
  const [rows] = await pool.query('SELECT * FROM posts WHERE id = ?', [result.insertId]);
  res.status(201).json(serializePost(rows[0]));
});

app.put('/api/posts/:id', authRequired, async (req, res) => {
  const [existing] = await pool.query('SELECT id FROM posts WHERE id = ?', [req.params.id]);
  if (existing.length === 0) return res.status(404).json({ error: '文章不存在' });
  const { title, summary = '', content = '', tags = [], published = 1, difficulty, created_at, cover } =
    req.body || {};
  if (!title?.trim()) return res.status(400).json({ error: '标题不能为空' });
  const tagStr = Array.isArray(tags) ? tags.join(',') : String(tags);

  const sets = ['title = ?', 'summary = ?', 'content = ?', 'tags = ?', 'published = ?'];
  const params = [title.trim(), summary, content, tagStr, published ? 1 : 0];
  if (typeof difficulty === 'number') {
    sets.push('difficulty = ?');
    params.push(difficulty);
  }
  if (typeof cover === 'string') {
    sets.push('cover = ?');
    params.push(cover);
  }
  if (created_at) {
    sets.push('created_at = ?');
    params.push(created_at);
  }
  params.push(req.params.id);
  await pool.query(`UPDATE posts SET ${sets.join(', ')} WHERE id = ?`, params);

  const [rows] = await pool.query('SELECT * FROM posts WHERE id = ?', [req.params.id]);
  res.json(serializePost(rows[0]));
});

app.delete('/api/posts/:id', authRequired, async (req, res) => {
  const [result] = await pool.query('DELETE FROM posts WHERE id = ?', [req.params.id]);
  if (result.affectedRows === 0) return res.status(404).json({ error: '文章不存在' });
  res.json({ ok: true });
});

// ---------- Comment routes ----------

app.get('/api/posts/:id/comments', async (req, res) => {
  const [rows] = await pool.query(
    'SELECT * FROM comments WHERE post_id = ? ORDER BY created_at DESC',
    [req.params.id]
  );
  res.json(rows);
});

app.post('/api/posts/:id/comments', async (req, res) => {
  const { nickname, content } = req.body || {};
  if (!nickname?.trim() || !content?.trim()) {
    return res.status(400).json({ error: '昵称和评论内容不能为空' });
  }
  if (nickname.trim().length > 50) {
    return res.status(400).json({ error: '昵称最长 50 个字符' });
  }
  if (content.trim().length > 1000) {
    return res.status(400).json({ error: '评论最长 1000 个字符' });
  }
  const [[post]] = await pool.query(
    'SELECT id, published FROM posts WHERE id = ?',
    [req.params.id]
  );
  if (!post || !post.published) {
    return res.status(404).json({ error: '文章不存在' });
  }
  const [result] = await pool.query(
    'INSERT INTO comments (post_id, nickname, content) VALUES (?, ?, ?)',
    [post.id, nickname.trim(), content.trim()]
  );
  const [[comment]] = await pool.query('SELECT * FROM comments WHERE id = ?', [
    result.insertId,
  ]);
  res.status(201).json(comment);
});

// Admin: list all comments / delete any comment
app.get('/api/comments', authRequired, async (_req, res) => {
  const [rows] = await pool.query(
    `SELECT c.*, p.title AS post_title FROM comments c
     LEFT JOIN posts p ON p.id = c.post_id
     ORDER BY c.created_at DESC`
  );
  res.json(rows);
});

app.delete('/api/comments/:id', authRequired, async (req, res) => {
  const [result] = await pool.query('DELETE FROM comments WHERE id = ?', [req.params.id]);
  if (result.affectedRows === 0) return res.status(404).json({ error: '评论不存在' });
  res.json({ ok: true });
});

// ---------- Stats (admin dashboard) ----------

app.get('/api/stats', authRequired, async (_req, res) => {
  const [[t]] = await pool.query('SELECT COUNT(*) AS c FROM posts');
  const [[p]] = await pool.query('SELECT COUNT(*) AS c FROM posts WHERE published = 1');
  res.json({ total: t.c, published: p.c, draft: t.c - p.c });
});

// ---------- Site settings (dynamic texts) ----------

app.get('/api/site', async (_req, res) => {
  const [rows] = await pool.query('SELECT `key`, value FROM site_settings');
  res.json(Object.fromEntries(rows.map((r) => [r.key, r.value])));
});

app.put('/api/site', authRequired, async (req, res) => {
  const body = req.body || {};
  const entries = Object.entries(body).filter(
    ([k, v]) => typeof k === 'string' && typeof v === 'string'
  );
  if (entries.length === 0) return res.status(400).json({ error: '没有可保存的设置' });
  for (const [key, value] of entries) {
    await pool.query(
      'INSERT INTO site_settings (`key`, value) VALUES (?, ?) ON DUPLICATE KEY UPDATE value = VALUES(value)',
      [key.slice(0, 50), value]
    );
  }
  const [rows] = await pool.query('SELECT `key`, value FROM site_settings');
  res.json(Object.fromEntries(rows.map((r) => [r.key, r.value])));
});

// ---------- Views / Likes ----------

// 浏览量：每次打开文章页 +1
app.post('/api/posts/:id/view', async (req, res) => {
  const [result] = await pool.query(
    'UPDATE posts SET views = views + 1 WHERE id = ? AND published = 1',
    [req.params.id]
  );
  if (result.affectedRows === 0) return res.status(404).json({ error: '文章不存在' });
  const [[{ views }]] = await pool.query('SELECT views FROM posts WHERE id = ?', [req.params.id]);
  res.json({ views });
});

// 点赞 +1
app.post('/api/posts/:id/like', async (req, res) => {
  const [result] = await pool.query(
    'UPDATE posts SET likes = likes + 1 WHERE id = ? AND published = 1',
    [req.params.id]
  );
  if (result.affectedRows === 0) return res.status(404).json({ error: '文章不存在' });
  const [[{ likes }]] = await pool.query('SELECT likes FROM posts WHERE id = ?', [req.params.id]);
  res.json({ likes });
});

// ---------- Messages (guestbook) ----------

app.get('/api/messages', async (_req, res) => {
  const [rows] = await pool.query('SELECT * FROM messages ORDER BY created_at DESC LIMIT 200');
  res.json(rows);
});

app.post('/api/messages', async (req, res) => {
  const { nickname, content } = req.body || {};
  if (!nickname?.trim() || !content?.trim()) {
    return res.status(400).json({ error: '昵称和留言内容不能为空' });
  }
  if (nickname.trim().length > 50) return res.status(400).json({ error: '昵称最长 50 个字符' });
  if (content.trim().length > 500) return res.status(400).json({ error: '留言最长 500 个字符' });
  const [result] = await pool.query('INSERT INTO messages (nickname, content) VALUES (?, ?)', [
    nickname.trim(),
    content.trim(),
  ]);
  const [rows] = await pool.query('SELECT * FROM messages WHERE id = ?', [result.insertId]);
  res.status(201).json(rows[0]);
});

app.delete('/api/messages/:id', authRequired, async (req, res) => {
  await pool.query('DELETE FROM messages WHERE id = ?', [req.params.id]);
  res.json({ ok: true });
});

// ---------- Image upload ----------

app.post('/api/upload', authRequired, (req, res) => {
  upload.single('file')(req, res, (err) => {
    if (err) return res.status(400).json({ error: err.message });
    if (!req.file) return res.status(400).json({ error: '请选择图片' });
    res.status(201).json({ url: `/uploads/${req.file.filename}` });
  });
});

// ---------- Start ----------

initDatabase()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Blog API running at http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error('Failed to connect to MySQL:', err.message);
    console.error('Please make sure MySQL is running on port 3306 (see server/.env)');
    process.exit(1);
  });
