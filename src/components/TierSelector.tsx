import { useTheme, TIER_CONFIGS, TierType } from '@/contexts/ThemeContext';
import { ChevronDown, Check } from 'lucide-react';
import { useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { cn } from '@/lib/utils';

const TierSelector: React.FC = () => {
  const { tier, setTier, tierConfig } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const tiers = Object.entries(TIER_CONFIGS) as [TierType, typeof tierConfig][];

  return (
    <div className="relative w-full">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full rounded-xl border-2 bg-slate-900/70 p-4 flex items-center justify-between transition-all hover:bg-slate-800/70"
        style={{ borderColor: `${tierConfig.color}66` }}
      >
        <div className="flex items-center gap-3">
          <span
            className="w-4 h-4 rounded-full flex-shrink-0"
            style={{ backgroundColor: tierConfig.color, boxShadow: `0 0 12px ${tierConfig.color}` }}
          />
          <div className="text-left">
            <p className="font-bold text-foreground leading-tight">
              Login as {tierConfig.label}
            </p>
            <p className="text-sm text-muted-foreground">{tierConfig.gradeRange}</p>
          </div>
        </div>
        <ChevronDown
          className={cn(
            'w-5 h-5 text-muted-foreground transition-transform duration-300',
            isOpen && 'rotate-180'
          )}
        />
      </button>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.98 }}
            transition={{ duration: 0.18, ease: 'easeOut' }}
            className="absolute top-full left-0 right-0 mt-2 rounded-xl overflow-hidden z-50 border border-white/10 bg-[#0a0f1c] shadow-2xl shadow-black/60"
          >
            {tiers.map(([key, config]) => {
              const active = tier === key;
              return (
                <button
                  key={key}
                  type="button"
                  onClick={() => {
                    setTier(key);
                    setIsOpen(false);
                  }}
                  className={cn(
                    'w-full p-4 flex items-center gap-3 text-left transition-colors relative',
                    active ? 'bg-white/[0.06]' : 'hover:bg-white/[0.03]'
                  )}
                >
                  {active && (
                    <span
                      className="absolute left-0 top-0 bottom-0 w-1"
                      style={{ backgroundColor: config.color }}
                    />
                  )}
                  <span
                    className="w-4 h-4 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor: config.color,
                      boxShadow: active ? `0 0 12px ${config.color}` : 'none',
                    }}
                  />
                  <div className="flex-1">
                    <p className="font-bold text-foreground leading-tight">{config.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {config.gradeRange} · {config.vibe}
                    </p>
                  </div>
                  {active && <Check className="w-4 h-4" style={{ color: config.color }} />}
                </button>
              );
            })}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default TierSelector;
