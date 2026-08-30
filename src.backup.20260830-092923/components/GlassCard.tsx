import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

const GlassCard: React.FC<GlassCardProps> = ({ children, className, hover = true }) => {
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

export default GlassCard;
