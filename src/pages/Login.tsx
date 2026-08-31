import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Loader2 } from 'lucide-react';
import Backdrop from '@/components/Backdrop';
import Panel from '@/components/Panel';
import GlowButton from '@/components/GlowButton';
import Wordmark from '@/components/Wordmark';
import { useAuth } from '@/contexts/AuthContext';
import steamFoundryLogo from '@/assets/steam-foundry-logo.webp';

type Mode = 'signin' | 'register';

const Login: React.FC = () => {
  const navigate = useNavigate();
  const { session, role, loading: authLoading, signIn, signUp } = useAuth();
  const [mode, setMode] = useState<Mode>('signin');
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  // Route by role once it resolves after sign-in.
  useEffect(() => {
    if (authLoading || !session || !role) return;
    if (role === 'organizer') navigate('/organizer', { replace: true });
    else if (role === 'judge') navigate('/lab/judge', { replace: true });
    else navigate('/lab/dashboard', { replace: true });
  }, [authLoading, session, role, navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      if (mode === 'register') {
        await signUp(email.trim(), password, fullName.trim());
        // With email confirmation on there is no session yet, so say what happens next.
        setNotice(
          'Account created. Confirm your email if you receive one, then sign in. The APEN 2026 team links your account to your school.',
        );
        setMode('signin');
      } else {
        await signIn(email.trim(), password);
        // Redirect is handled by the effect above, once the role resolves.
      }
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
          {/* Wordmark header */}
          <motion.div
            className="mb-8"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6 }}
          >
            <Wordmark size="lg" className="justify-center" />
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
              {mode === 'signin'
                ? 'Sign in to run your teams through the Innovation Funnel.'
                : 'Register your teacher account, then the APEN 2026 team links it to your school.'}
            </motion.p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <AnimatePresence initial={false}>
              {mode === 'register' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-3">
                    Your name
                  </label>
                  <div className="relative">
                    <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="w-full bg-secondary/40 border-2 border-white/10 rounded-lg py-3 pl-12 pr-4 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary/60 focus:bg-secondary/60 transition-all"
                      placeholder="Jane Okafor"
                    />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

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
                  placeholder={mode === 'register' ? 'At least 8 characters' : '••••••••'}
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}
            {notice && <p className="text-sm text-emerald-400">{notice}</p>}

            <GlowButton
              type="submit"
              disabled={busy}
              className="w-full mt-6 py-3 font-semibold text-base"
            >
              {busy && <Loader2 className="w-4 h-4 animate-spin" />}
              {mode === 'signin' ? 'Sign in' : 'Create account'}
              {!busy && <ArrowRight className="w-5 h-5" />}
            </GlowButton>
          </form>

          <button
            type="button"
            onClick={() => {
              setMode((m) => (m === 'signin' ? 'register' : 'signin'));
              setError(null);
              setNotice(null);
            }}
            className="w-full text-center text-sm text-muted-foreground hover:text-primary mt-6 transition-colors"
          >
            {mode === 'signin'
              ? 'New school? Register a teacher account'
              : 'Already registered? Sign in'}
          </button>

          <p className="text-center text-xs text-muted-foreground/60 mt-4">
            Judges and organizers sign in here too.
          </p>
        </Panel>
      </motion.div>
    </div>
  );
};

export default Login;
