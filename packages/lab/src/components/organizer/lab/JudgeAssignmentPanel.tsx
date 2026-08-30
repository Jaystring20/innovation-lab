import { useState } from 'react';
import { Loader2, Plus } from 'lucide-react';
import Panel from '@/components/Panel';
import GlowButton from '@/components/GlowButton';
import { cn } from '@/lib/utils';
import type { LabData } from './LabConsole';

interface JudgeAssignmentPanelProps {
  data: LabData;
  organizerId: string;
  onChanged: () => void;
}

const JudgeAssignmentPanel: React.FC<JudgeAssignmentPanelProps> = ({ data }) => {
  const [busy, setBusy] = useState(false);

  const unassigned = data.submissions.filter((s) => {
    const assigned = data.assignments.filter((a) => a.submission_id === s.id);
    return assigned.length === 0 && s.status === 'submitted';
  });

  return (
    <div className="space-y-4">
      <Panel hover={false} className="p-4 bg-info/10 border border-info/20">
        <p className="text-sm text-foreground">
          <span className="font-semibold">{unassigned.length}</span> submissions need judge assignment
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Assign {Math.ceil(unassigned.length / 3)} judges to cover all submissions (3 per submission)
        </p>
      </Panel>

      <div className="space-y-3">
        {unassigned.map((sub) => {
          const team = data.teams.find((t) => t.id === sub.team_id);
          const stage = data.stages.find((s) => s.id === sub.stage_id);

          return (
            <Panel key={sub.id} hover className="p-4">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <p className="font-medium text-foreground">{team?.name}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stage?.name}</p>
                </div>
                <div className="flex gap-2">
                  <select
                    disabled={busy}
                    className="bg-secondary/40 border border-border rounded px-3 py-2 text-sm text-foreground disabled:opacity-60"
                    defaultValue=""
                  >
                    <option value="">Select judge...</option>
                    {data.judges.map((j) => (
                      <option key={j.id} value={j.id}>
                        {j.full_name || j.email}
                      </option>
                    ))}
                  </select>
                  <GlowButton type="button" size="sm" disabled={busy}>
                    <Plus className="w-4 h-4" />
                  </GlowButton>
                </div>
              </div>
            </Panel>
          );
        })}
      </div>

      {unassigned.length === 0 && (
        <Panel hover={false}>
          <p className="text-sm text-muted-foreground text-center py-6">
            All submissions have been assigned judges.
          </p>
        </Panel>
      )}
    </div>
  );
};

export default JudgeAssignmentPanel;
