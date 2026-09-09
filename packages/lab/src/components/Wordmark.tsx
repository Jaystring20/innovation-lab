import { cn } from '@/lib/utils';

interface WordmarkProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

/**
 * STEAM FOUNDRY typographic wordmark + flame mark.
 * Used in app chrome (headers, sidebars, login screens).
 * Respects --font-display token for division theming.
 */
const Wordmark: React.FC<WordmarkProps> = ({ size = 'md', className }) => {
  const sizes = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-xl',
  };

  return (
    <div className={cn('flex items-center gap-2 font-display font-600', sizes[size], className)}>
      <span className="text-foreground tracking-tight">STEAM FOUNDRY</span>
      {/* Inline flame SVG — small, accent colored */}
      <svg
        width={size === 'lg' ? 20 : size === 'md' ? 16 : 14}
        height={size === 'lg' ? 20 : size === 'md' ? 16 : 14}
        viewBox="0 0 20 20"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        className="text-primary flex-shrink-0"
      >
        <path
          d="M10 2C9 4 8 6 8 8.5C8 11.5 9.5 14 11 14.5C11.5 15 12 15.5 11 17C10.5 17.5 9 16.5 8.5 16C8 15.5 7.5 15 6.5 16C6 16.5 5.5 17 5 17C4 15 5 12 5 10C5 7 6 4 10 2Z"
          fill="currentColor"
        />
      </svg>
    </div>
  );
};

export default Wordmark;
