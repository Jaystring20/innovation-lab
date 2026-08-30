import { useState } from 'react';
import { ExternalLink, Undo2, Unlock } from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import StatusPill from '@/components/lab/StatusPill';
import { releaseFeedback, returnSubmission, type AdminSubmission } from '@/lib/lab';
import { DIVISION_SHORT } from '@/lib/store';
import { cn } from '@/lib/utils';
import type { LabData } from './LabConsole';

/** Every team × every stage, with the aggregate score once judging closes. */
const SubmissionsMatrix: React.FC<{ data: LabData; onChanged: () => void }> = ({
  data,
  onChanged,
}) => {
  const [open, setOpen] = useState<AdminSubmission | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const byTeam = new Map<string, Map<number, AdminSubmission>>();
  for (const s of data.submissions) {
    const ord = s.stages?.ord ?? 0;
    if (!byTeam.has(s.team_id)) byTeam.set(s.team_id, new Map());
    byTeam.get(s.team_id)!.set(ord, s);
  }

  async function act(fn: () => Promise<void>) {
    setBusy(true);
    setError(null);
    try {
      await fn();
      setOpen(null);
      onChanged();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  if (data.teams.length === 0) {
    return (
      <GlassCard hover={false}>
        <p className="text-sm text-muted-foreground">
          No teams yet. Teams appear once a school's teacher account is linked and they add
          their teams.
        </p>
      </GlassCard>
    );
  }

  return (
    <>
      {error && (
        <GlassCard className="mb-3" hover={false}>
          <p className="text-sm text-red-400">{error}</p>
        </GlassCard>
      )}

      <GlassCard className="p-0 overflow-x-auto" hover={false}>
        <table className="w-full text-sm min-w-[720px]">
          <thead>
            <tr className="text-left text-muted-foreground border-b border-white/10">
              <th className="p-3 font-medium">Team</th>
              <th className="p-3 font-medium">School</th>
              <th className="p-3 font-medium">Division</th>
              {data.stages.map((st) => (
                <th key={st.id} className="p-3 font-medium text-center">
                  S{st.ord}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.teams.map((team) => {
              const row = byTeam.get(team.id);
              return (
                <tr key={team.id} className="border-b border-white/5 last:border-0">
                  <td className="p-3">
                    <div className="text-foreground">{team.name}</div>
                    {team.eliminated_after_stage && (
                      <div className="text-xs text-red-400">
                        Out after S{team.eliminated_after_stage}
                      </div>
                    )}
                    {team.advanced_at && (
                      <div className="text-xs text-emerald-400">Finalist</div>
                    )}
                  </td>
                  <td className="p-3 text-muted-foreground">{team.schools?.name ?? '—'}</td>
                  <td className="p-3 text-muted-foreground">{DIVISION_SHORT[team.division]}</td>
                  {data.stages.map((st) => {
                    const sub = row?.get(st.ord);
                    return (
                      <td key={st.id} className="p-2 text-center">
                        {!sub ? (
                          <span className="text-muted-foreground/40">—</span>
                        ) : (
                          <button
                            onClick={() => setOpen(sub)}
                            className={cn(
                              'w-full px-2 py-1.5 rounded-lg hover:bg-white/5 transition-colors',
                            )}
                          >
                            <div className="text-xs">
                              {sub.scores?.avg_total != null ? (
                                <span className="text-foreground font-semibold tabular-nums">
                                  {sub.scores.avg_total}
                                </span>
                              ) : (
                                <span className="text-muted-foreground">
                                  {shortStatus(sub.status)}
                                </span>
                              )}
                            </div>
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </GlassCard>

      {open && (
        <GlassCard className="mt-4" hover={false}>
          <div className="flex items-start justify-between gap-4 mb-3 flex-wrap">
            <div>
              <p className="font-semibold text-foreground">
                {open.teams?.name} · {open.stages?.name}
              </p>
              <p className="text-sm text-muted-foreground">
                {open.submitted_at
                  ? `Submitted ${new Date(open.submitted_at).toLocaleString('en-NG')}`
                  : 'Not submitted'}
              </p>
            </div>
            <StatusPill status={open.status} />
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                Deliverable
              </p>
              <ul className="space-y-1.5">
                {[
                  { label: 'Video / demo', url: open.payload?.video_url },
                  { label: 'Docs / prompt log', url: open.payload?.doc_url },
                  { label: 'Repository', url: open.payload?.repo_url },
                ]
                  .filter((l) => l.url)
                  .map((l) => (
                    <li key={l.label}>
                      <a
                        href={l.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline break-all"
                      >
                        {l.label} <ExternalLink className="w-3.5 h-3.5 flex-shrink-0" />
                      </a>
                    </li>
                  ))}
                {!open.payload?.video_url && !open.payload?.doc_url && !open.payload?.repo_url && (
                  <li className="text-sm text-muted-foreground">Nothing submitted yet.</li>
                )}
              </ul>
              {open.payload?.notes && (
                <p className="text-sm text-foreground/90 bg-white/5 rounded-lg p-3 border border-white/5 mt-3">
                  {open.payload.notes}
                </p>
              )}
            </div>

            <div>
              <p className="text-xs uppercase tracking-widest text-muted-foreground mb-2">
                Scores
              </p>
              {open.scores ? (
                <dl className="text-sm space-y-1">
                  <Row label="Judges" value={String(open.scores.judge_count)} />
                  <Row label="Design Thinking" value={fmt(open.scores.avg_design, 20)} />
                  <Row label="Hardware" value={fmt(open.scores.avg_hardware, 30)} />
                  <Row label="AI Innovation" value={fmt(open.scores.avg_ai, 30)} />
                  <Row label="Presentation" value={fmt(open.scores.avg_presentation, 20)} />
                  <Row label="Total" value={fmt(open.scores.avg_total, 100)} strong />
                </dl>
              ) : (
                <p className="text-sm text-muted-foreground">No scores submitted yet.</p>
              )}

              <div className="flex gap-2 mt-4 flex-wrap">
                {open.status === 'scored' && !open.feedback_released_at && (
                  <button
                    disabled={busy}
                    onClick={() => act(() => releaseFeedback(open.id))}
                    className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-primary/15 text-primary hover:bg-primary/25 transition-colors"
                  >
                    <Unlock className="w-4 h-4" /> Release feedback
                  </button>
                )}
                {open.status === 'submitted' && (
                  <button
                    disabled={busy}
                    onClick={() => act(() => returnSubmission(open.id))}
                    className="inline-flex items-center gap-1.5 text-sm px-3 py-1.5 rounded-lg bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
                  >
                    <Undo2 className="w-4 h-4" /> Return for changes
                  </button>
                )}
                <button
                  onClick={() => setOpen(null)}
                  className="text-sm px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground"
                >
                  Close
                </button>
              </div>
              {open.feedback_released_at && (
                <p className="text-xs text-emerald-400 mt-2">
                  Feedback released {new Date(open.feedback_released_at).toLocaleString('en-NG')}
                </p>
              )}
            </div>
          </div>
        </GlassCard>
      )}
    </>
  );
};

function shortStatus(s: AdminSubmission['status']): string {
  return { not_started: '–', submitted: 'new', under_review: 'review', scored: '', returned: 'sent back' }[s];
}

function fmt(v: number | null | undefined, max: number): string {
  return v == null ? '—' : `${v} / ${max}`;
}

const Row: React.FC<{ label: string; value: string; strong?: boolean }> = ({
  label,
  value,
  strong,
}) => (
  <div className="flex justify-between gap-4">
    <dt className="text-muted-foreground">{label}</dt>
    <dd className={cn('tabular-nums', strong ? 'text-foreground font-semibold' : 'text-foreground/90')}>
      {value}
    </dd>
  </div>
);

export default SubmissionsMatrix;
