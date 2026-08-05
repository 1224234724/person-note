const skillGroups = [
  { name: '🎨 前端核心', items: ['HTML5', 'CSS3', 'JavaScript (ES6+)', 'TypeScript'] },
  { name: '⚛️ 框架与库', items: ['React 19', 'react-router', 'react-markdown'] },
  { name: '🛠️ 工程化', items: ['Vite', 'Webpack', 'Tailwind CSS', 'Git', 'npm'] },
  { name: '🖥️ 后端与数据库', items: ['Node.js', 'Express', 'JWT 认证', 'MySQL'] },
  { name: '🚀 正在学习', items: ['Vue 3', 'React SSR', 'Docker 部署', '性能优化'] },
];

export default function About() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">关于我</h1>

      {/* Profile card */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
        <img
          src="/avatar.jpg"
          alt="ぃ你若不离丶"
          className="w-24 h-24 rounded-full object-cover ring-2 ring-indigo-300 dark:ring-purple-600 avatar-glow shrink-0"
        />
        <div className="text-center md:text-left">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">ぃ你若不离丶</h2>
          <p className="text-sm text-gray-400 mt-0.5">前端开发学习者 / 终身学习者</p>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">
            你好，欢迎来到我的个人博客！这里记录我的学习笔记、技术总结和生活随笔。
            相信输出是最好的输入，写下来才能真正想明白。
          </p>
        </div>
      </div>

      {/* Skills */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 md:p-8">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">技术栈</h2>
        <div className="grid gap-4 md:grid-cols-2">
          {skillGroups.map((group) => (
            <div key={group.name}>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {group.name}
              </p>
              <div className="flex flex-wrap gap-2">
                {group.items.map((skill) => (
                  <span
                    key={skill}
                    className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 px-3 py-1.5 rounded-full hover:bg-indigo-100 hover:text-indigo-700 dark:hover:bg-indigo-900 dark:hover:text-indigo-300 transition-colors"
                  >
                    {skill}
                  </span>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* About this blog */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 md:p-8 markdown-body">
        <h2>关于这个博客</h2>
        <ul>
          <li>前端：React + Vite + Tailwind CSS</li>
          <li>后端：Node.js + Express + JWT</li>
          <li>数据库：MySQL</li>
        </ul>
        <p>这个博客从零开始自主开发，从数据库设计到页面渲染全程自己实现。</p>

        <h2>联系方式</h2>
        <ul>
          <li>
            Gitee：
            <a href="https://gitee.com/wangyu-0312" target="_blank" rel="noreferrer">
              gitee.com/wangyu-0312
            </a>
          </li>
          <li>
            邮箱：<a href="mailto:1224234724@qq.com">1224234724@qq.com</a>
          </li>
        </ul>
      </div>
    </div>
  );
}
