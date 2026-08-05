import { useEffect, useState } from 'react';
import { request } from '../lib/api.js';
import { formatDate } from '../lib/utils.js';
import FadeIn from '../components/FadeIn.jsx';
import { useSite } from '../lib/site.jsx';

const NICKNAME_KEY = 'blog_comment_nickname';
const AVATAR_COLORS = ['bg-pink-400', 'bg-indigo-400', 'bg-emerald-400', 'bg-amber-400', 'bg-sky-400'];

export default function Messages() {
  const site = useSite();
  const [messages, setMessages] = useState([]);
  const [nickname, setNickname] = useState(() => localStorage.getItem(NICKNAME_KEY) || '');
  const [content, setContent] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  function load() {
    request('/messages').then(setMessages).catch(() => {});
  }

  useEffect(load, []);

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await request('/messages', { method: 'POST', body: { nickname, content } });
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
    'w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500';

  return (
    <div className="space-y-6">
      <FadeIn>
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-pink-500 via-purple-600 to-slate-900 text-white p-8 card-fx">
          <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <h1 className="text-3xl font-bold shimmer-text">📮 留言板</h1>
          <p className="text-pink-100 mt-2 text-sm leading-relaxed">
            路过的朋友，留下你的足迹吧～ 无论是打招呼、提建议还是唠嗑，{site.nickname} 都会看到！
          </p>
        </section>
      </FadeIn>

      {/* 留言表单 */}
      <FadeIn delay={100}>
        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 space-y-3"
        >
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">✏️ 写下你的留言</h2>
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
            placeholder="想说点什么...（最长 500 字）"
            maxLength={500}
            rows={3}
            className={`${inputCls} resize-none`}
          />
          <div className="flex items-center justify-between">
            {error ? <p className="text-red-500 text-sm">{error}</p> : <span />}
            <button
              type="submit"
              disabled={submitting}
              className="neon-btn text-white text-sm px-5 py-2 rounded-lg font-medium disabled:opacity-50"
            >
              {submitting ? '发送中...' : '🚀 发射留言'}
            </button>
          </div>
        </form>
      </FadeIn>

      {/* 留言列表 */}
      <div className="space-y-4">
        {messages.map((m, idx) => (
          <FadeIn key={m.id} delay={Math.min(idx, 6) * 50}>
            <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 flex gap-3 card-fx">
              <div
                className={`w-10 h-10 rounded-full ${AVATAR_COLORS[idx % AVATAR_COLORS.length]} flex items-center justify-center text-white text-sm font-bold shrink-0`}
              >
                {m.nickname.slice(0, 1).toUpperCase()}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-baseline gap-2">
                  <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {m.nickname}
                  </span>
                  <time className="text-xs text-gray-400">{formatDate(m.created_at)}</time>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1 whitespace-pre-wrap break-words">
                  {m.content}
                </p>
              </div>
            </div>
          </FadeIn>
        ))}
        {messages.length === 0 && (
          <p className="text-gray-400 text-center py-16">还没有留言，来做第一个吧～ 🌸</p>
        )}
      </div>
    </div>
  );
}
