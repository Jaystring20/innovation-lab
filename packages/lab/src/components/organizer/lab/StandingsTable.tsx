import { useMemo } from 'react';
import { Medal } from 'lucide-react';
import Panel from '@/components/Panel';
import { cn } from '@/lib/utils';
import type { LabData } from './LabConsole';

interface StandingsTableProps {
  data: LabData;
}

const StandingsTable: React.FC<StandingsTableProps> = ({ data }) => {
  const byDivision = useMemo(() => {
    const groups: Record<string, typeof data.standings> = {};
    data.standings.forEach((s) => {
      if (!groups[s.division]) groups[s.division] = [];
      groups[s.division].push(s);
    });
    return Object.entries(groups).map(([div, standings]) => ({
      division: div,
      standings: standings.sort((a, b) => a.division_rank - b.division_rank),
    }));
  }, [data.standings]);

  return (
    <div className="space-y-8">
      {byDivision.map(({ division, standings }) => (
        <div key={division}>
          <h3 className="text-lg font-bold text-foreground mb-3 capitalize">{division} Division</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b border-border">
                <tr>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Rank</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Team</th>
                  <th className="text-left py-3 px-4 font-semibold text-muted-foreground">School</th>
                  {data.stages.map((stage) => (
                    <th
                      key={stage.id}
                      className="text-center py-3 px-4 font-semibold text-muted-foreground text-xs"
                    >
                      {stage.name.split(' ')[0]}
                    </th>
                  ))}
                  <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Overall</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {standings.map((standing, idx) => {
                  const team = data.teams.find((t) => t.id === standing.team_id);
                  const school = data.schools.find((s) => s.id === standing.school_id);
                  const isMedal = idx < 3;
                  const medalEmoji = ['🥇', '🥈', '🥉'][idx];

                  return (
                    <tr key={standing.team_id} className="hover:bg-white/5 transition-colors">
                      <td className={cn('py-3 px-4 font-bold', isMedal && 'text-primary')}>
                        {isMedal && <span className="mr-1">{medalEmoji}</span>}
                        {standing.division_rank}
                      </td>
                      <td className="py-3 px-4 font-medium">{team?.name}</td>
                      <td className="py-3 px-4 text-muted-foreground text-xs">{school?.name}</td>
                      {data.stages.map((stage) => {
                        const score = standing.stage_scores[stage.id];
                        return (
                          <td key={stage.id} className="text-center py-3 px-4 text-muted-foreground">
                            {score ? Math.round(score) : '-'}
                          </td>
                        );
                      })}
                      <td className="text-right py-3 px-4 font-semibold tabular-nums">
                        {standing.overall ? Math.round(standing.overall) : '-'}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StandingsTable;
