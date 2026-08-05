import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { pool, initDatabase } from './db.js';

const app = express();
const PORT = process.env.PORT || 3001;
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';

app.use(cors());
app.use(express.json({ limit: '5mb' }));

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
  const { title, summary = '', content = '', tags = [], published = 1 } = req.body || {};
  if (!title?.trim()) return res.status(400).json({ error: '标题不能为空' });
  const tagStr = Array.isArray(tags) ? tags.join(',') : String(tags);
  const [result] = await pool.query(
    'INSERT INTO posts (title, summary, content, tags, published) VALUES (?, ?, ?, ?, ?)',
    [title.trim(), summary, content, tagStr, published ? 1 : 0]
  );
  const [rows] = await pool.query('SELECT * FROM posts WHERE id = ?', [result.insertId]);
  res.status(201).json(serializePost(rows[0]));
});

app.put('/api/posts/:id', authRequired, async (req, res) => {
  const [existing] = await pool.query('SELECT id FROM posts WHERE id = ?', [req.params.id]);
  if (existing.length === 0) return res.status(404).json({ error: '文章不存在' });
  const { title, summary = '', content = '', tags = [], published = 1 } = req.body || {};
  if (!title?.trim()) return res.status(400).json({ error: '标题不能为空' });
  const tagStr = Array.isArray(tags) ? tags.join(',') : String(tags);
  await pool.query(
    'UPDATE posts SET title = ?, summary = ?, content = ?, tags = ?, published = ? WHERE id = ?',
    [title.trim(), summary, content, tagStr, published ? 1 : 0, req.params.id]
  );
  const [rows] = await pool.query('SELECT * FROM posts WHERE id = ?', [req.params.id]);
  res.json(serializePost(rows[0]));
});

app.delete('/api/posts/:id', authRequired, async (req, res) => {
  const [result] = await pool.query('DELETE FROM posts WHERE id = ?', [req.params.id]);
  if (result.affectedRows === 0) return res.status(404).json({ error: '文章不存在' });
  res.json({ ok: true });
});

// ---------- Stats (admin dashboard) ----------

app.get('/api/stats', authRequired, async (_req, res) => {
  const [[t]] = await pool.query('SELECT COUNT(*) AS c FROM posts');
  const [[p]] = await pool.query('SELECT COUNT(*) AS c FROM posts WHERE published = 1');
  res.json({ total: t.c, published: p.c, draft: t.c - p.c });
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
