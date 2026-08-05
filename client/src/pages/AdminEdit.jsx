import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import 'highlight.js/styles/github-dark.css';
import { request, getToken } from '../lib/api.js';
import BackgroundFX from '../components/BackgroundFX.jsx';
import SakuraFX from '../components/SakuraFX.jsx';

// 难度档位与代表值（保存时写入该值）
const DIFF_LEVELS = [
  { label: '入门', value: 10 },
  { label: '进阶', value: 40 },
  { label: '高级', value: 70 },
  { label: '深入', value: 90 },
];
const levelOf = (v) => {
  if (v <= 20) return DIFF_LEVELS[0];
  if (v <= 55) return DIFF_LEVELS[1];
  if (v <= 80) return DIFF_LEVELS[2];
  return DIFF_LEVELS[3];
};

// Markdown 工具栏按钮定义
const TOOLBAR = [
  { icon: 'H2', title: '二级标题', type: 'line', prefix: '## ' },
  { icon: 'H3', title: '三级标题', type: 'line', prefix: '### ' },
  { icon: 'B', title: '加粗', type: 'wrap', before: '**', after: '**', ph: '加粗文本' },
  { icon: 'I', title: '斜体', type: 'wrap', before: '*', after: '*', ph: '斜体文本' },
  { icon: '~S~', title: '删除线', type: 'wrap', before: '~~', after: '~~', ph: '删除文本' },
  { icon: '<>', title: '行内代码', type: 'wrap', before: '`', after: '`', ph: 'code' },
  { icon: '▤', title: '代码块', type: 'block', text: '\n```js\n// 代码写在这里\n```\n' },
  { icon: '🔗', title: '插入链接', type: 'wrap', before: '[', after: '](https://)', ph: '链接文字' },
  { icon: '🖼', title: '插入图片', type: 'block', text: '\n![图片描述](https://)\n' },
  { icon: '📤', title: '上传图片并插入正文', type: 'upload' },
  { icon: '❝', title: '引用', type: 'line', prefix: '> ' },
  { icon: '•', title: '无序列表', type: 'line', prefix: '- ' },
  { icon: '1.', title: '有序列表', type: 'line', prefix: '1. ' },
  { icon: '▦', title: '插入表格', type: 'block', text: '\n| 列1 | 列2 | 列3 |\n| --- | --- | --- |\n| 内容 | 内容 | 内容 |\n' },
  { icon: '—', title: '分割线', type: 'block', text: '\n\n---\n\n' },
];

const DRAFT_KEY = 'blog-draft-new';

export default function AdminEdit() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;
  const taRef = useRef(null);
  const fileRef = useRef(null);

  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [tags, setTags] = useState('');
  const [content, setContent] = useState('');
  const [difficulty, setDifficulty] = useState(50);
  const [cover, setCover] = useState('');
  const [published, setPublished] = useState(true);
  const [view, setView] = useState('edit'); // edit | preview | split
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [draftMsg, setDraftMsg] = useState('');
  const [savedAt, setSavedAt] = useState('');

  // 编辑已有文章：从接口加载
  useEffect(() => {
    if (!isEdit) return;
    request(`/posts/${id}`)
      .then((post) => {
        setTitle(post.title);
        setSummary(post.summary);
        setTags(post.tags.join(','));
        setContent(post.content);
        setDifficulty(post.difficulty ?? 50);
        setCover(post.cover || '');
        setPublished(post.published === 1);
      })
      .catch((e) => setError(e.message));
  }, [id, isEdit]);

  // 新建文章：恢复本地草稿
  useEffect(() => {
    if (isEdit) return;
    const raw = localStorage.getItem(DRAFT_KEY);
    if (!raw) return;
    try {
      const draft = JSON.parse(raw);
      if (draft.title || draft.content) {
        setTitle(draft.title || '');
        setSummary(draft.summary || '');
        setTags(draft.tags || '');
        setContent(draft.content || '');
        setDifficulty(draft.difficulty ?? 50);
        setCover(draft.cover || '');
        setPublished(draft.published ?? true);
        setDraftMsg('📄 已恢复本地草稿');
      }
    } catch {
      /* ignore broken draft */
    }
  }, [isEdit]);

  // 新建文章：每 3 秒自动保存草稿到 localStorage
  useEffect(() => {
    if (isEdit) return;
    const timer = setTimeout(() => {
      if (!title && !content) return;
      localStorage.setItem(
        DRAFT_KEY,
        JSON.stringify({ title, summary, tags, content, difficulty, cover, published })
      );
      setSavedAt(new Date().toLocaleTimeString('zh-CN'));
    }, 3000);
    return () => clearTimeout(timer);
  }, [isEdit, title, summary, tags, content, difficulty, cover, published]);

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
      difficulty,
      cover,
    };
    try {
      if (isEdit) {
        await request(`/posts/${id}`, { method: 'PUT', body });
      } else {
        await request('/posts', { method: 'POST', body });
        localStorage.removeItem(DRAFT_KEY);
      }
      navigate('/admin');
    } catch (e) {
      setError(e.message);
    } finally {
      setSaving(false);
    }
  }

  // 上传图片到后端，并把 Markdown 图片语法插入到光标处
  async function handleUploadFile(e) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${getToken()}` },
        body: fd,
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '上传失败');
      const md = `\n![${file.name}](${data.url})\n`;
      const ta = taRef.current;
      const pos = ta ? ta.selectionEnd : content.length;
      setContent((prev) => prev.slice(0, pos) + md + prev.slice(pos));
    } catch (err) {
      setError(`图片上传失败：${err.message}`);
    }
  }

  // 工具栏：在光标处插入 / 包裹 / 加行前缀
  function applyTool(tool) {
    if (tool.type === 'upload') {
      fileRef.current?.click();
      return;
    }
    const ta = taRef.current;
    if (!ta) return;
    const { selectionStart: start, selectionEnd: end } = ta;
    const value = content;
    let next = value;
    let cursor = end;

    if (tool.type === 'wrap') {
      const selected = value.slice(start, end) || tool.ph;
      next = value.slice(0, start) + tool.before + selected + tool.after + value.slice(end);
      cursor = start + tool.before.length + selected.length + tool.after.length;
    } else if (tool.type === 'block') {
      next = value.slice(0, start) + tool.text + value.slice(end);
      cursor = start + tool.text.length;
    } else if (tool.type === 'line') {
      // 给选中范围内的每一行加前缀
      const lineStart = value.lastIndexOf('\n', start - 1) + 1;
      const lineEnd = value.indexOf('\n', end) === -1 ? value.length : value.indexOf('\n', end);
      const segment = value.slice(lineStart, lineEnd);
      const toggled = segment
        .split('\n')
        .map((line) => (line.startsWith(tool.prefix) ? line.slice(tool.prefix.length) : tool.prefix + line))
        .join('\n');
      next = value.slice(0, lineStart) + toggled + value.slice(lineEnd);
      cursor = lineStart + toggled.length;
    }

    setContent(next);
    requestAnimationFrame(() => {
      ta.focus();
      ta.setSelectionRange(cursor, cursor);
    });
  }

  const chars = content.length;
  const lines = content ? content.split('\n').length : 0;
  const currentLevel = levelOf(difficulty);

  const inputCls =
    'w-full bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-shadow';
  const toolBtnCls =
    'min-w-7 px-1.5 py-1 text-xs rounded-md text-gray-600 dark:text-gray-300 hover:bg-indigo-100 hover:text-indigo-700 dark:hover:bg-indigo-900/50 dark:hover:text-indigo-300 transition-colors font-medium';

  const previewPane = (
    <div className="glass-card rounded-xl p-6 overflow-auto">
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
  );

  return (
    <div className="min-h-screen flex flex-col transition-colors">
      <BackgroundFX />
      <SakuraFX count={12} />

      <header className="sticky top-0 z-10 bg-white/80 dark:bg-gray-900/80 backdrop-blur border-b border-gray-200 dark:border-gray-800">
        <div className="max-w-5xl mx-auto px-6 h-14 flex items-center justify-between">
          <h1 className="font-bold shimmer-text text-lg">
            {isEdit ? '✏️ 编辑文章' : '✍️ 写新文章'}
          </h1>
          <div className="flex items-center gap-3 text-sm">
            {savedAt && !isEdit && (
              <span className="text-xs text-gray-400 hidden md:inline">🕐 草稿已自动保存 {savedAt}</span>
            )}
            <label className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                checked={published}
                onChange={(e) => setPublished(e.target.checked)}
              />
              发布（取消则为草稿）
            </label>
            <Link
              to="/admin"
              className="text-gray-600 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors"
            >
              取消
            </Link>
            <button
              onClick={handleSave}
              disabled={saving}
              className="neon-btn text-white px-4 py-1.5 rounded-lg font-medium"
            >
              {saving ? '保存中...' : '💾 保存'}
            </button>
          </div>
        </div>
      </header>

      <main className="flex-1 max-w-5xl w-full mx-auto px-6 py-6 flex flex-col gap-4">
        {error && <p className="text-red-500 text-sm">{error}</p>}
        {draftMsg && <p className="text-indigo-500 dark:text-indigo-400 text-sm">{draftMsg}</p>}

        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="文章标题"
          className={`${inputCls} text-lg font-semibold`}
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
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
          <div className="flex items-center gap-2">
            <span className="text-xs text-gray-400 shrink-0">难度</span>
            <select
              value={currentLevel.value}
              onChange={(e) => setDifficulty(Number(e.target.value))}
              className={`${inputCls} flex-1`}
            >
              {DIFF_LEVELS.map((lv) => (
                <option key={lv.value} value={lv.value}>
                  {lv.label}（Lv.{lv.value}）
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* 封面图 */}
        <div className="flex items-center gap-3">
          <input
            type="text"
            value={cover}
            onChange={(e) => setCover(e.target.value)}
            placeholder="封面图地址（可粘贴图片链接，或点工具栏 📤 上传后复制地址）"
            className={`${inputCls} flex-1`}
          />
          {cover && (
            <img
              src={cover}
              alt="封面预览"
              className="h-10 w-20 object-cover rounded-md border border-gray-200 dark:border-gray-700"
            />
          )}
        </div>
        <input ref={fileRef} type="file" accept="image/*" onChange={handleUploadFile} className="hidden" />

        {/* 工具栏 + 视图切换 + 字数统计 */}
        <div className="flex flex-wrap items-center gap-1 bg-white/70 dark:bg-gray-900/70 border border-gray-200 dark:border-gray-700 rounded-xl px-2 py-1.5">
          {TOOLBAR.map((tool) => (
            <button
              key={tool.title}
              type="button"
              title={tool.title}
              onClick={() => applyTool(tool)}
              className={toolBtnCls}
            >
              {tool.icon}
            </button>
          ))}
          <div className="flex-1" />
          <span className="text-xs text-gray-400 mr-2">
            {chars} 字 · {lines} 行
          </span>
          <div className="flex gap-1">
            {[
              { key: 'edit', label: '编写' },
              { key: 'split', label: '分栏' },
              { key: 'preview', label: '预览' },
            ].map(({ key, label }) => (
              <button
                key={key}
                type="button"
                onClick={() => setView(key)}
                className={`text-sm px-3 py-1 rounded-md transition-colors ${
                  view === key
                    ? 'bg-indigo-600 text-white'
                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {view === 'preview' ? (
          <div className="flex-1 min-h-[420px]">{previewPane}</div>
        ) : view === 'split' ? (
          <div className="flex-1 min-h-[420px] grid md:grid-cols-2 gap-4">
            <textarea
              ref={taRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={'用 Markdown 写作，例如：\n\n# 标题\n\n正文内容...\n\n```js\nconsole.log("代码块");\n```'}
              className="h-full min-h-[420px] w-full bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-700 rounded-xl p-4 font-mono text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none transition-shadow"
            />
            {previewPane}
          </div>
        ) : (
          <textarea
            ref={taRef}
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={'用 Markdown 写作，例如：\n\n# 标题\n\n正文内容...\n\n```js\nconsole.log("代码块");\n```'}
            className="flex-1 min-h-[420px] w-full bg-white/80 dark:bg-gray-900/80 border border-gray-200 dark:border-gray-700 rounded-xl p-4 font-mono text-sm text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none transition-shadow"
          />
        )}
      </main>
    </div>
  );
}
