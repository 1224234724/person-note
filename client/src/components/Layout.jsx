import { Link, NavLink, Outlet } from 'react-router-dom';

const navItem = ({ isActive }) =>
  `px-3 py-1.5 rounded-md text-sm transition-colors ${
    isActive
      ? 'bg-gray-900 text-white'
      : 'text-gray-600 hover:text-gray-900 hover:bg-gray-100'
  }`;

export default function Layout() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="sticky top-0 z-10 bg-white/80 backdrop-blur border-b border-gray-200">
        <div className="max-w-3xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2">
            <span className="w-7 h-7 rounded-lg bg-gray-900 text-white flex items-center justify-center text-sm font-bold">
              博
            </span>
            <span className="font-bold text-gray-900">我的博客</span>
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
          </nav>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 py-8">
        <Outlet />
      </main>

      <footer className="border-t border-gray-200 bg-white mt-8">
        <div className="max-w-3xl mx-auto px-4 py-8 text-center space-y-2">
          <p className="text-sm text-gray-500">记录学习、技术与生活</p>
          <p className="text-xs text-gray-400">
            © {new Date().getFullYear()} 我的个人博客 · Powered by React + Node.js + MySQL
          </p>
          <p className="text-xs text-gray-300">
            <Link to="/admin/login" className="hover:text-gray-500 transition-colors">
              博主入口
            </Link>
          </p>
        </div>
      </footer>
    </div>
  );
}
