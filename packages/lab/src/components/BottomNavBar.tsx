import { useLocation, Link } from 'react-router-dom';
import { ShoppingCart, FlaskConical, Home, Settings } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  requiresAuth?: boolean;
}

/**
 * BottomNavBar — mobile & tablet navigation
 * Fixed at bottom, shows key routes as icons + labels
 * Hides on desktop (1024px+) via CSS
 */
const BottomNavBar: React.FC = () => {
  const { pathname } = useLocation();
  const { isAuthenticated } = useAuth();

  const navItems: NavItem[] = [
    {
      label: 'Home',
      icon: <Home className="w-5 h-5" />,
      href: '/',
      requiresAuth: false,
    },
    {
      label: 'Store',
      icon: <ShoppingCart className="w-5 h-5" />,
      href: '/store',
      requiresAuth: false,
    },
    {
      label: 'Lab',
      icon: <FlaskConical className="w-5 h-5" />,
      href: '/lab',
      requiresAuth: false,
    },
    ...(isAuthenticated
      ? [
          {
            label: 'Organizer',
            icon: <Settings className="w-5 h-5" />,
            href: '/organizer',
            requiresAuth: true,
          },
        ]
      : []),
  ];

  const isActive = (href: string) => {
    if (href === '/') return pathname === '/';
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-surface lg:hidden">
      <div className="flex h-16">
        {navItems.map((item) => (
          <Link
            key={item.href}
            to={item.href}
            className={cn(
              'flex-1 flex flex-col items-center justify-center gap-1 text-xs font-medium transition-colors',
              isActive(item.href)
                ? 'text-primary'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {item.icon}
            <span className="hidden sm:inline">{item.label}</span>
          </Link>
        ))}
      </div>
    </nav>
  );
};

export default BottomNavBar;
