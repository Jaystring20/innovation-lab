import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  ShoppingCart,
  FlaskConical,
  ShieldCheck,
  PackageSearch,
  ArrowRight,
  Download,
  MapPin,
  Calendar,
  Users,
} from 'lucide-react';
import Backdrop from '@/components/Backdrop';
import Panel from '@/components/Panel';
import GlowButton from '@/components/GlowButton';
import ThemeToggle from '@/components/ThemeToggle';
import { DivisionIcon, SignalPulse } from '@/components/landing/ForgeGraphics';
import { usePublicTheme } from '@/hooks/usePublicTheme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/utils';
import { DIVISIONS } from '@/data/divisions';
import apenSeal from '@/assets/apen-seal.webp';
import imperialEdtechLogo from '@/assets/imperial-edtech-logo.webp';
import apen2026Flier from '@/assets/apen-2026-flier.webp';

const HANDBOOK_URL = '/downloads/apen-2026-competition-handbook.pdf';

const TIMELINE = [
  { phase: '01', name: 'Pre-registration & kit dispatch', dates: 'Aug 31 – Sep 30' },
  { phase: '02', name: 'Stage 1 — Design Sprint', dates: 'Sep 28 – Oct 4', deliverable: '3-minute video pitch' },
  { phase: '03', name: 'Stage 2 — Advanced Build', dates: 'Oct 5 – Oct 23', deliverable: 'Functional prototype' },
  { phase: '04', name: 'Judging & mid-term break', dates: 'Oct 24 – Nov 8', deliverable: 'Finalists selected' },
  { phase: '05', name: 'Stage 3 — Intelligize', dates: 'Nov 9 – Nov 22', deliverable: 'AI prompt log & video' },
  { phase: '06', name: 'Grand Finale — BATTLE', dates: 'Nov 26', deliverable: 'Champions crowned, Lagos' },
];

const RUBRIC = [
  { label: 'Design Thinking & Empathy', weight: 20 },
  { label: 'Hardware Execution & Build Quality', weight: 30 },
  { label: 'AI Innovation — the Intelligize Layer', weight: 30 },
  { label: 'Presentation & Documentation', weight: 20 },
];

const Apen2026: React.FC = () => {
  const { theme, toggle } = usePublicTheme();
  const reduceMotion = useReducedMotion();

  return (
    <div className={cn('min-h-screen bg-background relative overflow-hidden', theme === 'light' && 'light')}>
      <Backdrop />

      <div className="relative z-10">
        <div className="max-w-5xl mx-auto px-5 pt-16 flex items-center justify-between mb-10">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            &larr; STEAM Foundry
          </Link>
          <ThemeToggle theme={theme} onToggle={toggle} />
        </div>

        {/* Hero — asymmetric, organizer credit up front */}
        <section className="max-w-5xl mx-auto px-5 pb-16 md:pb-20">
          <div className="grid md:grid-cols-[1.15fr_0.85fr] gap-10 md:gap-8 items-start">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="flex items-center gap-4 mb-8">
                <div className="relative">
                  <motion.div
                    className="absolute inset-0 rounded-full bg-primary blur-md"
                    initial={{ opacity: 0.15 }}
                    animate={reduceMotion ? { opacity: 0.15 } : { opacity: [0.1, 0.3, 0.1] }}
                    transition={reduceMotion ? {} : { duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    aria-hidden="true"
                  />
                  <img
                    src={apenSeal}
                    alt="APEN — Association of Private Educators in Nigeria"
                    className="relative h-11 w-11 object-contain"
                  />
                </div>
                <div className="w-px h-8 bg-border" />
                <img src={imperialEdtechLogo} alt="Imperial EdTech" className="h-6 w-auto object-contain" />
              </div>

              <p className="text-sm font-semibold tracking-wider text-primary mb-2">
                AI, CODING &amp; ROBOTICS COMPETITION
              </p>
              <SignalPulse className="w-28 h-9 text-primary mb-2 -ml-1" />
              <h1 className="font-display text-4xl md:text-5xl lg:text-6xl font-bold text-foreground leading-[1.05] tracking-tight mb-4">
                APEN 2026
              </h1>
              <p className="text-muted-foreground text-base md:text-lg leading-relaxed max-w-[52ch] mb-3">
                Smart solutions for tomorrow&rsquo;s Nigeria. Design, build, and intelligize a real
                engineering challenge, then defend it live at the Grand Finale in Lagos.
              </p>
              <p className="text-muted-foreground text-sm leading-relaxed max-w-[52ch] mb-8">
                Every team gets the same kit for their division, so the build is judged fair and equal.
                The AI layer on top is entirely yours to invent.
              </p>

              <div className="flex flex-wrap gap-3">
                <Link to="/store">
                  <GlowButton className="px-6 py-3 font-semibold">
                    Register your school <ArrowRight className="w-4 h-4" />
                  </GlowButton>
                </Link>
                <a href={HANDBOOK_URL} download>
                  <GlowButton variant="secondary" className="px-6 py-3 font-semibold">
                    <Download className="w-4 h-4" /> Download the Handbook
                  </GlowButton>
                </a>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
              className="space-y-6"
            >
              <Panel className="p-2 overflow-hidden">
                <img
                  src={apen2026Flier}
                  alt="APEN AI, Coding & Robotics Competition — Smart Solutions for Tomorrow's Nigeria. Design. Build. Intelligize. Battle. Strictly for APEN schools. Levels: Primary, Secondary, Sixth Form divisions. Participation: Hybrid. Sept.–Nov. 2026."
                  className="w-full h-auto rounded-[calc(var(--radius)-4px)]"
                />
              </Panel>

              <Panel className="p-6">
                <p className="text-xs font-semibold tracking-wider text-muted-foreground mb-4">
                  KEY FACTS
                </p>
                <dl className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <dt className="text-sm font-semibold text-foreground">9-week cycle</dt>
                      <dd className="text-sm text-muted-foreground">Aug 31 &ndash; Nov 26, 2026</dd>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <MapPin className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <dt className="text-sm font-semibold text-foreground">Grand Finale — BATTLE</dt>
                      <dd className="text-sm text-muted-foreground">Nov 26, Lagos &middot; hybrid</dd>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Users className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
                    <div>
                      <dt className="text-sm font-semibold text-foreground">3 divisions</dt>
                      <dd className="text-sm text-muted-foreground">Primary, Secondary, Sixth Form</dd>
                    </div>
                  </div>
                </dl>
              </Panel>
            </motion.div>
          </div>
        </section>

        {/* Division breakdown — one real challenge per age group, not filler cards */}
        <section className="border-t border-border">
          <div className="max-w-5xl mx-auto px-5 py-16 md:py-20">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
              One challenge per division
            </h2>
            <p className="text-muted-foreground max-w-[60ch] mb-10">
              Every school builds the same standardized kit for its division, so hardware judging stays
              fair. What you do with the AI layer on top is where your team stands out.
            </p>

            <div className="divide-y divide-border border-t border-b border-border">
              {DIVISIONS.map((d, i) => (
                <motion.div
                  key={d.niche}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                >
                  <Link
                    to={`/apen-2026/${d.slug}`}
                    className="group grid md:grid-cols-[auto_1fr_auto] gap-4 md:gap-8 items-start py-8 -mx-4 px-4 rounded-lg transition-colors hover:bg-surface"
                  >
                    <div className="md:w-40 flex-shrink-0">
                      <motion.div whileHover={reduceMotion ? {} : { scale: 1.1 }} className="inline-block">
                        <DivisionIcon niche={d.niche} className="w-7 h-7 text-primary mb-2" />
                      </motion.div>
                      <p className="text-xs font-semibold tracking-wider text-primary mb-1">{d.tag}</p>
                      <p className="font-display text-xl font-bold text-foreground">{d.niche}</p>
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground mb-1.5 inline-flex items-center gap-1.5">
                        {d.project}
                        <ArrowRight className="w-3.5 h-3.5 text-primary opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0" />
                      </p>
                      <p className="text-sm text-muted-foreground leading-relaxed mb-2 max-w-[58ch]">
                        {d.challenge}
                      </p>
                      <p className="text-xs text-muted-foreground/80">
                        {d.hardware} &middot; {d.sdg}
                      </p>
                    </div>
                    <div className="md:text-right flex-shrink-0">
                      <p className="text-xs text-muted-foreground mb-0.5">Kit price</p>
                      <p className="font-display text-lg font-bold text-foreground tabular-nums">{d.price}</p>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-4">
              Full bill of materials for every kit is in the{' '}
              <a href={HANDBOOK_URL} download className="text-primary hover:underline">
                Competition Handbook
              </a>
              . Delivery is ₦10,000 within Lagos, ₦20,000 outside.
            </p>
          </div>
        </section>

        {/* Timeline — the 9-week cycle */}
        <section className="border-t border-border">
          <div className="max-w-5xl mx-auto px-5 py-16 md:py-20">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
              The nine-week cycle
            </h2>
            <p className="text-muted-foreground max-w-[60ch] mb-10">
              Four stages, Design through Battle, mapped to six phases that fit inside a single
              academic term.
            </p>

            <ol className="space-y-0">
              {TIMELINE.map((t, i) => (
                <motion.li
                  key={t.phase}
                  className="relative flex gap-5 pb-8 last:pb-0"
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-60px' }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                >
                  {i < TIMELINE.length - 1 && (
                    <motion.span
                      className="absolute left-[15px] top-8 bottom-0 w-px bg-primary/40 origin-top"
                      initial={{ scaleY: 0 }}
                      whileInView={{ scaleY: 1 }}
                      viewport={{ once: true, margin: '-60px' }}
                      transition={{ duration: 0.5, delay: i * 0.06 + 0.15 }}
                      aria-hidden="true"
                    />
                  )}
                  <span className="relative z-10 flex-shrink-0 w-8 h-8 rounded-full bg-surface border border-primary/50 flex items-center justify-center text-xs font-mono font-semibold text-primary">
                    {t.phase}
                  </span>
                  <div className="flex-1 flex flex-col sm:flex-row sm:items-baseline sm:justify-between gap-1 pt-1">
                    <div>
                      <p className="text-sm font-semibold text-foreground">{t.name}</p>
                      {t.deliverable && (
                        <p className="text-xs text-muted-foreground mt-0.5">{t.deliverable}</p>
                      )}
                    </div>
                    <p className="text-xs font-mono text-muted-foreground tabular-nums flex-shrink-0">
                      {t.dates}
                    </p>
                  </div>
                </motion.li>
              ))}
            </ol>
          </div>
        </section>

        {/* Judging rubric — real weighted criteria, not decoration */}
        <section className="border-t border-border">
          <div className="max-w-5xl mx-auto px-5 py-16 md:py-20">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-2">
              How you&rsquo;re judged
            </h2>
            <p className="text-muted-foreground max-w-[60ch] mb-10">
              Scores are aggregated across all four stages of the Innovation Funnel.
            </p>

            <div className="space-y-5">
              {RUBRIC.map((r, i) => (
                <motion.div
                  key={r.label}
                  initial={{ opacity: 0 }}
                  whileInView={{ opacity: 1 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.08 }}
                >
                  <div className="flex items-baseline justify-between mb-1.5">
                    <p className="text-sm font-semibold text-foreground">{r.label}</p>
                    <p className="text-sm font-mono font-semibold text-primary tabular-nums">{r.weight}%</p>
                  </div>
                  <div className="h-1.5 rounded-full bg-surface border border-border overflow-hidden">
                    <motion.div
                      className="h-full bg-primary rounded-full"
                      initial={{ width: 0 }}
                      whileInView={{ width: `${r.weight}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 0.7, delay: i * 0.08 + 0.1, ease: [0.16, 1, 0.3, 1] }}
                    />
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* Store / Lab funnel — the actual conversion mechanism, unchanged */}
        <section className="border-t border-border">
          <div className="max-w-5xl mx-auto px-5 py-16 md:py-20">
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-10">
              Get started
            </h2>
            <div className="grid gap-6 md:grid-cols-2">
              <Panel className="h-full flex flex-col overflow-hidden p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-lg bg-primary/15">
                    <ShoppingCart className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">The Store</h3>
                </div>
                <p className="text-sm text-muted-foreground flex-1 mb-6 leading-relaxed">
                  Register your school and teams, order the official kit for your division, or skip
                  it and register for lab access only. No account needed to start.
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

              <Panel className="h-full flex flex-col overflow-hidden p-6">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-3 rounded-lg bg-primary/15">
                    <FlaskConical className="w-6 h-6 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-foreground">The Lab</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                  Where your teams run the competition &mdash; submit each stage, read judge feedback,
                  and track aggregated scores through to the BATTLE.
                </p>
                <ol className="space-y-3 mb-6 flex-1">
                  {[
                    { n: '01', name: 'Design', note: '3-minute video pitch · field research' },
                    { n: '02', name: 'Build', note: 'standardized kit prototype' },
                    { n: '03', name: 'Intelligize', note: 'AI layer + prompt log' },
                    { n: '04', name: 'BATTLE', note: 'live grand finale, Lagos' },
                  ].map((s) => (
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
            </div>
          </div>
        </section>

        {/* Organizer credit + contact */}
        <section className="border-t border-border">
          <div className="max-w-5xl mx-auto px-5 py-14">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
              <div>
                <p className="text-xs font-semibold tracking-wider text-muted-foreground mb-4">
                  ORGANIZED BY
                </p>
                <div className="flex items-center gap-5">
                  <img src={apenSeal} alt="APEN — Association of Private Educators in Nigeria" className="h-14 w-14 object-contain" />
                  <div className="w-px h-10 bg-border" />
                  <img src={imperialEdtechLogo} alt="Imperial EdTech" className="h-7 w-auto object-contain" />
                </div>
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p className="text-foreground font-semibold">Questions about APEN 2026?</p>
                <p>omotayo@imperialedtech.com</p>
                <p>+234 809 705 1401 &middot; +234 803 820 0861</p>
              </div>
            </div>

            <div className="mt-10 pt-8 border-t border-border">
              <Link
                to="/organizer/login"
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <ShieldCheck className="w-4 h-4" />
                Organizer sign in
              </Link>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default Apen2026;
