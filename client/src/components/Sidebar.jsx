import { useEffect, useMemo, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { request } from '../lib/api.js';
import { collectTags, formatDate, wordCount } from '../lib/utils.js';

const cardCls =
  'bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 card-fx';
const titleCls = 'font-semibold text-gray-900 dark:text-gray-100 text-sm mb-3';

export default function Sidebar() {
  const location = useLocation();
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    request('/posts').then(setPosts).catch(() => {});
  }, []);

  const tags = useMemo(() => collectTags(posts), [posts]);
  const totalChars = useMemo(
    () => posts.reduce((sum, p) => sum + wordCount(p.content), 0),
    [posts]
  );
  const years = useMemo(() => {
    const map = new Map();
    for (const post of posts) {
      const year = new Date(post.created_at).getFullYear();
      map.set(year, (map.get(year) || 0) + 1);
    }
    return [...map.entries()].sort((a, b) => b[0] - a[0]);
  }, [posts]);

  // Hide sidebar on admin pages and login page
  if (location.pathname.startsWith('/admin')) return null;

  return (
    <aside className="hidden lg:block space-y-5">
      {/* Blogger card */}
      <div className={`${cardCls} text-center`}>
        <img
          src="/avatar.jpg"
          alt="ぃ你若不离丶"
          className="w-20 h-20 mx-auto rounded-full object-cover ring-2 ring-indigo-300 dark:ring-purple-600 avatar-glow"
        />
        <h2 className="font-bold text-gray-900 dark:text-gray-100 mt-3">ぃ你若不离丶</h2>
        <p className="text-xs text-gray-400 mt-1 leading-relaxed">
          记录学习、技术与生活
          <br />
          输出是最好的输入
        </p>
        <div className="flex justify-center gap-2 mt-3">
          <a
            href="https://gitee.com/wangyu-0312"
            target="_blank"
            rel="noreferrer"
            className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full hover:bg-gray-900 hover:text-white dark:hover:bg-white dark:hover:text-gray-900 transition-colors"
          >
            🐙 Gitee
          </a>
          <a
            href="mailto:1224234724@qq.com"
            className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-3 py-1 rounded-full hover:bg-gray-900 hover:text-white dark:hover:bg-white dark:hover:text-gray-900 transition-colors"
          >
            ✉️ 邮箱
          </a>
        </div>
        <div className="grid grid-cols-3 divide-x divide-gray-100 dark:divide-gray-800 mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          <div>
            <p className="font-bold text-gray-900 dark:text-gray-100">{posts.length}</p>
            <p className="text-[11px] text-gray-400">文章</p>
          </div>
          <div>
            <p className="font-bold text-gray-900 dark:text-gray-100">{tags.length}</p>
            <p className="text-[11px] text-gray-400">标签</p>
          </div>
          <div>
            <p className="font-bold text-gray-900 dark:text-gray-100">{totalChars}</p>
            <p className="text-[11px] text-gray-400">字数</p>
          </div>
        </div>
      </div>

      {/* Recent posts */}
      <div className={cardCls}>
        <h2 className={titleCls}>📚 最近更新</h2>
        <ul className="space-y-3">
          {posts.slice(0, 5).map((post) => (
            <li key={post.id}>
              <Link to={`/post/${post.id}`} className="block group">
                <p className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors line-clamp-1">
                  {post.title}
                </p>
                <p className="text-[11px] text-gray-400 mt-0.5">{formatDate(post.created_at)}</p>
              </Link>
            </li>
          ))}
          {posts.length === 0 && <p className="text-xs text-gray-400">暂无文章</p>}
        </ul>
      </div>

      {/* Tag cloud */}
      <div className={cardCls}>
        <h2 className={titleCls}>🏷️ 标签云</h2>
        <div className="flex flex-wrap gap-2">
          {tags.map(({ name, count }) => (
            <Link
              key={name}
              to={`/?tag=${encodeURIComponent(name)}`}
              className="text-xs bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-full hover:bg-gray-900 hover:text-white dark:hover:bg-white dark:hover:text-gray-900 transition-colors"
            >
              {name} ({count})
            </Link>
          ))}
          {tags.length === 0 && <p className="text-xs text-gray-400">暂无标签</p>}
        </div>
      </div>

      {/* Archive shortcut */}
      <div className={cardCls}>
        <h2 className={titleCls}>🗓️ 归档</h2>
        <ul className="space-y-2">
          {years.map(([year, count]) => (
            <li key={year}>
              <Link
                to="/archive"
                className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
              >
                <span>{year} 年</span>
                <span className="text-xs text-gray-400">{count} 篇</span>
              </Link>
            </li>
          ))}
          {years.length === 0 && <p className="text-xs text-gray-400">暂无归档</p>}
        </ul>
      </div>

      {/* Links / site info */}
      <div className={cardCls}>
        <h2 className={titleCls}>🔗 关于本站</h2>
        <ul className="space-y-2 text-sm">
          <li>
            <a
              href="https://gitee.com/wangyu-0312/person-note"
              target="_blank"
              rel="noreferrer"
              className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              Gitee 仓库 ↗
            </a>
          </li>
          <li>
            <Link
              to="/about"
              className="text-gray-600 dark:text-gray-300 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
            >
              关于博主
            </Link>
          </li>
        </ul>
        <p className="text-[11px] text-gray-300 dark:text-gray-600 mt-4 leading-relaxed">
          React 19 + Vite + Tailwind CSS
          <br />
          Node.js + Express + MySQL
          <br />
          从零开始自主开发
        </p>
      </div>
    </aside>
  );
}
