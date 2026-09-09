/**
 * Backdrop — static blueprint grid + soft radial accent
 * No animation → zero battery/jank cost on low-end Android
 * `position: fixed` ensures it sits behind all content
 */

const GlassOrbs: React.FC = () => {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      {/* Blueprint grid — 1px lines at low opacity */}
      <svg
        className="absolute inset-0 w-full h-full opacity-5"
        style={{
          backgroundImage: 'url("data:image/svg+xml,%3Csvg width=%2720%27 height=%2720%27 xmlns=%27http://www.w3.org/2000/svg%27%3E%3Cline x1=%270%27 y1=%270%27 x2=%270%27 y2=%2720%27 stroke=%27white%27 stroke-width=%271%27/%3E%3Cline x1=%270%27 y1=%270%27 x2=%2720%27 y2=%270%27 stroke=%27white%27 stroke-width=%271%27/%3E%3C/svg%3E")',
          backgroundSize: '20px 20px',
        }}
        aria-hidden="true"
      />

      {/* Soft radial accent anchored top-left */}
      <div
        className="absolute top-0 left-0 w-96 h-96 opacity-20"
        style={{
          background: 'radial-gradient(circle at center, hsl(var(--primary) / 0.3), transparent 70%)',
          filter: 'blur(40px)',
        }}
        aria-hidden="true"
      />
    </div>
  );
};

export default GlassOrbs;
