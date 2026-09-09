import { cn } from '@/lib/utils';

interface StatRowProps {
  label: string;
  value: string | number;
  tone?: 'ok' | 'warn' | 'info' | 'danger' | 'default';
  className?: string;
}

/**
 * Metric strip: display-font number + caps label + hairline baseline
 * Replaces local Stat components across the organizer console
 */
const StatRow: React.FC<StatRowProps> = ({ label, value, tone = 'default', className }) => {
  const toneClass = {
    ok: 'text-ok',
    warn: 'text-warn',
    info: 'text-info',
    danger: 'text-danger',
    default: 'text-primary',
  }[tone];

  return (
    <div className={cn('border-b border-border/50 pb-4 last:border-0', className)}>
      <div className={cn('text-3xl md:text-4xl font-semibold tabular-nums font-display', toneClass)}>
        {value}
      </div>
      <div className="text-xs uppercase tracking-widest text-muted-foreground font-medium mt-2">
        {label}
      </div>
    </div>
  );
};

export default StatRow;
