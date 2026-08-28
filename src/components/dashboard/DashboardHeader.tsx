import { useNavigate } from 'react-router-dom';
import { LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useTheme } from '@/contexts/ThemeContext';
import steamFoundryLogo from '@/assets/steam-foundry-logo.webp';

const ROLE_LABEL: Record<string, string> = {
  teacher: 'School lead',
  judge: 'Judge',
  organizer: 'Organizer',
};

const DashboardHeader: React.FC = () => {
  const navigate = useNavigate();
  const { displayName, role, signOut } = useAuth();
  const { tierConfig } = useTheme();
  const name = displayName ?? 'there';

  return (
    <header className="h-16 glass-card rounded-none border-x-0 border-t-0 flex items-center justify-between px-4 md:px-6 flex-shrink-0">
      <div className="flex items-center gap-3 min-w-0">
        <img src={steamFoundryLogo} alt="STEAM Foundry" className="w-8 h-8 object-contain flex-shrink-0" />
        <div className="min-w-0">
          <p className="font-bold text-foreground leading-tight truncate">STEAM Foundry</p>
          <p className="text-xs text-muted-foreground truncate">
            APEN 2026 · {role ? ROLE_LABEL[role] ?? role : 'Lab'}
          </p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <p className="hidden sm:block text-sm text-muted-foreground truncate max-w-[220px]">
          {name}
        </p>
        <div
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0"
          style={{
            backgroundColor: tierConfig.color,
            boxShadow: `0 0 0 2px hsl(var(--background)), 0 0 0 4px ${tierConfig.color}40`,
          }}
        >
          <span className="text-[#020617] font-bold text-sm">
            {name.charAt(0).toUpperCase()}
          </span>
        </div>
        <button
          onClick={() => signOut().then(() => navigate('/'))}
          title="Sign out"
          className="p-2 rounded-lg hover:bg-white/10 transition-colors text-muted-foreground hover:text-foreground"
        >
          <LogOut className="w-5 h-5" />
        </button>
      </div>
    </header>
  );
};

export default DashboardHeader;
