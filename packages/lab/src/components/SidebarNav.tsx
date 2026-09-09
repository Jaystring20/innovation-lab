import { useLocation, Link } from 'react-router-dom';
import { ShoppingCart, FlaskConical, Home, Settings, LogOut } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import Wordmark from './Wordmark';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  divider?: boolean;
  requiresAuth?: boolean;
}

/**
 * SidebarNav — desktop navigation
 * Fixed left sidebar, shows app logo, main routes, and auth controls
 * Hidden on mobile & tablet, visible on desktop (1024px+) only
 */
const SidebarNav: React.FC = () => {
  const { pathname } = useLocation();
  const { isAuthenticated, logout } = useAuth();

  const navItems: NavItem[] = [
    {
      label: 'Home',
      icon: <Home className="w-5 h-5" />,
      href: '/',
    },
    {
      label: 'Store',
      icon: <ShoppingCart className="w-5 h-5" />,
      href: '/store',
    },
    {
      label: 'Lab',
      icon: <FlaskConical className="w-5 h-5" />,
      href: '/lab',
    },
    ...(isAuthenticated
      ? [
          {
            label: 'Organizer',
            icon: <Settings className="w-5 h-5" />,
            href: '/organizer',
            divider: true,
          },
        ]
      : []),
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <aside className="hidden lg:fixed lg:flex lg:flex-col lg:left-0 lg:top-0 lg:h-screen lg:w-64 lg:border-r lg:border-border lg:bg-surface lg:z-40 lg:pt-6">
      {/* Logo */}
      <div className="px-6 mb-8">
        <Link to="/" className="inline-flex hover:opacity-80 transition-opacity">
          <Wordmark size="sm" />
        </Link>
      </div>

      {/* Navigation Links */}
      <nav className="flex-1 px-3 space-y-1">
        {navItems.map((item) => (
          <div key={item.href}>
            {item.divider && <div className="my-4 border-t border-border" />}
            <Link
              to={item.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors',
                isActive(item.href)
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-surface-hover hover:text-foreground'
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          </div>
        ))}
      </nav>

      {/* Sign Out Button */}
      {isAuthenticated && (
        <div className="px-3 py-4 border-t border-border">
          <button
            onClick={logout}
            className="flex w-full items-center gap-3 px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
          >
            <LogOut className="w-5 h-5" />
            <span>Sign out</span>
          </button>
        </div>
      )}
    </aside>
  );
};

export default SidebarNav;
