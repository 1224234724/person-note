import { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import { request } from '../lib/api.js';
import { formatDate, readingTime, wordCount } from '../lib/utils.js';
import Comments from '../components/Comments.jsx';

/** Extract h1~h3 headings from markdown, skipping fenced code blocks */
function parseToc(markdown) {
  const headings = [];
  let inCode = false;
  for (const line of (markdown || '').split('\n')) {
    if (line.trim().startsWith('```')) {
      inCode = !inCode;
      continue;
    }
    if (inCode) continue;
    const m = /^(#{1,3})\s+(.+)$/.exec(line);
    if (m) headings.push({ level: m[1].length, text: m[2].trim() });
  }
  return headings;
}

function TocNav({ headings, articleRef }) {
  function jump(index) {
    // Rendered headings appear in the same order as the parsed ones
    const els = articleRef.current?.querySelectorAll('h1, h2, h3');
    els?.[index]?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  return (
    <nav className="hidden xl:block sticky top-20 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4">
      <p className="font-semibold text-gray-900 dark:text-gray-100 text-sm mb-2">📖 本文目录</p>
      <ul className="space-y-1.5 max-h-[60vh] overflow-auto">
        {headings.map((h, i) => (
          <li key={i}>
            <button
              onClick={() => jump(i)}
              style={{ paddingLeft: `${(h.level - 1) * 12}px` }}
              className="block w-full text-left text-xs text-gray-500 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors leading-relaxed"
            >
              {h.text}
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}

export default function PostDetail() {
  const { id } = useParams();
  const articleRef = useRef(null);
  const [post, setPost] = useState(null);
  const [neighbors, setNeighbors] = useState({ prev: null, next: null });
  const [error, setError] = useState('');

  useEffect(() => {
    setPost(null);
    setError('');
    window.scrollTo(0, 0);
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

  const toc = useMemo(() => parseToc(post?.content), [post?.content]);

  if (error) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 dark:text-gray-400">{error}</p>
        <Link to="/" className="text-blue-600 text-sm mt-4 inline-block hover:underline">
          ← 返回首页
        </Link>
      </div>
    );
  }
  if (!post) return <p className="text-gray-400 text-center py-20">加载中...</p>;

  return (
    <article>
      <div className="xl:grid xl:grid-cols-[minmax(0,1fr)_230px] xl:gap-8 items-start">
        <div className="min-w-0">
          <header className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 leading-snug">
              {post.title}
            </h1>
            <div className="flex flex-wrap items-center gap-x-3 gap-y-2 mt-4 text-sm text-gray-400">
              <time>📅 {formatDate(post.created_at)}</time>
              <span>·</span>
              <span>{wordCount(post.content)} 字</span>
              <span>·</span>
              <span>约 {readingTime(post.content)} 分钟读完</span>
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded-full text-xs"
                >
                  # {tag}
                </span>
              ))}
            </div>
          </header>

          <div
            ref={articleRef}
            className="markdown-body bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 md:p-8 scroll-mt-20 [&_h1]:scroll-mt-20 [&_h2]:scroll-mt-20 [&_h3]:scroll-mt-20"
          >
            <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
              {post.content}
            </ReactMarkdown>
          </div>

          {/* Prev / Next navigation */}
          <nav className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
            {neighbors.prev ? (
              <Link
                to={`/post/${neighbors.prev.id}`}
                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-700 transition-all"
              >
                <p className="text-xs text-gray-400">← 上一篇（更新）</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 line-clamp-1">
                  {neighbors.prev.title}
                </p>
              </Link>
            ) : (
              <div />
            )}
            {neighbors.next && (
              <Link
                to={`/post/${neighbors.next.id}`}
                className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-4 hover:shadow-md hover:border-gray-300 dark:hover:border-gray-700 transition-all md:text-right"
              >
                <p className="text-xs text-gray-400">下一篇（更早）→</p>
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 mt-1 line-clamp-1">
                  {neighbors.next.title}
                </p>
              </Link>
            )}
          </nav>

          {/* Comments */}
          <div className="mt-6">
            <Comments postId={post.id} />
          </div>

          <div className="mt-8 text-center">
            <Link to="/" className="text-blue-600 text-sm hover:underline">
              ← 返回文章列表
            </Link>
          </div>
        </div>

        {/* TOC sidebar (extra-wide screens only) */}
        {toc.length > 1 && <TocNav headings={toc} articleRef={articleRef} />}
      </div>
    </article>
  );
}
