import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type TierType = 'explorer' | 'creator' | 'innovator' | 'engineer' | 'leader';

interface TierConfig {
  name: string;
  label: string;
  gradeRange: string;
  color: string;
  vibe: string;
  description: string;
}

export const TIER_CONFIGS: Record<TierType, TierConfig> = {
  explorer: {
    name: 'explorer',
    label: 'Explorer',
    gradeRange: 'Primary 1-3',
    color: '#FACC15',
    vibe: 'Playful & Curious',
    description: 'Discover the world of innovation through play',
  },
  creator: {
    name: 'creator',
    label: 'Creator',
    gradeRange: 'Primary 4-6',
    color: '#FB923C',
    vibe: 'Builder & Maker',
    description: 'Build amazing things with your imagination',
  },
  innovator: {
    name: 'innovator',
    label: 'Innovator',
    gradeRange: 'JSS 1-3',
    color: '#3B82F6',
    vibe: 'Tech & Coding',
    description: 'Code your ideas into reality',
  },
  engineer: {
    name: 'engineer',
    label: 'Engineer',
    gradeRange: 'SS 1-2',
    color: '#22C55E',
    vibe: 'Industrial & Systems',
    description: 'Design systems that change the world',
  },
  leader: {
    name: 'leader',
    label: 'Leader',
    gradeRange: 'SS 3',
    color: '#EAB308',
    vibe: 'Executive & Professional',
    description: 'Lead the future of innovation',
  },
};

interface ThemeContextType {
  tier: TierType;
  setTier: (tier: TierType) => void;
  tierConfig: TierConfig;
  isAuthenticated: boolean;
  setIsAuthenticated: (auth: boolean) => void;
  userName: string;
  setUserName: (name: string) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tier, setTier] = useState<TierType>('explorer');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [userName, setUserName] = useState('Student');

  useEffect(() => {
    // Apply tier class to document root for CSS variable switching
    const root = document.documentElement;
    
    // Remove all tier classes
    Object.keys(TIER_CONFIGS).forEach((t) => {
      root.classList.remove(`tier-${t}`);
    });
    
    // Add current tier class
    root.classList.add(`tier-${tier}`);
    
    // Ensure dark mode is always on
    root.classList.add('dark');
  }, [tier]);

  const value: ThemeContextType = {
    tier,
    setTier,
    tierConfig: TIER_CONFIGS[tier],
    isAuthenticated,
    setIsAuthenticated,
    userName,
    setUserName,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextType => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
