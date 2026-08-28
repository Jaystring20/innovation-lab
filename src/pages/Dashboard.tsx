import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, Plus, RefreshCw, Users } from 'lucide-react';
import GlassCard from '@/components/GlassCard';
import GlowButton from '@/components/GlowButton';
import GlassOrbs from '@/components/GlassOrbs';
import DashboardHeader from '@/components/dashboard/DashboardHeader';
import TeamPanel from '@/components/lab/TeamPanel';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme, type TierType } from '@/contexts/ThemeContext';
import { createTeam, listMyTeams, listStages, type Stage, type Team } from '@/lib/lab';

/**
 * Teacher view of the Lab: this school's teams, each running the 4-Stage
 * Innovation Funnel. Access is the teacher's profile.school_id — an account an
 * organizer has not linked yet can see nothing, which is the expected state
 * between registering and being linked.
 */
const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const { session, profile, role, loading: authLoading, displayName } = useAuth();
  const { setTier } = useTheme();

  const [stages, setStages] = useState<Stage[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (authLoading) return;
    if (!session) navigate('/lab', { replace: true });
    else if (role === 'organizer') navigate('/organizer', { replace: true });
    else if (role === 'judge') navigate('/lab/judge', { replace: true });
  }, [authLoading, session, role, navigate]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [s, t] = await Promise.all([listStages(), listMyTeams()]);
      setStages(s);
      setTeams(t);
      // Follow the school's own division for palette and typeface.
      if (t[0]) setTier(t[0].division as TierType);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [setTier]);

  useEffect(() => {
    if (session && role === 'teacher') load();
  }, [session, role, load]);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!profile?.school_id || !newName.trim()) return;
    setCreating(true);
    setError(null);
    try {
      const team = await createTeam(profile.school_id, newName);
      setTeams((rows) => [...rows, team]);
      setNewName('');
      setTier(team.division as TierType);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setCreating(false);
    }
  }

  if (authLoading || !session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  // Registered, but no organizer has linked the account to a school yet.
  if (!profile?.school_id) {
    return (
      <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 relative overflow-hidden">
        <GlassOrbs />
        <GlassCard className="max-w-md relative z-10 text-center p-8" hover={false}>
          <div className="w-12 h-12 rounded-full bg-primary/15 flex items-center justify-center mx-auto mb-4">
            <Users className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-xl font-bold text-foreground mb-2">
            Waiting to be linked to your school
          </h1>
          <p className="text-sm text-muted-foreground">
            Your account ({displayName}) is registered. The APEN 2026 team links it to your
            school once your kit order is confirmed — then your teams and the Innovation
            Funnel appear here.
          </p>
        </GlassCard>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <DashboardHeader />

      <motion.main
        className="flex-1 overflow-y-auto p-6 max-w-6xl w-full mx-auto"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
      >
        <div className="flex items-start justify-between gap-4 mb-6 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Your teams</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Each team runs the 4-Stage Innovation Funnel: Design → Build → Intelligize →
              BATTLE.
            </p>
          </div>
          <button
            onClick={load}
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary"
          >
            <RefreshCw className="w-4 h-4" /> Refresh
          </button>
        </div>

        {error && (
          <GlassCard className="mb-4" hover={false}>
            <p className="text-sm text-red-400">{error}</p>
          </GlassCard>
        )}

        <GlassCard className="mb-6" hover={false}>
          <form onSubmit={handleCreate} className="flex gap-3 items-end flex-wrap">
            <div className="flex-1 min-w-[220px]">
              <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-2">
                Add a team
              </label>
              <input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="e.g. Team Harvest"
                className="w-full bg-secondary/40 border-2 border-white/10 rounded-lg py-2.5 px-3 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 transition-all"
              />
            </div>
            <GlowButton type="submit" size="sm" disabled={creating || !newName.trim()}>
              <span className="flex items-center gap-2">
                {creating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Add team
              </span>
            </GlowButton>
          </form>
          <p className="text-xs text-muted-foreground/70 mt-2">
            You can add as many teams as your school registered kits for.
          </p>
        </GlassCard>

        {loading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading your teams…
          </div>
        ) : teams.length === 0 ? (
          <GlassCard hover={false}>
            <p className="text-sm text-muted-foreground">
              No teams yet. Add your first team above to open Stage 1.
            </p>
          </GlassCard>
        ) : (
          <div className="space-y-5">
            {teams.map((team) => (
              <TeamPanel key={team.id} team={team} stages={stages} />
            ))}
          </div>
        )}
      </motion.main>
    </div>
  );
};

export default Dashboard;
