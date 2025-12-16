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
        'glass-card p-6 tier-transition',
        hover && 'hover:bg-slate-800/60 hover:border-white/20 hover:shadow-glow',
        className
      )}
    >
      {children}
    </div>
  );
};

export default GlassCard;
