import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { request, clearAuth, getUsername } from '../lib/api.js';

export default function Admin() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState(null);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    Promise.all([request('/posts'), request('/stats')])
      .then(([list, s]) => {
        setPosts(list);
        setStats(s);
      })
      .catch((e) => setError(e.message));
  }, []);

  useEffect(load, [load]);

  function handleLogout() {
    clearAuth();
    navigate('/admin/login');
  }

  async function handleDelete(post) {
    if (!window.confirm(`确定要删除《${post.title}》吗？此操作不可恢复。`)) return;
    try {
      await request(`/posts/${post.id}`, { method: 'DELETE' });
      load();
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-4xl mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="font-bold text-gray-900">博客后台</h1>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-400">{getUsername()}</span>
            <Link to="/" className="text-gray-600 hover:text-gray-900">
              查看博客
            </Link>
            <button onClick={handleLogout} className="text-gray-600 hover:text-red-500">
              退出登录
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        {stats && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
              <p className="text-xs text-gray-400 mt-1">全部文章</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-green-600">{stats.published}</p>
              <p className="text-xs text-gray-400 mt-1">已发布</p>
            </div>
            <div className="bg-white rounded-xl border border-gray-200 p-4 text-center">
              <p className="text-2xl font-bold text-amber-500">{stats.draft}</p>
              <p className="text-xs text-gray-400 mt-1">草稿</p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">文章管理</h2>
          <Link
            to="/admin/edit"
            className="bg-gray-900 text-white text-sm px-4 py-2 rounded-lg hover:bg-gray-700 transition-colors"
          >
            + 写新文章
          </Link>
        </div>

        {error && <p className="text-red-500 text-sm mb-4">出错了：{error}</p>}

        <div className="bg-white rounded-xl border border-gray-200 divide-y divide-gray-100">
          {posts.length === 0 && (
            <p className="text-gray-400 text-sm text-center py-10">还没有文章</p>
          )}
          {posts.map((post) => (
            <div key={post.id} className="p-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Link
                    to={`/admin/edit/${post.id}`}
                    className="font-medium text-gray-900 hover:text-blue-600 truncate"
                  >
                    {post.title}
                  </Link>
                  {post.published === 0 && (
                    <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full shrink-0">
                      草稿
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(post.created_at).toLocaleDateString('zh-CN')}
                  {post.tags.length > 0 && ` · ${post.tags.join(' / ')}`}
                </p>
              </div>
              <div className="flex items-center gap-3 text-sm shrink-0">
                <Link to={`/admin/edit/${post.id}`} className="text-blue-600 hover:underline">
                  编辑
                </Link>
                <button
                  onClick={() => handleDelete(post)}
                  className="text-red-500 hover:underline"
                >
                  删除
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
