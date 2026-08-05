import { useEffect, useState } from 'react';

// 页面顶部的滚动进度条，渐变色
export default function ScrollProgress() {
  const [percent, setPercent] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const doc = document.documentElement;
      const max = doc.scrollHeight - doc.clientHeight;
      setPercent(max > 0 ? (doc.scrollTop / max) * 100 : 0);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <div
      className="fixed top-0 left-0 z-50 h-[3px] bg-gradient-to-r from-indigo-500 via-purple-500 to-fuchsia-500 shadow-[0_0_8px_rgba(139,92,246,0.8)]"
      style={{ width: `${percent}%` }}
    />
  );
}
