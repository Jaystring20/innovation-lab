import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, User } from 'lucide-react';
import TeamStatsCard from './TeamStatsCard';
import StageCard from './StageCard';
import TeamPanel from './TeamPanel';
import { type Team, type Stage, type Submission } from '@/lib/lab';
import { cn } from '@/lib/utils';

interface LabDashboardProps {
  team: Team;
  stages: Stage[];
  submissions: Submission[];
}

type ViewType = 'team' | 'individual';

/**
 * LabDashboard — unified teacher view of one team's lab progression
 * Tabs: Team Overview, Individual Members
 * Content: Team stats, stage cards, stage detail (submissions + feedback)
 */
const LabDashboard: React.FC<LabDashboardProps> = ({ team, stages, submissions }) => {
  const [view, setView] = useState<ViewType>('team');
  const [activeStageId, setActiveStageId] = useState<string | null>(
    submissions[0]?.stage_id ?? stages[0]?.id ?? null
  );

  const tabs: { id: ViewType; label: string; icon: React.ReactNode }[] = [
    { id: 'team', label: 'Team Overview', icon: <Users className="w-4 h-4" /> },
    { id: 'individual', label: 'Members', icon: <User className="w-4 h-4" /> },
  ];

  return (
    <div className="space-y-6">
      {/* Tabs */}
      <div className="flex gap-2 border-b border-border">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setView(tab.id)}
            className={cn(
              'flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors border-b-2',
              view === tab.id
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      <AnimatePresence mode="wait">
        {view === 'team' && (
          <motion.div
            key="team"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-6"
          >
            {/* Team Stats */}
            <TeamStatsCard team={team} stages={stages} submissions={submissions} />

            {/* Stage Progress Grid */}
            <div className="space-y-3">
              <h3 className="text-sm font-bold uppercase tracking-widest text-muted-foreground">
                4-Stage Funnel
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
                {stages.map((stage, idx) => (
                  <StageCard
                    key={stage.id}
                    stage={stage}
                    submission={submissions.find((s) => s.stage_id === stage.id)}
                    index={idx}
                    isActive={activeStageId === stage.id}
                    onClick={() => setActiveStageId(stage.id)}
                  />
                ))}
              </div>
            </div>

            {/* Team Panel (Submission + Feedback) */}
            <TeamPanel team={team} stages={stages} />
          </motion.div>
        )}

        {view === 'individual' && (
          <motion.div
            key="individual"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="space-y-4"
          >
            <p className="text-sm text-muted-foreground">
              Individual member stats and contributions coming soon.
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default LabDashboard;
