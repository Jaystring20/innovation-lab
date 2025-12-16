import { useTheme } from '@/contexts/ThemeContext';
import { Bell, Settings } from 'lucide-react';
import steamFoundryLogo from '@/assets/steam-foundry-logo.png';

const DashboardHeader: React.FC = () => {
  const { tierConfig, userName } = useTheme();

  return (
    <header className="h-16 glass-card rounded-none border-x-0 border-t-0 flex items-center justify-between px-6">
      {/* Left: Logo (visible on mobile) */}
      <div className="flex items-center gap-3 lg:hidden">
        <img
          src={steamFoundryLogo}
          alt="STEAM Foundry"
          className="w-8 h-8 object-contain"
        />
      </div>

      {/* Center: Welcome Message */}
      <div className="hidden lg:block">
        <h1 className="text-lg font-semibold text-foreground">
          Welcome back, <span className="text-primary">{userName}</span>
        </h1>
        <p className="text-sm text-muted-foreground">
          {tierConfig.label} • {tierConfig.gradeRange}
        </p>
      </div>

      {/* Right: Actions & Avatar */}
      <div className="flex items-center gap-4">
        {/* Notifications */}
        <button className="p-2 rounded-lg hover:bg-white/10 transition-colors relative">
          <Bell className="w-5 h-5 text-muted-foreground" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-primary rounded-full" />
        </button>

        {/* Settings */}
        <button className="p-2 rounded-lg hover:bg-white/10 transition-colors">
          <Settings className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* User Avatar */}
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/50 to-primary flex items-center justify-center"
            style={{ 
              boxShadow: `0 0 0 2px hsl(var(--background)), 0 0 0 4px ${tierConfig.color}` 
            }}
          >
            <span className="text-primary-foreground font-bold text-sm">
              {userName.charAt(0).toUpperCase()}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};

export default DashboardHeader;
