/**
 * Wordmark Component
 *
 * Typographic "STEAM FOUNDRY" + small inline flame SVG
 * Used in: headers, app chrome, sidebars (replaces raster logo)
 *
 * Props:
 * - size?: 'sm' | 'md' | 'lg' (default: 'md')
 * - className?: string
 */

interface WordmarkProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizeMap = {
  sm: {
    text: 'text-sm',
    flame: 'w-4 h-4',
  },
  md: {
    text: 'text-lg',
    flame: 'w-5 h-5',
  },
  lg: {
    text: 'text-2xl',
    flame: 'w-6 h-6',
  },
};

export default function Wordmark({ size = 'md', className = '' }: WordmarkProps) {
  const { text, flame } = sizeMap[size];

  return (
    <div className={`flex items-center gap-2 ${className}`}>
      {/* Flame SVG accent */}
      <svg
        className={`${flame} flex-shrink-0`}
        viewBox="0 0 24 24"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Flame shape */}
        <path
          d="M12 2c0 0-2 3-2 5.5C10 9.5 10.5 11 12 12c1.5-1 2-2.5 2-4.5C14 5 12 2 12 2Z"
          fill="currentColor"
          className="text-primary"
        />
        {/* Glow inner */}
        <path
          d="M11.5 4.5c0 1.5.3 2.5.8 3 .5-.5.8-1.5.8-3"
          fill="currentColor"
          className="text-primary/60"
        />
      </svg>

      {/* Text wordmark */}
      <div className={`${text} font-display font-semibold leading-none tracking-tight text-foreground`}>
        STEAM
        <br />
        <span className="text-primary">FOUNDRY</span>
      </div>
    </div>
  );
}
