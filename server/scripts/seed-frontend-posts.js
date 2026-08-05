/**
 * One-off script: seed in-depth frontend tech posts via the API.
 * Usage: node scripts/seed-frontend-posts.js  (backend must be running on :3001)
 */
const BASE = 'http://localhost:3001/api';

const samples = [
  {
    title: '深入理解 JavaScript 事件循环：从调用栈到微任务',
    summary:
      '为什么 setTimeout(fn, 0) 不会立即执行？为什么 Promise.then 比 setTimeout 先执行？这篇文章从调用栈讲到微任务队列，彻底搞懂事件循环。',
    tags: ['JavaScript', '前端进阶'],
    content: `# 深入理解 JavaScript 事件循环

JavaScript 是单线程语言，但浏览器和 Node.js 让它看起来能"同时"做多件事。背后的核心机制就是**事件循环（Event Loop）**。

## 一、调用栈：同步代码的执行场所

JS 引擎用一个**调用栈（Call Stack）**执行代码：函数被调用时压栈，返回时出栈。

\`\`\`js
function first() {
  console.log('first');
  second();
}
function second() {
  console.log('second');
}
first();
// 栈的变化：first 入栈 → second 入栈 → second 出栈 → first 出栈
\`\`\`

单线程意味着：栈里有一个耗时操作，后面所有代码都得等。这就是异步存在的原因。

## 二、Web APIs：异步任务的"候场区"

\`setTimeout\`、\`fetch\`、DOM 事件这些并不由 JS 引擎执行，而是交给浏览器提供的 **Web APIs**。它们完成后，把回调函数放进**任务队列**。

\`\`\`js
console.log(1);
setTimeout(() => console.log(2), 0);
console.log(3);
// 输出：1 3 2
\`\`\`

即使延迟写 0，回调也必须等主线程（调用栈）清空后才有机会执行。

## 三、宏任务与微任务：两种队列

这是面试最常考、也最容易混淆的部分：

| 类型 | 来源 | 例子 |
| --- | --- | --- |
| 宏任务 (Macrotask) | 宿主环境 | setTimeout、setInterval、I/O、UI 渲染 |
| 微任务 (Microtask) | JS 引擎 | Promise.then、queueMicrotask、MutationObserver |

**关键规则：每执行完一个宏任务，会先把微任务队列全部清空，再执行下一个宏任务。**

\`\`\`js
console.log('start');

setTimeout(() => console.log('timeout'), 0);   // 宏任务
Promise.resolve().then(() => console.log('promise')); // 微任务

console.log('end');
// 输出：start → end → promise → timeout
\`\`\`

## 四、async/await 的本质

\`await\` 之后的代码相当于放进了一个微任务：

\`\`\`js
async function foo() {
  console.log('A');
  await null;
  console.log('B'); // 这一行进入微任务队列
}
foo();
console.log('C');
// 输出：A → C → B
\`\`\`

## 五、经典综合题

\`\`\`js
console.log(1);
setTimeout(() => console.log(2));
Promise.resolve().then(() => console.log(3)).then(() => console.log(4));
console.log(5);
// 输出：1 5 3 4 2
\`\`\`

分析顺序：先同步（1、5）→ 清空微任务（3，然后链式的 4）→ 下一个宏任务（2）。

> 记住一句话：**同步先执行，微任务插队，宏任务排队**。掌握这个模型，90% 的执行顺序题都能推出来。
`,
  },
  {
    title: '彻底搞懂 CSS 的 BFC：触发条件与三大应用',
    summary:
      'BFC 是 CSS 布局面试的高频考点。这篇文章讲清楚 BFC 是什么、怎么触发，以及它解决外边距合并、浮动高度塌陷、文字环绕三大问题的原理。',
    tags: ['CSS', '前端进阶'],
    content: `# 彻底搞懂 CSS 的 BFC

**BFC（Block Formatting Context，块级格式化上下文）**是 CSS 中一块独立的渲染区域，内部元素的布局不会影响外部。理解它，很多"诡异"的布局问题就有了答案。

## 一、BFC 的布局规则

一个 BFC 内部遵循这些规则：

1. 内部的盒子在垂直方向依次排列
2. **同一个 BFC 内相邻盒子的垂直 margin 会合并**
3. BFC 的区域不会与浮动元素重叠
4. 计算 BFC 高度时，浮动子元素也参与计算

## 二、如何触发 BFC

| 方式 | 说明 |
| --- | --- |
| \`overflow: hidden / auto\` | 最常用的土办法 |
| \`display: flow-root\` | 专为创建 BFC 而生，无副作用 |
| \`display: flex / grid\` | 其子元素各自形成 BFC |
| \`display: inline-block\` | 行内块也会触发 |
| \`position: absolute / fixed\` | 脱离文档流的同时触发 |

## 三、应用一：解决 margin 合并

\`\`\`html
<div style="margin-bottom: 30px;">上</div>
<div style="margin-top: 20px;">下</div>
<!-- 实际间距是 30px（取较大值），不是 50px -->
\`\`\`

把其中一个元素包进新的 BFC，合并就被阻止了：

\`\`\`html
<div style="overflow: hidden;">
  <div style="margin-top: 20px;">下</div>
</div>
\`\`\`

## 四、应用二：清除浮动（高度塌陷）

父元素只包含浮动子元素时高度为 0。给父元素触发 BFC 即可：

\`\`\`css
.parent {
  display: flow-root; /* 子元素浮动也会计入高度 */
}
\`\`\`

## 五、应用三：两栏布局（自适应宽度）

浮动元素会与普通块重叠，但**不会与 BFC 重叠**：

\`\`\`html
<div style="float: left; width: 200px;">侧边栏</div>
<div style="overflow: hidden;">主内容自动占满剩余宽度</div>
\`\`\`

右侧触发 BFC 后拒绝与浮动重叠，天然形成自适应两栏布局——这是 Flex 普及前的经典方案。

> 现代布局有了 Flex 和 Grid，但 BFC 依然是理解 CSS 渲染模型的基石，面试官问的不是 API，是你对渲染机制的理解深度。
`,
  },
  {
    title: 'React 渲染机制与性能优化：从虚拟 DOM 到 memo',
    summary:
      '组件为什么会重新渲染？re-render 一定是坏事吗？这篇讲透 React 的渲染流程、diff 算法要点，以及 memo、useMemo、useCallback 的正确使用姿势。',
    tags: ['React', '前端进阶'],
    content: `# React 渲染机制与性能优化

性能优化的前提是理解机制。这篇从"组件为什么会重新渲染"讲起。

## 一、渲染的两个阶段

1. **Render 阶段**：组件函数重新执行，生成新的虚拟 DOM 树
2. **Commit 阶段**：React diff 新旧两棵树，把差异应用到真实 DOM

关键认知：**re-render ≠ 真实 DOM 更新**。diff 后没变化的部分不会碰真实 DOM，所以 re-render 的成本主要是"执行组件函数 + diff"。

## 二、什么时候会触发 re-render

- 自身 \`setState\` 被调用（即使值相同？——对象/数组引用变了就会）
- **父组件 re-render，默认会带着所有子组件一起 re-render**
- Context 的 value 变化，所有消费该 Context 的组件都会更新

第二点是最容易被忽视的：

\`\`\`jsx
function Parent() {
  const [count, setCount] = useState(0);
  return (
    <div>
      <button onClick={() => setCount(count + 1)}>+1</button>
      <Child /> {/* count 变了 Child 也会 re-render！ */}
    </div>
  );
}
\`\`\`

## 三、React.memo：跳过无谓的子组件渲染

\`\`\`jsx
const Child = React.memo(function Child() {
  console.log('Child render');
  return <div>静态内容</div>;
});
\`\`\`

\`memo\` 会对 props 做浅比较，没变化就跳过渲染。但注意两个陷阱：

\`\`\`jsx
// 陷阱 1：每次渲染都生成新函数，props 引用变了，memo 失效
<Child onClick={() => doSomething(id)} />

// 陷阱 2：每次渲染都生成新对象
<Child style={{ color: 'red' }} />
\`\`\`

## 四、useCallback / useMemo：稳住引用

\`\`\`jsx
const handleClick = useCallback(() => doSomething(id), [id]);
const style = useMemo(() => ({ color: 'red' }), []);
\`\`\`

它们配合 \`memo\` 才有意义。**如果子组件没用 memo，给父组件加 useCallback 基本是无效优化。**

## 五、列表渲染的稳定 key

\`\`\`jsx
// 反例：用 index 做 key，删除第一项时所有项都会错位重渲染
{list.map((item, i) => <Row key={i} data={item} />)}

// 正例：用唯一 id
{list.map((item) => <Row key={item.id} data={item} />)}
\`\`\`

## 六、优化清单

1. 先测量（React DevTools Profiler），别凭感觉优化
2. 状态下移：把频繁变化的状态放到最小的组件里
3. \`memo\` + \`useCallback\` 成对使用，包住渲染昂贵的组件
4. 大列表用虚拟滚动（如 react-window）
5. 路由级代码分割：\`React.lazy\` + \`Suspense\`

> 过早优化是万恶之源。90% 的页面不需要这些手段，但理解原理能帮你定位那 10% 真正的性能瓶颈。
`,
  },
  {
    title: 'HTTP 缓存详解：强缓存与协商缓存一次讲透',
    summary:
      'Cache-Control、Expires、ETag、Last-Modified 到底怎么配合？浏览器何时用本地缓存、何时问服务器？这篇用完整流程图讲清楚前端性能优化的第一课。',
    tags: ['HTTP', '前端进阶'],
    content: `# HTTP 缓存详解

前端性能优化里收益最大、成本最低的手段就是 HTTP 缓存。它的核心分为两层：**强缓存**和**协商缓存**。

## 一、浏览器请求的完整决策流程

\`\`\`
发起请求
  │
  ├─ 有强缓存且未过期？ ──是──▶ 直接用本地副本（不发请求，状态码 200 from disk cache）
  │
  └─ 否 ──▶ 发请求到服务器（协商缓存）
              │
              ├─ 资源没变？ ──▶ 304 Not Modified（只回响应头，复用本地副本）
              └─ 资源变了 ──▶ 200 + 新内容
\`\`\`

## 二、强缓存：完全不问服务器

由两个响应头控制（Cache-Control 优先级更高）：

| 响应头 | 示例 | 说明 |
| --- | --- | --- |
| Cache-Control | \`max-age=31536000\` | 相对时间，缓存一年 |
| Cache-Control | \`no-cache\` | **不是不缓存**，是每次都要协商 |
| Cache-Control | \`no-store\` | 真正的不缓存 |
| Expires | HTTP 时间 | 老方案，受客户端时间影响，已被淘汰 |

\`max-age=0\` 和 \`no-cache\` 效果类似：缓存可以存，但每次用之前必须向服务器确认。

## 三、协商缓存：问一声"变了吗"

两组"凭证"：

**第一组（弱）：Last-Modified / If-Modified-Since**

- 服务器返回 \`Last-Modified: 文件修改时间\`
- 下次请求带上 \`If-Modified-Since\`
- 缺陷：秒级精度，文件 1 秒内改了检测不到；文件内容没变但修改时间变了会误判

**第二组（强）：ETag / If-None-Match**

- 服务器给内容算一个指纹（如 hash）作为 \`ETag\`
- 下次请求带上 \`If-None-Match\`
- 内容一致返回 304，**优先级高于 Last-Modified**

## 四、工程实践：静态资源的黄金配置

现代前端构建（Vite/Webpack）产出的文件名都带 hash：\`index-CRQjLb8y.js\`。基于此：

\`\`\`nginx
# 带 hash 的文件：内容变文件名就变，可以放心缓存一年
location /assets/ {
  add_header Cache-Control "public, max-age=31536000, immutable";
}

# HTML 入口：永远协商，保证用户能拿到新文件名
location / {
  add_header Cache-Control "no-cache";
}
\`\`\`

这就是"内容寻址 + 长缓存"的经典方案：**HTML 不缓存负责"更新"，JS/CSS 长缓存负责"快"**。

## 五、面试速记

- 强缓存不发请求（200 from cache），协商缓存发请求但可能 304
- \`no-cache\` ≠ \`no-store\`
- ETag 比 Last-Modified 更精确，优先级更高
- 刷新（F5）会让强缓存失效走协商；地址栏回车则正常走强缓存

> 理解了缓存机制，你也就理解了为什么部署后用户要"强制刷新"，以及为什么文件名 hash 是标配。
`,
  },
  {
    title: '前端构建工具进化史：Webpack 与 Vite 原理对比',
    summary:
      '为什么 Vite 启动只要几百毫秒而 Webpack 要几十秒？dev 和 build 为什么用两套引擎？这篇讲清楚两代构建工具的核心原理和设计取舍。',
    tags: ['工程化', '前端进阶'],
    content: `# 前端构建工具进化史：Webpack 与 Vite

这个博客就是用 Vite 构建的。为什么现在的脚手架默认都用 Vite？得先理解 Webpack 是怎么工作的、慢在哪里。

## 一、构建工具解决什么问题

浏览器不认识 JSX、TypeScript、\`import\` 语法（旧浏览器），也不能高效处理上千个零散文件。构建工具干两件事：

1. **编译**：把新语法转成浏览器能跑的代码
2. **打包**：把成百上千个模块合并成少数几个文件

## 二、Webpack：bundle 模式

Webpack 的思路是"先打包，再服务"：

\`\`\`
源码 → 依赖分析 → 打包成 bundle → 启动 dev server → 浏览器拿到 bundle
\`\`\`

问题：项目越大，启动越慢。几千个模块的项目冷启动几十秒很常见，因为**必须先把整个应用打包完**，浏览器才能收到第一个字节。

HMR（热更新）也是同理：改一行代码，要重新计算受影响的 chunk，模块图越大越慢。

## 三、Vite：no-bundle 模式

Vite 的开发模式完全不同，它利用了现代浏览器原生支持的 ES Modules：

\`\`\`html
<script type="module" src="/src/main.jsx"></script>
\`\`\`

浏览器自己发起 \`import\` 请求，Vite 的 dev server **按需编译**：请求到哪个文件才现编译哪个文件。

- 启动成本 ≈ 启动一个 HTTP 服务器（毫秒级），与项目大小无关
- 第三方依赖用 esbuild 预构建（Go 写的，比 JS 工具快 10~100 倍）
- HMR 只重新编译单个模块，与项目规模解耦

## 四、为什么 Vite 生产构建又用回了打包

dev 不打包有个副作用：一个页面几百个模块请求，HTTP 请求开销大。所以 Vite 的 \`vite build\` 用 **Rollup** 做正式打包——这就是"dev 用 esbuild/no-bundle，build 用 Rollup"的双引擎设计。

## 五、对比总结

| 维度 | Webpack | Vite |
| --- | --- | --- |
| 启动方式 | 先打包再服务 | 按需编译 |
| 冷启动 | 秒~十秒级 | 毫秒级 |
| HMR 速度 | 随项目变大变慢 | 基本恒定 |
| 生态成熟度 | 最成熟，插件最多 | 快速追赶，主流框架全覆盖 |
| 兼容性处理 | loader 体系 | dev 靠浏览器原生能力 |

## 六、怎么选

- 新项目：直接 Vite，官方脚手架已默认
- 重度依赖 Webpack 特性的老项目：不急着迁，可以渐进式尝试
- 组件库开发：考虑 Rollup 或 tsup

> 工具的进化方向始终是"把等待时间还给开发者"。理解原理之后，你评估新工具只需要问一句：它的启动模型是 bundle 还是 no-bundle？
`,
  },
];

async function main() {
  const login = await fetch(`${BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username: 'admin', password: 'admin123' }),
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
  console.log('Done! Frontend deep-dive posts seeded.');
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
