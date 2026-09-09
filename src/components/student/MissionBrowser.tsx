import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, BookOpen, Target, Zap } from 'lucide-react';
import Panel from '@/components/Panel';
import { getMissions } from '@/lib/student';
import type { Mission, Stage } from '@/lib/student';

interface MissionBrowserProps {
  stage: Stage;
  division: string;
  onSelectMission?: (mission: Mission) => void;
}

export const MissionBrowser: React.FC<MissionBrowserProps> = ({
  stage,
  division,
  onSelectMission,
}) => {
  const [missions, setMissions] = useState<Mission[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getMissions(stage.id, division);
        setMissions(data);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [stage.id, division]);

  if (loading)
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-primary mr-2" />
        <p className="text-sm text-muted-foreground">Loading missions…</p>
      </div>
    );

  if (error)
    return (
      <Panel className="bg-danger/10 border-danger/30" hover={false}>
        <p className="text-sm text-danger">{error}</p>
      </Panel>
    );

  return (
    <div className="space-y-3">
      {missions.length === 0 ? (
        <Panel hover={false}>
          <p className="text-sm text-muted-foreground text-center py-4">
            No missions available for this stage yet.
          </p>
        </Panel>
      ) : (
        missions.map((mission, idx) => (
          <motion.div
            key={mission.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Panel
              hover
              onClick={() => onSelectMission?.(mission)}
              className="cursor-pointer space-y-2"
            >
              <div className="flex items-start justify-between">
                <h3 className="font-semibold text-foreground">{mission.title}</h3>
                <div className="flex gap-1">
                  <Target className="w-4 h-4 text-primary flex-shrink-0" />
                </div>
              </div>
              <p className="text-sm text-muted-foreground">{mission.brief}</p>
              {mission.learning_objectives.length > 0 && (
                <div className="text-xs text-muted-foreground mt-2">
                  <p className="font-medium mb-1">Learning goals:</p>
                  <ul className="list-disc list-inside space-y-0.5">
                    {mission.learning_objectives.slice(0, 2).map((obj, i) => (
                      <li key={i}>{obj}</li>
                    ))}
                    {mission.learning_objectives.length > 2 && (
                      <li>+{mission.learning_objectives.length - 2} more</li>
                    )}
                  </ul>
                </div>
              )}
              {mission.resources.length > 0 && (
                <div className="flex items-center gap-1 text-xs text-primary mt-2">
                  <BookOpen className="w-3 h-3" />
                  {mission.resources.length} resources available
                </div>
              )}
            </Panel>
          </motion.div>
        ))
      )}
    </div>
  );
};

export default MissionBrowser;
