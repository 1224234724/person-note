import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { request } from '../lib/api.js';
import { readingTime, wordCount, collectTags } from '../lib/utils.js';

function DateBadge({ dateStr }) {
  const d = new Date(dateStr);
  return (
    <div className="flex flex-col items-center justify-center w-16 h-16 rounded-xl bg-gray-100 shrink-0">
      <span className="text-xl font-bold text-gray-900 leading-none">{d.getDate()}</span>
      <span className="text-[11px] text-gray-400 mt-1">
        {d.getFullYear()}/{String(d.getMonth() + 1).padStart(2, '0')}
      </span>
    </div>
  );
}

export default function Home() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [keyword, setKeyword] = useState('');
  const [activeTag, setActiveTag] = useState('');

  useEffect(() => {
    request('/posts')
      .then(setPosts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const tags = useMemo(() => collectTags(posts), [posts]);
  const totalChars = useMemo(
    () => posts.reduce((sum, p) => sum + wordCount(p.content), 0),
    [posts]
  );

  const filtered = useMemo(() => {
    const kw = keyword.trim().toLowerCase();
    return posts.filter((post) => {
      if (activeTag && !post.tags.includes(activeTag)) return false;
      if (!kw) return true;
      return (
        post.title.toLowerCase().includes(kw) ||
        post.summary.toLowerCase().includes(kw) ||
        post.tags.some((t) => t.toLowerCase().includes(kw))
      );
    });
  }, [posts, keyword, activeTag]);

  if (loading) return <p className="text-gray-400 text-center py-20">加载中...</p>;
  if (error) return <p className="text-red-500 text-center py-20">出错了：{error}</p>;

  return (
    <div>
      {/* Hero section */}
      <section className="rounded-2xl bg-gradient-to-br from-gray-900 via-gray-800 to-gray-700 text-white p-8 md:p-10 mb-8">
        <h1 className="text-3xl font-bold">你好，欢迎来到我的博客 👋</h1>
        <p className="text-gray-300 mt-3 leading-relaxed">
          这里记录我的学习笔记、技术总结和生活随笔。
          <br />
          写作是思考的延伸，希望这里能成为我成长路上的见证。
        </p>
        <div className="flex gap-8 mt-6">
          <div>
            <p className="text-2xl font-bold">{posts.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">篇文章</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{tags.length}</p>
            <p className="text-xs text-gray-400 mt-0.5">个标签</p>
          </div>
          <div>
            <p className="text-2xl font-bold">{totalChars}</p>
            <p className="text-xs text-gray-400 mt-0.5">总字数</p>
          </div>
        </div>
      </section>

      {/* Search + tag filter */}
      <section className="mb-6 space-y-3">
        <input
          type="text"
          value={keyword}
          onChange={(e) => setKeyword(e.target.value)}
          placeholder="🔍 搜索文章标题、摘要或标签..."
          className="w-full bg-white border border-gray-200 rounded-xl px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        {tags.length > 0 && (
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setActiveTag('')}
              className={`text-xs px-3 py-1.5 rounded-full transition-colors ${
                activeTag === ''
                  ? 'bg-gray-900 text-white'
                  : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400'
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
                    ? 'bg-gray-900 text-white'
                    : 'bg-white border border-gray-200 text-gray-600 hover:border-gray-400'
                }`}
              >
                {name} ({count})
              </button>
            ))}
          </div>
        )}
      </section>

      {/* Post list */}
      {filtered.length === 0 && (
        <p className="text-gray-400 text-center py-20">
          {posts.length === 0 ? '还没有文章，快去后台写第一篇吧！' : '没有找到匹配的文章'}
        </p>
      )}

      <div className="space-y-5">
        {filtered.map((post) => (
          <article
            key={post.id}
            className="bg-white rounded-xl border border-gray-200 p-5 md:p-6 flex gap-5 hover:shadow-md hover:border-gray-300 transition-all"
          >
            <DateBadge dateStr={post.created_at} />
            <div className="min-w-0 flex-1">
              <Link to={`/post/${post.id}`}>
                <h2 className="text-lg font-semibold text-gray-900 hover:text-blue-600 transition-colors">
                  {post.title}
                </h2>
              </Link>
              <p className="text-gray-500 text-sm mt-1.5 leading-relaxed line-clamp-2">
                {post.summary || post.content.slice(0, 100)}
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-3 text-xs text-gray-400">
                <span>约 {readingTime(post.content)} 分钟读完</span>
                <span>·</span>
                <span>{wordCount(post.content)} 字</span>
                {post.tags.map((tag) => (
                  <button
                    key={tag}
                    onClick={() => setActiveTag(tag)}
                    className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full hover:bg-gray-200 transition-colors"
                  >
                    # {tag}
                  </button>
                ))}
              </div>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
