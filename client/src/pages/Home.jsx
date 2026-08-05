import { useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { request } from '../lib/api.js';
import { readingTime, wordCount, collectTags } from '../lib/utils.js';
import FadeIn from '../components/FadeIn.jsx';
import DifficultyBadge from '../components/DifficultyBadge.jsx';
import ResumeModal from '../components/ResumeModal.jsx';
import { useSite } from '../lib/site.jsx';

function useTyping(words, speed = 110, pause = 1800) {
  const [text, setText] = useState('');
  useEffect(() => {
    let word = 0;
    let char = 0;
    let deleting = false;
    let timer;
    const tick = () => {
      const w = words[word];
      if (!deleting) {
        char++;
        if (char >= w.length) {
          deleting = true;
          setText(w);
          timer = setTimeout(tick, pause);
          return;
        }
      } else {
        char--;
        if (char <= 0) {
          deleting = false;
          word = (word + 1) % words.length;
        }
      }
      setText(w.slice(0, char));
      timer = setTimeout(tick, deleting ? 45 : speed);
    };
    timer = setTimeout(tick, speed);
    return () => clearTimeout(timer);
  }, [words, speed, pause]);
  return text;
}

function DateBadge({ dateStr }) {
  const d = new Date(dateStr);
  return (
    <div className="flex flex-col items-center justify-center w-16 h-16 rounded-xl bg-gray-100 dark:bg-gray-800 shrink-0">
      <span className="text-xl font-bold text-gray-900 dark:text-gray-100 leading-none">{d.getDate()}</span>
      <span className="text-[11px] text-gray-400 mt-1">
        {d.getFullYear()}/{String(d.getMonth() + 1).padStart(2, '0')}
      </span>
    </div>
  );
}

export default function Home() {
  const site = useSite();
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [keyword, setKeyword] = useState('');
  const [resumeUrl, setResumeUrl] = useState(null);
  const [showResume, setShowResume] = useState(false);
  // 打字机文案来自站点设置，用 | 分隔
  const heroWords = useMemo(
    () => site.typing_words.split('|').map((s) => s.trim()).filter(Boolean),
    [site.typing_words]
  );
  const typed = useTyping(heroWords);
  // Active tag lives in the URL (?tag=xxx) so the sidebar tag cloud can link here
  const activeTag = searchParams.get('tag') || '';
  const setActiveTag = (tag) => setSearchParams(tag ? { tag } : {});

  useEffect(() => {
    request('/posts')
      .then(setPosts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
    // 简历存在时才显示入口
    request('/resume')
      .then(({ url }) => setResumeUrl(url))
      .catch(() => {});
  }, []);

  const tags = useMemo(() => collectTags(posts), [posts]);
  const totalChars = useMemo(
    () => posts.reduce((sum, p) => sum + wordCount(p.content), 0),
    [posts]
  );
  // 最新文章排在最上面
  const byLatest = useMemo(
    () => [...posts].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)),
    [posts]
  );

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return byLatest.filter((post) => {
      if (activeTag && !post.tags.includes(activeTag)) return false;
      if (!kw) return true;
      return (
        post.title.toLowerCase().includes(kw) ||
        post.summary.toLowerCase().includes(kw) ||
        post.tags.some((t) => t.toLowerCase().includes(kw))
      );
    });
  }, [byLatest, keyword, activeTag]);

  if (loading) return <p className="text-gray-400 text-center py-20">加载中...</p>;
  if (error) return <p className="text-red-500 text-center py-20">出错了：{error}</p>;

  return (
    <div>
      {/* Hero section */}
      <FadeIn>
        <section className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-slate-900 text-white p-8 md:p-10 mb-8 card-fx">
          <div className="absolute -top-16 -right-16 w-56 h-56 rounded-full bg-white/10 blur-2xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-10 w-64 h-64 rounded-full bg-fuchsia-400/20 blur-3xl pointer-events-none" />
          <h1 className="text-3xl font-bold shimmer-text">{site.hero_title}</h1>
          <p className="text-indigo-100 mt-3 text-lg font-medium h-7">
            {typed}
            <span className="type-caret" />
          </p>
          <p className="text-indigo-200/80 mt-3 leading-relaxed text-sm">
            {site.hero_desc}
          </p>
          {resumeUrl && (
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowResume(true)}
                className="neon-btn text-white text-sm px-5 py-2 rounded-lg font-medium"
              >
                📄 查看我的简历
              </button>
              <a
                href={resumeUrl}
                download
                className="text-sm px-5 py-2 rounded-lg font-medium bg-white/15 hover:bg-white/25 text-white transition-colors"
              >
                ⬇️ 直接下载
              </a>
            </div>
          )}
          <div className="flex gap-8 mt-6">
            <div>
              <p className="text-2xl font-bold">{posts.length}</p>
              <p className="text-xs text-indigo-200/70 mt-0.5">篇文章</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{tags.length}</p>
              <p className="text-xs text-indigo-200/70 mt-0.5">个标签</p>
            </div>
            <div>
              <p className="text-2xl font-bold">{totalChars}</p>
              <p className="text-xs text-indigo-200/70 mt-0.5">总字数</p>
            </div>
          </div>
        </section>
      </FadeIn>

      {/* Search + tag filter */}
      <section className="mb-6 space-y-3">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="🔍 搜索文章标题、摘要或标签..."
          className="w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-gray-100 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTag('')}
              className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                activeTag === ''
                  ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                  : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:border-gray-400'
              }`}
            >
              全部
            </button>
            {tags.map(({ name, count }) => (
              <button
                key={name}
                onClick={() => setActiveTag(activeTag === name ? '' : name)}
                className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                  activeTag === name
                    ? 'bg-gray-900 text-white dark:bg-white dark:text-gray-900'
                    : 'bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-600 dark:text-gray-300 hover:border-gray-400'
                }`}
              >
                {name} ({count})
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Post list */}
      <div className="flex items-center justify-between mb-3">
        <h2 className="font-semibold text-gray-900 dark:text-gray-100">📖 全部文章</h2>
        <span className="text-xs text-gray-400">最新发布的文章在最上面 ↓</span>
      </div>

      {filtered.length === 0 && (
        <p className="text-gray-400 text-center py-20">
          {posts.length === 0 ? '还没有文章，快去后台写第一篇吧！' : '没有找到匹配的文章'}
        </p>
      )}

      <div className="space-y-5">
        {filtered.map((post, idx) => (
          <FadeIn key={post.id} delay={Math.min(idx, 5) * 60}>
            <article className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-5 md:p-6 flex gap-5 card-fx hover:border-indigo-300 dark:hover:border-indigo-700">
              <DateBadge dateStr={post.created_at} />
              <div className="min-w-0 flex-1">
                <Link to={`/post/${post.id}`}>
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors">
                    {post.title}
                  </h2>
                </Link>
                {post.cover && (
                  <Link to={`/post/${post.id}`} className="block mt-3">
                    <img
                      src={post.cover}
                      alt={post.title}
                      loading="lazy"
                      className="w-full max-h-56 object-cover rounded-lg border border-gray-100 dark:border-gray-800"
                    />
                  </Link>
                )}
                <p className="text-gray-500 text-sm mt-1.5 leading-relaxed line-clamp-2">
                  {post.summary || post.content.slice(0, 100)}
                </p>
                <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-gray-400">
                  <DifficultyBadge difficulty={post.difficulty} />
                  <span>约 {readingTime(post.content)} 分钟读完</span>
                  <span>·</span>
                  <span>👀 {post.views || 0}</span>
                  <span>·</span>
                  <span>❤️ {post.likes || 0}</span>
                  <span>·</span>
                  <span>{wordCount(post.content)} 字</span>
                  {post.tags.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setActiveTag(tag)}
                      className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full hover:bg-indigo-100 hover:text-indigo-700 dark:hover:bg-indigo-900 dark:hover:text-indigo-300 transition-colors"
                    >
                      # {tag}
                    </button>
                  ))}
                </div>
              </div>
            </article>
          </FadeIn>
        ))}
      </div>

      {/* 简历预览弹窗 */}
      {showResume && resumeUrl && (
        <ResumeModal url={resumeUrl} onClose={() => setShowResume(false)} />
      )}
    </div>
  );
}
