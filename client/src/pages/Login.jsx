import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { request, setAuth, isLoggedIn } from '../lib/api.js';
import BackgroundFX from '../components/BackgroundFX.jsx';
import SakuraFX from '../components/SakuraFX.jsx';

export default function Login() {
  const navigate = useNavigate();

  // Already logged in? go straight to dashboard
  useEffect(() => {
    if (isLoggedIn()) navigate('/admin', { replace: true });
  }, [navigate]);
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const data = await request('/auth/login', {
        method: 'POST',
        body: { username, password },
      });
      setAuth(data.token, data.username);
      navigate('/admin');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4 transition-colors">
      <BackgroundFX />
      <SakuraFX count={18} />

      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold shimmer-text">后台登录</h1>
          <p className="text-gray-400 dark:text-gray-500 text-sm mt-2">
            ✦ 只有博主本人可以进入 ✦
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="glass-card rounded-2xl p-7 space-y-4 card-fx"
        >
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1.5">
              👤 用户名
            </label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full bg-white/70 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-shadow"
              placeholder="请输入用户名"
              autoFocus
            />
          </div>
          <div>
            <label className="block text-sm text-gray-600 dark:text-gray-300 mb-1.5">
              🔒 密码
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-white/70 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700 rounded-xl px-3.5 py-2.5 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-shadow"
              placeholder="请输入密码"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm bg-red-50 dark:bg-red-900/20 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="neon-btn w-full text-white rounded-xl py-2.5 text-sm font-bold tracking-widest"
          >
            {loading ? '登录中...' : '✨ 进入后台 ✨'}
          </button>
        </form>

        <p className="text-center mt-6">
          <Link
            to="/"
            className="text-sm text-gray-400 dark:text-gray-500 hover:text-purple-500 dark:hover:text-purple-400 transition-colors"
          >
            ← 返回博客首页
          </Link>
        </p>
      </div>
    </div>
  );
}
