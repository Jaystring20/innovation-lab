import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingCart, FlaskConical, ShieldCheck, PackageSearch, ArrowRight } from 'lucide-react';
import Backdrop from '@/components/Backdrop';
import Panel from '@/components/Panel';
import GlowButton from '@/components/GlowButton';
import HeroImagePlate from '@/components/HeroImagePlate';
import steamFoundryLogo from '@/assets/steam-foundry-logo.webp';

const FUNNEL = [
  { n: '01', name: 'Design', note: '3-minute video pitch · field research' },
  { n: '02', name: 'Build', note: 'standardized kit prototype' },
  { n: '03', name: 'Intelligize', note: 'AI layer + prompt log' },
  { n: '04', name: 'BATTLE', note: 'live grand finale, Lagos' },
];

const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <Backdrop />

      <div className="relative z-10 max-w-5xl mx-auto px-5 py-16">
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          {/* Hero image plate */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
            <HeroImagePlate
              src={steamFoundryLogo}
              alt="STEAM Foundry"
              className="mb-8"
            />
          </motion.div>

          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 font-display">
            Innovation Store &amp; Lab
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Order your division&rsquo;s kit and run your team through the 4-Stage Innovation Funnel
            to compete at the Grand BATTLE in Lagos.
          </p>
        </motion.header>

        <div className="grid gap-6 md:grid-cols-2">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Panel className="h-full flex flex-col overflow-hidden border-l-4 border-l-primary p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-lg bg-primary/15">
                  <ShoppingCart className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">The Store</h2>
              </div>
              <p className="text-sm text-muted-foreground flex-1 mb-6 leading-relaxed">
                Register your school and teams — order the official kit for your
                division, or skip it and register for lab access only. No account
                needed to start.
              </p>
              <div className="flex flex-col gap-3">
                <Link to="/store">
                  <GlowButton className="w-full">
                    Register your school <ArrowRight className="w-4 h-4" />
                  </GlowButton>
                </Link>
                <Link to="/order">
                  <GlowButton variant="secondary" size="sm" className="w-full">
                    <PackageSearch className="w-4 h-4" /> Track an existing order
                  </GlowButton>
                </Link>
              </div>
            </Panel>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Panel className="h-full flex flex-col overflow-hidden border-l-4 border-l-primary p-6">
              <div className="flex items-center gap-3 mb-6">
                <div className="p-3 rounded-lg bg-primary/15">
                  <FlaskConical className="w-6 h-6 text-primary" />
                </div>
                <h2 className="text-2xl font-bold text-foreground">The Lab</h2>
              </div>
              <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                Where your teams run the competition &mdash; submit each stage,
                read judge feedback, and track aggregated scores through to the
                BATTLE.
              </p>
              <ol className="space-y-3 mb-6 flex-1">
                {FUNNEL.map((s) => (
                  <li key={s.n} className="flex gap-3 text-sm">
                    <span className="font-mono text-xs font-semibold text-primary/80 pt-0.5 tabular-nums">
                      {s.n}
                    </span>
                    <span className="flex-1">
                      <span className="font-semibold text-foreground">{s.name}</span>
                      <span className="text-muted-foreground"> — {s.note}</span>
                    </span>
                  </li>
                ))}
              </ol>
              <Link to="/lab" className="mt-auto">
                <GlowButton className="w-full">
                  Enter the Lab <ArrowRight className="w-4 h-4" />
                </GlowButton>
              </Link>
            </Panel>
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
