import GlassCard from '@/components/GlassCard';
import GlowButton from '@/components/GlowButton';
import { useTheme } from '@/contexts/ThemeContext';
import { Play, Clock, Trophy, Zap, Star, Users } from 'lucide-react';
import { motion } from 'framer-motion';

const BentoGrid: React.FC = () => {
  const { tierConfig } = useTheme();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1,
      },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <motion.div
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Card 1: Current Mission (Large - spans 2 cols) */}
      <motion.div variants={itemVariants} className="lg:col-span-2 lg:row-span-2">
        <GlassCard className="h-full flex flex-col">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wider">
                Current Mission
              </p>
              <h3 className="text-xl font-bold text-foreground mt-1">
                Build a Solar-Powered Robot
              </h3>
            </div>
            <div
              className="p-2 rounded-lg"
              style={{ backgroundColor: tierConfig.color + '20' }}
            >
              <Zap className="w-6 h-6" style={{ color: tierConfig.color }} />
            </div>
          </div>

          <p className="text-muted-foreground text-sm mb-6 flex-1">
            Design and construct a robot that harnesses solar energy. Learn about
            renewable energy, circuits, and mechanical systems.
          </p>

          {/* Progress Bar */}
          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-muted-foreground">Progress</span>
              <span className="text-primary font-semibold">65%</span>
            </div>
            <div className="h-2 bg-secondary rounded-full overflow-hidden">
              <motion.div
                className="h-full rounded-full"
                style={{ backgroundColor: tierConfig.color }}
                initial={{ width: 0 }}
                animate={{ width: '65%' }}
                transition={{ duration: 1, ease: 'easeOut' }}
              />
            </div>
          </div>

          <GlowButton className="w-full flex items-center justify-center gap-2">
            <Play className="w-4 h-4" />
            Continue Mission
          </GlowButton>
        </GlassCard>
      </motion.div>

      {/* Card 2: My XP (Medium) */}
      <motion.div variants={itemVariants} className="lg:col-span-1">
        <GlassCard className="h-full">
          <div className="flex items-start justify-between mb-4">
            <p className="text-sm text-muted-foreground uppercase tracking-wider">
              Innovation Points
            </p>
            <Star className="w-5 h-5 text-primary" />
          </div>

          {/* Radial Progress */}
          <div className="relative w-32 h-32 mx-auto mb-4">
            <svg className="w-full h-full transform -rotate-90">
              <circle
                cx="64"
                cy="64"
                r="56"
                stroke="currentColor"
                strokeWidth="8"
                fill="none"
                className="text-secondary"
              />
              <motion.circle
                cx="64"
                cy="64"
                r="56"
                stroke={tierConfig.color}
                strokeWidth="8"
                fill="none"
                strokeLinecap="round"
                strokeDasharray="351.86"
                initial={{ strokeDashoffset: 351.86 }}
                animate={{ strokeDashoffset: 351.86 * 0.28 }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-foreground">2,540</span>
              <span className="text-xs text-muted-foreground">XP</span>
            </div>
          </div>

          <p className="text-center text-sm text-muted-foreground">
            Level 12 • {tierConfig.label}
          </p>
        </GlassCard>
      </motion.div>

      {/* Card 3: Next Live Class (Small) */}
      <motion.div variants={itemVariants} className="lg:col-span-1">
        <GlassCard className="h-full">
          <div className="flex items-start justify-between mb-4">
            <p className="text-sm text-muted-foreground uppercase tracking-wider">
              Next Live Class
            </p>
            <Clock className="w-5 h-5 text-primary" />
          </div>

          <div className="text-center py-4">
            <p className="text-3xl font-bold text-foreground font-jetbrains">
              02:45:30
            </p>
            <p className="text-sm text-muted-foreground mt-2">
              Robotics Workshop
            </p>
            <p className="text-xs text-primary mt-1">with Mr. Adebayo</p>
          </div>

          <GlowButton variant="secondary" className="w-full mt-4" size="sm">
            Set Reminder
          </GlowButton>
        </GlassCard>
      </motion.div>

      {/* Card 4: Leaderboard (Tall - spans 2 rows) */}
      <motion.div variants={itemVariants} className="lg:col-span-2 lg:row-span-1">
        <GlassCard className="h-full">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-sm text-muted-foreground uppercase tracking-wider">
                Leaderboard
              </p>
              <p className="text-xs text-primary">This Week</p>
            </div>
            <Trophy className="w-5 h-5 text-primary" />
          </div>

          <div className="space-y-3">
            {[
              { rank: 1, name: 'Chiamaka O.', xp: 3420, avatar: 'C' },
              { rank: 2, name: 'Emeka N.', xp: 3180, avatar: 'E' },
              { rank: 3, name: 'Fatima A.', xp: 2950, avatar: 'F' },
              { rank: 4, name: 'You', xp: 2540, avatar: 'Y', isUser: true },
              { rank: 5, name: 'Tunde B.', xp: 2380, avatar: 'T' },
            ].map((entry, idx) => (
              <div
                key={idx}
                className={`flex items-center gap-3 p-2 rounded-lg transition-all ${
                  entry.isUser ? 'bg-primary/10 border border-primary/30' : 'hover:bg-white/5'
                }`}
              >
                <span
                  className={`w-6 h-6 flex items-center justify-center text-xs font-bold rounded ${
                    entry.rank <= 3 ? 'bg-primary text-primary-foreground' : 'bg-secondary text-foreground'
                  }`}
                >
                  {entry.rank}
                </span>
                <div
                  className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold"
                  style={{
                    backgroundColor: entry.isUser ? tierConfig.color : '#334155',
                    color: entry.isUser ? '#020617' : '#fff',
                  }}
                >
                  {entry.avatar}
                </div>
                <span className={`flex-1 ${entry.isUser ? 'text-primary font-semibold' : 'text-foreground'}`}>
                  {entry.name}
                </span>
                <span className="text-sm text-muted-foreground font-jetbrains">
                  {entry.xp.toLocaleString()} XP
                </span>
              </div>
            ))}
          </div>
        </GlassCard>
      </motion.div>

      {/* Card 5: Quick Stats */}
      <motion.div variants={itemVariants} className="lg:col-span-2">
        <GlassCard className="h-full">
          <div className="flex items-start justify-between mb-4">
            <p className="text-sm text-muted-foreground uppercase tracking-wider">
              Quick Stats
            </p>
            <Users className="w-5 h-5 text-primary" />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-3 rounded-lg bg-white/5">
              <p className="text-2xl font-bold text-foreground">12</p>
              <p className="text-xs text-muted-foreground">Missions Done</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-white/5">
              <p className="text-2xl font-bold text-foreground">8</p>
              <p className="text-xs text-muted-foreground">Badges Earned</p>
            </div>
            <div className="text-center p-3 rounded-lg bg-white/5">
              <p className="text-2xl font-bold text-foreground">24h</p>
              <p className="text-xs text-muted-foreground">Learning Time</p>
            </div>
          </div>
        </GlassCard>
      </motion.div>
    </motion.div>
  );
};

export default BentoGrid;
