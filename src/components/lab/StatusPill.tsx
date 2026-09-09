import { cn } from '@/lib/utils';
import { STATUS_LABEL, type SubmissionStatus } from '@/lib/lab';

/**
 * Status pill styling using semantic tokens instead of hardcoded colors.
 * Maps submission status to background, text, and border using the design system's
 * --ok, --warn, --info, --danger tokens for maintainability and theme consistency.
 */
const TONE: Record<SubmissionStatus, string> = {
  not_started: 'bg-muted/20 text-muted-foreground border-border',
  submitted: 'bg-warn/15 text-warn border-warn/30',
  under_review: 'bg-info/15 text-info border-info/30',
  scored: 'bg-ok/15 text-ok border-ok/30',
  returned: 'bg-danger/15 text-danger border-danger/30',
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
