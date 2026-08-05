import { useSite } from '../lib/site.jsx';

const skillGroups = [
  { name: '🎨 前端核心', items: ['HTML5', 'CSS3', 'JavaScript (ES6+)', 'TypeScript'] },
  { name: '⚛️ 框架与库', items: ['React 19', 'react-router', 'react-markdown'] },
  { name: '🛠️ 工程化', items: ['Vite', 'Webpack', 'Tailwind CSS', 'Git', 'npm'] },
  { name: '🖥️ 后端与数据库', items: ['Node.js', 'Express', 'JWT 认证', 'MySQL'] },
  { name: '🚀 正在学习', items: ['Vue 3', 'React SSR', 'Docker 部署', '性能优化'] },
];

export default function About() {
  const site = useSite();
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">关于我</h1>

      {/* Profile card */}
      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 md:p-8 flex flex-col md:flex-row items-center gap-6">
        <img
          src="/avatar.jpg"
          alt={site.nickname}
          className="w-24 h-24 rounded-full object-cover ring-2 ring-indigo-300 dark:ring-purple-600 avatar-glow shrink-0"
        />
        <div className="text-center md:text-left">
          <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">{site.nickname}</h2>
          <p className="text-sm text-gray-400 mt-0.5">{site.identity}</p>
          <p className="text-sm text-gray-500 mt-2 leading-relaxed">{site.intro}</p>
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
            <a href={site.gitee} target="_blank" rel="noreferrer">
              {site.gitee.replace(/^https?:\/\//, '')}
            </a>
          </li>
          <li>
            邮箱：<a href={`mailto:${site.email}`}>{site.email}</a>
          </li>
        </ul>
      </div>
    </div>
  );
}
