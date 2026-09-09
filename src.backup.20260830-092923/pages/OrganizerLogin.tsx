import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, ArrowLeft } from 'lucide-react';
import GlassOrbs from '@/components/GlassOrbs';
import GlassCard from '@/components/GlassCard';
import GlowButton from '@/components/GlowButton';
import Wordmark from '@/components/Wordmark';
import { useAuth } from '@/contexts/AuthContext';
import steamFoundryLogo from '@/assets/steam-foundry-logo.webp';

const OrganizerLogin: React.FC = () => {
  const navigate = useNavigate();
  const { signIn, signOut, session, isOrganizer, loading: authLoading } = useAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Only forward an actual organizer. A teacher or judge with valid credentials
  // is signed back out and told why, rather than bounced with no explanation.
  useEffect(() => {
    if (authLoading || !session) return;
    if (isOrganizer) {
      navigate('/organizer', { replace: true });
    } else {
      signOut().then(() =>
        setError('That account is not an organizer account. Ask the APEN 2026 team for access.'),
      );
    }
  }, [authLoading, session, isOrganizer, navigate, signOut]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await signIn(email, password);
      // Routing is handled by the effect above, once the role has resolved.
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4 relative overflow-hidden">
      <GlassOrbs />
      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: 16 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-md relative z-10"
      >
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary mb-4"
        >
          <ArrowLeft className="w-4 h-4" /> Back
        </Link>
        <GlassCard className="p-8" hover={false}>
          <div className="text-center mb-8">
            <Wordmark size="md" className="justify-center mb-4" />
            <h1 className="text-xl font-semibold text-foreground mb-1 font-display">Organizer Sign In</h1>
            <p className="text-muted-foreground text-sm">
              APEN 2026 Innovation Store — operations console
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm text-muted-foreground mb-2">Email</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full bg-secondary/50 border border-white/10 rounded-lg py-3 pl-11 pr-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm text-muted-foreground mb-2">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                <input
                  type="password"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full bg-secondary/50 border border-white/10 rounded-lg py-3 pl-11 pr-4 text-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            </div>

            {error && <p className="text-sm text-red-400">{error}</p>}

            <GlowButton type="submit" disabled={loading} className="w-full mt-2">
              {loading ? 'Signing in…' : 'Sign in'}
              <ArrowRight className="w-4 h-4" />
            </GlowButton>
          </form>

          <p className="text-center text-xs text-muted-foreground mt-6">
            Organizer accounts are provisioned in Supabase Auth. Contact the APEN 2026
            team if you need access.
          </p>
        </GlassCard>
      </motion.div>
    </div>
  );
};

export default OrganizerLogin;
