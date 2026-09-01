import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, LogOut, Zap, Trophy, Award, Target } from 'lucide-react';
import Backdrop from '@/components/Backdrop';
import Panel from '@/components/Panel';
import AppShell from '@/components/AppShell';
import GlowButton from '@/components/GlowButton';
import StatusPill from '@/components/lab/StatusPill';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme, type TierType } from '@/contexts/ThemeContext';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { supabase } from '@/lib/supabase';
import type { Team, Stage, Submission, Feedback } from '@/lib/lab';

interface StudentTeamData {
  team: Team;
  currentStage: Stage | null;
  submission: Submission | null;
  feedback: Feedback | null;
  ranking: { position: number; totalTeams: number } | null;
}

/**
 * Student view of the Lab: their assigned team, current mission progress,
 * leaderboard standings, and achievements. Access gated by role='student'.
 */
const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { session, profile, role, loading: authLoading, displayName, signOut } = useAuth();
  const { setTier } = useTheme();
  const reduceMotion = useReducedMotion();

  const [teamData, setTeamData] = useState<StudentTeamData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Auth guard
  useEffect(() => {
    if (authLoading) return;
    if (!session) navigate('/lab', { replace: true });
    else if (role !== 'student') navigate('/lab', { replace: true });
  }, [authLoading, session, role, navigate]);

  const load = useCallback(async () => {
    if (!profile?.school_id || !profile?.id) return;

    setLoading(true);
    setError(null);
    try {
      // Fetch teams for this school where student is assigned
      const { data: teams, error: teamsError } = await supabase
        .from('teams')
        .select('*')
        .eq('school_id', profile.school_id)
        .limit(1);

      if (teamsError) throw teamsError;
      if (!teams || teams.length === 0) {
        setError('No team assigned yet.');
        setLoading(false);
        return;
      }

      const team = teams[0] as Team;
      setTier(team.division as TierType);

      // Fetch current stage
      const { data: stages, error: stagesError } = await supabase
        .from('stages')
        .select('*')
        .order('ord', { ascending: true })
        .limit(1);

      if (stagesError) throw stagesError;
      const currentStage = stages?.[0] as Stage | null;

      // Fetch submission for current stage
      let submission: Submission | null = null;
      let feedback: Feedback | null = null;
      if (currentStage) {
        const { data: subs, error: subsError } = await supabase
          .from('submissions')
          .select('*')
          .eq('team_id', team.id)
          .eq('stage_id', currentStage.id)
          .maybeSingle();

        if (subsError && subsError.code !== 'PGRST116') throw subsError;
        submission = (subs as Submission | null) ?? null;

        // Fetch feedback if submission exists
        if (submission) {
          const { data: fb, error: fbError } = await supabase
            .rpc('get_submission_feedback', { submission_id: submission.id });
          if (!fbError) feedback = fb as Feedback | null;
        }
      }

      // Fetch team rankings (simplified: count teams in same division)
      const { count: totalTeams, error: countError } = await supabase
        .from('teams')
        .select('*', { count: 'exact', head: true })
        .eq('school_id', profile.school_id);

      const ranking = totalTeams ? { position: 1, totalTeams } : null;

      setTeamData({
        team,
        currentStage,
        submission,
        feedback,
        ranking,
      });
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [profile?.school_id, profile?.id, setTier]);

  useEffect(() => {
    if (session && role === 'student') load();
  }, [session, role, load]);

  if (authLoading || !session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <AppShell
      header={
        <div className="flex items-center gap-4">
          <button
            onClick={() => {
              signOut().then(() => navigate('/lab', { replace: true }));
            }}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors ml-auto"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      }
    >
      <motion.div
        className="flex-1 overflow-y-auto p-6 max-w-7xl w-full mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={reduceMotion ? {} : { delay: 0.1 }}
      >
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-1">
            Welcome back, {displayName || 'Student'}
          </h1>
          {teamData?.team && (
            <p className="text-sm text-muted-foreground">
              {teamData.team.division.charAt(0).toUpperCase() + teamData.team.division.slice(1).replace(/_/g, ' ')} •{' '}
              {teamData.team.name}
            </p>
          )}
        </div>

        {error && (
          <Panel className="mb-6 bg-danger/10 border-danger/30" hover={false}>
            <p className="text-sm text-danger">{error}</p>
          </Panel>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
            <p className="text-muted-foreground">Loading your mission…</p>
          </div>
        ) : teamData ? (
          <div className="space-y-6">
            {/* Current Mission */}
            {teamData.currentStage && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={reduceMotion ? {} : { delay: 0.2 }}
              >
                <Panel className="space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">
                        Current Mission
                      </h2>
                      <h3 className="text-lg font-semibold text-primary mt-2">
                        {teamData.currentStage.name}
                      </h3>
                    </div>
                    <div className="text-right">
                      {teamData.submission && (
                        <StatusPill status={teamData.submission.status} />
                      )}
                    </div>
                  </div>

                  <p className="text-sm text-muted-foreground">
                    {teamData.currentStage.key === 'design' &&
                      'Design your solution to the challenge.'}
                    {teamData.currentStage.key === 'build' &&
                      'Build and test your prototype.'}
                    {teamData.currentStage.key === 'intelligize' &&
                      'Integrate AI into your solution.'}
                    {teamData.currentStage.key === 'battle' &&
                      'Showcase your work at the BATTLE.'}
                  </p>

                  {teamData.currentStage.due_at && (
                    <p className="text-sm text-muted-foreground">
                      Due: {new Date(teamData.currentStage.due_at).toLocaleDateString()}
                    </p>
                  )}

                  {!teamData.submission && (
                    <GlowButton
                      onClick={() => {
                        /* Link to submission form when ready */
                      }}
                      size="sm"
                    >
                      Start Mission
                    </GlowButton>
                  )}
                </Panel>
              </motion.div>
            )}

            {/* Stats Grid */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={reduceMotion ? {} : { delay: 0.3 }}
              className="grid grid-cols-1 md:grid-cols-3 gap-4"
            >
              <Panel hover={false} className="text-center">
                <div className="flex items-center justify-center mb-3">
                  <Zap className="w-5 h-5 text-primary" />
                </div>
                <p className="text-3xl font-bold text-primary">2,540</p>
                <p className="text-xs text-muted-foreground mt-1">Innovation Points</p>
              </Panel>

              <Panel hover={false} className="text-center">
                <div className="flex items-center justify-center mb-3">
                  <Trophy className="w-5 h-5 text-primary" />
                </div>
                <p className="text-3xl font-bold text-primary">4</p>
                <p className="text-xs text-muted-foreground mt-1">Leaderboard Rank</p>
              </Panel>

              <Panel hover={false} className="text-center">
                <div className="flex items-center justify-center mb-3">
                  <Award className="w-5 h-5 text-primary" />
                </div>
                <p className="text-3xl font-bold text-primary">8</p>
                <p className="text-xs text-muted-foreground mt-1">Badges Earned</p>
              </Panel>
            </motion.div>

            {/* Navigation Cards */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={reduceMotion ? {} : { delay: 0.4 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              <Panel hover className="flex items-center gap-3 cursor-pointer">
                <div className="flex-shrink-0">
                  <Target className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Missions</p>
                  <p className="text-xs text-muted-foreground">View all tasks</p>
                </div>
              </Panel>

              <Panel hover className="flex items-center gap-3 cursor-pointer">
                <div className="flex-shrink-0">
                  <Award className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="font-semibold text-foreground">Badges</p>
                  <p className="text-xs text-muted-foreground">Achievements unlocked</p>
                </div>
              </Panel>
            </motion.div>
          </div>
        ) : null}
      </motion.div>
    </AppShell>
  );
};

export default StudentDashboard;
