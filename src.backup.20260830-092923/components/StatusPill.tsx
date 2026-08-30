import { cn } from '@/lib/utils';

interface StatusPillProps {
  status: 'pending' | 'active' | 'completed' | 'approved' | 'rejected' | 'paused' | 'draft';
  size?: 'sm' | 'md';
  className?: string;
}

/**
 * Status pill with semantic tone + leading dot
 * Used by submissions, orders, and review queues
 */
const StatusPill: React.FC<StatusPillProps> = ({ status, size = 'md', className }) => {
  const statusConfig = {
    pending: { bg: 'bg-info/10', text: 'text-info', label: 'Pending', dot: 'bg-info' },
    active: { bg: 'bg-warn/10', text: 'text-warn', label: 'Active', dot: 'bg-warn' },
    completed: { bg: 'bg-ok/10', text: 'text-ok', label: 'Completed', dot: 'bg-ok' },
    approved: { bg: 'bg-ok/10', text: 'text-ok', label: 'Approved', dot: 'bg-ok' },
    rejected: { bg: 'bg-danger/10', text: 'text-danger', label: 'Rejected', dot: 'bg-danger' },
    paused: { bg: 'bg-muted/20', text: 'text-muted-foreground', label: 'Paused', dot: 'bg-muted-foreground' },
    draft: { bg: 'bg-muted/20', text: 'text-muted-foreground', label: 'Draft', dot: 'bg-muted-foreground' },
  };

  const config = statusConfig[status];
  const sizes = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center gap-2 rounded-full font-medium tier-transition',
        config.bg,
        config.text,
        sizes[size],
        className
      )}
    >
      <span className={cn('inline-block w-2 h-2 rounded-full', config.dot)} />
      {config.label}
    </span>
  );
};

export default StatusPill;
