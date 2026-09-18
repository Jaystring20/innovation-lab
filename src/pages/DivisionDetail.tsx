import { Link, Navigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { AlertTriangle, ArrowLeft, ArrowRight, Cpu, Target } from 'lucide-react';
import Backdrop from '@/components/Backdrop';
import Panel from '@/components/Panel';
import GlowButton from '@/components/GlowButton';
import ThemeToggle from '@/components/ThemeToggle';
import { DivisionIcon, DivisionScene } from '@/components/landing/ForgeGraphics';
import { usePublicTheme } from '@/hooks/usePublicTheme';
import { useReducedMotion } from '@/hooks/useReducedMotion';
import { cn } from '@/lib/utils';
import { DELIVERABLES, DIVISIONS, getDivisionBySlug } from '@/data/divisions';

const HANDBOOK_URL = '/downloads/apen-2026-competition-handbook.pdf';

const DivisionDetail: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const { theme, toggle } = usePublicTheme();
  const reduceMotion = useReducedMotion();
  const division = getDivisionBySlug(slug);

  if (!division) {
    return <Navigate to="/apen-2026" replace />;
  }

  const otherDivisions = DIVISIONS.filter((d) => d.slug !== division.slug);

  return (
    <div className={cn('min-h-screen bg-background relative overflow-hidden', theme === 'light' && 'light')}>
      <Backdrop />

      <div className="relative z-10">
        <div className="max-w-5xl mx-auto px-5 pt-16 flex items-center justify-between mb-10">
          <Link
            to="/apen-2026"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> APEN 2026
          </Link>
          <ThemeToggle theme={theme} onToggle={toggle} />
        </div>

        {/* Hero — the scene diagram tells the story before a word is read */}
        <section className="max-w-5xl mx-auto px-5 pb-14 md:pb-16">
          <div className="grid md:grid-cols-[1fr_1.1fr] gap-10 md:gap-8 items-center">
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            >
              <div className="flex items-center gap-2.5 mb-4">
                <DivisionIcon niche={division.niche} className="w-7 h-7 text-primary" />
                <p className="text-xs font-semibold tracking-wider text-primary">{division.tag}</p>
              </div>
              <h1 className="font-display text-4xl md:text-5xl font-bold text-foreground leading-[1.05] tracking-tight mb-4">
                {division.niche}
              </h1>
              <p className="text-lg font-semibold text-foreground mb-3">{division.project}</p>
              <p className="text-muted-foreground leading-relaxed max-w-[50ch] mb-6">{division.brief}</p>
              <div className="flex flex-wrap gap-3">
                <Link to="/store">
                  <GlowButton className="px-6 py-3 font-semibold">
                    Register for {division.niche} <ArrowRight className="w-4 h-4" />
                  </GlowButton>
                </Link>
                <a href={HANDBOOK_URL} download>
                  <GlowButton variant="secondary" className="px-6 py-3 font-semibold">
                    Full Handbook
                  </GlowButton>
                </a>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.15, ease: [0.16, 1, 0.3, 1] }}
            >
              <Panel className="p-4">
                <DivisionScene niche={division.niche} className="w-full h-auto text-primary" />
              </Panel>
            </motion.div>
          </div>
        </section>

        {/* The Challenge */}
        <section className="border-t border-border">
          <div className="max-w-5xl mx-auto px-5 py-14 md:py-16">
            <div className="flex items-center gap-2.5 mb-4">
              <Target className="w-4 h-4 text-primary" />
              <p className="text-xs font-semibold tracking-wider text-primary">THE CHALLENGE</p>
            </div>
            <p className="text-foreground text-lg md:text-xl leading-relaxed max-w-[62ch] font-display font-semibold">
              {division.challenge}
            </p>

            {division.safetyNote && (
              <div className="mt-6 flex items-start gap-3 p-4 rounded-lg border border-warn/40 bg-warn/10 max-w-[62ch]">
                <AlertTriangle className="w-4 h-4 text-warn mt-0.5 flex-shrink-0" />
                <p className="text-sm text-foreground leading-relaxed">
                  <span className="font-semibold">Safety note: </span>
                  {division.safetyNote}
                </p>
              </div>
            )}
          </div>
        </section>

        {/* What you'll build — the kit, broken down */}
        <section className="border-t border-border">
          <div className="max-w-5xl mx-auto px-5 py-14 md:py-16">
            <div className="flex items-center gap-2.5 mb-2">
              <Cpu className="w-4 h-4 text-primary" />
              <p className="text-xs font-semibold tracking-wider text-primary">WHAT YOU'LL BUILD</p>
            </div>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-10">
              Every {division.niche} team starts from the same kit
            </h2>

            <div className="grid sm:grid-cols-2 gap-4">
              {division.hardwareBreakdown.map((item, i) => (
                <motion.div
                  key={item.name}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                >
                  <Panel className="p-5 h-full">
                    <p className="font-display font-bold text-foreground mb-1.5">{item.name}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{item.role}</p>
                  </Panel>
                </motion.div>
              ))}
            </div>

            <div className="mt-10">
              <p className="text-xs font-semibold tracking-wider text-muted-foreground mb-4">
                FULL BILL OF MATERIALS
              </p>
              <div className="border border-border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-surface border-b border-border">
                      <th className="text-left font-semibold text-muted-foreground py-2.5 pl-4 pr-2 w-10">#</th>
                      <th className="text-left font-semibold text-muted-foreground py-2.5 px-2">Component</th>
                      <th className="text-left font-semibold text-muted-foreground py-2.5 px-2 w-20">Qty</th>
                      <th className="text-right font-semibold text-muted-foreground py-2.5 pl-2 pr-4 w-24">Price</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {division.bom.map((line) => (
                      <tr key={line.n}>
                        <td className="py-2.5 pl-4 pr-2 text-muted-foreground tabular-nums">{line.n}</td>
                        <td className="py-2.5 px-2 text-foreground">{line.component}</td>
                        <td className="py-2.5 px-2 text-muted-foreground">{line.qty}</td>
                        <td className="py-2.5 pl-2 pr-4 text-right font-semibold text-foreground tabular-nums">
                          {line.price}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="mt-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 p-5 rounded-lg border border-border bg-surface">
              <div>
                <p className="text-xs text-muted-foreground mb-0.5">Kit price</p>
                <p className="font-display text-2xl font-bold text-foreground tabular-nums">{division.price}</p>
              </div>
              <Link to="/store">
                <GlowButton className="px-6 py-3 font-semibold">
                  Register your school <ArrowRight className="w-4 h-4" />
                </GlowButton>
              </Link>
            </div>
          </div>
        </section>

        {/* Sustainable Development Goals this division works toward */}
        <section className="border-t border-border">
          <div className="max-w-5xl mx-auto px-5 py-14 md:py-16">
            <p className="text-xs font-semibold tracking-wider text-primary mb-2">UN SUSTAINABLE DEVELOPMENT GOALS</p>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-10">
              Real problems, mapped to real goals
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {division.sdgDetail.map((s, i) => (
                <motion.div
                  key={s.code}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.4, delay: i * 0.08 }}
                  className="p-5 rounded-lg border border-border bg-surface"
                >
                  <p className="font-mono text-xs font-semibold text-primary mb-1.5">{s.code}</p>
                  <p className="text-sm font-semibold text-foreground">{s.title}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* What you'll submit — the four required deliverables, straight
            from the Competition Handbook. Same format across all divisions;
            only the hardware and challenge above differ. */}
        <section className="border-t border-border">
          <div className="max-w-5xl mx-auto px-5 py-14 md:py-16">
            <p className="text-xs font-semibold tracking-wider text-primary mb-2">WHAT YOU'LL SUBMIT</p>
            <h2 className="font-display text-2xl md:text-3xl font-bold text-foreground mb-10">
              Four deliverables, four deadlines
            </h2>
            <div className="space-y-4">
              {DELIVERABLES.map((d, i) => (
                <motion.div
                  key={d.name}
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: '-40px' }}
                  transition={{ duration: 0.4, delay: i * 0.06 }}
                  className="flex flex-col sm:flex-row sm:items-start gap-2 sm:gap-6 p-5 rounded-lg border border-border bg-surface"
                >
                  <div className="sm:w-36 flex-shrink-0">
                    <p className="text-xs font-semibold tracking-wider text-primary mb-0.5">{d.stage}</p>
                    <p className="text-xs font-mono text-muted-foreground">{d.due}</p>
                  </div>
                  <div>
                    <p className="font-display font-bold text-foreground mb-1">{d.name}</p>
                    <p className="text-sm text-muted-foreground leading-relaxed">{d.detail}</p>
                  </div>
                </motion.div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-6">
              Full judging weights and stage-by-stage details are in the{' '}
              <a href={HANDBOOK_URL} download className="text-primary hover:underline">
                Competition Handbook
              </a>
              .
            </p>
          </div>
        </section>

        {/* Other divisions */}
        <section className="border-t border-border">
          <div className="max-w-5xl mx-auto px-5 py-14 md:py-16">
            <p className="text-xs font-semibold tracking-wider text-primary mb-6">OTHER DIVISIONS</p>
            <div className="grid sm:grid-cols-2 gap-4">
              {otherDivisions.map((d) => (
                <Link key={d.slug} to={`/apen-2026/${d.slug}`} className="group">
                  <Panel className="p-5 h-full flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <motion.div whileHover={reduceMotion ? {} : { scale: 1.1 }}>
                        <DivisionIcon niche={d.niche} className="w-6 h-6 text-primary flex-shrink-0" />
                      </motion.div>
                      <div>
                        <p className="text-xs text-muted-foreground">{d.tag}</p>
                        <p className="font-display font-bold text-foreground">{d.niche}</p>
                      </div>
                    </div>
                    <ArrowRight className="w-4 h-4 text-primary opacity-0 -translate-x-1 transition-all group-hover:opacity-100 group-hover:translate-x-0 flex-shrink-0" />
                  </Panel>
                </Link>
              ))}
            </div>
          </div>
        </section>
      </div>
    </div>
  );
};

export default DivisionDetail;
