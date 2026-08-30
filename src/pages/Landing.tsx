import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, FlaskConical, ShieldCheck, PackageSearch, ArrowRight } from 'lucide-react';
import GlassOrbs from '@/components/GlassOrbs';
import GlassCard from '@/components/GlassCard';
import GlowButton from '@/components/GlowButton';
import steamFoundryLogo from '@/assets/steam-foundry-logo.webp';

const FUNNEL = [
  { n: '01', name: 'Design', note: '3-minute video pitch · field research' },
  { n: '02', name: 'Build', note: 'standardized kit prototype' },
  { n: '03', name: 'Intelligize', note: 'AI layer + prompt log' },
  { n: '04', name: 'BATTLE', note: 'live grand finale, Lagos' },
];

const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#020617] relative overflow-hidden">
      <GlassOrbs />

      <div className="relative z-10 max-w-5xl mx-auto px-5 py-16">
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <img
            src={steamFoundryLogo}
            alt="STEAM Foundry"
            className="w-20 h-20 mx-auto mb-5 object-contain"
          />
          <p className="text-sm font-semibold tracking-wider text-primary mb-2">
            APEN 2026 · STEAM FOUNDRY
          </p>
          <h1 className="text-3xl md:text-4xl font-bold text-foreground">
            Innovation Store &amp; Lab
          </h1>
          <p className="text-muted-foreground mt-3 max-w-xl mx-auto">
            Order your division&rsquo;s kit, then run your team through the 4-Stage
            Innovation Funnel &mdash; Design, Build, Intelligize &mdash; to the
            Grand Finale BATTLE.
          </p>
        </motion.header>

        <div className="grid gap-5 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <GlassCard className="h-full flex flex-col">
              <div className="p-3 rounded-lg bg-primary/15 w-fit mb-4">
                <ShoppingCart className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">The Store</h2>
              <p className="text-sm text-muted-foreground flex-1 mb-5">
                Browse the official kit for your division, register your school and
                teams, pay by bank transfer, and track dispatch — no account needed.
              </p>
              <div className="flex flex-col gap-2">
                <Link to="/store">
                  <GlowButton className="w-full">
                    Order a kit <ArrowRight className="w-4 h-4" />
                  </GlowButton>
                </Link>
                <Link to="/order">
                  <GlowButton variant="secondary" size="sm" className="w-full">
                    <PackageSearch className="w-4 h-4" /> Track an existing order
                  </GlowButton>
                </Link>
              </div>
            </GlassCard>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <GlassCard className="h-full flex flex-col">
              <div className="p-3 rounded-lg bg-primary/15 w-fit mb-4">
                <FlaskConical className="w-6 h-6 text-primary" />
              </div>
              <h2 className="text-xl font-bold text-foreground mb-2">The Lab</h2>
              <p className="text-sm text-muted-foreground mb-4">
                Where your teams run the competition &mdash; submit each stage,
                read judge feedback, and track aggregated scores through to the
                BATTLE.
              </p>
              <ol className="space-y-2 mb-5 flex-1">
                {FUNNEL.map((s) => (
                  <li key={s.n} className="flex gap-3 text-sm">
                    <span className="font-mono text-xs text-primary/80 pt-0.5 tabular-nums">
                      {s.n}
                    </span>
                    <span>
                      <span className="font-semibold text-foreground">{s.name}</span>
                      <span className="text-muted-foreground"> &mdash; {s.note}</span>
                    </span>
                  </li>
                ))}
              </ol>
              <Link to="/lab" className="mt-auto">
                <GlowButton className="w-full">
                  Enter the Lab <ArrowRight className="w-4 h-4" />
                </GlowButton>
              </Link>
            </GlassCard>
          </motion.div>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="text-center mt-10"
        >
          <Link
            to="/organizer/login"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ShieldCheck className="w-4 h-4" />
            Organizer sign in
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default Landing;
