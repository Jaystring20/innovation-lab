import { useCallback, useEffect, useMemo, useState } from 'react';
import { Loader2, RefreshCw } from 'lucide-react';
import Panel from '@/components/Panel';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import {
  listAllSubmissions,
  listAllTeams,
  listAssignments,
  listJudges,
  listSchools,
  listStages,
  listStandings,
  listUnlinkedTeachers,
  type AdminSubmission,
  type Assignment,
  type JudgeProfile,
  type Stage,
  type Standing,
  type Team,
} from '@/lib/lab';
import type { Division } from '@/lib/store';
import SubmissionsMatrix from './SubmissionsMatrix';
import JudgeAssignmentPanel from './JudgeAssignmentPanel';
import StandingsTable from './StandingsTable';
import StageGatePanel from './StageGatePanel';
import PeoplePanel from './PeoplePanel';

export type AdminTeam = Team & {
  schools: { name: string; contact_name: string; contact_email: string } | null;
};

export interface LabData {
  stages: Stage[];
  teams: AdminTeam[];
  submissions: AdminSubmission[];
  assignments: Assignment[];
  judges: JudgeProfile[];
  standings: Standing[];
  schools: { id: string; name: string; division: Division; contact_email: string }[];
  unlinkedTeachers: JudgeProfile[];
}

type Tab = 'submissions' | 'judging' | 'standings' | 'gate' | 'people';

const TABS: { key: Tab; label: string }[] = [
  { key: 'submissions', label: 'Submissions' },
  { key: 'judging', label: 'Judge assignment' },
  { key: 'standings', label: 'Standings' },
  { key: 'gate', label: 'Stage gate' },
  { key: 'people', label: 'People' },
];

/**
 * The organizer's view of the whole competition. Everything here is
 * organizer-only at the RLS layer — teachers and judges cannot read these
 * tables in full regardless of what the UI asks for.
 */
const LabConsole: React.FC = () => {
  const { session } = useAuth();
  const [tab, setTab] = useState<Tab>('submissions');
  const [data, setData] = useState<LabData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [stages, teams, submissions, assignments, judges, standings, schools, unlinkedTeachers] =
        await Promise.all([
          listStages(),
          listAllTeams(),
          listAllSubmissions(),
          listAssignments(),
          listJudges(),
          listStandings(),
          listSchools(),
          listUnlinkedTeachers(),
        ]);
      setData({
        stages,
        teams: teams as AdminTeam[],
        submissions,
        assignments,
        judges,
        standings,
        schools,
        unlinkedTeachers,
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const counts = useMemo(() => {
    if (!data) return null;
    const s = data.submissions;
    return {
      teams: data.teams.length,
      awaitingAssignment: s.filter((x) => x.status === 'submitted').length,
      inReview: s.filter((x) => x.status === 'under_review').length,
      scored: s.filter((x) => x.status === 'scored').length,
      judges: data.judges.length,
    };
  }, [data]);

  if (loading && !data) {
    return (
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Loader2 className="w-4 h-4 animate-spin" /> Loading the competition…
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {counts && (
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
          <Stat label="Teams" value={counts.teams} />
          <Stat label="Awaiting judges" value={counts.awaitingAssignment} tone="amber" />
          <Stat label="In review" value={counts.inReview} tone="sky" />
          <Stat label="Scored" value={counts.scored} tone="emerald" />
          <Stat label="Judges" value={counts.judges} />
        </div>
      )}

      <div className="flex items-center justify-between gap-3 flex-wrap">
        <nav className="flex gap-1 flex-wrap">
          {TABS.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-sm transition-colors',
                tab === t.key
                  ? 'bg-primary/20 text-primary border border-primary/30'
                  : 'text-muted-foreground hover:bg-white/5 border border-transparent',
              )}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <button
          onClick={load}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
        >
          <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} /> Refresh
        </button>
      </div>

      {error && (
        <Panel hover={false}>
          <p className="text-sm text-red-400">{error}</p>
        </Panel>
      )}

      {data && (
        <>
          {tab === 'submissions' && <SubmissionsMatrix data={data} onChanged={load} />}
          {tab === 'judging' && (
            <JudgeAssignmentPanel
              data={data}
              organizerId={session?.user.id ?? ''}
              onChanged={load}
            />
          )}
          {tab === 'standings' && <StandingsTable data={data} />}
          {tab === 'gate' && <StageGatePanel data={data} onChanged={load} />}
          {tab === 'people' && <PeoplePanel data={data} onChanged={load} />}
        </>
      )}
    </div>
  );
};

const TONES: Record<string, string> = {
  amber: 'text-amber-400',
  sky: 'text-sky-400',
  emerald: 'text-emerald-400',
};

const Stat: React.FC<{ label: string; value: number; tone?: string }> = ({
  label,
  value,
  tone,
}) => (
  <Panel hover={false} className="p-3">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className={cn('text-xl font-bold mt-0.5 tabular-nums', tone ? TONES[tone] : 'text-foreground')}>
      {value}
    </p>
  </Panel>
);

export default LabConsole;
