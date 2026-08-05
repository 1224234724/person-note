import { useEffect, useMemo, useState } from 'react';
import { request } from '../lib/api.js';

const COLORS = ['#f9a8d4', '#a5b4fc', '#67e8f9', '#fcd34d', '#c4b5fd', '#86efac'];

/**
 * 弹幕条：把文章的评论变成 B 站风格的飘屏弹幕
 * 循环播放，评论列表依然保留在页面下方
 */
export default function Danmaku({ postId }) {
  const [comments, setComments] = useState([]);

  useEffect(() => {
    request(`/posts/${postId}/comments`).then(setComments).catch(() => {});
  }, [postId]);

  // 给每条弹幕随机分配轨道、时长、延迟，负延迟让画面一开始就有弹幕在飞
  const items = useMemo(
    () =>
      comments.slice(0, 20).map((c, i) => ({
        ...c,
        top: 8 + (i % 3) * 30,
        duration: 13 + Math.random() * 9,
        delay: -(i * 4.3),
        color: COLORS[i % COLORS.length],
      })),
    [comments]
  );

  if (items.length === 0) return null;

  return (
    <div className="relative h-24 overflow-hidden rounded-xl bg-gradient-to-r from-indigo-950/90 via-purple-950/90 to-slate-900/90 border border-indigo-500/20 mb-6">
      <p className="absolute left-3 top-1.5 text-[10px] text-indigo-300/70 z-10">
        💫 弹幕模式 · 来自评论区
      </p>
      {items.map((d) => (
        <span
          key={d.id}
          className="danmaku-item"
          style={{
            top: `${d.top}px`,
            color: d.color,
            animationDuration: `${d.duration}s`,
            animationDelay: `${d.delay}s`,
          }}
        >
          {d.nickname}：{d.content.slice(0, 60)}
        </span>
      ))}
    </div>
  );
}
