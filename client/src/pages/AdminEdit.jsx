import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import { request } from '../lib/api.js';

export default function AdminEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [tags, setTags] = useState('');
  const [content, setContent] = useState('');
  const [published, setPublished] = useState(true);
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isEdit) return;
    request(`/posts/${id}`)
      .then((post) => {
        setTitle(post.title);
        setSummary(post.summary);
        setTags(post.tags.join(','));
        setContent(post.content);
        setPublished(post.published === 1);
      })
      .catch((e) => setError(e.message));
  }, [id, isEdit]);

  async function handleSave() {
    setError('');
    if (!title.trim()) {
      setError('请填写标题');
      return;
    }
    setSaving(true);
    const body = {
      title,
      summary,
      content,
      tags: tags
        .split(/[,，]/)
        .map((t) => t.trim())
        .filter(Boolean),
      published: published ? 1 : 0,
    };
    try {
      if (isEdit) {
        await request(`/posts/${id}`, { method: 'PUT', body });
      } else {
        await request('/posts', { method: 'POST', body });
      }
      navigate('/admin');
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  const inputCls =
    'w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500';

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white border-b border-gray-200">
        <div className="max-w-5xl mx-auto px-4 h-14 flex items-center justify-between">
          <h1 className="font-bold text-gray-900">{isEdit ? '编辑文章' : '写新文章'}</h1>
          <div className="flex items-center gap-3 text-sm">
            <label className="flex items-center gap-1.5 text-gray-600 cursor-pointer">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
              />
              发布（取消则为草稿）
            </label>
            <Link to="/admin" className="text-gray-600 hover:text-gray-900">
              取消
            </Link>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-gray-900 text-white px-4 py-1.5 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              {saving ? '保存中...' : '保存'}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-4 py-6 flex flex-col gap-4">
        {error && <p className="text-red-500 text-sm">{error}</p>}

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="文章标题"
          className={`${inputCls} text-lg font-semibold`}
        />

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <input
            type="text"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            placeholder="一句话摘要（显示在文章列表）"
            className={inputCls}
          />
          <input
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="标签，用逗号分隔，如：React,笔记"
            className={inputCls}
          />
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setPreview(false)}
            className={`text-sm px-3 py-1.5 rounded-md ${
              !preview ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            编写
          </button>
          <button
            onClick={() => setPreview(true)}
            className={`text-sm px-3 py-1.5 rounded-md ${
              preview ? 'bg-gray-900 text-white' : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            预览
          </button>
        </div>

        {preview ? (
          <div className="flex-1 min-h-[420px] bg-white rounded-xl border border-gray-200 p-6 overflow-auto">
            {content.trim() ? (
              <div className="markdown-body">
                <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeHighlight]}>
                  {content}
                </ReactMarkdown>
              </div>
            ) : (
              <p className="text-gray-400 text-sm">（暂无内容）</p>
            )}
          </div>
        ) : (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={'用 Markdown 写作，例如：\n\n# 标题\n\n正文内容...\n\n```js\nconsole.log("代码块");\n```'}
            className="flex-1 min-h-[420px] w-full bg-white border border-gray-300 rounded-xl p-4 font-mono text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
          />
        )}
      </main>
    </div>
  );
}
