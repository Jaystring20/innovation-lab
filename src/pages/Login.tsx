import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import GlassOrbs from '@/components/GlassOrbs';
import GlassCard from '@/components/GlassCard';
import GlowButton from '@/components/GlowButton';
import TierSelector from '@/components/TierSelector';
import steamFoundryLogo from '@/assets/steam-foundry-logo.png';
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
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Animated Glass Orbs Background */}
      <GlassOrbs />

      {/* Login Card */}
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.6, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        <GlassCard className="p-8" hover={false}>
          {/* Logo & Title */}
          <div className="text-center mb-8">
            <motion.img
              src={steamFoundryLogo}
              alt="STEAM Foundry"
              className="w-20 h-20 mx-auto mb-4 object-contain"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            />
            <h1 className="text-2xl font-bold text-foreground mb-2">
              Access Portal
            </h1>
            <p className="text-muted-foreground text-sm">
              Enter the Future-Ready Innovation Lab
            </p>
          </div>

          {/* Demo Tier Selector */}
          <div className="mb-6">
            <label className="block text-sm text-muted-foreground mb-2">
              Demo Mode: Select Your Tier
            </label>
            <TierSelector />
          </div>

          {/* Login Form */}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-2">
                Username / Email
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  placeholder="Enter your username"
                  className="w-full bg-secondary/50 border border-white/10 rounded-lg py-3 pl-11 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm text-muted-foreground mb-2">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  className="w-full bg-secondary/50 border border-white/10 rounded-lg py-3 pl-11 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all"
                />
              </div>
            </div>

            <GlowButton type="submit" className="w-full flex items-center justify-center gap-2 mt-6">
              Enter the Lab
              <ArrowRight className="w-4 h-4" />
            </GlowButton>
          </form>

          {/* Tier Info */}
          <motion.div
            key={tierConfig.name}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-6 p-4 rounded-lg bg-white/5 border border-white/10"
          >
            <div className="flex items-center gap-3">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: tierConfig.color }}
              />
              <div>
                <p className="text-sm font-semibold text-foreground">
                  {tierConfig.label} Mode
                </p>
                <p className="text-xs text-muted-foreground">
                  {tierConfig.description}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Footer */}
          <p className="text-center text-xs text-muted-foreground mt-6">
            By logging in, you agree to our Terms of Service
          </p>
        </GlassCard>
      </motion.div>
    </div>
  );
};

export default Login;
