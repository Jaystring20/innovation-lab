import { motion } from 'framer-motion';
import { useReducedMotion } from '@/hooks/useReducedMotion';

/**
 * Hand-crafted SVG + framer-motion visuals for the public landing page.
 * No raster assets — everything here is vector, themed via currentColor /
 * CSS custom properties so it tracks the light/dark public theme for free,
 * and gated by useReducedMotion so looping animation never fights the
 * user's OS preference (mirrors the pattern in Backdrop.tsx / TeamSetupPage.tsx).
 */

const HUB = { x: 200, y: 190, r: 15 };
const NODES = [
  { x: 202, y: 46, r: 8 },
  { x: 346, y: 132, r: 7 },
  { x: 304, y: 322, r: 8 },
  { x: 98, y: 330, r: 6 },
  { x: 56, y: 140, r: 7 },
];
const PEER_LINKS: [number, number][] = [
  [0, 1],
  [3, 4],
];

/**
 * The hero "ecosystem" diagram — one hub (The Lab) connected to the people
 * and resources around it. Elevated from a static diagram into a quiet
 * "infrastructure" motion piece: pulses of light travel the spokes toward
 * the hub, and the hub itself breathes, telling the story of a living
 * network rather than a org chart.
 */
export function ForgeNetwork() {
  const reduceMotion = useReducedMotion();

  return (
    <svg
      viewBox="0 0 400 400"
      className="w-full h-auto text-primary"
      role="img"
      aria-label="Diagram of STEAM Foundry connecting learners, educators, mentors, judges, kits, and partner organizations around a central hub"
    >
      <g stroke="currentColor" strokeWidth="1.5" opacity="0.35">
        {NODES.map((n, i) => (
          <line key={i} x1={HUB.x} y1={HUB.y} x2={n.x} y2={n.y} />
        ))}
        {PEER_LINKS.map(([a, b], i) => (
          <line key={`peer-${i}`} x1={NODES[a].x} y1={NODES[a].y} x2={NODES[b].x} y2={NODES[b].y} />
        ))}
      </g>

      {/* Traveling energy pulses — one per spoke, staggered, GPU-cheap (opacity + position only) */}
      {!reduceMotion &&
        NODES.map((n, i) => (
          <motion.circle
            key={`pulse-${i}`}
            r={2.5}
            fill="currentColor"
            initial={{ cx: n.x, cy: n.y, opacity: 0 }}
            animate={{
              cx: [n.x, HUB.x],
              cy: [n.y, HUB.y],
              opacity: [0, 0.9, 0],
            }}
            transition={{
              duration: 2.6,
              repeat: Infinity,
              repeatDelay: 1.4,
              delay: i * 0.5,
              ease: 'easeInOut',
            }}
          />
        ))}

      {/* Hub — slow breathing glow, the "forge core" */}
      <motion.circle
        cx={HUB.x}
        cy={HUB.y}
        r={HUB.r}
        fill="currentColor"
        initial={{ opacity: 0.9 }}
        animate={reduceMotion ? { opacity: 0.9 } : { opacity: [0.75, 1, 0.75] }}
        transition={reduceMotion ? {} : { duration: 3.2, repeat: Infinity, ease: 'easeInOut' }}
      />
      <circle cx={HUB.x} cy={HUB.y} r={HUB.r + 6} fill="none" stroke="currentColor" strokeWidth="1" opacity="0.25" />

      {NODES.map((n, i) => (
        <circle key={i} cx={n.x} cy={n.y} r={n.r} fill="currentColor" opacity="0.55" />
      ))}
    </svg>
  );
}

/** Minimal line-art glyphs for the "who it's for" role list — tailored to
 * the foundry metaphor rather than a generic icon set. 20x20 viewBox,
 * stroke-based, inherits color from the parent via currentColor.
 */
const ROLE_ICON_PATHS: Record<string, React.ReactNode> = {
  learners: (
    // hammer + spark — building by doing
    <>
      <path d="M4 16.5 12.5 8l2.5 2.5L7.5 19 4 16.5Z" />
      <path d="M13 6.5 15.5 4 18 6.5 15.5 9 13 6.5Z" />
      <path d="M16.5 3.5 17.5 2.5" strokeLinecap="round" />
    </>
  ),
  educators: (
    // open book — guided learning
    <>
      <path d="M10 5.5C8.3 4.4 5.8 4 4 4.2v11.6c1.8-.2 4.3.2 6 1.3" />
      <path d="M10 5.5C11.7 4.4 14.2 4 16 4.2v11.6c-1.8-.2-4.3.2-6 1.3" strokeLinecap="round" />
      <path d="M10 5.5v11.6" />
    </>
  ),
  mentors: (
    // compass — guidance over a term, not one event
    <>
      <circle cx="10" cy="10" r="7" />
      <path d="M12.6 7.4 11 11l-3.6 1.6L9 9l3.6-1.6Z" />
    </>
  ),
  judges: (
    // balanced scale — rubric scoring
    <>
      <path d="M10 3v14" strokeLinecap="round" />
      <path d="M5 6h10" strokeLinecap="round" />
      <path d="M5 6 2.5 11a2.5 2.5 0 0 0 5 0L5 6Z" />
      <path d="M15 6l-2.5 5a2.5 2.5 0 0 0 5 0L15 6Z" />
      <path d="M7 17h6" strokeLinecap="round" />
    </>
  ),
  'kits & resources': (
    // open crate — shared hardware baseline
    <>
      <path d="M3 8.5 10 5l7 3.5-7 3.5-7-3.5Z" />
      <path d="M3 8.5V15l7 3.5V12" />
      <path d="M17 8.5V15l-7 3.5" />
    </>
  ),
  'partner organizations': (
    // interlocking rings — running a program together
    <>
      <circle cx="7.5" cy="10" r="4.5" />
      <circle cx="13.5" cy="10" r="4.5" />
    </>
  ),
};

export function RoleIcon({ role, className }: { role: string; className?: string }) {
  const path = ROLE_ICON_PATHS[role.toLowerCase()];
  if (!path) return null;

  return (
    <svg
      viewBox="0 0 20 20"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {path}
    </svg>
  );
}

/** One glyph per APEN division, tied to its challenge theme rather than a
 * generic numbered badge. 24x24 viewBox, stroke-based, currentColor.
 */
const DIVISION_ICON_PATHS: Record<string, React.ReactNode> = {
  agriculture: (
    // leaf growing from a circuit trace — Smart Farm Bot
    <>
      <path d="M12 20V11" />
      <path d="M12 11c0-3.5 2.2-6 6-6.5C17.6 8 15 11 12 11Z" />
      <path d="M12 14c0-2.6-1.8-4.4-4.5-4.8C7.9 12 10 14 12 14Z" />
      <circle cx="4" cy="20" r="1.2" />
      <path d="M4 20h5" />
    </>
  ),
  power: (
    // bolt inside a monitoring ring — Smart Energy Bot
    <>
      <circle cx="12" cy="12" r="8.5" />
      <path d="M13 6.5 8.5 13h3.2l-.7 4.5L17 11h-3.2l.2-4.5Z" strokeLinejoin="round" />
    </>
  ),
  security: (
    // shield with a camera-eye aperture — Smart Security Bot
    <>
      <path d="M12 3.5 19 6.5v5c0 4.5-2.9 7.8-7 9-4.1-1.2-7-4.5-7-9v-5L12 3.5Z" />
      <circle cx="12" cy="11.5" r="2.4" />
      <path d="M12 9.4v.8M12 13.5v.8M9.9 11.5h.8M13.3 11.5h.8" strokeLinecap="round" />
    </>
  ),
};

export function DivisionIcon({ niche, className }: { niche: string; className?: string }) {
  const path = DIVISION_ICON_PATHS[niche.toLowerCase()];
  if (!path) return null;

  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.4"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {path}
    </svg>
  );
}

/** A quiet "signal" accent for the APEN hero — a scanning arc that suggests
 * sensing/detection (the through-line across all three divisions: sensors
 * reading soil, current, and motion), rather than a literal illustration.
 */
const SIGNAL_PATH_POINTS = [
  { x: 2, y: 30 },
  { x: 26, y: 18 },
  { x: 50, y: 6 },
  { x: 66, y: 18 },
  { x: 90, y: 30 },
  { x: 118, y: 20 },
];

export function SignalPulse({ className }: { className?: string }) {
  const reduceMotion = useReducedMotion();

  return (
    <svg viewBox="0 0 120 40" className={className} aria-hidden="true">
      <path
        d="M2 30 Q 20 30 26 18 T 50 6 Q 60 6 66 18 T 90 30 Q 100 30 118 20"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.5"
        opacity="0.3"
      />
      {!reduceMotion && (
        <motion.circle
          r={2.5}
          fill="currentColor"
          initial={{ cx: SIGNAL_PATH_POINTS[0].x, cy: SIGNAL_PATH_POINTS[0].y, opacity: 0 }}
          animate={{
            cx: SIGNAL_PATH_POINTS.map((p) => p.x),
            cy: SIGNAL_PATH_POINTS.map((p) => p.y),
            opacity: [0, 1, 1, 1, 1, 0],
          }}
          transition={{ duration: 3.5, repeat: Infinity, ease: 'linear' }}
        />
      )}
    </svg>
  );
}
