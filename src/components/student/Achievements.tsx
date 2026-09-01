import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Lock } from 'lucide-react';
import Panel from '@/components/Panel';
import { getStudentBadges } from '@/lib/student';
import type { Badge } from '@/lib/student';

interface AchievementsProps {
  studentId: string;
}

export const Achievements: React.FC<AchievementsProps> = ({ studentId }) => {
  const [badges, setBadges] = useState<Badge[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getStudentBadges(studentId);
        setBadges(data);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [studentId]);

  if (loading)
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-primary mr-2" />
        <p className="text-sm text-muted-foreground">Loading achievements…</p>
      </div>
    );

  if (error)
    return (
      <Panel className="bg-danger/10 border-danger/30" hover={false}>
        <p className="text-sm text-danger">{error}</p>
      </Panel>
    );

  const unlockedBadges = badges.filter((b) => b.unlocked_at);
  const lockedBadges = badges.filter((b) => !b.unlocked_at);

  return (
    <div className="space-y-6">
      {/* Unlocked Badges */}
      {unlockedBadges.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Achievements Unlocked ({unlockedBadges.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {unlockedBadges.map((badge, idx) => (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: idx * 0.05 }}
              >
                <Panel hover className="flex flex-col items-center text-center p-4">
                  <div className="text-4xl mb-2">{badge.icon_emoji}</div>
                  <p className="font-semibold text-foreground text-sm">{badge.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">{badge.description}</p>
                  <p className="text-xs text-ok mt-2 font-medium">
                    Unlocked {badge.unlocked_at ? new Date(badge.unlocked_at).toLocaleDateString() : 'recently'}
                  </p>
                </Panel>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Locked Badges */}
      {lockedBadges.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold text-foreground mb-4">
            Challenges to Unlock ({lockedBadges.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {lockedBadges.map((badge, idx) => (
              <motion.div
                key={badge.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: (unlockedBadges.length + idx) * 0.05 }}
              >
                <Panel hover={false} className="flex flex-col items-center text-center p-4 opacity-50">
                  <div className="text-4xl mb-2 filter grayscale">{badge.icon_emoji}</div>
                  <Lock className="w-4 h-4 text-muted-foreground mb-1" />
                  <p className="font-semibold text-foreground text-sm">{badge.title}</p>
                  <p className="text-xs text-muted-foreground mt-2">{badge.criteria}</p>
                </Panel>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {badges.length === 0 && (
        <Panel hover={false}>
          <p className="text-sm text-muted-foreground text-center py-8">
            No badges available yet. Complete missions to unlock achievements!
          </p>
        </Panel>
      )}
    </div>
  );
};

export default Achievements;
