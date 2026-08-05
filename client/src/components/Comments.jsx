import { useEffect, useState } from 'react';
import { request } from '../lib/api.js';
import { formatDate } from '../lib/utils.js';

const NICKNAME_KEY = 'blog_comment_nickname';

export default function Comments({ postId }) {
  const [comments, setComments] = useState([]);
  const [nickname, setNickname] = useState(() => localStorage.getItem(NICKNAME_KEY) || '');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function load() {
    request(`/posts/${postId}/comments`).then(setComments).catch(() => {});
  }

  useEffect(load, [postId]);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await request(`/posts/${postId}/comments`, {
        method: 'POST',
        body: { nickname, content },
      });
      localStorage.setItem(NICKNAME_KEY, nickname);
      setContent('');
      load();
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls =
    'w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <section className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6">
      <h2 className="font-semibold text-gray-900 dark:text-gray-100 mb-4">
        💬 评论 ({comments.length})
      </h2>

      {/* Comment list */}
      <ul className="space-y-4 mb-6">
        {comments.map((c) => (
          <li key={c.id} className="flex gap-3">
            <div className="w-9 h-9 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-sm font-bold text-gray-500 dark:text-gray-300 shrink-0">
              {c.nickname.slice(0, 1).toUpperCase()}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-baseline gap-2">
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                  {c.nickname}
                </span>
                <time className="text-xs text-gray-400">{formatDate(c.created_at)}</time>
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 whitespace-pre-wrap break-words">
                {c.content}
              </p>
            </div>
          </li>
        ))}
        {comments.length === 0 && (
          <p className="text-sm text-gray-400">还没有评论，来抢沙发～</p>
        )}
      </ul>

      {/* Comment form */}
      <form onSubmit={handleSubmit} className="space-y-3">
        <input
          type="text"
          value={nickname}
          onChange={(e) => setNickname(e.target.value)}
          placeholder="你的昵称"
          maxLength={50}
          className={`${inputCls} md:w-1/3`}
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="写下你的评论..."
          maxLength={1000}
          rows={3}
          className={`${inputCls} resize-none`}
        />
        <div className="flex items-center justify-between">
          {error ? <p className="text-red-500 text-sm">{error}</p> : <span />}
          <button
            type="submit"
            disabled={submitting}
            className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm px-5 py-2 rounded-lg hover:bg-gray-700 dark:hover:bg-gray-200 transition-colors disabled:opacity-50"
          >
            {submitting ? '发送中...' : '发表评论'}
          </button>
        </div>
      </form>
    </section>
  );
}
