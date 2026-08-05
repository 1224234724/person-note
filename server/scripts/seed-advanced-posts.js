/**
 * One-off script: seed advanced frontend deep-dive posts via the API.
 * Topics: Webpack internals, TypeScript type gymnastics, MVVM, design patterns, React SSR.
 * Usage: node scripts/seed-advanced-posts.js  (backend must be running on :3001)
 */
const BASE = 'http://localhost:3001/api';

const samples = [
  {
    title: 'Webpack 深入：从 Loader 到 Plugin，看懂编译全流程',
    summary:
      'Loader 和 Plugin 到底有什么区别？Tapable 钩子是怎么工作的？这篇文章从编译流程讲起，带你手写一个自定义插件，彻底吃透 Webpack 的核心机制。',
    tags: ['Webpack', '工程化', '前端进阶'],
    content: `# Webpack 深入：从 Loader 到 Plugin

很多人会用 Webpack 配置，却说不清 \`loader\` 和 \`plugin\` 的本质区别。这篇文章把 Webpack 的编译流程拆开看，最后手写一个插件。

## 一、编译全流程：三个阶段

Webpack 的构建可以概括为三个阶段：

1. **初始化**：合并命令行参数、配置文件和默认配置，实例化 \`Compiler\`，把所有 Plugin 的 \`apply\` 方法调用一遍，让插件挂载钩子
2. **编译（make）**：从 entry 出发，递归解析依赖，对每个模块调用对应的 Loader 转译，最终得到模块依赖图（Module Graph）
3. **输出（emit）**：根据依赖图把模块组装成 Chunk，生成代码写入文件系统

\`\`\`text
entry → 解析依赖 → Loader 转译 → 依赖图 → Chunk → 产物 bundle
\`\`\`

其中 \`Compiler\` 代表整个构建生命周期（全局唯一），\`Compilation\` 代表一次具体的编译（watch 模式下每次文件变化都会创建新的 Compilation）。

## 二、Loader 的本质：字符串转换管道

**Loader 本质是一个函数，输入源码字符串，输出转换后的字符串。** 多个 Loader 像管道一样串联执行：

\`\`\`js
// 一个最简单的 Loader：给代码加上注释
module.exports = function (source) {
  return '// built by my-loader\\n' + source;
};
\`\`\`

配置中的执行顺序是**从右到左、从下到上**：

\`\`\`js
module: {
  rules: [
    // 先执行 sass-loader → 再执行 css-loader → 最后 style-loader
    { test: /\\.scss$/, use: ['style-loader', 'css-loader', 'sass-loader'] },
  ],
}
\`\`\`

几个进阶知识点：

- Loader 可以导出 \`pitch\` 方法，执行顺序变为从左到右，常用于 \`style-loader\` 拦截后续 Loader 直接内联样式
- \`this.async()\` 让 Loader 支持异步处理
- \`this.getOptions()\` 读取用户传入的配置项
- Loader 之间通过字符串传递，所以每个 Loader 都应尽量只做一件事，保持可组合

## 三、Plugin 的本质：基于 Tapable 的事件系统

Loader 只负责"转译文件"，而 Plugin 能介入**编译的任何阶段**，因为它基于事件机制。核心是 Tapable 这个钩子库：

\`\`\`js
const { SyncHook, AsyncSeriesHook } = require('tapable');

class Compiler {
  constructor() {
    this.hooks = {
      run: new AsyncSeriesHook(['compiler']),
      compile: new SyncHook(['params']),
      emit: new AsyncSeriesHook(['compilation']),
      done: new AsyncSeriesHook(['stats']),
    };
  }
}
\`\`\`

Plugin 就是一个带 \`apply\` 方法的类：

\`\`\`js
class MyPlugin {
  apply(compiler) {
    compiler.hooks.emit.tapAsync('MyPlugin', (compilation, callback) => {
      // 在产物写入磁盘前，可以修改 compilation.assets
      callback();
    });
  }
}
\`\`\`

常用钩子速查：

| 钩子 | 触发时机 | 典型用途 |
| --- | --- | --- |
| compiler.hooks.beforeCompile | 编译开始前 | 注入环境变量 |
| compiler.hooks.emit | 产物写入前 | 修改/新增输出文件 |
| compiler.hooks.done | 整个构建完成 | 统计耗时、发通知 |
| compilation.hooks.optimizeAssets | 资源优化阶段 | 压缩、混淆 |

## 四、手写一个"构建耗时统计"插件

\`\`\`js
class BuildTimePlugin {
  apply(compiler) {
    let start;
    compiler.hooks.compile.tap('BuildTimePlugin', () => {
      start = Date.now();
    });
    compiler.hooks.done.tap('BuildTimePlugin', (stats) => {
      const cost = Date.now() - start;
      console.log(\`✅ 构建完成，共 \${stats.compilation.chunks.size} 个 chunk，耗时 \${cost}ms\`);
    });
  }
}
module.exports = BuildTimePlugin;
\`\`\`

再进一步，利用 \`emit\` 钩子往产物里塞一个文件：

\`\`\`js
compiler.hooks.emit.tapAsync('BuildTimePlugin', (compilation, cb) => {
  compilation.assets['build-info.json'] = {
    source: () => JSON.stringify({ time: new Date().toISOString() }),
    size: () => 40,
  };
  cb();
});
\`\`\`

这就是 html-webpack-plugin、clean-webpack-plugin 等知名插件的基本思路。

## 五、性能优化思路

理解了流程，优化才有方向：

- **缩小处理范围**：\`include/exclude\`、\`resolve.extensions\` 精简
- **缓存**：Webpack 5 的 \`cache: { type: 'filesystem' }\` 效果立竿见影
- **并行**：\`thread-loader\` 把 Loader 放到 worker 线程池
- **拆分**：\`splitChunks\` 把公共依赖拆出独立 chunk，利用浏览器缓存
- **按需**：\`externals\` + CDN 引入大型库，Tree Shaking 依赖 ESM 静态结构

## 六、一句话总结

> Loader 是"文件转换器"，工作在模块级别；Plugin 是"流程参与者"，工作在编译器级别。看懂 Tapable 钩子，就看懂了 Webpack 插件生态的全部秘密。
`,
  },
  {
    title: 'TypeScript 类型体操：条件类型、infer 与泛型实战',
    summary:
      '泛型、条件类型、infer、映射类型到底怎么组合使用？本文从原理到实战，手写 Pick、DeepReadonly、Awaited 等工具类型，带你入门类型体操。',
    tags: ['TypeScript', '前端进阶'],
    content: `# TypeScript 类型体操入门

TypeScript 的类型系统是**图灵完备**的——你可以在类型层面做条件判断、递归、推导。这种"在类型里写逻辑"的玩法被社区称为类型体操。本文只讲生产中最用得上的部分。

## 一、泛型的本质：类型的参数

函数有参数让逻辑复用，类型有泛型让类型复用：

\`\`\`ts
function identity<T>(value: T): T {
  return value;
}
const n = identity(42); // T 被推断为 number

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T;
}
type UserResp = ApiResponse<{ id: number; name: string }>;
\`\`\`

配合 \`extends\` 可以约束泛型，\`= 默认值\` 可以兜底：

\`\`\`ts
function getKey<T extends object, K extends keyof T>(obj: T, key: K): T[K] {
  return obj[key];
}
\`\`\`

这里 \`T[K]\` 叫**索引访问类型**，是类型体操的基础积木。

## 二、条件类型：类型层面的三目运算

\`\`\`ts
type IsString<T> = T extends string ? 'yes' : 'no';
type A = IsString<'hi'>;   // 'yes'
type B = IsString<123>;    // 'no'
\`\`\`

**分布式条件类型**是个容易踩坑的特性：当 T 是裸泛型参数且为联合类型时，条件会对每个成员分别运算：

\`\`\`ts
type ToArr<T> = T extends any ? T[] : never;
type R = ToArr<string | number>; // string[] | number[]  ← 不是 (string|number)[]
\`\`\`

想阻止分布，加方括号：

\`\`\`ts
type ToArr2<T> = [T] extends [any] ? T[] : never;
type R2 = ToArr2<string | number>; // (string | number)[]
\`\`\`

## 三、infer：从结构里"挖"出类型

\`infer\` 配合条件类型，可以声明式地提取子类型：

\`\`\`ts
// 提取数组元素类型
type ElementOf<T> = T extends (infer E)[] ? E : never;
type E1 = ElementOf<string[]>; // string

// 提取函数返回值类型（ReturnType 的官方实现思路）
type MyReturnType<T> = T extends (...args: any[]) => infer R ? R : never;

// 提取 Promise 包裹的类型
type Unwrap<T> = T extends Promise<infer U> ? U : T;
\`\`\`

官方的 \`Awaited\` 类型用递归把多层 Promise 剥干净：

\`\`\`ts
type MyAwaited<T> = T extends Promise<infer U> ? MyAwaited<U> : T;
type X = MyAwaited<Promise<Promise<number>>>; // number
\`\`\`

## 四、映射类型：批量改造属性

\`keyof\` 拿到所有键，映射类型逐个变换：

\`\`\`ts
type MyPartial<T> = { [K in keyof T]?: T[K] };
type MyReadonly<T> = { readonly [K in keyof T]: T[K] };
\`\`\`

TS 4.1 之后可以用 \`as\` 重命名键，实现过滤：

\`\`\`ts
// Omit：把指定键过滤掉
type MyOmit<T, K extends keyof T> = {
  [P in keyof T as P extends K ? never : P]: T[P];
};

// 只保留函数属性
type OnlyFuncs<T> = {
  [P in keyof T as T[P] extends Function ? P : never]: T[P];
};
\`\`\`

## 五、实战：DeepReadonly 递归实现

面试高频题，综合了递归 + 条件类型 + 映射类型：

\`\`\`ts
type DeepReadonly<T> = T extends Function
  ? T
  : T extends (infer U)[]
  ? readonly DeepReadonly<U>[]
  : T extends object
  ? { readonly [K in keyof T]: DeepReadonly<T[K]> }
  : T;
\`\`\`

三个分支分别处理：函数不处理、数组递归元素、对象递归属性、基本类型直接返回。

## 六、模板字面量类型

字符串也能参与类型运算：

\`\`\`ts
type EventName<T extends string> = \\\`on\\\${Capitalize<T>}\\\`;
type E = EventName<'click'>; // 'onClick'

type PathParams = '/user/:id/post/:postId';
\`\`\`

Vue 的 \`defineEmits\`、很多路由库的路径参数推导都用了这个特性。

## 七、学习建议

1. 先熟练使用内置工具类型（Partial、Pick、Record、ReturnType）
2. 再看它们的官方实现（lib.es5.d.ts 里都能找到）
3. 最后去 type-challenges 仓库刷题，从 easy 开始

> 类型体操的尽头不是炫技，而是让使用者"少写类型、不写错类型"。写库的人多受罪，用库的人才能少受罪。
`,
  },
  {
    title: 'MVVM 原理剖析：从脏检查到 Proxy 的三代演进',
    summary:
      'Vue 的响应式为什么从 Object.defineProperty 换成了 Proxy？Angular 的脏检查到底在检查什么？本文梳理 MVVM 数据绑定的三代实现，并手写一个迷你响应式系统。',
    tags: ['Vue', '框架原理', '前端进阶'],
    content: `# MVVM 原理：数据绑定的三代演进

MVVM 的核心问题是：**数据变了，视图怎么自动更新？** 不同框架给出了三代答案。理解这段演进，你就理解了 Vue/React 生态里一半的面试题。

## 一、MVVM 是什么

- **Model**：数据
- **View**：视图
- **ViewModel**：把 Model 映射到 View 的中间层，负责双向绑定

关键在"自动"：你改数据，视图自己变，不用手写 \`document.getElementById('app').textContent = xxx\`。

## 二、第一代：脏检查（AngularJS）

AngularJS 的思路很暴力：**不追踪变化，而是主动对比**。

每个作用域维护一个 watcher 列表，触发时机（digest 循环）一到，就把所有 watcher 的"当前值"和"上次值"对比，不一致就更新视图，然后**再循环一轮**——因为更新可能引发新变化，直到没有任何变化为止（一般最多跑 10 轮防止死循环）。

\`\`\`js
// 简化的 digest 循环
function digest(scope) {
  let dirty = true;
  let round = 0;
  while (dirty && round < 10) {
    dirty = false;
    round++;
    for (const w of scope.watchers) {
      const newValue = w.getter(scope);
      if (newValue !== w.last) {
        w.last = newValue;
        dirty = true;
        w.callback(newValue);
      }
    }
  }
}
\`\`\`

缺点显而易见：**watcher 多了之后每轮全量对比，性能差**；而且定时器、原生事件不会自动触发 digest，要手动 \`$apply\`。

## 三、第二代：数据劫持（Vue 2）

Vue 2 的思路反过来：**不轮询，而是在数据被修改的那一刻就知道**。用 \`Object.defineProperty\` 把每个属性劫持成 getter/setter：

\`\`\`js
function defineReactive(obj, key, val) {
  Object.defineProperty(obj, key, {
    get() {
      collectDep(key); // 读取时收集依赖
      return val;
    },
    set(newVal) {
      if (newVal === val) return;
      val = newVal;
      notifyDep(key); // 写入时通知更新
    },
  });
}
\`\`\`

配合"依赖收集"：组件渲染时读到哪些属性，就把渲染函数记到那些属性的订阅列表里；属性被改时，只通知订阅过它的组件。

但 defineProperty 有两个硬伤：

1. **只能劫持已存在的属性**，动态添加属性要用 \`Vue.set\`
2. **数组按索引修改、修改 length 检测不到**，Vue 只能重写数组的 7 个变异方法（push/pop/splice...）绕过

且初始化时必须递归遍历整个对象，数据层级深时启动成本高。

## 四、第三代：Proxy（Vue 3）

ES2015 的 Proxy 直接在**对象层面**拦截，一次性解决所有问题：

\`\`\`js
function reactive(target) {
  return new Proxy(target, {
    get(t, key, receiver) {
      track(t, key); // 依赖收集
      const res = Reflect.get(t, key, receiver);
      return typeof res === 'object' && res !== null ? reactive(res) : res; // 惰性递归
    },
    set(t, key, value, receiver) {
      const res = Reflect.set(t, key, value, receiver);
      trigger(t, key); // 派发更新
      return res;
    },
    deleteProperty(t, key) {
      const res = Reflect.deleteProperty(t, key);
      trigger(t, key);
      return res;
    },
  });
}
\`\`\`

相比 Vue 2 的升级点：

| 能力 | Vue 2 (defineProperty) | Vue 3 (Proxy) |
| --- | --- | --- |
| 新增/删除属性 | 需要 Vue.set / Vue.delete | 直接支持 |
| 数组索引/length | 检测不到 | 直接支持 |
| 深层对象 | 初始化全量递归 | 访问到才递归（懒） |
| Map/Set | 不支持 | 支持 |

## 五、手写 30 行迷你响应式

把依赖收集和派发更新补全，就是一个能跑的迷你版：

\`\`\`js
let activeEffect = null;
const targetMap = new WeakMap();

function effect(fn) {
  activeEffect = fn;
  fn(); // 先执行一次，触发 getter 收集依赖
  activeEffect = null;
}

function track(target, key) {
  if (!activeEffect) return;
  let depsMap = targetMap.get(target);
  if (!depsMap) targetMap.set(target, (depsMap = new Map()));
  let deps = depsMap.get(key);
  if (!deps) depsMap.set(key, (deps = new Set()));
  deps.add(activeEffect);
}

function trigger(target, key) {
  targetMap.get(target)?.get(key)?.forEach((fn) => fn());
}
\`\`\`

用起来：

\`\`\`js
const state = reactive({ count: 0 });
effect(() => {
  document.getElementById('app').textContent = state.count;
});
state.count++; // 视图自动更新
\`\`\`

这就是 Vue 3 响应式系统的骨架（真实版本还要处理嵌套 effect、清理失效依赖、computed 等）。

## 六、总结

三代方案演进的主线是：**从"事后轮询"到"事前拦截"，从"属性级"到"对象级"**。面试时别只背 API，把"为什么换"讲清楚才是加分项。
`,
  },
  {
    title: '前端常用的设计模式：观察者、发布订阅、代理与策略',
    summary:
      '设计模式不是后端专属。本文用前端场景讲透四种最常用的模式：单例、策略、观察者 vs 发布订阅、代理，每个都配可运行的代码。',
    tags: ['设计模式', 'JavaScript', '前端进阶'],
    content: `# 前端常用的设计模式

很多人觉得设计模式是后端的事，其实前端代码里到处都是模式：Vue 的响应式是代理模式，EventBus 是发布订阅，表单校验天然适合策略模式。本文挑最高频的四种讲透。

## 一、单例模式：全局唯一实例

确保一个类只有一个实例，并提供全局访问点。

\`\`\`js
class Modal {
  constructor() {
    if (Modal.instance) return Modal.instance;
    this.visible = false;
    Modal.instance = this;
  }
  show() { this.visible = true; }
}

const a = new Modal();
const b = new Modal();
console.log(a === b); // true
\`\`\`

前端场景：全局 Loading、全局 Store（Redux store 就是单例）、浏览器里的 \`window\` 本身。

更优雅的惰性写法：

\`\`\`js
const getStore = (() => {
  let store = null;
  return () => store ?? (store = createStore());
})();
\`\`\`

## 二、策略模式：消灭 if/else

把一系列算法封装成可互换的策略对象。典型场景：表单校验。

\`\`\`js
const strategies = {
  required: (v, msg) => (v ? '' : msg),
  minLength: (v, len, msg) => (v.length >= len ? '' : msg),
  isPhone: (v, msg) => (/^1[3-9]\\d{9}$/.test(v) ? '' : msg),
};

function validate(rule, ...args) {
  return strategies[rule](...args);
}

validate('required', '', '用户名不能为空');     // '用户名不能为空'
validate('isPhone', '13800138000', '手机号格式错误'); // ''
\`\`\`

新增校验规则时完全不用改已有代码，符合开闭原则。React 里的 reducer 按 action.type 分发，本质也是策略思想。

## 三、观察者模式 vs 发布订阅模式

这两个概念经常被混为一谈，**关键区别在中间有没有"事件中心"**。

**观察者模式**：目标（Subject）直接维护观察者列表，变化时直接通知。

\`\`\`js
class Subject {
  observers = [];
  attach(o) { this.observers.push(o); }
  notify(data) { this.observers.forEach((o) => o.update(data)); }
}

// Vue 2 的响应式依赖收集就是这种结构：Dep = Subject，Watcher = Observer
\`\`\`

**发布订阅模式**：发布者和订阅者互相不认识，中间隔一个事件中心（Broker）。

\`\`\`js
class EventEmitter {
  events = {};
  on(name, fn) {
    (this.events[name] ??= []).push(fn);
  }
  off(name, fn) {
    this.events[name] = (this.events[name] || []).filter((f) => f !== fn);
  }
  emit(name, ...args) {
    (this.events[name] || []).forEach((fn) => fn(...args));
  }
  once(name, fn) {
    const wrapper = (...args) => { fn(...args); this.off(name, wrapper); };
    this.on(name, wrapper);
  }
}
\`\`\`

Node.js 的 EventEmitter、DOM 的 \`addEventListener\`、跨组件通信的 EventBus 都是发布订阅。

一句话区分：观察者模式里目标知道谁在观察它；发布订阅里双方完全解耦，只认事件名。

## 四、代理模式：控制访问

为对象提供替身，控制对它的访问。ES6 直接把代理做成了语言特性：

\`\`\`js
const user = { name: '小明', age: 17 };
const checked = new Proxy(user, {
  set(t, key, value) {
    if (key === 'age' && value < 0) throw new Error('年龄不能为负');
    t[key] = value;
    return true;
  },
});
checked.age = -1; // 抛出异常
\`\`\`

应用场景：

- **Vue 3 响应式**：用 Proxy 拦截读写实现依赖收集
- **保护代理**：校验、权限、参数过滤
- **远程代理**：RPC 调用看起来像本地方法
- **缓存代理**：缓存计算结果

\`\`\`js
const cacheProxy = (fn) => {
  const cache = new Map();
  return (...args) => {
    const key = JSON.stringify(args);
    if (!cache.has(key)) cache.set(key, fn(...args));
    return cache.get(key);
  };
};
\`\`\`

React 的高阶组件（HOC）也带着代理的影子：不修改原组件，包一层增强功能。

## 五、总结

| 模式 | 一句话 | 前端典型应用 |
| --- | --- | --- |
| 单例 | 全局只要一个 | Store、全局弹窗 |
| 策略 | 算法可互换 | 表单校验、支付方式选择 |
| 发布订阅 | 事件中心解耦 | EventBus、EventEmitter |
| 代理 | 替身控制访问 | Vue3 响应式、缓存 |

> 模式的价值不在"用上了哪个"，而在于遇到重复问题时，知道有现成的、被验证过的解法。
`,
  },
  {
    title: 'React SSR 深入：同构渲染与 Hydration 原理',
    summary:
      '为什么首屏要用服务端渲染？renderToString 和 Hydration 到底做了什么？SSR、SSG、CSR 怎么选？本文从渲染流程讲到 Next.js 的落地实践。',
    tags: ['React', 'SSR', '前端进阶'],
    content: `# React SSR 深入：同构渲染与 Hydration

纯客户端渲染（CSR）有两个老大难：**首屏白屏**（要先下载执行 JS 才能看到内容）和 **SEO 不友好**（爬虫拿到的是空 div）。SSR（服务端渲染）就是为了解决这两个问题。

## 一、三种渲染模式对比

| 模式 | 渲染位置 | 首屏速度 | SEO | 服务器压力 |
| --- | --- | --- | --- | --- |
| CSR | 浏览器 | 慢（等 JS） | 差 | 无 |
| SSR | 服务器（每次请求） | 快 | 好 | 高 |
| SSG | 构建时生成静态 HTML | 最快 | 好 | 几乎无 |

选型经验：内容不常变的（文档、博客）用 SSG；内容个性化、实时的（feed 流、电商详情页）用 SSR；后台管理系统用 CSR 就够了。

## 二、SSR 的完整流程

\`\`\`text
1. 请求到达服务器
2. 服务器执行 React 组件代码 → renderToString 生成 HTML 字符串
3. HTML 返回浏览器 → 用户立即看到内容（但还不能交互）
4. 浏览器下载 JS bundle
5. React 执行 hydrate：把事件绑定到已有 HTML 上
6. 页面变为可交互（TTI）
\`\`\`

核心 API 是两兄弟：

\`\`\`js
// 服务器端
import { renderToString } from 'react-dom/server';
const html = renderToString(<App />);

// 浏览器端
import { hydrateRoot } from 'react-dom/client';
hydrateRoot(document.getElementById('root'), <App />);
\`\`\`

注意服务器端用的是 \`renderToString\` 而不是 \`render\`——它输出字符串而非操作 DOM（服务器没有 DOM）。

## 三、什么是"同构"

**同构 = 同一套组件代码既在服务器跑，又在浏览器跑。** 这带来几个必须处理的差异：

1. **没有 window/document**：服务器端访问会直接报错，副作用要放进 \`useEffect\`（它只在浏览器执行）
2. **生命周期差异**：服务器只执行渲染阶段，\`useEffect\`、事件监听都不会跑
3. **状态传递**：服务器取好的数据要序列化塞进 HTML（俗称脱水），浏览器再取出来（注水），避免二次请求

\`\`\`html
<!-- 脱水：服务器把数据挂到 window -->
<script>window.__INITIAL_STATE__ = {"post":{...}}</script>
\`\`\`

## 四、Hydration 的原理与陷阱

Hydration 不是"重新渲染"，而是**复用服务器生成的 HTML，只补上事件监听**。React 会在浏览器端再跑一遍组件渲染，对比生成的虚拟 DOM 和已有 HTML 是否一致。

不一致就会报经典的 **Hydration Mismatch** 错误，常见诱因：

\`\`\`jsx
function Time() {
  // ❌ 服务器和浏览器的时间必然不同 → mismatch
  return <span>{new Date().toLocaleTimeString()}</span>;
}

function Time2() {
  const [time, setTime] = useState('');
  useEffect(() => setTime(new Date().toLocaleTimeString()), []);
  // ✅ 首次渲染输出空字符串，与服务器一致；挂载后再更新
  return <span>{time}</span>;
}
\`\`\`

其他常见诱因：\`Math.random()\`、依赖 \`localStorage\` 的初始值、浏览器插件修改 DOM。

## 五、流式渲染与 Suspense

React 18 带来了流式 SSR：页面可以分块发送，先出壳，慢的数据后补。

\`\`\`jsx
import { renderToPipeableStream } from 'react-dom/server';

const { pipe } = renderToPipeableStream(
  <Suspense fallback={<Spinner />}>
    <SlowComments />  {/* 慢的部分单独挂起 */}
  </Suspense>,
  { onShellReady: () => pipe(res) }
);
\`\`\`

好处：首字节时间大幅提前；慢接口不再拖累整页。Next.js 的 App Router 就是建立在这套机制上。

## 六、Next.js 帮你做了什么

手写 SSR 要自己搞路由匹配、数据预取、HTML 模板、状态注水脱水……Next.js 把这些全部封装：

- 文件路由 + 自动代码分割
- \`getServerSideProps\`（SSR 数据预取）/ \`getStaticProps\`（SSG）
- App Router 里的 Server Components：组件直接在服务器执行，连 JS 都不发给浏览器

## 七、什么时候不要用 SSR

- 强交互、无 SEO 需求的后台系统
- 页面高度个性化，缓存命中率极低，服务器扛不住
- 团队还不熟悉同构的各种坑（hydration、副作用时机）

> SSR 不是银弹，是拿服务器算力换用户体验和 SEO 的交易。理解 renderToString → 注水 → Hydration 这条主线，再看任何 SSR 框架都不再神秘。
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
  console.log('Done! Advanced deep-dive posts seeded.');
}

main().catch((e) => {
  console.error(e.message);
  process.exit(1);
});
