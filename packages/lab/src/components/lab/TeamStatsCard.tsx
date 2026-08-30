import { Users, Target, TrendingUp } from 'lucide-react';
import Panel from '@/components/Panel';
import { type Team, type Stage, type Submission } from '@/lib/lab';
import { cn } from '@/lib/utils';

interface TeamStatsCardProps {
  team: Team;
  stages: Stage[];
  submissions: Submission[];
}

/**
 * TeamStatsCard — overview of team progress and stats
 * Shows: team name, member count, current stage, total XP, advancement status
 */
const TeamStatsCard: React.FC<TeamStatsCardProps> = ({ team, stages, submissions }) => {
  // Calculate current stage (highest completed)
  const currentStageIndex = Math.max(
    0,
    submissions.length > 0
      ? stages.findIndex((s) => s.id === submissions[submissions.length - 1]?.stage_id)
      : -1
  ) + 1;

  // Get team XP (sum of all scored submissions)
  const totalXP = submissions
    .filter((s) => s.status === 'scored')
    .reduce((sum, s) => sum + (s.score || 0), 0);

  const isAdvanced = team.advanced_at !== null;
  const isEliminated = team.eliminated_after_stage !== null;

  return (
    <Panel className="space-y-6" hover={false}>
      {/* Header */}
      <div className="border-b border-border pb-4">
        <h2 className="text-2xl font-bold text-foreground font-display">{team.name}</h2>
        <div className="flex items-center gap-2 mt-2">
          {isAdvanced && <span className="text-xs font-semibold text-ok px-2 py-1 bg-ok/10 rounded">
            Advanced to Finals
          </span>}
          {isEliminated && <span className="text-xs font-semibold text-danger px-2 py-1 bg-danger/10 rounded">
            Eliminated at Stage {team.eliminated_after_stage}
          </span>}
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-3 gap-4">
        {/* Members */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Users className="w-4 h-4" />
            <span className="text-xs uppercase tracking-widest">Members</span>
          </div>
          <p className="text-2xl font-bold text-foreground font-display tabular-nums">
            {team.member_count ?? 0}
          </p>
        </div>

        {/* Current Stage */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Target className="w-4 h-4" />
            <span className="text-xs uppercase tracking-widest">Stage</span>
          </div>
          <p className="text-2xl font-bold text-foreground font-display">
            {currentStageIndex}/{stages.length}
          </p>
        </div>

        {/* Total XP */}
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-muted-foreground">
            <TrendingUp className="w-4 h-4" />
            <span className="text-xs uppercase tracking-widest">XP</span>
          </div>
          <p className="text-2xl font-bold text-primary font-display tabular-nums">
            {totalXP}
          </p>
        </div>
      </div>

      {/* Stage Progress Bar */}
      <div className="space-y-2 pt-2 border-t border-border">
        <p className="text-xs uppercase tracking-widest text-muted-foreground">Progress</p>
        <div className="flex gap-1">
          {stages.map((stage, idx) => {
            const isCompleted = idx < currentStageIndex;
            const isCurrent = idx === currentStageIndex - 1;
            return (
              <div
                key={stage.id}
                className={cn(
                  'flex-1 h-2 rounded-sm transition-colors',
                  isCompleted ? 'bg-primary' : isCurrent ? 'bg-primary/50' : 'bg-muted'
                )}
                title={stage.name}
              />
            );
          })}
        </div>
      </div>
    </Panel>
  );
};

export default TeamStatsCard;
