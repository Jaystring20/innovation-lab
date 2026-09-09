import { useMemo, useState } from 'react';
import { Loader2, Plus, X } from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import StatusPill from '@/components/lab/StatusPill';
import { assignJudge, unassignJudge, type AdminSubmission } from '@/lib/lab';
import { DIVISION_SHORT } from '@/lib/store';
import { cn } from '@/lib/utils';
import type { LabData } from './LabConsole';

/**
 * Who reviews what.
 *
 * Assignment is deliberate rather than automatic: the organizer balances load
 * and keeps judges away from schools they are connected to. Assigning the
 * first judge moves the submission into review (database trigger); scoring by
 * all assigned judges closes it.
 */
const JudgeAssignmentPanel: React.FC<{
  data: LabData;
  organizerId: string;
  onChanged: () => void;
}> = ({ data, organizerId, onChanged }) => {
  const [stageOrd, setStageOrd] = useState<number>(1);
  const [busyKey, setBusyKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const judgeById = useMemo(
    () => new Map(data.judges.map((j) => [j.id, j])),
    [data.judges],
  );

  const assignmentsBySubmission = useMemo(() => {
    const m = new Map<string, string[]>();
    for (const a of data.assignments) {
      if (!m.has(a.submission_id)) m.set(a.submission_id, []);
      m.get(a.submission_id)!.push(a.judge_id);
    }
    return m;
  }, [data.assignments]);

  const loadPerJudge = useMemo(() => {
    const m = new Map<string, number>();
    for (const a of data.assignments) m.set(a.judge_id, (m.get(a.judge_id) ?? 0) + 1);
    return m;
  }, [data.assignments]);

  // Only work that has actually been submitted needs a judge.
  const rows = data.submissions.filter(
    (s) => s.stages?.ord === stageOrd && s.status !== 'not_started',
  );

  async function toggle(sub: AdminSubmission, judgeId: string, assigned: boolean) {
    const key = `${sub.id}:${judgeId}`;
    setBusyKey(key);
    setError(null);
    try {
      if (assigned) await unassignJudge(sub.id, judgeId);
      else await assignJudge(sub.id, judgeId, organizerId);
      onChanged();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusyKey(null);
    }
  }

  if (data.judges.length === 0) {
    return (
      <GlassCard hover={false}>
        <p className="text-sm text-muted-foreground">
          No judge accounts yet. A judge signs up at <code className="text-primary">/lab</code>,
          then an organizer sets their role to <code className="text-primary">judge</code> (see
          LAB_SETUP.md).
        </p>
      </GlassCard>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 flex-wrap">
        <span className="text-sm text-muted-foreground">Stage</span>
        {data.stages.map((st) => (
          <button
            key={st.id}
            onClick={() => setStageOrd(st.ord)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm transition-colors border',
              stageOrd === st.ord
                ? 'bg-primary/20 text-primary border-primary/30'
                : 'text-muted-foreground hover:bg-white/5 border-transparent',
            )}
          >
            {st.name.replace(/^Stage \d+ — /, `S${st.ord} `)}
          </button>
        ))}
      </div>

      <GlassCard hover={false}>
        <p className="text-xs uppercase tracking-widest text-muted-foreground mb-3">
          Judge workload
        </p>
        <div className="flex flex-wrap gap-2">
          {data.judges.map((j) => (
            <span
              key={j.id}
              className="text-sm px-3 py-1.5 rounded-lg bg-white/5 border border-white/10"
            >
              {j.full_name ?? j.email}
              <span className="text-muted-foreground tabular-nums">
                {' '}
                · {loadPerJudge.get(j.id) ?? 0}
              </span>
            </span>
          ))}
        </div>
      </GlassCard>

      {error && (
        <GlassCard hover={false}>
          <p className="text-sm text-red-400">{error}</p>
        </GlassCard>
      )}

      {rows.length === 0 ? (
        <GlassCard hover={false}>
          <p className="text-sm text-muted-foreground">
            Nothing submitted for this stage yet.
          </p>
        </GlassCard>
      ) : (
        <div className="space-y-3">
          {rows.map((sub) => {
            const assigned = assignmentsBySubmission.get(sub.id) ?? [];
            return (
              <GlassCard key={sub.id} hover={false}>
                <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
                  <div>
                    <p className="font-semibold text-foreground">{sub.teams?.name}</p>
                    <p className="text-sm text-muted-foreground">
                      {sub.teams ? DIVISION_SHORT[sub.teams.division] : '—'} ·{' '}
                      {assigned.length} judge{assigned.length === 1 ? '' : 's'} assigned
                    </p>
                  </div>
                  <StatusPill status={sub.status} />
                </div>

                <div className="flex flex-wrap gap-2">
                  {data.judges.map((j) => {
                    const isAssigned = assigned.includes(j.id);
                    const key = `${sub.id}:${j.id}`;
                    return (
                      <button
                        key={j.id}
                        disabled={busyKey === key}
                        onClick={() => toggle(sub, j.id, isAssigned)}
                        className={cn(
                          'inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg border transition-colors',
                          isAssigned
                            ? 'bg-primary/20 text-primary border-primary/30'
                            : 'bg-white/5 text-muted-foreground border-white/10 hover:text-foreground hover:bg-white/10',
                        )}
                      >
                        {busyKey === key ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : isAssigned ? (
                          <X className="w-3.5 h-3.5" />
                        ) : (
                          <Plus className="w-3.5 h-3.5" />
                        )}
                        {judgeById.get(j.id)?.full_name ?? j.email}
                      </button>
                    );
                  })}
                </div>
              </GlassCard>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default JudgeAssignmentPanel;
