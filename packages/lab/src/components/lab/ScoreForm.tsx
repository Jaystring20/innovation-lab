import { useState } from 'react';
import { Loader2, Check } from 'lucide-react';
import GlowButton from '@/components/GlowButton';
import { RUBRIC, RUBRIC_MAX, submitScore, type ScoreInput } from '@/lib/lab';

const EMPTY: ScoreInput = {
  c_design: 0,
  c_hardware: 0,
  c_ai: 0,
  c_presentation: 0,
  comments: '',
};

/**
 * The handbook rubric, scored per submission.
 *
 * Criteria maxima (20/30/30/20) are enforced in the database too — these
 * inputs mirror the check constraints rather than being the only guard.
 */
const ScoreForm: React.FC<{
  submissionId: string;
  judgeId: string;
  existing: (ScoreInput & { comments: string | null }) | null;
  onScored: () => void;
}> = ({ submissionId, judgeId, existing, onScored }) => {
  const [score, setScore] = useState<ScoreInput>(
    existing ? { ...existing, comments: existing.comments ?? '' } : EMPTY,
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const total = RUBRIC.reduce((n, c) => n + (Number(score[c.key]) || 0), 0);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await submitScore(submissionId, judgeId, score);
      setSaved(true);
      onScored();
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {RUBRIC.map((c) => (
        <div key={c.key}>
          <div className="flex items-baseline justify-between mb-2">
            <label htmlFor={`${submissionId}-${c.key}`} className="text-sm text-foreground">
              {c.label}
            </label>
            <span className="text-xs text-muted-foreground">max {c.max}</span>
          </div>
          <div className="flex items-center gap-3">
            <input
              id={`${submissionId}-${c.key}`}
              type="range"
              min={0}
              max={c.max}
              value={score[c.key]}
              onChange={(e) => {
                setScore((s) => ({ ...s, [c.key]: Number(e.target.value) }));
                setSaved(false);
              }}
              className="flex-1 accent-[hsl(var(--primary))]"
            />
            <input
              type="number"
              min={0}
              max={c.max}
              value={score[c.key]}
              onChange={(e) => {
                const v = Math.max(0, Math.min(c.max, Number(e.target.value) || 0));
                setScore((s) => ({ ...s, [c.key]: v }));
                setSaved(false);
              }}
              className="w-16 bg-secondary/40 border-2 border-white/10 rounded-lg py-1.5 px-2 text-sm text-foreground text-center tabular-nums focus:outline-none focus:border-primary/60"
            />
          </div>
        </div>
      ))}

      <div className="flex items-baseline justify-between pt-2 border-t border-white/10">
        <span className="text-sm text-muted-foreground">Total</span>
        <span className="text-2xl font-bold text-foreground tabular-nums">
          {total}
          <span className="text-sm font-normal text-muted-foreground"> / {RUBRIC_MAX}</span>
        </span>
      </div>

      <div>
        <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
          Comments for the team
        </label>
        <textarea
          rows={3}
          value={score.comments}
          onChange={(e) => {
            setScore((s) => ({ ...s, comments: e.target.value }));
            setSaved(false);
          }}
          placeholder="What worked, and what would make this stronger."
          className="w-full bg-secondary/40 border-2 border-white/10 rounded-lg py-2.5 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-all"
        />
        <p className="text-xs text-muted-foreground/70 mt-1.5">
          Shown to the school without your name once the stage is released.
        </p>
      </div>

      {error && <p className="text-sm text-red-400">{error}</p>}

      <GlowButton type="submit" size="sm" disabled={busy}>
        <span className="flex items-center gap-2">
          {busy ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : saved ? (
            <Check className="w-4 h-4" />
          ) : null}
          {existing ? 'Update score' : 'Submit score'}
        </span>
      </GlowButton>
    </form>
  );
};

export default ScoreForm;
