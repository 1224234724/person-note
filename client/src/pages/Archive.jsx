import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { request } from '../lib/api.js';
import { formatDate } from '../lib/utils.js';

export default function Archive() {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    request('/posts')
      .then(setPosts)
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  // Group posts by year, newest first
  const groups = useMemo(() => {
    const map = new Map();
    for (const post of posts) {
      const year = new Date(post.created_at).getFullYear();
      if (!map.has(year)) map.set(year, []);
      map.get(year).push(post);
    }
    return [...map.entries()].sort((a, b) => b[0] - a[0]);
  }, [posts]);

  if (loading) return <p className="text-gray-400 text-center py-20">加载中...</p>;
  if (error) return <p className="text-red-500 text-center py-20">出错了：{error}</p>;

  return (
    <div>
      <section className="mb-10">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">文章归档</h1>
        <p className="text-gray-500 text-sm mt-1">
          目前共计 {posts.length} 篇文章，继续加油！
        </p>
      </section>

      <div className="space-y-10">
        {groups.map(([year, items]) => (
          <section key={year}>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-4">{year}</h2>
            <div className="relative border-l-2 border-gray-200 dark:border-gray-800 ml-2 space-y-6">
              {items.map((post) => (
                <div key={post.id} className="relative pl-6">
                  <span className="absolute -left-[7px] top-1.5 w-3 h-3 rounded-full bg-white dark:bg-gray-950 border-2 border-gray-900 dark:border-gray-400" />
                  <time className="text-xs text-gray-400">{formatDate(post.created_at)}</time>
                  <Link to={`/post/${post.id}`} className="block mt-0.5">
                    <span className="text-gray-800 dark:text-gray-200 font-medium hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                      {post.title}
                    </span>
                  </Link>
                </div>
              ))}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
