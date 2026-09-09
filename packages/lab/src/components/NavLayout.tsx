import { ReactNode } from 'react';
import BottomNavBar from './BottomNavBar';
import SidebarNav from './SidebarNav';

interface NavLayoutProps {
  children: ReactNode;
}

/**
 * NavLayout — responsive navigation wrapper
 * Provides:
 * - BottomNavBar on mobile/tablet (< 1024px)
 * - SidebarNav on desktop (>= 1024px)
 * - Adjusts main content padding to avoid nav overlap
 */
const NavLayout: React.FC<NavLayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation components (show based on breakpoint) */}
      <BottomNavBar />
      <SidebarNav />

      {/* Main content — padded to avoid nav overlap */}
      <main className="pb-16 lg:pl-64 lg:pb-0">
        {children}
      </main>
    </div>
  );
};

export default NavLayout;
