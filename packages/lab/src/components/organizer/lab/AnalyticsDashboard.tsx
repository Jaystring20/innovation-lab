import { useMemo } from 'react';
import { TrendingUp, Users, Target, Award, BarChart3 } from 'lucide-react';
import Panel from '@/components/Panel';
import { cn } from '@/lib/utils';
import type { LabData } from './LabConsole';

interface AnalyticsDashboardProps {
  data: LabData;
}

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ data }) => {
  const stats = useMemo(() => {
    const totalTeams = data.teams.length;
    const totalSubmissions = data.submissions.length;
    const scoredSubmissions = data.submissions.filter((s) => s.status === 'scored').length;
    const avgScore =
      scoredSubmissions > 0
        ? data.submissions
            .filter((s) => s.scores?.avg_total)
            .reduce((sum, s) => sum + (s.scores?.avg_total ?? 0), 0) / scoredSubmissions
        : 0;

    const divisionBreakdown = data.teams.reduce(
      (acc, team) => {
        acc[team.division] = (acc[team.division] ?? 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    const stageCompletionByStage = data.stages.map((stage) => {
      const submissions = data.submissions.filter((s) => s.stage_id === stage.id);
      const completed = submissions.filter((s) => s.status === 'scored').length;
      return {
        stageName: stage.name,
        total: submissions.length,
        completed,
        percentage: submissions.length > 0 ? (completed / submissions.length) * 100 : 0,
      };
    });

    const judgeStats = {
      totalJudges: data.judges.length,
      assignedJudges: new Set(data.assignments.map((a) => a.judge_id)).size,
      avgAssignmentsPerJudge: data.assignments.length / data.judges.length,
    };

    return {
      totalTeams,
      totalSubmissions,
      scoredSubmissions,
      avgScore,
      divisionBreakdown,
      stageCompletionByStage,
      judgeStats,
    };
  }, [data]);

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
        <StatCard
          label="Teams"
          value={stats.totalTeams}
          icon={<Users className="w-5 h-5" />}
          trend="+0%"
        />
        <StatCard
          label="Submissions"
          value={stats.totalSubmissions}
          icon={<Target className="w-5 h-5" />}
          subtext={`${stats.scoredSubmissions} scored`}
        />
        <StatCard
          label="Avg Score"
          value={Math.round(stats.avgScore)}
          icon={<Award className="w-5 h-5" />}
          subtext="/100"
          tone="accent"
        />
        <StatCard
          label="Judges"
          value={stats.judgeStats.totalJudges}
          icon={<Users className="w-5 h-5" />}
          subtext={`${stats.judgeStats.assignedJudges} active`}
        />
        <StatCard
          label="Completion"
          value={
            stats.totalSubmissions > 0
              ? Math.round((stats.scoredSubmissions / stats.totalSubmissions) * 100)
              : 0
          }
          icon={<TrendingUp className="w-5 h-5" />}
          subtext="%"
          tone="success"
        />
      </div>

      {/* Stage Completion */}
      <Panel hover={false} className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <BarChart3 className="w-5 h-5 text-primary" />
          <h3 className="font-bold text-foreground">Stage Completion</h3>
        </div>

        <div className="space-y-4">
          {stats.stageCompletionByStage.map((stage) => (
            <div key={stage.stageName}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-foreground">{stage.stageName}</span>
                <span className="text-sm text-muted-foreground">
                  {stage.completed}/{stage.total}
                </span>
              </div>
              <div className="w-full bg-secondary/50 rounded-full h-2 overflow-hidden">
                <div
                  className={cn('h-full transition-all', getProgressColor(stage.percentage))}
                  style={{ width: `${stage.percentage}%` }}
                />
              </div>
              <span className="text-xs text-muted-foreground">
                {Math.round(stage.percentage)}%
              </span>
            </div>
          ))}
        </div>
      </Panel>

      {/* Division Breakdown */}
      <Panel hover={false} className="p-6">
        <h3 className="font-bold text-foreground mb-6">Teams by Division</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(stats.divisionBreakdown).map(([division, count]) => (
            <div
              key={division}
              className="bg-secondary/40 border border-border rounded-lg p-4 text-center"
            >
              <p className="text-sm text-muted-foreground capitalize mb-2">{division}</p>
              <p className="text-3xl font-bold text-primary">{count}</p>
              <p className="text-xs text-muted-foreground mt-2">
                {Math.round((count / stats.totalTeams) * 100)}% of teams
              </p>
            </div>
          ))}
        </div>
      </Panel>

      {/* Judge Utilization */}
      <Panel hover={false} className="p-6">
        <h3 className="font-bold text-foreground mb-6">Judge Utilization</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p className="text-sm text-muted-foreground mb-2">Judges Assigned</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-primary">
                {stats.judgeStats.assignedJudges}
              </span>
              <span className="text-muted-foreground">
                of {stats.judgeStats.totalJudges}
              </span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">
              {Math.round(
                (stats.judgeStats.assignedJudges / stats.judgeStats.totalJudges) * 100,
              )}% active
            </p>
          </div>

          <div>
            <p className="text-sm text-muted-foreground mb-2">Avg Assignments per Judge</p>
            <div className="flex items-baseline gap-2">
              <span className="text-4xl font-bold text-primary">
                {stats.judgeStats.avgAssignmentsPerJudge.toFixed(1)}
              </span>
              <span className="text-muted-foreground">submissions</span>
            </div>
            <p className="text-xs text-muted-foreground mt-2">Fairly balanced</p>
          </div>
        </div>
      </Panel>

      {/* Summary Stats */}
      <Panel hover={false} className="p-6 bg-info/5 border border-info/20">
        <div className="space-y-2">
          <p className="font-medium text-foreground">Competition Summary</p>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>
              • {stats.totalTeams} teams registered across{' '}
              {Object.keys(stats.divisionBreakdown).length} divisions
            </li>
            <li>
              • {stats.scoredSubmissions} of {stats.totalSubmissions} submissions scored (
              {stats.totalSubmissions > 0
                ? Math.round((stats.scoredSubmissions / stats.totalSubmissions) * 100)
                : 0}
              %)
            </li>
            <li>
              • {stats.stageCompletionByStage.length} stages with {stats.totalSubmissions} total
              submissions
            </li>
            <li>
              • {stats.judgeStats.totalJudges} judges assigned to{' '}
              {data.assignments.length} submissions
            </li>
          </ul>
        </div>
      </Panel>
    </div>
  );
};

interface StatCardProps {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  subtext?: string;
  trend?: string;
  tone?: 'default' | 'accent' | 'success' | 'warning';
}

const StatCard: React.FC<StatCardProps> = ({
  label,
  value,
  icon,
  subtext,
  trend,
  tone = 'default',
}) => {
  const toneStyles = {
    default: 'text-foreground',
    accent: 'text-primary',
    success: 'text-ok',
    warning: 'text-warn',
  };

  return (
    <Panel hover={false} className="p-4">
      <div className="flex items-start justify-between gap-2 mb-3">
        <span className="text-muted-foreground">{icon}</span>
        {trend && <span className="text-xs font-medium text-ok">{trend}</span>}
      </div>
      <p className="text-xs text-muted-foreground mb-1">{label}</p>
      <p className={cn('text-2xl font-bold', toneStyles[tone])}>
        {value}
        {subtext && <span className="text-sm text-muted-foreground ml-1">{subtext}</span>}
      </p>
    </Panel>
  );
};

function getProgressColor(percentage: number): string {
  if (percentage === 0) return 'bg-muted';
  if (percentage < 33) return 'bg-warn';
  if (percentage < 67) return 'bg-info';
  return 'bg-ok';
}

export default AnalyticsDashboard;
