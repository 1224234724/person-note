import { Link, NavLink, Outlet } from 'react-router-dom';
import Sidebar from './Sidebar.jsx';
import ThemeToggle from './ThemeToggle.jsx';
import BackgroundFX from './BackgroundFX.jsx';
import ScrollProgress from './ScrollProgress.jsx';

const navItem = ({ isActive }) =>
  `px-3 py-1.5 rounded-md text-sm transition-colors ${
    isActive
      ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 dark:text-gray-300 dark:hover:text-white dark:hover:bg-gray-800'
  }`;

export default function Layout() {
  return (
    <div className="min-h-screen flex flex-col transition-colors">
      <ScrollProgress />
      <BackgroundFX />
      <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-[1600px] mx-auto px-6 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-gray-900 dark:bg-white text-white dark:text-gray-900 flex items-center justify-center text-sm font-bold">
              博
            </span>
            <span className="font-bold text-gray-900 dark:text-gray-100">我的博客</span>
          </Link>
          <nav className="flex items-center gap-1">
            <NavLink to="/" className={navItem} end>
              首页
            </NavLink>
            <NavLink to="/archive" className={navItem}>
              归档
            </NavLink>
            <NavLink to="/about" className={navItem}>
              关于
            </NavLink>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-[1600px] w-full mx-auto px-6 py-8 grid gap-8 lg:grid-cols-[minmax(0,1fr)_340px] items-start">
        <div className="min-w-0">
          <Outlet />
        </div>
        <Sidebar />
      </main>

      <footer className="border-t border-gray-200 dark:border-gray-800 bg-white/60 dark:bg-gray-900/60 backdrop-blur mt-8">
        <div className="max-w-[1600px] mx-auto px-6 py-8 text-center space-y-2">
          <p className="text-sm text-gray-500 dark:text-gray-400">记录学习、技术与生活</p>
          <p className="text-sm flex items-center justify-center gap-4">
            <a
              href="https://gitee.com/wangyu-0312"
              target="_blank"
              rel="noreferrer"
              className="text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              🐙 Gitee
            </a>
            <a
              href="mailto:1224234724@qq.com"
              className="text-gray-500 dark:text-gray-400 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              ✉️ 1224234724@qq.com
            </a>
          </p>
          <p className="text-xs text-gray-400 dark:text-gray-500">
            © {new Date().getFullYear()} 我的个人博客 · Powered by React + Node.js + MySQL
          </p>
          <p className="text-xs text-gray-300 dark:text-gray-600">
            <Link to="/admin/login" className="hover:text-gray-500 transition-colors">
              博主入口
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
