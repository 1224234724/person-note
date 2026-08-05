import { useEffect, useRef } from 'react';

// 全屏炫酷背景：粒子连线画布 + 浮动渐变光斑，自动适配明暗主题
export default function BackgroundFX() {
  const canvasRef = useRef(null);
  const glowRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    let w, h, raf;
    const COUNT = 60;
    const MAX_DIST = 130;
    const mouse = { x: -9999, y: -9999 };
    const petals = []; // 点击爆裂的樱花瓣
    const stars = []; // 鼠标星星尾迹
    const lastTrail = { x: -9999, y: -9999 };

    const resize = () => {
      w = canvas.width = window.innerWidth;
      h = canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const onMouseMove = (e) => {
      mouse.x = e.clientX;
      mouse.y = e.clientY;
      if (glowRef.current) {
        glowRef.current.style.transform = `translate(${e.clientX - 250}px, ${e.clientY - 250}px)`;
      }
      // 移动距离够长才生成星星尾迹，控制数量
      const dist = Math.hypot(e.clientX - lastTrail.x, e.clientY - lastTrail.y);
      if (dist > 28) {
        lastTrail.x = e.clientX;
        lastTrail.y = e.clientY;
        stars.push({
          x: e.clientX,
          y: e.clientY,
          vx: (Math.random() - 0.5) * 0.6,
          vy: -Math.random() * 0.4 - 0.2,
          size: Math.random() * 5 + 3,
          life: 1,
          hue: Math.random() > 0.5 ? 300 : 48, // 粉紫 / 金色
          rot: Math.random() * Math.PI,
          spin: (Math.random() - 0.5) * 0.15,
        });
      }
    };
    window.addEventListener('mousemove', onMouseMove);

    // 点击樱花爆裂
    const onClick = (e) => {
      const n = 12 + Math.floor(Math.random() * 6);
      for (let i = 0; i < n; i++) {
        const angle = (Math.PI * 2 * i) / n + Math.random() * 0.5;
        const speed = Math.random() * 3 + 1.5;
        petals.push({
          x: e.clientX,
          y: e.clientY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed - 1.2,
          size: Math.random() * 5 + 4,
          rot: Math.random() * Math.PI * 2,
          spin: (Math.random() - 0.5) * 0.25,
          life: 1,
        });
      }
      if (petals.length > 300) petals.splice(0, petals.length - 300);
    };
    window.addEventListener('click', onClick);

    const particles = Array.from({ length: COUNT }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      vx: (Math.random() - 0.5) * 0.4,
      vy: (Math.random() - 0.5) * 0.4,
      r: Math.random() * 1.8 + 0.6,
    }));

    const draw = () => {
      const dark = document.documentElement.classList.contains('dark');
      ctx.clearRect(0, 0, w, h);
      const rgb = dark ? '139,92,246' : '99,102,241';

      for (const p of particles) {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0 || p.x > w) p.vx *= -1;
        if (p.y < 0 || p.y > h) p.vy *= -1;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(${rgb},${dark ? 0.7 : 0.45})`;
        ctx.fill();
      }

      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.hypot(dx, dy);
          if (dist < MAX_DIST) {
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.strokeStyle = `rgba(${rgb},${((1 - dist / MAX_DIST) * (dark ? 0.22 : 0.13)).toFixed(3)})`;
            ctx.lineWidth = 1;
            ctx.stroke();
          }
        }
        // 粒子与鼠标的连线，增强互动感
        const mdx = particles[i].x - mouse.x;
        const mdy = particles[i].y - mouse.y;
        const mdist = Math.hypot(mdx, mdy);
        if (mdist < 160) {
          ctx.beginPath();
          ctx.moveTo(particles[i].x, particles[i].y);
          ctx.lineTo(mouse.x, mouse.y);
          ctx.strokeStyle = `rgba(${rgb},${((1 - mdist / 160) * 0.5).toFixed(3)})`;
          ctx.lineWidth = 1;
          ctx.stroke();
        }
      }
      // 点击爆裂的樱花瓣：带重力和旋转的椭圆花瓣
      for (let i = petals.length - 1; i >= 0; i--) {
        const p = petals[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.06; // 重力
        p.vx *= 0.985;
        p.rot += p.spin;
        p.life -= 0.014;
        if (p.life <= 0) {
          petals.splice(i, 1);
          continue;
        }
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        ctx.globalAlpha = p.life;
        ctx.fillStyle = dark ? '#f9a8d4' : '#f472b6';
        ctx.beginPath();
        ctx.ellipse(0, 0, p.size, p.size * 0.55, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }

      // 鼠标星星尾迹：四角星逐渐缩小消失
      for (let i = stars.length - 1; i >= 0; i--) {
        const s = stars[i];
        s.x += s.vx;
        s.y += s.vy;
        s.rot += s.spin;
        s.life -= 0.03;
        if (s.life <= 0) {
          stars.splice(i, 1);
          continue;
        }
        const r = s.size * s.life;
        ctx.save();
        ctx.translate(s.x, s.y);
        ctx.rotate(s.rot);
        ctx.globalAlpha = s.life * 0.9;
        ctx.fillStyle = `hsl(${s.hue}, 95%, ${dark ? 72 : 62}%)`;
        ctx.beginPath();
        ctx.moveTo(0, -r);
        ctx.quadraticCurveTo(0, 0, r, 0);
        ctx.quadraticCurveTo(0, 0, 0, r);
        ctx.quadraticCurveTo(0, 0, -r, 0);
        ctx.quadraticCurveTo(0, 0, 0, -r);
        ctx.fill();
        ctx.restore();
      }
      ctx.globalAlpha = 1;

      raf = requestAnimationFrame(draw);
    };
    draw();

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener('resize', resize);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('click', onClick);
    };
  }, []);

  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none" aria-hidden="true">
      <canvas ref={canvasRef} className="absolute inset-0" />
      {/* 跟随鼠标的柔光 */}
      <div
        ref={glowRef}
        className="absolute top-0 left-0 w-[500px] h-[500px] rounded-full bg-indigo-500/10 dark:bg-purple-500/15 blur-3xl will-change-transform"
      />
      <div className="bg-blob w-[520px] h-[520px] bg-indigo-400/40 dark:bg-indigo-600/20 top-[-10%] left-[-6%]" />
      <div
        className="bg-blob w-[440px] h-[440px] bg-fuchsia-400/30 dark:bg-fuchsia-600/15 bottom-[-12%] right-[-6%]"
        style={{ animationDelay: '-6s' }}
      />
      <div
        className="bg-blob w-[360px] h-[360px] bg-sky-400/30 dark:bg-sky-600/15 top-[35%] right-[18%]"
        style={{ animationDelay: '-12s' }}
      />
    </div>
  );
}
