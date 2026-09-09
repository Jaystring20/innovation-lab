import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Trophy, Medal, Flame } from 'lucide-react';
import Panel from '@/components/Panel';
import { getLeaderboard } from '@/lib/student';
import type { LeaderboardEntry } from '@/lib/student';

interface LeaderboardProps {
  schoolId: string;
  division: string;
  currentTeamId?: string;
}

export const Leaderboard: React.FC<LeaderboardProps> = ({
  schoolId,
  division,
  currentTeamId,
}) => {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getLeaderboard(schoolId, division);
        setEntries(data);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [schoolId, division]);

  if (loading)
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-primary mr-2" />
        <p className="text-sm text-muted-foreground">Loading leaderboard…</p>
      </div>
    );

  if (error)
    return (
      <Panel className="bg-danger/10 border-danger/30" hover={false}>
        <p className="text-sm text-danger">{error}</p>
      </Panel>
    );

  const getMedalIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-5 h-5 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-5 h-5 text-gray-400" />;
    if (rank === 3) return <Medal className="w-5 h-5 text-orange-700" />;
    return <Flame className="w-5 h-5 text-primary" />;
  };

  return (
    <div className="space-y-2">
      {entries.length === 0 ? (
        <Panel hover={false}>
          <p className="text-sm text-muted-foreground text-center py-4">
            No teams on leaderboard yet.
          </p>
        </Panel>
      ) : (
        entries.map((entry, idx) => {
          const isCurrentTeam = currentTeamId && entry.team_name === currentTeamId;
          return (
            <motion.div
              key={`${entry.rank}-${entry.team_name}`}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
            >
              <Panel
                hover={false}
                className={`flex items-center justify-between p-3 ${
                  isCurrentTeam ? 'border-primary bg-primary/5' : ''
                }`}
              >
                <div className="flex items-center gap-3 flex-1">
                  <div className="flex-shrink-0 flex items-center justify-center w-8 h-8">
                    {getMedalIcon(entry.rank)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-foreground truncate">
                      {entry.rank}. {entry.team_name}
                      {isCurrentTeam && <span className="text-xs ml-2 text-primary">(You)</span>}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {entry.current_stage} • {entry.badges_earned} badges
                    </p>
                  </div>
                </div>
                <div className="flex-shrink-0 text-right">
                  <p className="font-bold text-primary tabular-nums">{entry.xp}</p>
                  <p className="text-xs text-muted-foreground">XP</p>
                </div>
              </Panel>
            </motion.div>
          );
        })
      )}
    </div>
  );
};

export default Leaderboard;
