import { useState } from 'react';
import { applyTheme } from '../lib/theme.js';

export default function ThemeToggle() {
  const [dark, setDark] = useState(() =>
    document.documentElement.classList.contains('dark')
  );

  function toggle() {
    const next = !dark;
    setDark(next);
    applyTheme(next ? 'dark' : 'light');
  }

  return (
    <button
      onClick={toggle}
      title={dark ? '切换到亮色模式' : '切换到暗色模式'}
      className="w-8 h-8 rounded-md flex items-center justify-center text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800 transition-colors"
    >
      {dark ? '🌙' : '☀️'}
    </button>
  );
}
