/**
 * One-off script: seed sample posts into the database via the API.
 * Usage: node scripts/seed-posts.js  (backend must be running on :3001)
 */
const BASE = 'http://localhost:3001/api';

const samples = [
  {
    title: '我的前端学习路线',
    summary: '从 HTML/CSS 到 React，记录我目前走过的学习路径和踩过的坑，给同样在路上的你一些参考。',
    tags: ['前端', '学习笔记'],
    content: `# 我的前端学习路线

学前端也有一段时间了，这里把我的学习路径整理出来，既是总结，也希望能帮到刚入门的朋友。

## 第一阶段：HTML + CSS

最基础也最重要的部分，重点掌握：

- 语义化标签的使用
- Flex 和 Grid 布局（现代布局的核心）
- 响应式设计的基本思路

## 第二阶段：JavaScript

这是前端的灵魂，花的时间最长：

\`\`\`js
// 闭包、原型链、事件循环是绕不开的三座大山
function greet(name) {
  return () => console.log('Hello, ' + name);
}
\`\`\`

- 先打牢语法基础（ES6+ 重点：箭头函数、解构、Promise）
- 再学 DOM 操作和事件机制
- 最后理解异步编程

## 第三阶段：React

有了 JS 基础后上手 React 就顺了很多，目前我在做的这个博客就是用 React 写的。

> 学习没有捷径，但好的路线可以少走弯路。
`,
  },
  {
    title: 'React Hooks 入门笔记',
    summary: 'useState、useEffect、useMemo 到底怎么用？用最小的例子讲清楚 Hooks 的核心思想。',
    tags: ['React', '学习笔记'],
    content: `# React Hooks 入门笔记

Hooks 是 React 16.8 引入的新特性，让你在不写 class 的情况下使用状态和其他 React 特性。

## useState：给组件加状态

\`\`\`jsx
const [count, setCount] = useState(0);
\`\`\`

一行代码就能让函数组件拥有自己的状态。

## useEffect：处理副作用

数据请求、订阅、手动修改 DOM，都属于副作用：

\`\`\`jsx
useEffect(() => {
  fetch('/api/posts').then(res => res.json()).then(setPosts);
}, []);
\`\`\`

依赖数组是 useEffect 最容易踩坑的地方：

| 写法 | 执行时机 |
| --- | --- |
| 不传 | 每次渲染后都执行 |
| \`[]\` | 只在挂载时执行一次 |
| \`[a, b]\` | a 或 b 变化时执行 |

## useMemo：缓存计算结果

\`\`\`jsx
const filtered = useMemo(
  () => posts.filter(p => p.tags.includes(tag)),
  [posts, tag]
);
\`\`\`

> 理解 Hooks 的关键：把组件看作一个函数，每次渲染都是重新执行这个函数。
`,
  },
  {
    title: '从零搭建个人博客：我的技术选型',
    summary: '为什么选 React + Node.js + MySQL？这篇记录我搭建这个博客时的每一个技术决策和理由。',
    tags: ['博客', '随笔'],
    content: `# 从零搭建个人博客：我的技术选型

你正在看的这个博客，就是我从零开始搭的。这里记录一下每个技术选型的理由。

## 为什么前后端分离

- **前端 React**：组件化开发，生态丰富，以后转 Next.js 也平滑
- **后端 Node.js + Express**：前后端都用 JavaScript，一个人维护没有语言切换成本
- **数据库 MySQL**：最主流的关系型数据库，部署生态成熟

## 为什么不用现成的 Hexo / WordPress

现成方案快是快，但：

1. 我想**真正理解**一个网站从数据库到页面的完整链路
2. 自己写的每一行代码都可以随意折腾
3. 这本身就是一个最好的练手项目

## 整体架构

\`\`\`
浏览器 ──▶ React 前端 ──HTTP──▶ Express API ──▶ MySQL
\`\`\`

登录用 JWT，写文章的后台也在这个项目里。

> 造轮子的过程，就是学习的过程。
`,
  },
];

async function main() {
  const login = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'wangyu', password: 'hhxxttxs' }),
  });
  if (!login.ok) throw new Error('Login failed — is the backend running?');
  const { token } = await login.json();

  for (const post of samples) {
    const res = await fetch(`${BASE}/posts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: JSON.stringify({ ...post, published: 1 }),
    });
    if (!res.ok) throw new Error(`Failed to create "${post.title}"`);
    console.log('Created:', post.title);
  }
  console.log('Done! Sample posts seeded.');
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
