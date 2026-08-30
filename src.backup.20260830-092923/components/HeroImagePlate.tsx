import { cn } from '@/lib/utils';

interface HeroImagePlateProps {
  src: string;
  alt: string;
  className?: string;
}

/**
 * Hero image plate container — intentional dark frame for the raster logo asset.
 * Renders at 240-280px on desktop, responsive on mobile.
 * Provides breathing room and visual hierarchy for the logo.
 */
const HeroImagePlate: React.FC<HeroImagePlateProps> = ({ src, alt, className }) => {
  return (
    <div
      className={cn(
        'relative mx-auto mb-8',
        'w-56 md:w-64 lg:w-72 aspect-video', // 240px / 256px / 288px
        'border border-border rounded-lg overflow-hidden',
        'bg-surface',
        className
      )}
    >
      {/* Subtle inner glow — optional, very faint */}
      <div className="absolute inset-0 pointer-events-none bg-gradient-to-b from-white/5 to-transparent" />

      {/* Image */}
      <img
        src={src}
        alt={alt}
        className="w-full h-full object-cover object-center"
      />
    </div>
  );
};

export default HeroImagePlate;
