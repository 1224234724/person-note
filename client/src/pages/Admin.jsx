import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { request, clearAuth, getUsername } from '../lib/api.js';
import BackgroundFX from '../components/BackgroundFX.jsx';
import SakuraFX from '../components/SakuraFX.jsx';
import DifficultyBadge from '../components/DifficultyBadge.jsx';

const cardCls =
  'glass-card rounded-xl divide-y divide-gray-200/60 dark:divide-gray-700/60';

export default function Admin() {
  const navigate = useNavigate();
  const [posts, setPosts] = useState([]);
  const [stats, setStats] = useState(null);
  const [comments, setComments] = useState([]);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    Promise.all([request('/posts'), request('/stats'), request('/comments')])
      .then(([list, s, cs]) => {
        setPosts(list);
        setStats(s);
        setComments(cs);
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

  async function handleDeleteComment(comment) {
    if (!window.confirm(`确定删除 ${comment.nickname} 的评论吗？`)) return;
    try {
      await request(`/comments/${comment.id}`, { method: 'DELETE' });
      load();
    } catch (e) {
      alert(e.message);
    }
  }

  return (
    <div className="min-h-screen transition-colors">
      <BackgroundFX />
      <SakuraFX count={12} />

      <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <h1 className="font-bold shimmer-text text-lg">✨ 博客后台</h1>
          <div className="flex items-center gap-3 text-sm">
            <span className="text-gray-400">👤 {getUsername()}</span>
            <Link
              to="/"
              className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              查看博客
            </Link>
            <button
              onClick={handleLogout}
              className="text-gray-600 dark:text-gray-300 hover:text-red-500 transition-colors"
            >
              退出登录
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-6 py-8">
        {stats && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="glass-card rounded-xl p-4 text-center card-fx">
              <p className="text-2xl font-bold text-indigo-600 dark:text-indigo-400">
                {stats.total}
              </p>
              <p className="text-xs text-gray-400 mt-1">全部文章</p>
            </div>
            <div className="glass-card rounded-xl p-4 text-center card-fx">
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {stats.published}
              </p>
              <p className="text-xs text-gray-400 mt-1">已发布</p>
            </div>
            <div className="glass-card rounded-xl p-4 text-center card-fx">
              <p className="text-2xl font-bold text-amber-500">{stats.draft}</p>
              <p className="text-xs text-gray-400 mt-1">草稿</p>
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">📝 文章管理</h2>
          <Link
            to="/admin/edit"
            className="neon-btn text-white text-sm px-4 py-2 rounded-lg font-medium"
          >
            ✍️ 写新文章
          </Link>
        </div>

        {error && <p className="text-red-500 text-sm mb-4">出错了：{error}</p>}

        <div className={cardCls}>
          {posts.length === 0 && (
            <p className="text-gray-400 text-sm text-center py-10">还没有文章</p>
          )}
          {posts.map((post) => (
            <div
              key={post.id}
              className="p-4 flex items-center justify-between gap-4 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-colors"
            >
              <div className="min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                  <Link
                    to={`/admin/edit/${post.id}`}
                    className="font-medium text-gray-900 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors truncate"
                  >
                    {post.title}
                  </Link>
                  <DifficultyBadge difficulty={post.difficulty} />
                  {post.published === 0 && (
                    <span className="text-xs bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-300 px-2 py-0.5 rounded-full shrink-0">
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
                <Link
                  to={`/admin/edit/${post.id}`}
                  className="text-indigo-600 dark:text-indigo-400 hover:underline"
                >
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

        {/* Comment moderation */}
        <h2 className="font-semibold text-gray-900 dark:text-gray-100 mt-10 mb-4">
          💬 评论管理（{comments.length}）
        </h2>
        <div className={cardCls}>
          {comments.length === 0 && (
            <p className="text-gray-400 text-sm text-center py-10">还没有评论</p>
          )}
          {comments.map((c) => (
            <div
              key={c.id}
              className="p-4 flex items-start justify-between gap-4 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/10 transition-colors"
            >
              <div className="min-w-0">
                <p className="text-sm text-gray-900 dark:text-gray-100">
                  <span className="font-medium">{c.nickname}</span>
                  <span className="text-xs text-gray-400 ml-2">
                    {new Date(c.created_at).toLocaleString('zh-CN')}
                  </span>
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 break-words">
                  {c.content}
                </p>
                {c.post_title && (
                  <p className="text-xs text-gray-400 mt-1">评论于《{c.post_title}》</p>
                )}
              </div>
              <button
                onClick={() => handleDeleteComment(c)}
                className="text-sm text-red-500 hover:underline shrink-0"
              >
                删除
              </button>
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
