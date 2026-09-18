import { Sun, Moon } from 'lucide-react';
import { cn } from '@/lib/utils';
import type { PublicTheme } from '@/hooks/usePublicTheme';

interface ThemeToggleProps {
  theme: PublicTheme;
  onToggle: () => void;
  className?: string;
}

const ThemeToggle: React.FC<ThemeToggleProps> = ({ theme, onToggle, className }) => {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-label={theme === 'dark' ? 'Switch to light theme' : 'Switch to dark theme'}
      className={cn(
        'inline-flex items-center justify-center w-9 h-9 rounded-lg border border-border',
        'text-muted-foreground hover:text-primary hover:border-primary/60',
        'transition-colors duration-200 active:scale-95',
        className
      )}
    >
      {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
};

export default ThemeToggle;
