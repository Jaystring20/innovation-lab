import { motion } from 'framer-motion';
import { CheckCircle2, Clock, AlertCircle } from 'lucide-react';
import Panel from '@/components/Panel';
import StatusPill from './StatusPill';
import { type Stage, type Submission } from '@/lib/lab';
import { cn } from '@/lib/utils';

interface StageCardProps {
  stage: Stage;
  submission?: Submission;
  index: number;
  isActive?: boolean;
  onClick?: () => void;
}

/**
 * StageCard — individual stage in the 4-stage funnel
 * Shows: stage name, description, submission status, judge feedback summary
 */
const StageCard: React.FC<StageCardProps> = ({ stage, submission, index, isActive, onClick }) => {
  const isCompleted = submission?.status === 'scored';
  const isPending = submission?.status === 'submitted' || submission?.status === 'under_review';
  const isReady = !submission || submission.status === 'in_progress';

  const statusColor = isCompleted
    ? 'text-ok'
    : isPending
      ? 'text-warn'
      : 'text-muted-foreground';

  const statusIcon = isCompleted
    ? <CheckCircle2 className={cn('w-5 h-5', statusColor)} />
    : isPending
      ? <Clock className={cn('w-5 h-5', statusColor)} />
      : <AlertCircle className={cn('w-5 h-5', statusColor)} />;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1 }}
      onClick={onClick}
      className={cn('cursor-pointer transition-all', isActive && 'ring-2 ring-primary')}
    >
      <Panel hover className="space-y-3">
        {/* Header */}
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-bold px-2 py-1 bg-primary/10 text-primary rounded">
                {String(index + 1).padStart(2, '0')}
              </span>
            </div>
            <h3 className="font-bold text-foreground font-display">{stage.name}</h3>
            <p className="text-xs text-muted-foreground mt-1">{stage.description}</p>
          </div>
          {statusIcon}
        </div>

        {/* Status */}
        {submission && (
          <div className="pt-2 border-t border-border">
            <StatusPill status={submission.status} />
          </div>
        )}

        {/* Deadline */}
        {stage.deadline && (
          <div className="text-xs text-muted-foreground">
            Due: {new Date(stage.deadline).toLocaleDateString()}
          </div>
        )}
      </Panel>
    </motion.div>
  );
};

export default StageCard;
