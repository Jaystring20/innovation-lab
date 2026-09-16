import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Loader2 } from 'lucide-react';
import Backdrop from '@/components/Backdrop';
import Panel from '@/components/Panel';
import GlowButton from '@/components/GlowButton';
import HeroImagePlate from '@/components/HeroImagePlate';
import { useAuth } from '@/contexts/AuthContext';
import steamFoundryLogo from '@/assets/steam-foundry-logo.webp';

/**
 * Sign-in only (ADR-001). New schools do not self-serve an account here —
 * every account (teacher and team) is created atomically by the register-order
 * Edge Function via /store, which always links it to a school. A separate
 * self-serve signUp() here used to create orphaned teacher profiles with no
 * school_id and no way to attach one after the fact.
 */
const Login: React.FC = () => {
  const navigate = useNavigate();
  const { session, role, loading: authLoading, signIn } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Route by role once it resolves after sign-in.
  useEffect(() => {
    if (authLoading || !session || !role) return;
    if (role === 'organizer') navigate('/organizer', { replace: true });
    else if (role === 'judge') navigate('/lab/judge', { replace: true });
    else if (role === 'student') navigate('/lab/student', { replace: true });
    // Team accounts (shared student accounts) also go to student dashboard
    else if (role === 'student' || session?.user?.user_metadata?.is_team_account) {
      navigate('/lab/student', { replace: true });
    }
    else navigate('/lab/dashboard', { replace: true });
  }, [authLoading, session, role, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    try {
      await signIn(email.trim(), password);
      // Redirect is handled by the effect above, once the role resolves.
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <Backdrop />

      <motion.div
        initial={{ opacity: 0, scale: 0.92, y: 30 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="w-full max-w-md relative z-10"
      >
        <Panel className="p-8 overflow-hidden" hover={false}>
          {/* Logo hero image */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <HeroImagePlate
              src={steamFoundryLogo}
              alt="STEAM Foundry"
              className="mx-auto"
            />
          </motion.div>

          <div className="mb-8">
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
              Sign in to run your teams through the Innovation Funnel.
            </motion.p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                Email
              </label>
              <div className="relative">
                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-secondary/40 border-2 border-white/10 rounded-lg py-3 pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:bg-secondary/60 transition-all"
                  placeholder="you@school.edu.ng"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                Password
              </label>
              <div className="relative">
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-secondary/40 border-2 border-white/10 rounded-lg py-3 pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:bg-secondary/60 transition-all"
                  placeholder="••••••••"
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <GlowButton
              type="submit"
              disabled={busy}
              className="w-full mt-6 py-3 font-semibold text-base"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              Sign in
              {!busy && <ArrowRight className="w-5 h-5" />}
            </GlowButton>
          </form>

          <Link
            to="/store"
            className="block w-full text-center text-sm text-muted-foreground hover:text-primary mt-6 transition-colors"
          >
            New school? Register here
          </Link>

          <p className="text-center text-xs text-muted-foreground/60 mt-4">
            Judges and organizers sign in here too.
          </p>
        </Panel>
      </motion.div>
    </div>
  );
};

export default Login;
