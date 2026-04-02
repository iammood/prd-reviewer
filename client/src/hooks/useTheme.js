import { useState, useEffect } from 'react';

export default function useTheme() {
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('prd_reviewer_theme') ?? 'dark';
  });

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
    } else {
      root.classList.remove('dark');
    }
    localStorage.setItem('prd_reviewer_theme', theme);
  }, [theme]);

  function toggle() {
    setTheme(t => (t === 'dark' ? 'light' : 'dark'));
  }

  return { theme, toggle };
}
