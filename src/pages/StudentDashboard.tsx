import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, LogOut, Zap, Trophy, Award, Target, Users, BookOpen } from 'lucide-react';
import Backdrop from '@/components/Backdrop';
import Panel from '@/components/Panel';
import AppShell from '@/components/AppShell';
import GlowButton from '@/components/GlowButton';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme, type TierType } from '@/contexts/ThemeContext';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { listStages, listMyTeams, type Stage, type Team } from '@/lib/lab';
import {
  getStudentProgress,
  getLeaderboard,
  getStudentBadges,
  type StudentProgress,
  type LeaderboardEntry,
  type Badge,
} from '@/lib/student';
import MissionBrowser from '@/components/student/MissionBrowser';
import TeamCollaboration from '@/components/student/TeamCollaboration';
import Leaderboard from '@/components/student/Leaderboard';
import Portfolio from '@/components/student/Portfolio';
import Achievements from '@/components/student/Achievements';

type TabName = 'overview' | 'missions' | 'team' | 'leaderboard' | 'achievements' | 'portfolio';

/**
 * Student Dashboard: The complete learning platform experience.
 * Students experience their innovation journey through 4 stages: Design → Build → Intelligize → Battle.
 * Features: missions, team collaboration, submissions, feedback, XP/badges, leaderboard, portfolio.
 */
const StudentDashboard: React.FC = () => {
  const navigate = useNavigate();
  const { session, profile, role, loading: authLoading, displayName, signOut } = useAuth();
  const { setTier } = useTheme();
  const reduceMotion = useReducedMotion();

  const [currentTab, setCurrentTab] = useState<TabName>('overview');
  const [team, setTeam] = useState<Team | null>(null);
  const [stages, setStages] = useState<Stage[]>([]);
  const [currentStage, setCurrentStage] = useState<Stage | null>(null);
  const [progress, setProgress] = useState<StudentProgress | null>(null);
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [badges, setBadges] = useState<Badge[]>([]);
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
      // Fetch stages
      const stagesData = await listStages();
      setStages(stagesData);
      if (stagesData.length > 0) setCurrentStage(stagesData[0]);

      // Fetch user's team
      const teamsData = await listMyTeams();
      if (teamsData.length === 0) {
        setError('You are not assigned to a team yet.');
        setLoading(false);
        return;
      }

      const userTeam = teamsData[0] as Team;
      setTeam(userTeam);
      setTier(userTeam.division as TierType);

      // Fetch progress
      const progressData = await getStudentProgress(
        profile.id,
        userTeam.id,
        profile.school_id,
      );
      if (progressData) setProgress(progressData);

      // Fetch leaderboard
      const leaderboardData = await getLeaderboard(profile.school_id, userTeam.division);
      setLeaderboard(leaderboardData);

      // Fetch badges
      const badgesData = await getStudentBadges(profile.id);
      setBadges(badgesData);
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

  const unlockedBadgeCount = badges.filter((b) => b.unlocked_at).length;

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
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-1">
            Welcome back, {displayName || 'Student'}
          </h1>
          {team && (
            <p className="text-sm text-muted-foreground">
              {team.division.charAt(0).toUpperCase() + team.division.slice(1).replace(/_/g, ' ')} •{' '}
              {team.name}
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
            <p className="text-muted-foreground">Loading your dashboard…</p>
          </div>
        ) : team && progress ? (
          <>
            {/* Quick Stats */}
            {currentTab === 'overview' && (
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={reduceMotion ? {} : { delay: 0.2 }}
                className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8"
              >
                <Panel hover={false} className="text-center">
                  <div className="flex items-center justify-center mb-3">
                    <Zap className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-3xl font-bold text-primary">{progress.overall_xp}</p>
                  <p className="text-xs text-muted-foreground mt-1">Innovation Points</p>
                </Panel>

                <Panel hover={false} className="text-center">
                  <div className="flex items-center justify-center mb-3">
                    <Trophy className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-3xl font-bold text-primary">#{progress.rank}</p>
                  <p className="text-xs text-muted-foreground mt-1">Leaderboard Rank</p>
                </Panel>

                <Panel hover={false} className="text-center">
                  <div className="flex items-center justify-center mb-3">
                    <Award className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-3xl font-bold text-primary">{unlockedBadgeCount}</p>
                  <p className="text-xs text-muted-foreground mt-1">Badges Earned</p>
                </Panel>

                <Panel hover={false} className="text-center">
                  <div className="flex items-center justify-center mb-3">
                    <Target className="w-5 h-5 text-primary" />
                  </div>
                  <p className="text-3xl font-bold text-primary">{progress.completion_percent}%</p>
                  <p className="text-xs text-muted-foreground mt-1">Journey Complete</p>
                </Panel>
              </motion.div>
            )}

            {/* Navigation Tabs */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={reduceMotion ? {} : { delay: 0.3 }}
              className="flex flex-wrap gap-2 mb-8 pb-4 border-b border-border overflow-x-auto"
            >
              {[
                { id: 'overview' as TabName, label: 'Overview', icon: Target },
                { id: 'missions' as TabName, label: 'Missions', icon: BookOpen },
                { id: 'team' as TabName, label: 'Team', icon: Users },
                { id: 'leaderboard' as TabName, label: 'Leaderboard', icon: Trophy },
                { id: 'achievements' as TabName, label: 'Achievements', icon: Award },
                { id: 'portfolio' as TabName, label: 'Portfolio', icon: Zap },
              ].map(({ id, label, icon: Icon }) => (
                <button
                  key={id}
                  onClick={() => setCurrentTab(id)}
                  className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg transition-all text-sm font-medium ${
                    currentTab === id
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:text-foreground hover:bg-surface'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {label}
                </button>
              ))}
            </motion.div>

            {/* Tab Content */}
            <motion.div
              key={currentTab}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={reduceMotion ? {} : { duration: 0.3 }}
            >
              {/* Overview Tab */}
              {currentTab === 'overview' && currentStage && (
                <div className="space-y-6">
                  <Panel className="space-y-4">
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">{currentStage.name}</h2>
                      <p className="text-sm text-muted-foreground mt-2">
                        {currentStage.key === 'design' && 'Design your solution to the challenge.'}
                        {currentStage.key === 'build' && 'Build and test your prototype.'}
                        {currentStage.key === 'intelligize' && 'Integrate AI into your solution.'}
                        {currentStage.key === 'battle' && 'Showcase your work at the BATTLE.'}
                      </p>
                    </div>
                    {currentStage.due_at && (
                      <p className="text-sm text-muted-foreground">
                        Due: {new Date(currentStage.due_at).toLocaleDateString()}
                      </p>
                    )}
                    <GlowButton size="sm" onClick={() => setCurrentTab('missions')}>
                      View Missions
                    </GlowButton>
                  </Panel>

                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-4">Top Teams</h3>
                      <Leaderboard
                        schoolId={team.school_id}
                        division={team.division}
                        currentTeamId={team.id}
                      />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-foreground mb-4">Recent Badges</h3>
                      <div className="grid grid-cols-3 gap-2">
                        {badges
                          .filter((b) => b.unlocked_at)
                          .slice(0, 6)
                          .map((badge) => (
                            <div key={badge.id} className="text-center">
                              <div className="text-3xl mb-1">{badge.icon_emoji}</div>
                              <p className="text-xs text-muted-foreground truncate">{badge.title}</p>
                            </div>
                          ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Missions Tab */}
              {currentTab === 'missions' && currentStage && (
                <MissionBrowser stage={currentStage} division={team.division} />
              )}

              {/* Team Tab */}
              {currentTab === 'team' && <TeamCollaboration teamId={team.id} />}

              {/* Leaderboard Tab */}
              {currentTab === 'leaderboard' && (
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-4">Leaderboard</h2>
                  <Leaderboard
                    schoolId={team.school_id}
                    division={team.division}
                    currentTeamId={team.id}
                  />
                </div>
              )}

              {/* Achievements Tab */}
              {currentTab === 'achievements' && (
                <Achievements studentId={profile.id} />
              )}

              {/* Portfolio Tab */}
              {currentTab === 'portfolio' && (
                <div>
                  <h2 className="text-xl font-semibold text-foreground mb-6">Your Portfolio</h2>
                  <Portfolio teamId={team.id} />
                </div>
              )}
            </motion.div>
          </>
        ) : null}
      </motion.div>
    </AppShell>
  );
};

export default StudentDashboard;
