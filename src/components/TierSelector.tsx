import { useTheme, TIER_CONFIGS, TierType } from '@/contexts/ThemeContext';
import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

const TierSelector: React.FC = () => {
  const { tier, setTier, tierConfig } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const tiers = Object.entries(TIER_CONFIGS) as [TierType, typeof tierConfig][];

  return (
    <div className="relative w-full">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full glass-card p-4 flex items-center justify-between hover:bg-slate-800/60 transition-all"
      >
        <div className="flex items-center gap-3">
          <div
            className="w-4 h-4 rounded-full"
            style={{ backgroundColor: tierConfig.color }}
          />
          <div className="text-left">
            <p className="font-semibold text-foreground">
              Login as {tierConfig.label}
            </p>
            <p className="text-sm text-muted-foreground">{tierConfig.gradeRange}</p>
          </div>
        </div>
        <ChevronDown
          className={cn(
            'w-5 h-5 text-muted-foreground transition-transform',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 glass-card overflow-hidden z-50">
          {tiers.map(([key, config]) => (
            <button
              key={key}
              onClick={() => {
                setTier(key);
                setIsOpen(false);
              }}
              className={cn(
                'w-full p-4 flex items-center gap-3 hover:bg-slate-800/60 transition-all text-left',
                tier === key && 'bg-slate-800/40'
              )}
            >
              <div
                className="w-4 h-4 rounded-full flex-shrink-0"
                style={{ backgroundColor: config.color }}
              />
              <div className="flex-1">
                <p className="font-semibold text-foreground">{config.label}</p>
                <p className="text-sm text-muted-foreground">
                  {config.gradeRange} • {config.vibe}
                </p>
              </div>
              {tier === key && (
                <div className="w-2 h-2 rounded-full bg-primary" />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default TierSelector;
