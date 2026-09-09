import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface PanelProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

/**
 * Panel — solid surface with hairline border, no glassmorphism.
 * Used everywhere: cards, sidebars, modals, sections.
 * Replaces GlassCard; same API for backward compatibility.
 */
const Panel: React.FC<PanelProps> = ({ children, className, hover = true }) => {
  return (
    <div
      className={cn(
        'panel p-6 tier-transition',
        hover && 'hover:border-primary/60',
        className
      )}
    >
      {children}
    </div>
  );
};

export default Panel;
