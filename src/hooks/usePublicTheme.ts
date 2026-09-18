import { useEffect, useState } from 'react';

const STORAGE_KEY = 'sf-public-theme';

export type PublicTheme = 'light' | 'dark';

function getInitialTheme(): PublicTheme {
  if (typeof window === 'undefined') return 'dark';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored === 'light' || stored === 'dark') return stored;
  return window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
}

/**
 * Light/dark toggle scoped to the public marketing pages (Landing, Apen2026,
 * Privacy). The Lab/Store/dashboards stay on the fixed dark workspace theme
 * from ThemeContext — this is a separate, independent switch.
 */
export function usePublicTheme() {
  const [theme, setTheme] = useState<PublicTheme>(getInitialTheme);

  useEffect(() => {
    window.localStorage.setItem(STORAGE_KEY, theme);
  }, [theme]);

  const toggle = () => setTheme((t) => (t === 'light' ? 'dark' : 'light'));

  return { theme, toggle };
}
