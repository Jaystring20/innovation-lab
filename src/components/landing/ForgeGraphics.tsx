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
