import { useState } from 'react';
import { AlertTriangle, Loader2, Play, Save } from 'lucide-react';
import Panel from '@/components/Panel';
import GlowButton from '@/components/GlowButton';
import { runStageGate, updateStage, type GateResult } from '@/lib/lab';
import { DIVISION_LABELS } from '@/lib/store';
import { cn } from '@/lib/utils';
import type { LabData } from './LabConsole';

/**
 * The elimination gate.
 *
 * The handbook eliminates after Stage 2 (Phase 4): teams are ranked within
 * their division on everything scored so far and the top N advance to Stages 3
 * and 4. Dry run first — the confirm step writes elimination/advancement and
 * opens the later stages for advancers.
 */
const StageGatePanel: React.FC<{ data: LabData; onChanged: () => void }> = ({
  data,
  onChanged,
}) => {
  const [stageOrd, setStageOrd] = useState(2);
  const [preview, setPreview] = useState<GateResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const stage = data.stages.find((s) => s.ord === stageOrd);
  const [advanceCount, setAdvanceCount] = useState<string>(
    stage?.advance_count != null ? String(stage.advance_count) : '',
  );

  async function saveCount() {
    if (!stage) return;
    setBusy(true);
    setError(null);
    try {
      const n = advanceCount.trim() === '' ? null : Number(advanceCount);
      await updateStage(stage.id, { advance_count: n });
      onChanged();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  async function run(dryRun: boolean) {
    setBusy(true);
    setError(null);
    try {
      const result = await runStageGate(stageOrd, dryRun);
      setPreview(result);
      if (!dryRun) {
        setConfirming(false);
        onChanged();
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <Panel hover={false}>
        <div className="flex items-center gap-3 flex-wrap mb-4">
          <span className="text-sm text-muted-foreground">Gate after</span>
          {data.stages
            .filter((s) => s.ord < 4)
            .map((st) => (
              <button
                key={st.id}
                onClick={() => {
                  setStageOrd(st.ord);
                  setPreview(null);
                  setConfirming(false);
                  setAdvanceCount(st.advance_count != null ? String(st.advance_count) : '');
                }}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-sm transition-colors border',
                  stageOrd === st.ord
                    ? 'bg-primary/20 text-primary border-primary/30'
                    : 'text-muted-foreground hover:bg-white/5 border-transparent',
                )}
              >
                Stage {st.ord}
              </button>
            ))}
        </div>

        <div className="flex items-end gap-3 flex-wrap">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
              Teams advancing per division
            </label>
            <input
              type="number"
              min={1}
              value={advanceCount}
              onChange={(e) => setAdvanceCount(e.target.value)}
              placeholder="e.g. 20"
              className="w-32 bg-secondary/40 border-2 border-white/10 rounded-lg py-2 px-3 text-sm text-foreground tabular-nums focus:outline-none focus:border-primary/60"
            />
          </div>
          <button
            onClick={saveCount}
            disabled={busy}
            className="inline-flex items-center gap-1.5 text-sm px-3 py-2 rounded-lg bg-white/5 text-muted-foreground hover:text-foreground hover:bg-white/10 transition-colors"
          >
            <Save className="w-4 h-4" /> Save
          </button>
          <GlowButton size="sm" disabled={busy} onClick={() => run(true)}>
            <span className="flex items-center gap-2">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
              Preview cut
            </span>
          </GlowButton>
        </div>
        <p className="text-xs text-muted-foreground/70 mt-3">
          Teams are ranked within their division on every stage scored so far. Preview is
          read-only; nothing changes until you confirm.
        </p>
      </Panel>

      {error && (
        <Panel hover={false}>
          <p className="text-sm text-red-400">{error}</p>
        </Panel>
      )}

      {preview && (
        <>
          {preview.divisions.map((d) => (
            <div key={d.division}>
              <h3 className="text-sm font-semibold text-foreground mb-2">
                {DIVISION_LABELS[d.division]}
                {d.advance_count != null && (
                  <span className="text-muted-foreground font-normal">
                    {' '}
                    — top {d.advance_count} advance
                  </span>
                )}
              </h3>
              <Panel className="p-0 overflow-x-auto" hover={false}>
                <table className="w-full text-sm min-w-[420px]">
                  <thead>
                    <tr className="text-left text-muted-foreground border-b border-white/10">
                      <th className="p-3 font-medium w-12">#</th>
                      <th className="p-3 font-medium">Team</th>
                      <th className="p-3 font-medium text-right">Score</th>
                      <th className="p-3 font-medium text-right">Result</th>
                    </tr>
                  </thead>
                  <tbody>
                    {d.rows.map((r) => (
                      <tr key={r.team_id} className="border-b border-white/5 last:border-0">
                        <td className="p-3 tabular-nums text-muted-foreground">{r.rank}</td>
                        <td className="p-3 text-foreground">{r.team_name}</td>
                        <td className="p-3 text-right tabular-nums text-foreground">
                          {r.overall ?? '—'}
                        </td>
                        <td
                          className={cn(
                            'p-3 text-right font-medium',
                            r.advances ? 'text-emerald-400' : 'text-red-400',
                          )}
                        >
                          {r.advances ? 'Advances' : 'Eliminated'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </Panel>
            </div>
          ))}

          {preview.dry_run && (
            <Panel hover={false}>
              {confirming ? (
                <div className="space-y-3">
                  <p className="flex items-start gap-2 text-sm text-amber-400">
                    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    This marks eliminated teams, advances the rest, and opens Stages 3 and 4
                    for advancers. Teams are emailed the result. Confirm to proceed.
                  </p>
                  <div className="flex gap-2">
                    <GlowButton size="sm" disabled={busy} onClick={() => run(false)}>
                      <span className="flex items-center gap-2">
                        {busy && <Loader2 className="w-4 h-4 animate-spin" />}
                        Confirm the cut
                      </span>
                    </GlowButton>
                    <button
                      onClick={() => setConfirming(false)}
                      className="text-sm px-3 py-1.5 rounded-lg text-muted-foreground hover:text-foreground"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => setConfirming(true)}
                  className="text-sm px-3 py-2 rounded-lg bg-white/5 text-foreground hover:bg-white/10 transition-colors"
                >
                  Apply this cut…
                </button>
              )}
            </Panel>
          )}

          {!preview.dry_run && (
            <Panel hover={false}>
              <p className="text-sm text-emerald-400">
                Gate applied. Advancing teams now have Stage 3 and Stage 4 open.
              </p>
            </Panel>
          )}
        </>
      )}
    </div>
  );
};

export default StageGatePanel;
