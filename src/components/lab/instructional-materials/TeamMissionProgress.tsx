'use client';

import { useState } from 'react';
import { ChevronDown, AlertCircle, CheckCircle, Clock } from 'lucide-react';

interface TeamRole {
  id: string;
  name: string; // "Designer", "Developer", "Project Manager", etc.
  studentName: string;
  studentId: string;
  status: 'completed' | 'in-progress' | 'not-started';
  completedDate?: string;
  contribution?: string; // e.g., "Completed empathy mapping"
}

interface TeamProgress {
  teamId: string;
  teamName: string;
  studentCount: number;
  overallProgress: number; // 0-100
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

// Mock data - replace with real data from database
const MOCK_TEAMS: TeamProgress[] = [
  {
    teamId: 'team-1',
    teamName: 'Team Alpha',
    studentCount: 4,
    overallProgress: 75,
    currentStep: 2,
    totalSteps: 3,
    startedDate: 'Sep 25',
    lastUpdated: '2 hours ago',
    roles: [
      {
        id: 'role-1',
        name: 'Designer',
        studentName: 'Sarah Ahmed',
        studentId: 'student-1',
        status: 'completed',
        completedDate: 'Oct 3',
        contribution: 'Completed empathy mapping with 3 user personas',
      },
      {
        id: 'role-2',
        name: 'Developer',
        studentName: 'Alex Okafor',
        studentId: 'student-2',
        status: 'completed',
        completedDate: 'Oct 4',
        contribution: 'Finalized problem statement based on research',
      },
      {
        id: 'role-3',
        name: 'Project Manager',
        studentName: 'Maria Silva',
        studentId: 'student-3',
        status: 'in-progress',
        contribution: 'Coordinating ideation session - 8 ideas sketched',
      },
      {
        id: 'role-4',
        name: 'Communicator',
        studentName: 'James Obi',
        studentId: 'student-4',
        status: 'in-progress',
        contribution: 'Documenting process and ideas',
      },
    ],
  },
  {
    teamId: 'team-2',
    teamName: 'Team Beta',
    studentCount: 4,
    overallProgress: 50,
    currentStep: 2,
    totalSteps: 3,
    startedDate: 'Sep 25',
    lastUpdated: '4 hours ago',
    roles: [
      {
        id: 'role-5',
        name: 'Designer',
        studentName: 'Zainab Hassan',
        studentId: 'student-5',
        status: 'completed',
        completedDate: 'Oct 2',
        contribution: 'Completed empathy mapping',
      },
      {
        id: 'role-6',
        name: 'Developer',
        studentName: 'Kofi Mensah',
        studentId: 'student-6',
        status: 'in-progress',
        contribution: 'Working on problem statement',
      },
      {
        id: 'role-7',
        name: 'Project Manager',
        studentName: 'Amara Nwosu',
        studentId: 'student-7',
        status: 'not-started',
        contribution: 'Awaiting input from other roles',
      },
      {
        id: 'role-8',
        name: 'Communicator',
        studentName: 'Tariq Mohammed',
        studentId: 'student-8',
        status: 'not-started',
        contribution: 'Will document after ideation phase',
      },
    ],
  },
  {
    teamId: 'team-3',
    teamName: 'Team Gamma',
    studentCount: 4,
    overallProgress: 25,
    currentStep: 1,
    totalSteps: 3,
    startedDate: 'Sep 26',
    lastUpdated: 'Yesterday',
    roles: [
      {
        id: 'role-9',
        name: 'Designer',
        studentName: 'Nia Patel',
        studentId: 'student-9',
        status: 'in-progress',
        contribution: 'Collecting user interview notes',
      },
      {
        id: 'role-10',
        name: 'Developer',
        studentName: 'Chen Wei',
        studentId: 'student-10',
        status: 'not-started',
        contribution: 'Waiting for user research completion',
      },
      {
        id: 'role-11',
        name: 'Project Manager',
        studentName: 'Lisa Johnson',
        studentId: 'student-11',
        status: 'in-progress',
        contribution: 'Scheduling remaining interviews',
      },
      {
        id: 'role-12',
        name: 'Communicator',
        studentName: 'Emeka Okoro',
        studentId: 'student-12',
        status: 'not-started',
        contribution: 'Ready to start documentation',
      },
    ],
  },
];

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
  const [expandedTeams, setExpandedTeams] = useState<Set<string>>(
    new Set(MOCK_TEAMS.slice(0, 1).map((t) => t.teamId))
  );

  const toggleTeamExpanded = (teamId: string) => {
    const newExpanded = new Set(expandedTeams);
    if (newExpanded.has(teamId)) {
      newExpanded.delete(teamId);
    } else {
      newExpanded.add(teamId);
    }
    setExpandedTeams(newExpanded);
  };

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
          {MOCK_TEAMS.length} teams
        </span>
      </div>

      {/* Teams */}
      <div className="space-y-2">
        {MOCK_TEAMS.map((team) => {
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
                          <div className="flex-grow min-w-0">
                            <div className="flex items-center gap-2">
                              <h5 className="text-xs font-600 text-zinc-900 dark:text-zinc-100">
                                {role.name}
                              </h5>
                              <span className="text-xs font-500 text-zinc-600 dark:text-zinc-400">
                                ({role.studentName})
                              </span>
                            </div>

                            <p className="text-xs text-zinc-700 dark:text-zinc-300 mt-1">
                              {role.contribution}
                            </p>

                            {role.status === 'completed' && role.completedDate && (
                              <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                                ✅ Completed on {role.completedDate}
                              </p>
                            )}

                            {role.status === 'not-started' && (
                              <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                                Not yet started
                              </p>
                            )}
                          </div>
                          <span className="text-xs font-500 text-zinc-600 dark:text-zinc-400 bg-white dark:bg-zinc-900 px-2 py-1 rounded flex-shrink-0">
                            {config.label}
                          </span>
                        </div>
                      </div>
                    );
                  })}

                  {/* Collaboration Assessment */}
                  <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/30 rounded-lg mt-4">
                    <p className="text-xs font-600 text-blue-900 dark:text-blue-100">
                      📌 Collaboration Assessment
                    </p>
                    <ul className="text-xs text-blue-800 dark:text-blue-200 mt-2 space-y-1 list-disc list-inside">
                      <li>
                        {completedRoles}/{team.studentCount} roles have completed their part
                      </li>
                      <li>Roles are dependent on each other (good sign of collaboration)</li>
                      <li>
                        {inProgressRoles > 0
                          ? `${inProgressRoles} roles actively working together`
                          : 'Team momentum is slowing - may need intervention'}
                      </li>
                    </ul>
                  </div>

                  {/* Teacher Actions */}
                  <div className="flex gap-2 pt-2 border-t border-blue-200 dark:border-blue-900/30">
                    <button className="flex-1 px-3 py-2 text-xs font-500 text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/30 hover:bg-blue-200 dark:hover:bg-blue-900/50 rounded transition">
                      Send Encouragement
                    </button>
                    <button className="px-3 py-2 text-xs font-500 text-zinc-600 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-600 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition">
                      View Details
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-3 gap-2 mt-4">
        <div className="p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg">
          <p className="text-xs font-600 text-green-900 dark:text-green-100">
            {MOCK_TEAMS.filter((t) => t.overallProgress === 100).length}
          </p>
          <p className="text-xs text-green-700 dark:text-green-300">Teams Complete</p>
        </div>
        <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900 rounded-lg">
          <p className="text-xs font-600 text-amber-900 dark:text-amber-100">
            {MOCK_TEAMS.reduce((acc, t) => acc + t.roles.filter((r) => r.status === 'in-progress').length, 0)}
          </p>
          <p className="text-xs text-amber-700 dark:text-amber-300">Roles In Progress</p>
        </div>
        <div className="p-3 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg">
          <p className="text-xs font-600 text-blue-900 dark:text-blue-100">
            {Math.round(
              (MOCK_TEAMS.reduce((acc, t) => acc + t.overallProgress, 0) / MOCK_TEAMS.length)
            )}%
          </p>
          <p className="text-xs text-blue-700 dark:text-blue-300">Class Average</p>
        </div>
      </div>
    </section>
  );
}
