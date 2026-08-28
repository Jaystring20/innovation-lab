import { useEffect, useState } from 'react';
import { Loader2, MessageSquare } from 'lucide-react';
import { getFeedback, RUBRIC, RUBRIC_MAX, type Feedback } from '@/lib/lab';
import { useTheme } from '@/contexts/ThemeContext';

/**
 * Released judge feedback for one submission.
 *
 * Scores are never read from `scores` directly — teachers have no policy on
 * that table. get_submission_feedback() is the only path, and it returns null
 * until an organizer (or the auto-release rule) has released the stage.
 */
const FeedbackPanel: React.FC<{ submissionId: string }> = ({ submissionId }) => {
  const { tierConfig } = useTheme();
  const [data, setData] = useState<Feedback | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    setLoading(true);
    getFeedback(submissionId)
      .then((f) => alive && setData(f))
      .catch(() => alive && setData(null))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [submissionId]);

  if (loading) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground py-4">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading feedback…
      </div>
    );
  }

  if (!data || !data.released_at) {
    return (
      <p className="text-sm text-muted-foreground py-3">
        Feedback will appear here once judging for this stage is complete.
      </p>
    );
  }

  const criteria = [
    { ...RUBRIC[0], value: data.avg_design },
    { ...RUBRIC[1], value: data.avg_hardware },
    { ...RUBRIC[2], value: data.avg_ai },
    { ...RUBRIC[3], value: data.avg_presentation },
  ];

  return (
    <div className="space-y-5">
      <div className="flex items-baseline justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground">Stage score</p>
          <p className="text-3xl font-bold text-foreground tabular-nums">
            {data.avg_total ?? '—'}
            <span className="text-base font-normal text-muted-foreground"> / {RUBRIC_MAX}</span>
          </p>
        </div>
        <p className="text-xs text-muted-foreground">
          Averaged across {data.judge_count} judge{data.judge_count === 1 ? '' : 's'}
        </p>
      </div>

      <div className="space-y-3">
        {criteria.map((c) => {
          const pct = c.value === null ? 0 : (Number(c.value) / c.max) * 100;
          return (
            <div key={c.key}>
              <div className="flex justify-between text-sm mb-1.5">
                <span className="text-muted-foreground">{c.label}</span>
                <span className="text-foreground tabular-nums font-medium">
                  {c.value ?? '—'} / {c.max}
                </span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-[width] duration-700"
                  style={{ width: `${pct}%`, backgroundColor: tierConfig.color }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {data.comments.length > 0 && (
        <div>
          <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-1.5">
            <MessageSquare className="w-3.5 h-3.5" />
            Judge comments
          </p>
          <ul className="space-y-2">
            {data.comments.map((c, i) => (
              <li
                key={i}
                className="text-sm text-foreground/90 bg-white/5 rounded-lg p-3 border border-white/5"
              >
                {c}
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground/60 mt-2">
            Comments are shown without judge names.
          </p>
        </div>
      )}
    </div>
  );
};

export default FeedbackPanel;
