import { useMemo } from 'react';

// 二次元樱花飘落特效：随机生成花瓣，从顶部飘落到屏幕外
export default function SakuraFX({ count = 14 }) {
  const petals = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: Math.random() * 100,
        size: 8 + Math.random() * 10,
        duration: 8 + Math.random() * 10,
        delay: -Math.random() * 18,
        sway: Math.random() > 0.5,
      })),
    [count]
  );

  return (
    <div className="fixed inset-0 -z-[5] overflow-hidden pointer-events-none" aria-hidden="true">
      {petals.map((p) => (
        <span
          key={p.id}
          className="sakura-petal"
          style={{
            left: `${p.left}%`,
            width: p.size,
            height: p.size,
            animationDuration: `${p.duration}s`,
            animationDelay: `${p.delay}s`,
            opacity: 0.5 + Math.random() * 0.4,
          }}
        />
      ))}
    </div>
  );
}
