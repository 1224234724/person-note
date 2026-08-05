import { useEffect } from 'react';

/**
 * 简历 PDF 预览弹窗：内嵌浏览器 PDF 预览 + 下载按钮
 */
export default function ResumeModal({ url, onClose }) {
  // ESC 关闭
  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="glass-card rounded-2xl w-full max-w-4xl h-[85vh] flex flex-col overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 py-3 border-b border-gray-200/60 dark:border-gray-700/60">
          <h2 className="font-semibold text-gray-900 dark:text-gray-100">📄 我的简历</h2>
          <div className="flex items-center gap-3">
            <a
              href={url}
              download
              className="neon-btn text-white text-xs px-4 py-1.5 rounded-lg font-medium"
            >
              ⬇️ 下载简历
            </a>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-red-500 text-lg leading-none transition-colors"
              title="关闭"
            >
              ✕
            </button>
          </div>
        </div>
        <iframe src={url} title="简历预览" className="flex-1 w-full bg-white" />
        <p className="text-center text-xs text-gray-400 py-2">
          预览由浏览器内置 PDF 阅读器提供，如无法显示请直接下载
        </p>
      </div>
    </div>
  );
}
