/**
 * One-off script: assign difficulty levels & realistic dates to existing posts.
 * Difficulty: 入门(1-20) 进阶(21-55) 高级(56-80) 深入(81-100)
 * Usage: node scripts/update-posts-meta.js  (backend must be running on :3001)
 */
const BASE = 'http://localhost:3001/api';

// [title keyword, difficulty, created_at] —— 按难度从浅到深排列
const meta = [
  ['欢迎来到我的博客', 5, '2026-07-01 10:00:00'],
  ['我的前端学习路线', 10, '2026-07-03 09:30:00'],
  ['React Hooks 入门笔记', 18, '2026-07-06 20:00:00'],
  ['从零搭建个人博客', 25, '2026-07-09 21:00:00'],
  ['HTTP 缓存详解', 35, '2026-07-12 10:30:00'],
  ['彻底搞懂 CSS 的 BFC', 40, '2026-07-15 14:00:00'],
  ['深入理解 JavaScript 事件循环', 48, '2026-07-18 09:00:00'],
  ['前端构建工具进化史', 55, '2026-07-21 16:00:00'],
  ['React 渲染机制与性能优化', 62, '2026-07-24 10:00:00'],
  ['前端常用的设计模式', 72, '2026-07-27 20:30:00'],
  ['TypeScript 类型体操', 80, '2026-07-29 09:00:00'],
  ['MVVM 原理剖析', 86, '2026-07-31 15:00:00'],
  ['Webpack 深入', 92, '2026-08-02 11:00:00'],
  ['React SSR 深入', 95, '2026-08-04 22:00:00'],
];

async function main() {
  const login = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'wangyu', password: 'hhxxttxs' }),
  });
  if (!login.ok) throw new Error('Login failed — is the backend running?');
  const { token } = await login.json();

  const posts = await fetch(`${BASE}/posts`, {
    headers: { Authorization: `Bearer ${token}` },
  }).then((r) => r.json());

  for (const [keyword, difficulty, createdAt] of meta) {
    const post = posts.find((p) => p.title.includes(keyword));
    if (!post) {
      console.warn('Not found:', keyword);
      continue;
    }
    const res = await fetch(`${BASE}/posts/${post.id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        title: post.title,
        summary: post.summary,
        content: post.content,
        tags: post.tags,
        published: post.published,
        difficulty,
        created_at: createdAt,
      }),
    });
    if (!res.ok) throw new Error(`Failed to update "${post.title}": ${res.status}`);
    console.log(`Lv.${String(difficulty).padStart(2, ' ')} ${createdAt.slice(0, 10)}  ${post.title}`);
  }
  console.log('Done! Posts reordered by difficulty.');
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
