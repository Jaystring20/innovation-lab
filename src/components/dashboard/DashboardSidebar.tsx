import { useState } from 'react';
import { useTheme } from '@/contexts/ThemeContext';
import { Home, Target, Award, FolderOpen, ChevronLeft, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';
import steamFoundryLogo from '@/assets/steam-foundry-logo.png';

const navItems = [
  { icon: Home, label: 'Dashboard', href: '/lab/dashboard' },
  { icon: Target, label: 'Missions', href: '/lab/missions' },
  { icon: Award, label: 'Badges', href: '/lab/badges' },
  { icon: FolderOpen, label: 'Portfolio', href: '/lab/portfolio' },
];

const DashboardSidebar: React.FC = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { tierConfig } = useTheme();
  const [activeItem, setActiveItem] = useState('/lab/dashboard');

  return (
    <aside
      className={cn(
        'glass-sidebar h-screen flex flex-col tier-transition',
        collapsed ? 'w-20' : 'w-64'
      )}
    >
      {/* Logo Section */}
      <div className="p-4 border-b border-white/10">
        <div className="flex items-center gap-3">
          <img
            src={steamFoundryLogo}
            alt="STEAM Foundry"
            className="w-10 h-10 object-contain"
          />
          {!collapsed && (
            <span className="font-bold text-lg text-foreground tier-transition">
              STEAM Foundry
            </span>
          )}
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-4 space-y-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeItem === item.href;

          return (
            <button
              key={item.href}
              onClick={() => setActiveItem(item.href)}
              className={cn(
                'w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all tier-transition',
                'hover:bg-white/10',
                isActive && 'bg-primary/20 border border-primary/30'
              )}
              style={{
                borderColor: isActive ? tierConfig.color + '50' : 'transparent',
              }}
            >
              <Icon
                className={cn(
                  'w-5 h-5 flex-shrink-0 transition-colors',
                  isActive ? 'text-primary' : 'text-muted-foreground'
                )}
              />
              {!collapsed && (
                <span
                  className={cn(
                    'font-medium transition-colors',
                    isActive ? 'text-primary' : 'text-muted-foreground'
                  )}
                >
                  {item.label}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Collapse Toggle */}
      <div className="p-4 border-t border-white/10">
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-lg hover:bg-white/10 transition-all text-muted-foreground"
        >
          {collapsed ? (
            <ChevronRight className="w-5 h-5" />
          ) : (
            <>
              <ChevronLeft className="w-5 h-5" />
              <span className="text-sm">Collapse</span>
            </>
          )}
        </button>
      </div>
    </aside>
  );
};

export default DashboardSidebar;
