import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

interface OrbProps {
  size: number;
  color: string;
  delay: number;
  duration: number;
  initialX: number;
  initialY: number;
}

const Orb: React.FC<OrbProps & { still?: boolean }> = ({ size, color, delay, duration, initialX, initialY, still }) => {
  return (
    <motion.div
      className="absolute rounded-full"
      style={{
        width: size,
        height: size,
        left: `${initialX}%`,
        top: `${initialY}%`,
        background: `radial-gradient(circle at 30% 30%, ${color}40, ${color}10, transparent)`,
        boxShadow: `0 0 ${size / 2}px ${color}20, inset 0 0 ${size / 3}px ${color}15`,
        backdropFilter: 'blur(2px)',
      }}
      animate={
        still
          ? { opacity: 0.45 }
          : {
              x: [0, 30, -20, 15, 0],
              y: [0, -40, 20, -30, 0],
              scale: [1, 1.1, 0.95, 1.05, 1],
              opacity: [0.4, 0.6, 0.5, 0.7, 0.4],
            }
      }
      transition={
        still
          ? { duration: 0 }
          : { duration, delay, repeat: Infinity, ease: 'easeInOut' }
      }
    />
  );
};

/**
 * Seven infinitely animating orbs are continuous compositor work. On the
 * low-end Android hardware most schools will use, that is real battery and
 * jank, so honour the OS reduced-motion setting and render them static.
 */
function usePrefersReducedMotion(): boolean {
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches,
  );

  useEffect(() => {
    const mq = window.matchMedia?.('(prefers-reduced-motion: reduce)');
    if (!mq) return;
    const onChange = () => setReduced(mq.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  return reduced;
}

const GlassOrbs: React.FC = () => {
  const reducedMotion = usePrefersReducedMotion();

  const orbs: OrbProps[] = [
    { size: 300, color: '#FACC15', delay: 0, duration: 15, initialX: 10, initialY: 20 },
    { size: 200, color: '#3B82F6', delay: 2, duration: 18, initialX: 70, initialY: 10 },
    { size: 250, color: '#22C55E', delay: 1, duration: 20, initialX: 80, initialY: 60 },
    { size: 180, color: '#FB923C', delay: 3, duration: 16, initialX: 20, initialY: 70 },
    { size: 150, color: '#EAB308', delay: 4, duration: 14, initialX: 50, initialY: 40 },
    { size: 120, color: '#3B82F6', delay: 2.5, duration: 17, initialX: 35, initialY: 15 },
    { size: 100, color: '#22C55E', delay: 1.5, duration: 19, initialX: 60, initialY: 80 },
  ];

  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {orbs.map((orb, index) => (
        <Orb key={index} {...orb} still={reducedMotion} />
      ))}
    </div>
  );
};

export default GlassOrbs;
