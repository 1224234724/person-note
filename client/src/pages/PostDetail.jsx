import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import { request } from '../lib/api.js';
import { formatDate, readingTime, wordCount } from '../lib/utils.js';

export default function PostDetail() {
  const { id } = useParams();
  const [post, setPost] = useState(null);
  const [neighbors, setNeighbors] = useState({ prev: null, next: null });
  const [error, setError] = useState('');

  useEffect(() => {
    setPost(null);
    setError('');
    request(`/posts/${id}`)
      .then(setPost)
      .catch((e) => setError(e.message));

    // Figure out prev/next posts from the full list
    request('/posts')
      .then((list) => {
        const idx = list.findIndex((p) => String(p.id) === String(id));
        if (idx === -1) return;
        // list is ordered newest first: next (older) = idx+1, prev (newer) = idx-1
        setNeighbors({ prev: list[idx - 1] || null, next: list[idx + 1] || null });
      })
      .catch(() => {});
  }, [id]);

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">{error}</p>
        <Link to="/" className="text-blue-600 text-sm mt-4 inline-block hover:underline">
          ← 返回首页
        </Link>
      </div>
    );
  }
  if (!post) return <p className="text-gray-400 text-center py-20">加载中...</p>;

  return (
    <article>
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 leading-snug">{post.title}</h1>
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-4 text-sm text-gray-400">
          <time>📅 {formatDate(post.created_at)}</time>
          <span>·</span>
          <span>{wordCount(post.content)} 字</span>
          <span>·</span>
          <span>约 {readingTime(post.content)} 分钟读完</span>
          {post.tags.map((tag) => (
            <span key={tag} className="bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full text-xs">
              # {tag}
            </span>
          ))}
        </div>
      </header>

      <div className="markdown-body bg-white rounded-xl border border-gray-200 p-6 md:p-8">
        <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
          {post.content}
        </ReactMarkdown>
      </div>

      {/* Prev / Next navigation */}
      <nav className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
        {neighbors.prev ? (
          <Link
            to={`/post/${neighbors.prev.id}`}
            className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-gray-300 transition-all"
          >
            <p className="text-xs text-gray-400">← 上一篇（更新）</p>
            <p className="text-sm font-medium text-gray-900 mt-1 line-clamp-1">
              {neighbors.prev.title}
            </p>
          </Link>
        ) : (
          <div />
        )}
        {neighbors.next && (
          <Link
            to={`/post/${neighbors.next.id}`}
            className="bg-white rounded-xl border border-gray-200 p-4 hover:shadow-md hover:border-gray-300 transition-all md:text-right"
          >
            <p className="text-xs text-gray-400">下一篇（更早）→</p>
            <p className="text-sm font-medium text-gray-900 mt-1 line-clamp-1">
              {neighbors.next.title}
            </p>
          </Link>
        )}
      </nav>

      <div className="mt-8 text-center">
        <Link to="/" className="text-blue-600 text-sm hover:underline">
          ← 返回文章列表
        </Link>
      </div>
    </article>
  );
}
