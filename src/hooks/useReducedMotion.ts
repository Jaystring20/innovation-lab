import { useEffect, useState } from 'react';

/**
 * Custom hook to detect and honor the user's prefers-reduced-motion preference.
 * Returns true if the user has requested reduced motion in their OS/browser settings.
 *
 * Use this to conditionally apply animations:
 * ```tsx
 * const reduceMotion = useReducedMotion();
 * <motion.div
 *   initial={{ opacity: 0 }}
 *   animate={{ opacity: 1 }}
 *   transition={reduceMotion ? {} : { delay: 0.1 }}
 * >
 * ```
 */
export function useReducedMotion(): boolean {
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    // Check initial preference
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setReduceMotion(mediaQuery.matches);

    // Listen for changes (user toggles accessibility settings)
    const handleChange = (e: MediaQueryListEvent) => {
      setReduceMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return reduceMotion;
}
