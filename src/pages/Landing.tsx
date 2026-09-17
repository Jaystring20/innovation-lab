import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight } from 'lucide-react';
import Backdrop from '@/components/Backdrop';
import GlowButton from '@/components/GlowButton';
import steamFoundryLogo from '@/assets/steam-foundry-logo.webp';

const PARTICIPANTS = ['Learners', 'Educators', 'Judges', 'Kits & resources', 'Partner organizations'];

const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      <Backdrop />

      <div className="relative z-10">
        {/* Hero — asymmetric split, not centered */}
        <section className="max-w-6xl mx-auto px-5 pt-16 pb-20 md:pt-20 md:pb-28">
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
                The infrastructure African STEAM needs.
              </h1>
              <p className="text-muted-foreground text-base md:text-lg leading-relaxed max-w-[46ch] mb-8">
                We run real, judged competitions end to end, and connect learners, educators, and
                the tools they need to build.
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
              <EcosystemDiagram />
            </motion.div>
          </div>
        </section>

        {/* Who it connects — a diagram row, not icon cards */}
        <section className="border-t border-border">
          <div className="max-w-6xl mx-auto px-5 py-12 md:py-14">
            <div className="flex flex-wrap items-center justify-center gap-x-8 gap-y-4">
              {PARTICIPANTS.map((label) => (
                <span
                  key={label}
                  className="text-sm md:text-base font-semibold text-foreground whitespace-nowrap"
                >
                  {label}
                </span>
              ))}
            </div>
          </div>
        </section>

        {/* Current program */}
        <section className="border-t border-border">
          <Link to="/apen-2026" className="block group">
            <div className="max-w-6xl mx-auto px-5 py-16 md:py-20">
              <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-8">
                <div>
                  <h2 className="font-display text-3xl md:text-4xl font-bold text-foreground mb-3">
                    APEN 2026
                  </h2>
                  <p className="text-muted-foreground max-w-[52ch] leading-relaxed">
                    The AI, Coding &amp; Robotics Competition running on The Lab right now, across
                    Primary, Secondary, and Sixth Form divisions.
                  </p>
                </div>
                <span className="inline-flex items-center gap-2 text-primary font-semibold whitespace-nowrap group-hover:gap-3 transition-[gap] flex-shrink-0">
                  Register for a Competition <ArrowRight className="w-5 h-5" />
                </span>
              </div>
            </div>
          </Link>
        </section>
      </div>
    </div>
  );
};

/**
 * A quiet geometric network diagram — the visual metaphor for "ecosystem":
 * one hub (The Lab) connected to the people and resources around it, with a
 * couple of peer-to-peer links to suggest a marketplace, not a strict
 * hub-and-spoke hierarchy.
 */
const EcosystemDiagram: React.FC = () => {
  const hub = { x: 200, y: 190, r: 15 };
  const nodes = [
    { x: 202, y: 46, r: 8 },
    { x: 346, y: 132, r: 7 },
    { x: 304, y: 322, r: 8 },
    { x: 98, y: 330, r: 6 },
    { x: 56, y: 140, r: 7 },
  ];

  return (
    <svg
      viewBox="0 0 400 400"
      className="w-full h-auto text-primary"
      role="img"
      aria-label="Diagram of STEAM Foundry connecting learners, educators, judges, kits, and partner organizations around a central hub"
    >
      <g stroke="currentColor" strokeWidth="1.5" opacity="0.35">
        {nodes.map((n, i) => (
          <line key={i} x1={hub.x} y1={hub.y} x2={n.x} y2={n.y} />
        ))}
        <line x1={nodes[0].x} y1={nodes[0].y} x2={nodes[1].x} y2={nodes[1].y} />
        <line x1={nodes[3].x} y1={nodes[3].y} x2={nodes[4].x} y2={nodes[4].y} />
      </g>
      <circle cx={hub.x} cy={hub.y} r={hub.r} fill="currentColor" opacity="0.9" />
      {nodes.map((n, i) => (
        <circle key={i} cx={n.x} cy={n.y} r={n.r} fill="currentColor" opacity="0.55" />
      ))}
    </svg>
  );
};

export default Landing;
