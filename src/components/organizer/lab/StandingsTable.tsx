import Panel from '@/components/Panel';
import { DIVISION_LABELS, type Division } from '@/lib/store';
import { cn } from '@/lib/utils';
import type { LabData } from './LabConsole';

const DIVISIONS: Division[] = ['primary', 'secondary', 'sixth_form'];

/**
 * Live ranking, straight from the team_standings view — a weighted average of
 * each scored stage, ranked within division. Nothing is tallied by hand.
 */
const StandingsTable: React.FC<{ data: LabData }> = ({ data }) => {
  const anyScored = data.standings.some((s) => s.overall != null);

  if (!anyScored) {
    return (
      <Panel hover={false}>
        <p className="text-sm text-muted-foreground">
          Standings appear once at least one submission has been fully scored. Scores roll up
          automatically — per-criterion average across judges, then weighted by stage.
        </p>
      </Panel>
    );
  }

  return (
    <div className="space-y-5">
      {DIVISIONS.map((div) => {
        const rows = data.standings.filter((s) => s.division === div);
        if (rows.length === 0) return null;
        const schoolName = (id: string) =>
          data.teams.find((t) => t.school_id === id)?.schools?.name ?? '—';

        return (
          <div key={div}>
            <h3 className="text-sm font-semibold text-foreground mb-2">
              {DIVISION_LABELS[div]}
            </h3>
            <Panel className="p-0 overflow-x-auto" hover={false}>
              <table className="w-full text-sm min-w-[560px]">
                <thead>
                  <tr className="text-left text-muted-foreground border-b border-white/10">
                    <th className="p-3 font-medium w-12">#</th>
                    <th className="p-3 font-medium">Team</th>
                    <th className="p-3 font-medium">School</th>
                    {data.stages.map((st) => (
                      <th key={st.id} className="p-3 font-medium text-center">
                        S{st.ord}
                      </th>
                    ))}
                    <th className="p-3 font-medium text-right">Overall</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((s) => (
                    <tr
                      key={s.team_id}
                      className={cn(
                        'border-b border-white/5 last:border-0',
                        s.eliminated_after_stage && 'opacity-50',
                      )}
                    >
                      <td className="p-3 tabular-nums text-muted-foreground">
                        {s.overall == null ? '—' : s.division_rank}
                      </td>
                      <td className="p-3">
                        <span className="text-foreground">{s.team_name}</span>
                        {s.eliminated_after_stage && (
                          <span className="text-xs text-red-400 ml-2">
                            out after S{s.eliminated_after_stage}
                          </span>
                        )}
                        {s.advanced_at && (
                          <span className="text-xs text-emerald-400 ml-2">finalist</span>
                        )}
                      </td>
                      <td className="p-3 text-muted-foreground">{schoolName(s.school_id)}</td>
                      {data.stages.map((st) => (
                        <td
                          key={st.id}
                          className="p-3 text-center tabular-nums text-muted-foreground"
                        >
                          {s.stage_scores?.[String(st.ord)] ?? '—'}
                        </td>
                      ))}
                      <td className="p-3 text-right tabular-nums font-semibold text-foreground">
                        {s.overall ?? '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Panel>
          </div>
        );
      })}
    </div>
  );
};

export default StandingsTable;
