/**
 * Backdrop Component
 *
 * Static blueprint grid + soft radial gradient
 * Replaces animated GlassOrbs — fixed position, zero animation cost
 */

export default function Backdrop() {
  return (
    <div
      className="fixed inset-0 -z-10 overflow-hidden"
      aria-hidden="true"
    >
      {/* Blueprint grid (1px lines, very low opacity) */}
      <div
        className="absolute inset-0"
        style={{
          backgroundImage: `
            linear-gradient(90deg, hsl(var(--border)) 1px, transparent 1px),
            linear-gradient(0deg, hsl(var(--border)) 1px, transparent 1px)
          `,
          backgroundSize: '40px 40px',
          opacity: 0.05,
        }}
      />

      {/* Soft radial accent in top-left (accent hue) */}
      <div
        className="absolute -top-1/2 -left-1/2 w-96 h-96 rounded-full opacity-10"
        style={{
          background: `radial-gradient(circle, hsl(var(--primary)) 0%, transparent 70%)`,
          filter: 'blur(80px)',
        }}
      />

      {/* Optional SVG noise for texture (subtle) */}
      <svg
        className="absolute inset-0 w-full h-full opacity-[0.02]"
        width="100%"
        height="100%"
        preserveAspectRatio="none"
      >
        <filter id="noise">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.9"
            numOctaves="4"
            result="noise"
          />
          <feColorMatrix
            in="noise"
            type="saturate"
            values="0"
          />
        </filter>
        <rect
          width="100%"
          height="100%"
          filter="url(#noise)"
          opacity="1"
        />
      </svg>

      {/* Solid background (no transparency needed) */}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: 'hsl(var(--background))',
        }}
      />
    </div>
  );
}
