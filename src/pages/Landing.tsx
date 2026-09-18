import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Calendar, MapPin, Users } from 'lucide-react';
import Backdrop from '@/components/Backdrop';
import Panel from '@/components/Panel';
import GlowButton from '@/components/GlowButton';
import ThemeToggle from '@/components/ThemeToggle';
import { ForgeNetwork, RoleIcon } from '@/components/landing/ForgeGraphics';
import { usePublicTheme } from '@/hooks/usePublicTheme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/utils';
import steamFoundryLogo from '@/assets/steam-foundry-logo.webp';
import apenSeal from '@/assets/apen-seal.webp';
import imperialEdtechLogo from '@/assets/imperial-edtech-logo.webp';

const ROLES = [
  {
    name: 'Learners',
    detail:
      'Work through a real, grade-appropriate problem every term, not just competition season, and build by doing instead of memorizing.',
  },
  {
    name: 'Educators',
    detail:
      "Run a mission-based Lab for your students, whether you're a school, an independent instructor, or homeschooling, guided by real problems, not a fixed curriculum.",
  },
  {
    name: 'Mentors',
    detail:
      'Independent STEAM instructors join the mentor community, guiding teams through their term, not just judging a single event.',
  },
  {
    name: 'Judges',
    detail:
      'Review team submissions inside the Lab against a published rubric, and score every stage as it happens.',
  },
  {
    name: 'Kits & resources',
    detail:
      "Every division starts from the same kit, so hardware is never why a team can't compete, with add-ons in the Innovation Store for teams pushing further.",
  },
  {
    name: 'Partner organizations',
    detail:
      'Run a competition or program on the platform, the way APEN and Imperial EdTech run APEN 2026 today.',
  },
];

const Landing: React.FC = () => {
  const { theme, toggle } = usePublicTheme();
  const reduceMotion = useReducedMotion();

  return (
    <div className={cn('min-h-screen bg-background relative overflow-hidden', theme === 'light' && 'light')}>
      <Backdrop />

      <div className="relative z-10">
        {/* Hero — asymmetric split, not centered */}
        <section className="max-w-6xl mx-auto px-5 pt-16 pb-20 md:pt-20 md:pb-28">
          <div className="flex justify-end mb-8">
            <ThemeToggle theme={theme} onToggle={toggle} />
          </div>
          <div className="grid md:grid-cols-[1.1fr_0.9fr] gap-12 md:gap-8 items-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <img
                src={steamFoundryLogo}
                alt="STEAM Foundry"
                className="h-9 md:h-11 w-auto mb-9 opacity-95"
              />
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-[1.05] tracking-tight mb-5">
                The infrastructure that turns African students into problem-solvers.
              </h1>
              <p className="text-muted-foreground text-base md:text-lg leading-relaxed max-w-[46ch] mb-8">
                Schools and instructors run a real, grade-appropriate problem every term, so
                students learn to think by building, not memorizing.
              </p>
              <Link to="/apen-2026">
                <GlowButton className="px-7 py-3 text-base font-semibold">
                  Register for a Competition <ArrowRight className="w-4 h-4" />
                </GlowButton>
              </Link>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="hidden md:block"
            >
              <ForgeNetwork />
            </motion.div>
          </div>
        </section>

        {/* Who it's for — explained roles, not a word list */}
        <section className="border-t border-border">
          <div className="max-w-6xl mx-auto px-5 py-16 md:py-20">
            <p className="text-xs font-semibold tracking-wider text-primary mb-3">WHO IT'S FOR</p>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
              One platform, six roles
            </h2>
            <p className="text-muted-foreground max-w-[60ch] mb-10">
              Every role here works toward the same outcome: students who learn by doing, every
              term, not just once a year.
            </p>

            <div className="divide-y divide-border border-t border-b border-border">
              {ROLES.map((r, i) => (
                <motion.div
                  key={r.name}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.5, delay: i * 0.06 }}
                  className="grid md:grid-cols-[0.28fr_1fr] gap-2 md:gap-8 items-start py-6"
                >
                  <div className="flex items-center gap-2.5">
                    <RoleIcon role={r.name} className="w-5 h-5 text-primary flex-shrink-0" />
                    <p className="font-display text-lg font-bold text-foreground">{r.name}</p>
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed max-w-[60ch]">
                    {r.detail}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Current program — real facts, not a bare link-out */}
        <section className="border-t border-border">
          <div className="max-w-6xl mx-auto px-5 py-16 md:py-20">
            <p className="text-xs font-semibold tracking-wider text-primary mb-3">CURRENT PROGRAM</p>

            <Link to="/apen-2026" className="block group">
              <Panel className="p-7 md:p-9">
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-8">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-5">
                      <div className="relative">
                        <motion.div
                          className="absolute inset-0 rounded-full bg-primary blur-md"
                          initial={{ opacity: 0.15 }}
                          animate={reduceMotion ? { opacity: 0.15 } : { opacity: [0.1, 0.3, 0.1] }}
                          transition={reduceMotion ? {} : { duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                          aria-hidden="true"
                        />
                        <img src={apenSeal} alt="APEN" className="relative h-8 w-8 object-contain" />
                      </div>
                      <div className="w-px h-6 bg-border" />
                      <img src={imperialEdtechLogo} alt="Imperial EdTech" className="h-4 w-auto object-contain" />
                    </div>
                    <h3 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
                      APEN 2026
                    </h3>
                    <p className="text-muted-foreground max-w-[52ch] leading-relaxed mb-6">
                      The AI, Coding &amp; Robotics Competition: one real Nigerian challenge per
                      division, solved with hardware and AI, then judged end to end.
                    </p>
                    <span className="inline-flex items-center gap-2 text-primary font-semibold whitespace-nowrap group-hover:gap-3 transition-[gap]">
                      Register for a Competition <ArrowRight className="w-5 h-5" />
                    </span>
                  </div>

                  <dl className="flex flex-row md:flex-col gap-6 md:gap-4 flex-wrap md:flex-shrink-0 md:w-52">
                    <div className="flex items-start gap-2.5">
                      <Calendar className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <dt className="text-sm font-semibold text-foreground">9-week cycle</dt>
                        <dd className="text-xs text-muted-foreground">Aug 31 &ndash; Nov 26, 2026</dd>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <dt className="text-sm font-semibold text-foreground">Grand Finale</dt>
                        <dd className="text-xs text-muted-foreground">Nov 26, Lagos &middot; hybrid</dd>
                      </div>
                    </div>
                    <div className="flex items-start gap-2.5">
                      <Users className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                      <div>
                        <dt className="text-sm font-semibold text-foreground">3 divisions</dt>
                        <dd className="text-xs text-muted-foreground">₦60,050 &ndash; ₦64,400 per kit</dd>
                      </div>
                    </div>
                  </dl>
                </div>
              </Panel>
            </Link>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Landing;
