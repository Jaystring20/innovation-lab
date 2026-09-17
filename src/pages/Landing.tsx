import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Cpu, Sparkles, Trophy } from 'lucide-react';
import Backdrop from '@/components/Backdrop';
import Panel from '@/components/Panel';
import GlowButton from '@/components/GlowButton';
import HeroImagePlate from '@/components/HeroImagePlate';
import steamFoundryLogo from '@/assets/steam-foundry-logo.webp';

const PILLARS = [
  {
    icon: Cpu,
    title: 'Hands-on kits',
    note: 'Real hardware — sensors, boards, and actuators — not slideware.',
  },
  {
    icon: Sparkles,
    title: 'A structured funnel',
    note: 'Design, Build, Intelligize, BATTLE — each stage judged, with feedback.',
  },
  {
    icon: Trophy,
    title: 'A real finale',
    note: 'Teams that make it through compete live, in front of judges, in Lagos.',
  },
];

const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <Backdrop />

      <div className="relative z-10 max-w-4xl mx-auto px-5 py-16">
        <motion.header
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-14"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.96 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.7, delay: 0.15 }}
          >
            <HeroImagePlate src={steamFoundryLogo} alt="STEAM Foundry" className="mb-8" />
          </motion.div>

          <h1 className="text-4xl md:text-5xl font-bold text-foreground mb-4 font-display">
            STEAM Foundry
          </h1>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            We build hands-on AI, coding &amp; robotics experiences for Nigerian schools — real
            kits, a judged competition funnel, and a live finale, not a worksheet.
          </p>

          <Link to="/apen-2026" className="inline-block mt-8">
            <GlowButton className="px-8 py-3 text-base font-semibold">
              Register for a Competition <ArrowRight className="w-4 h-4" />
            </GlowButton>
          </Link>
        </motion.header>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="grid gap-4 sm:grid-cols-3 mb-14"
        >
          {PILLARS.map((p) => (
            <Panel key={p.title} className="p-5 text-center" hover={false}>
              <div className="w-10 h-10 rounded-lg bg-primary/15 flex items-center justify-center mx-auto mb-3">
                <p.icon className="w-5 h-5 text-primary" />
              </div>
              <h3 className="text-sm font-semibold text-foreground mb-1">{p.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{p.note}</p>
            </Panel>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Link to="/apen-2026">
            <Panel className="p-6 flex items-center justify-between gap-4 border-l-4 border-l-primary group">
              <div>
                <p className="text-xs font-semibold tracking-wider text-primary mb-1">
                  CURRENTLY RUNNING
                </p>
                <h2 className="text-xl font-bold text-foreground mb-1">
                  APEN 2026 — AI, Coding &amp; Robotics Competition
                </h2>
                <p className="text-sm text-muted-foreground">
                  Primary, Secondary &amp; Sixth Form divisions · 4-stage funnel · Grand BATTLE in
                  Lagos
                </p>
              </div>
              <ArrowRight className="w-5 h-5 text-muted-foreground group-hover:text-primary group-hover:translate-x-1 transition-all flex-shrink-0" />
            </Panel>
          </Link>
        </motion.div>
      </div>
    </div>
  );
};

export default Landing;
