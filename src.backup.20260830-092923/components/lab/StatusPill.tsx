import { cn } from '@/lib/utils';
import { STATUS_LABEL, type SubmissionStatus } from '@/lib/lab';

const TONE: Record<SubmissionStatus, string> = {
  not_started: 'bg-white/5 text-muted-foreground border-white/10',
  submitted: 'bg-amber-500/15 text-amber-400 border-amber-500/30',
  under_review: 'bg-sky-500/15 text-sky-400 border-sky-500/30',
  scored: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30',
  returned: 'bg-red-500/15 text-red-400 border-red-500/30',
};

const StatusPill: React.FC<{ status: SubmissionStatus; className?: string }> = ({
  status,
  className,
}) => (
  <span
    className={cn(
      'inline-block px-2 py-0.5 rounded-md text-xs font-medium border whitespace-nowrap',
      TONE[status],
      className,
    )}
  >
    {STATUS_LABEL[status]}
  </span>
);

export default StatusPill;
