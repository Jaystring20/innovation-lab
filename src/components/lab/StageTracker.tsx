import { Check, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import type { Stage, Submission } from '@/lib/lab';

/**
 * The 4-Stage Innovation Funnel as a stepper.
 *
 * A stage a team has not reached (3 and 4 before the gate) has no submission
 * row at all — that is the locked state, not an error.
 */
const StageTracker: React.FC<{
  stages: Stage[];
  submissions: Submission[];
  activeStageId: string | null;
  onSelect: (stageId: string) => void;
}> = ({ stages, submissions, activeStageId, onSelect }) => {
  const { tierConfig } = useTheme();
  const byStage = new Map(submissions.map((s) => [s.stage_id, s]));

  return (
    <ol className="grid grid-cols-2 md:grid-cols-4 gap-2">
      {stages.map((stage) => {
        const sub = byStage.get(stage.id);
        const locked = !sub;
        const done = sub?.status === 'scored';
        const active = stage.id === activeStageId;

        return (
          <li key={stage.id}>
            <button
              type="button"
              disabled={locked}
              onClick={() => onSelect(stage.id)}
              className={cn(
                'w-full text-left p-3 rounded-xl border-2 transition-all',
                locked && 'opacity-45 cursor-not-allowed',
                !locked && !active && 'border-border hover:bg-white/5',
                active && 'bg-white/[0.06]',
              )}
              style={active ? { borderColor: tierConfig.color } : undefined}
            >
              <div className="flex items-center gap-2 mb-1">
                <span
                  className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold flex-shrink-0"
                  style={{
                    backgroundColor: done ? tierConfig.color : 'rgba(255,255,255,0.08)',
                    color: done ? '#020617' : undefined,
                  }}
                >
                  {done ? <Check className="w-3 h-3" /> : locked ? <Lock className="w-3 h-3" /> : stage.ord}
                </span>
                <span className="font-semibold text-sm text-foreground truncate">
                  {stage.name.replace(/^Stage \d+ — /, '')}
                </span>
              </div>
              <p className="text-xs text-muted-foreground">
                {locked ? 'Locked until you advance' : statusLine(sub!, stage)}
              </p>
            </button>
          </li>
        );
      })}
    </ol>
  );
};

function statusLine(sub: Submission, stage: Stage): string {
  if (sub.status === 'scored') return 'Scored';
  if (sub.status === 'under_review') return 'With the judges';
  if (sub.status === 'submitted') return 'Submitted';
  if (sub.status === 'returned') return 'Changes requested';
  if (!stage.due_at) return 'Not started';
  const due = new Date(stage.due_at);
  const days = Math.ceil((due.getTime() - Date.now()) / 86_400_000);
  if (days < 0) return 'Deadline passed';
  if (days === 0) return 'Due today';
  return `Due in ${days} day${days === 1 ? '' : 's'}`;
}

export default StageTracker;
