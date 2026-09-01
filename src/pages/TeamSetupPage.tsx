import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Loader2, ArrowLeft, LogOut } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import Backdrop from '@/components/Backdrop';
import Panel from '@/components/Panel';
import AppShell from '@/components/AppShell';
import GlowButton from '@/components/GlowButton';
import { TeamSetup } from '@/components/lab/TeamSetup';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme, type TierType } from '@/contexts/ThemeContext';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { listMyTeams, type Team } from '@/lib/lab';

interface Student {
  id: string;
  email: string;
  name: string;
}

/**
 * Team Setup Page: Configure teams with roles and member assignments.
 * Teachers use this to set up flexible team configurations before students start work.
 */
const TeamSetupPage: React.FC = () => {
  const navigate = useNavigate();
  const { session, profile, role, loading: authLoading, signOut } = useAuth();
  const { setTier } = useTheme();
  const reduceMotion = useReducedMotion();

  const [teams, setTeams] = useState<Team[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [configuredTeams, setConfiguredTeams] = useState<Set<string>>(new Set());

  // Auth guard
  useEffect(() => {
    if (authLoading) return;
    if (!session) navigate('/lab', { replace: true });
    else if (role === 'organizer') navigate('/organizer', { replace: true });
    else if (role === 'judge') navigate('/lab/judge', { replace: true });
  }, [authLoading, session, role, navigate]);

  // Load teams and students
  const load = useCallback(async () => {
    if (!profile?.school_id) return;

    setLoading(true);
    setError(null);
    try {
      // Fetch teams
      const teamsData = await listMyTeams();
      setTeams(teamsData);
      if (teamsData.length > 0) {
        setTier(teamsData[0].division as TierType);
        setSelectedTeamId(teamsData[0].id);
      }

      // Fetch students for this school
      const { data: studentsData, error: studentsError } = await supabase
        .from('profiles')
        .select('id, email, full_name')
        .eq('school_id', profile.school_id)
        .eq('role', 'teacher')
        .order('full_name', { ascending: true });

      if (studentsError) throw studentsError;

      const formattedStudents: Student[] = (studentsData || []).map((s) => ({
        id: s.id,
        email: s.email || '',
        name: s.full_name || 'Unknown',
      }));

      setStudents(formattedStudents);

      // Load configured teams
      const { data: configs } = await supabase
        .from('team_configurations')
        .select('team_id')
        .in(
          'team_id',
          teamsData.map((t) => t.id)
        );

      if (configs) {
        setConfiguredTeams(new Set(configs.map((c) => c.team_id)));
      }
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }, [profile?.school_id, setTier]);

  useEffect(() => {
    if (session && role === 'teacher') load();
  }, [session, role, load]);

  const selectedTeam = teams.find((t) => t.id === selectedTeamId);

  if (authLoading || !session) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!profile?.school_id) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
        <Backdrop />
        <Panel className="max-w-md relative z-10 text-center p-8" hover={false}>
          <h1 className="text-xl font-bold text-foreground mb-2">Not linked to school</h1>
          <p className="text-sm text-muted-foreground">
            Your account needs to be linked to a school before you can set up teams.
          </p>
        </Panel>
      </div>
    );
  }

  return (
    <AppShell
      header={
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate('/lab/dashboard', { replace: true })}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back
          </button>
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
          <h1 className="text-3xl font-bold text-foreground mb-2">Team Setup</h1>
          <p className="text-sm text-muted-foreground">
            Configure team roles and assign students before they start the Innovation Funnel.
          </p>
        </div>

        {error && (
          <Panel className="mb-6 bg-danger/10 border-danger/30" hover={false}>
            <p className="text-sm text-danger">{error}</p>
          </Panel>
        )}

        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-primary mr-2" />
            <p className="text-muted-foreground">Loading teams and students…</p>
          </div>
        ) : teams.length === 0 ? (
          <Panel hover={false}>
            <p className="text-sm text-muted-foreground">
              No teams yet. Create teams on the dashboard first, then return here to configure them.
            </p>
            <GlowButton
              onClick={() => navigate('/lab/dashboard')}
              className="mt-4"
              size="sm"
            >
              Go to Dashboard
            </GlowButton>
          </Panel>
        ) : (
          <div className="grid lg:grid-cols-4 gap-6">
            {/* Teams List Sidebar */}
            <motion.div
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={reduceMotion ? {} : { delay: 0.15 }}
              className="lg:col-span-1"
            >
              <Panel className="sticky top-6" hover={false}>
                <h2 className="text-sm font-bold uppercase tracking-wide text-muted-foreground mb-4">
                  Teams
                </h2>
                <div className="space-y-2">
                  {teams.map((team) => (
                    <button
                      key={team.id}
                      onClick={() => setSelectedTeamId(team.id)}
                      className={`w-full text-left px-4 py-3 rounded-lg border-2 transition-all ${
                        selectedTeamId === team.id
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      }`}
                    >
                      <p className="text-sm font-500 text-foreground">{team.name}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {configuredTeams.has(team.id) ? (
                          <span className="text-ok">✓ Configured</span>
                        ) : (
                          <span className="text-warn">Not configured</span>
                        )}
                      </p>
                    </button>
                  ))}
                </div>
              </Panel>
            </motion.div>

            {/* Setup Form */}
            <motion.div
              key={selectedTeamId}
              initial={{ opacity: 0, x: 8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={reduceMotion ? {} : { delay: 0.15 }}
              className="lg:col-span-3"
            >
              {selectedTeam ? (
                <Panel
                  className="space-y-6"
                  hover={false}
                >
                  <div>
                    <h2 className="text-2xl font-bold text-foreground">{selectedTeam.name}</h2>
                    <p className="text-sm text-muted-foreground mt-1">
                      Configure roles and assign team members below.
                    </p>
                  </div>

                  {students.length === 0 ? (
                    <div className="text-center py-8 bg-muted/20 rounded-lg">
                      <p className="text-sm text-muted-foreground">
                        No students found for your school yet.
                      </p>
                    </div>
                  ) : (
                    <TeamSetup
                      schoolId={profile.school_id}
                      teacherId={profile.id}
                      teamId={selectedTeam.id}
                      teamName={selectedTeam.name}
                      students={students}
                      onSave={(config) => {
                        setConfiguredTeams((prev) => new Set([...prev, selectedTeam.id]));
                      }}
                    />
                  )}
                </Panel>
              ) : (
                <Panel hover={false}>
                  <p className="text-sm text-muted-foreground">Select a team to configure</p>
                </Panel>
              )}
            </motion.div>
          </div>
        )}
      </motion.div>
    </AppShell>
  );
};

export default TeamSetupPage;
