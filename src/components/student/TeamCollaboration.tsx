import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Users, CheckCircle, AlertCircle } from 'lucide-react';
import Panel from '@/components/Panel';
import { getTeamMembers } from '@/lib/student';
import type { TeamMember } from '@/lib/student';

interface TeamCollaborationProps {
  teamId: string;
}

export const TeamCollaboration: React.FC<TeamCollaborationProps> = ({ teamId }) => {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const data = await getTeamMembers(teamId);
        setMembers(data);
      } catch (e) {
        setError((e as Error).message);
      } finally {
        setLoading(false);
      }
    })();
  }, [teamId]);

  if (loading)
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="w-5 h-5 animate-spin text-primary mr-2" />
        <p className="text-sm text-muted-foreground">Loading team…</p>
      </div>
    );

  if (error)
    return (
      <Panel className="bg-danger/10 border-danger/30" hover={false}>
        <p className="text-sm text-danger">{error}</p>
      </Panel>
    );

  const roleIcons: Record<string, string> = {
    captain: '👑',
    engineer: '⚙️',
    designer: '🎨',
    researcher: '🔬',
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2 mb-4">
        <Users className="w-5 h-5 text-primary" />
        <h3 className="font-semibold text-foreground">Team Members ({members.length})</h3>
      </div>

      {members.length === 0 ? (
        <Panel hover={false}>
          <p className="text-sm text-muted-foreground text-center py-4">
            No team members assigned yet.
          </p>
        </Panel>
      ) : (
        members.map((member, idx) => (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: idx * 0.05 }}
          >
            <Panel hover={false} className="flex items-center justify-between p-4">
              <div className="flex items-center gap-3 flex-1">
                <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-lg">
                  {roleIcons[member.role] || '👤'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground truncate">{member.full_name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span className="capitalize">{member.role}</span>
                    <span>•</span>
                    <span>{member.xp} XP</span>
                  </div>
                </div>
              </div>
              <div className="flex-shrink-0">
                {member.status === 'active' ? (
                  <CheckCircle className="w-5 h-5 text-ok" />
                ) : (
                  <AlertCircle className="w-5 h-5 text-warn" />
                )}
              </div>
            </Panel>
          </motion.div>
        ))
      )}
    </div>
  );
};

export default TeamCollaboration;
