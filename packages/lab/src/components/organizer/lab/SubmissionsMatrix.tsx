import { useMemo, useState } from 'react';
import { ChevronDown } from 'lucide-react';
import Panel from '@/components/Panel';
import StatusPill from '@/components/lab/StatusPill';
import { cn } from '@/lib/utils';
import type { LabData } from './LabConsole';

interface SubmissionsMatrixProps {
  data: LabData;
  onChanged: () => void;
}

const SubmissionsMatrix: React.FC<SubmissionsMatrixProps> = ({ data }) => {
  const [stageFilter, setStageFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return data.submissions.filter((sub) => {
      if (stageFilter && sub.stages?.key !== stageFilter) return false;
      if (statusFilter && sub.status !== statusFilter) return false;
      return true;
    });
  }, [data.submissions, stageFilter, statusFilter]);

  return (
    <div className="space-y-4">
      <div className="flex gap-2 flex-wrap">
        {['design', 'build', 'intelligize', 'battle'].map((stage) => (
          <button
            key={stage}
            onClick={() => setStageFilter(stageFilter === stage ? null : stage)}
            className={cn(
              'px-3 py-1.5 rounded-lg text-sm transition-colors border',
              stageFilter === stage
                ? 'bg-primary/20 text-primary border-primary/30'
                : 'bg-secondary/20 text-muted-foreground border-border hover:text-foreground',
            )}
          >
            {stage}
          </button>
        ))}
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b border-border">
            <tr>
              <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Team</th>
              <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Division</th>
              <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Stage</th>
              <th className="text-left py-3 px-4 font-semibold text-muted-foreground">Status</th>
              <th className="text-right py-3 px-4 font-semibold text-muted-foreground">Score</th>
              <th className="text-center py-3 px-4 font-semibold text-muted-foreground">Judges</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {filtered.map((sub) => {
              const team = data.teams.find((t) => t.id === sub.team_id);
              const stage = data.stages.find((s) => s.id === sub.stage_id);
              const judges = data.assignments.filter((a) => a.submission_id === sub.id).length;

              return (
                <tr key={sub.id} className="hover:bg-white/5 transition-colors">
                  <td className="py-3 px-4 font-medium">{team?.name ?? 'Unknown'}</td>
                  <td className="py-3 px-4 text-muted-foreground">{team?.division ?? '-'}</td>
                  <td className="py-3 px-4 text-muted-foreground">{stage?.name ?? '-'}</td>
                  <td className="py-3 px-4">
                    <StatusPill status={sub.status} />
                  </td>
                  <td className="py-3 px-4 text-right tabular-nums font-mono">
                    {sub.scores?.avg_total ? Math.round(sub.scores.avg_total) : '-'}/100
                  </td>
                  <td className="py-3 px-4 text-center text-muted-foreground">{judges}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {filtered.length === 0 && (
        <Panel hover={false}>
          <p className="text-sm text-muted-foreground text-center py-6">No submissions.</p>
        </Panel>
      )}
    </div>
  );
};

export default SubmissionsMatrix;
