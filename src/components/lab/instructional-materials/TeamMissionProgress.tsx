'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface TeamRole {
  id: string;
  name: string;
  studentName: string;
  studentId: string;
  status: 'completed' | 'in-progress' | 'not-started';
  completedDate?: string;
  contribution?: string;
}

interface TeamProgress {
  teamId: string;
  teamName: string;
  studentCount: number;
  overallProgress: number;
  currentStep: number;
  totalSteps: number;
  roles: TeamRole[];
  startedDate?: string;
  lastUpdated: string;
}

interface TeamMissionProgressProps {
  schoolId: string;
  teacherId: string;
  stageId: string;
  stageName: string;
  teamCount: number;
}

const STATUS_CONFIG = {
  'completed': {
    icon: <CheckCircle className="w-4 h-4 text-green-600 dark:text-green-400" />,
    label: 'Completed',
    color: 'bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900',
  },
  'in-progress': {
    icon: <Clock className="w-4 h-4 text-amber-600 dark:text-amber-400" />,
    label: 'In Progress',
    color: 'bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-900',
  },
  'not-started': {
    icon: <AlertCircle className="w-4 h-4 text-zinc-400" />,
    label: 'Not Started',
    color: 'bg-zinc-50 dark:bg-zinc-900/20 border-zinc-200 dark:border-zinc-800',
  },
};

export function TeamMissionProgress({
  schoolId,
  teacherId,
  stageId,
  stageName,
  teamCount,
}: TeamMissionProgressProps) {
  const [teams, setTeams] = useState<TeamProgress[]>([]);
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load team data from Supabase
  useEffect(() => {
    const loadTeamData = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch all teams for this school
        const { data: schoolTeams, error: teamsError } = await supabase
          .from('teams')
          .select('*')
          .eq('school_id', schoolId);

        if (teamsError) throw teamsError;
        if (!schoolTeams || schoolTeams.length === 0) {
          setTeams([]);
          return;
        }

        // For each team, fetch configuration and member data
        const teamsData: TeamProgress[] = [];

        for (const team of schoolTeams) {
          // Fetch team configuration (includes template/roles)
          const { data: config } = await supabase
            .from('team_configurations')
            .select('*')
            .eq('team_id', team.id)
            .single();

          // Fetch team member profiles with role assignments
          const { data: members } = await supabase
            .from('team_member_profiles')
            .select(`
              *,
              user:auth.users(*)
            `)
            .eq('team_id', team.id);

          // Fetch team mission progress for this stage
          const { data: progress } = await supabase
            .from('team_mission_progress')
            .select('*')
            .eq('team_id', team.id)
            .eq('stage_id', stageId)
            .single();

          // Fetch role contributions to get status
          const { data: contributions } = await supabase
            .from('role_contributions')
            .select('*')
            .eq('team_id', team.id)
            .eq('stage_id', stageId);

          // Build team roles with status information
          const teamRoles: TeamRole[] = (members || []).map((member) => {
            const contribution = contributions?.find(
              (c) => c.team_role_id === member.id
            );

            return {
              id: member.id,
              name: member.assigned_role,
              studentName: member.full_name || 'Unknown',
              studentId: member.student_id,
              status: (contribution?.status || 'not-started') as 'completed' | 'in-progress' | 'not-started',
              completedDate: contribution?.completed_date ? new Date(contribution.completed_date).toLocaleDateString() : undefined,
              contribution: contribution?.contribution_description || undefined,
            };
          });

          teamsData.push({
            teamId: team.id,
            teamName: team.team_name,
            studentCount: teamRoles.length,
            overallProgress: progress?.overall_progress || 0,
            currentStep: progress?.current_step || 0,
            totalSteps: progress?.total_steps || 3,
            startedDate: progress?.started_date ? new Date(progress.started_date).toLocaleDateString() : undefined,
            lastUpdated: progress?.last_updated ? new Date(progress.last_updated).toLocaleTimeString() : 'Never',
            roles: teamRoles,
          });
        }

        setTeams(teamsData);
        // Expand first team by default
        if (teamsData.length > 0) {
          setExpandedTeams(new Set([teamsData[0].teamId]));
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load team data');
      } finally {
        setLoading(false);
      }
    };

    loadTeamData();
  }, [schoolId, stageId]);

  const toggleTeamExpanded = (teamId: string) => {
    const newExpanded = new Set(expandedTeams);
    if (newExpanded.has(teamId)) {
      newExpanded.delete(teamId);
    } else {
      newExpanded.add(teamId);
    }
    setExpandedTeams(newExpanded);
  };

  if (loading) {
    return (
      <section className="space-y-3">
        <div className="border border-zinc-300 dark:border-zinc-700 rounded-lg p-6 text-center">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading team progress...</p>
        </div>
      </section>
    );
  }

  if (error) {
    return (
      <section className="space-y-3">
        <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded-lg p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-500 text-red-900 dark:text-red-100">Error loading teams</p>
            <p className="text-xs text-red-800 dark:text-red-200 mt-1">{error}</p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-500 text-zinc-900 dark:text-zinc-100">
            📊 Team Mission Progress & Role Contributions
          </h3>
          <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
            Track team progress and verify collaboration across roles
          </p>
        </div>
        <span className="text-xs font-500 text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800 px-2 py-1 rounded">
          {teams.length} teams
        </span>
      </div>

      {/* Teams */}
      <div className="space-y-2">
        {teams.length === 0 ? (
          <div className="border border-dashed border-zinc-300 dark:border-zinc-700 rounded-lg p-6 text-center">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">No teams configured yet</p>
          </div>
        ) : (
          teams.map((team) => {
            const isExpanded = expandedTeams.has(team.teamId);
            const completedRoles = team.roles.filter((r) => r.status === 'completed').length;
            const inProgressRoles = team.roles.filter((r) => r.status === 'in-progress').length;

            return (
              <div
                key={team.teamId}
                className="border border-zinc-300 dark:border-zinc-700 rounded-lg overflow-hidden bg-white dark:bg-zinc-950"
              >
                {/* Team Header */}
                <div
                  className="p-4 flex items-center justify-between cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition"
                  onClick={() => toggleTeamExpanded(team.teamId)}
                >
                  <div className="flex-grow">
                    <div className="flex items-center gap-2 mb-2">
                      <h4 className="text-sm font-600 text-zinc-900 dark:text-zinc-100">
                        {team.teamName}
                      </h4>
                      <span className="text-xs font-500 text-zinc-500 dark:text-zinc-400">
                        {team.studentCount} students
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="flex items-center gap-2 mb-2">
                      <div className="flex-grow bg-zinc-200 dark:bg-zinc-800 rounded-full h-2 overflow-hidden">
                        <div
                          className="bg-blue-600 dark:bg-blue-500 h-full transition-all"
                          style={{ width: `${team.overallProgress}%` }}
                        />
                      </div>
                      <span className="text-xs font-600 text-zinc-700 dark:text-zinc-300 min-w-fit">
                        {team.overallProgress}%
                      </span>
                    </div>

                    {/* Status Summary */}
                    <div className="text-xs text-zinc-600 dark:text-zinc-400 space-y-1">
                      <p>
                        Step {team.currentStep}/{team.totalSteps} · Last updated: {team.lastUpdated}
                      </p>
                      <p>
                        ✅ {completedRoles} roles completed ·{' '}
                        {inProgressRoles > 0 && `⏳ ${inProgressRoles} in progress ·`} 📧 Latest:
                        {team.roles[team.roles.length - 1]?.studentName}
                      </p>
                    </div>
                  </div>

                  <ChevronDown
                    className={`w-4 h-4 text-zinc-500 transition flex-shrink-0 ml-2 ${
                      isExpanded ? 'rotate-180' : ''
                    }`}
                  />
                </div>

                {/* Role Contributions (Expanded) */}
                {isExpanded && (
                  <div className="border-t border-zinc-200 dark:border-zinc-700 px-4 py-4 bg-zinc-50 dark:bg-zinc-900/30 space-y-3">
                    {team.roles.map((role) => {
                      const config = STATUS_CONFIG[role.status];
                      return (
                        <div
                          key={role.id}
                          className={`p-3 border rounded-lg ${config.color}`}
                        >
                          <div className="flex items-start gap-2">
                            {config.icon}
                            <div className="flex-grow">
                              <p className="text-xs font-600 text-zinc-900 dark:text-zinc-100">
                                {role.studentName} ({role.name})
                              </p>
                              <p className="text-xs text-zinc-700 dark:text-zinc-300 mt-1">
                                {role.contribution || 'No contribution yet'}
                              </p>
                              {role.completedDate && (
                                <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                                  Completed: {role.completedDate}
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Summary Stats */}
      {teams.length > 0 && (
        <div className="grid grid-cols-3 gap-2 text-xs">
          <div className="bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg p-3 text-center">
            <p className="font-600 text-green-900 dark:text-green-100">
              {teams.filter((t) => t.overallProgress === 100).length}
            </p>
            <p className="text-green-700 dark:text-green-200">Teams complete</p>
          </div>
          <div className="bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg p-3 text-center">
            <p className="font-600 text-amber-900 dark:text-amber-100">
              {teams.filter((t) => t.overallProgress > 0 && t.overallProgress < 100).length}
            </p>
            <p className="text-amber-700 dark:text-amber-200">In progress</p>
          </div>
          <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-3 text-center">
            <p className="font-600 text-blue-900 dark:text-blue-100">
              {Math.round(teams.reduce((sum, t) => sum + t.overallProgress, 0) / teams.length)}%
            </p>
            <p className="text-blue-700 dark:text-blue-200">Class average</p>
          </div>
        </div>
      )}
    </section>
  );
}
