import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type TierType = 'primary' | 'secondary' | 'sixth_form';

interface TierConfig {
  name: string;
  label: string;
  gradeRange: string;
  color: string;
  vibe: string;
  description: string;
}

export const TIER_CONFIGS: Record<TierType, TierConfig> = {
  primary: {
    name: 'primary',
    label: 'Primary',
    gradeRange: 'Ages 7–12',
    color: '#FACC15',
    vibe: 'Agriculture Challenge',
    description: 'Smart Farm Bot + LED Interface',
  },
  secondary: {
    name: 'secondary',
    label: 'Secondary',
    gradeRange: 'Ages 13–16',
    color: '#FB923C',
    vibe: 'Power Challenge',
    description: 'Smart Energy Bot',
  },
  sixth_form: {
    name: 'sixth_form',
    label: 'Sixth Form',
    gradeRange: 'Ages 16–18',
    color: '#3B82F6',
    vibe: 'Security Challenge',
    description: 'ESP32-CAM Smart Security Bot',
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
  const [tier, setTier] = useState<TierType>('primary');
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
    tierConfig: TIER_CONFIGS[tier] ?? TIER_CONFIGS.primary,
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
