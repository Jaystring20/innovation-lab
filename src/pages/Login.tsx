import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import GlassOrbs from '@/components/GlassOrbs';
import GlassCard from '@/components/GlassCard';
import GlowButton from '@/components/GlowButton';
import TierSelector from '@/components/TierSelector';
import steamFoundryLogo from '@/assets/steam-foundry-logo.webp';
import { User, Lock, ArrowRight } from 'lucide-react';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { setIsAuthenticated, setUserName, tierConfig } = useTheme();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setUserName(username || 'Student');
    setIsAuthenticated(true);
    navigate('/lab/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Glass Orbs Background */}
      <GlassOrbs />

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        <GlassCard className="p-8 overflow-hidden" hover={false}>
          {/* Logo Banner — full-bleed hero */}
          <motion.div
            className="-mx-8 -mt-8 mb-8 h-32 overflow-hidden relative"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.8 }}
          >
            <motion.img
              src={steamFoundryLogo}
              alt="STEAM Foundry"
              className="w-full h-full object-cover object-center"
              initial={{ scale: 1.12 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.1, duration: 1.2, ease: 'easeOut' }}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-slate-900/80" />
          </motion.div>

          {/* Title — Amplified */}
          <div className="mb-10">
            <motion.h1
              className="text-4xl font-bold text-foreground mb-3 leading-[1.1] tracking-tight"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
            >
              Enter the Lab
            </motion.h1>
            <motion.p
              className="text-base text-muted-foreground leading-relaxed"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.4 }}
            >
              Pick your division and master its challenge
            </motion.p>
          </div>

          {/* Tier Selector — Now the Hero */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-3">
              Choose Your Division
            </p>
            <TierSelector />
          </motion.div>

          {/* Challenge context — supporting strip, not a second selector */}
          <AnimatePresence mode="wait">
            <motion.div
              key={tierConfig.name}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.25 }}
              className="mb-8 pl-4 py-1 border-l-2"
              style={{ borderColor: tierConfig.color }}
            >
              <p
                className="text-xs font-semibold uppercase tracking-widest"
                style={{ color: tierConfig.color }}
              >
                {tierConfig.vibe}
              </p>
              <p className="text-sm text-muted-foreground mt-0.5">
                Build: {tierConfig.description}
              </p>
            </motion.div>
          </AnimatePresence>

          {/* Login Form — Tier-Colored Inputs */}
          <form onSubmit={handleLogin} className="space-y-4">
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.55 }}
            >
              <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                Username / Email
              </label>
              <div className="relative group">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-all group-focus-within:scale-110 pointer-events-none" style={{ color: tierConfig.color }} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full bg-secondary/40 border-2 rounded-lg py-3 pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:bg-secondary/60 transition-all"
                  style={{
                    borderColor: username ? tierConfig.color : 'rgba(255,255,255,0.1)',
                  }}
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
            >
              <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                Password
              </label>
              <div className="relative group">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 transition-all group-focus-within:scale-110 pointer-events-none" style={{ color: tierConfig.color }} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-secondary/40 border-2 rounded-lg py-3 pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:bg-secondary/60 transition-all"
                  style={{
                    borderColor: password ? tierConfig.color : 'rgba(255,255,255,0.1)',
                  }}
                />
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.65 }}
            >
              <GlowButton type="submit" className="w-full mt-8 py-3 font-semibold text-base">
                <span className="flex items-center justify-center gap-2">
                  Begin Your Challenge
                  <ArrowRight className="w-5 h-5" />
                </span>
              </GlowButton>
            </motion.div>
          </form>

          {/* Footer — Toned Down */}
          <p className="text-center text-xs text-muted-foreground/60 mt-6">
            Terms of Service apply
          </p>
        </GlassCard>
      </motion.div>
    </div>
  );
};

export default Login;
