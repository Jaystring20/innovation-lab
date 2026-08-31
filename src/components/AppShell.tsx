import { ReactNode } from 'react';
import { motion } from 'framer-motion';
import Backdrop from './Backdrop';
import Wordmark from './Wordmark';

interface AppShellProps {
  children: ReactNode;
  header?: ReactNode;
  sidebar?: ReactNode;
  className?: string;
}

/**
 * Unified shell for the three dashboards: organizer, teacher, judge
 * Provides: Backdrop, header (Wordmark + chrome), optional sidebar, main content
 * All children animate in with framer-motion on page load
 */
const AppShell: React.FC<AppShellProps> = ({ children, header, sidebar, className }) => {
  return (
    <div className="min-h-screen bg-background">
      <Backdrop />

      {/* Header bar */}
      <motion.header
        className="sticky top-0 z-20 bg-surface border-b border-border"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <div className="max-w-7xl mx-auto px-4 md:px-6 py-4 flex items-center justify-between">
          <Wordmark size="sm" />
          {header && <div className="flex-1 flex justify-end">{header}</div>}
        </div>
      </motion.header>

      <div className="relative z-10 flex">
        {/* Optional sidebar */}
        {sidebar && (
          <motion.aside
            className="hidden md:block w-64 bg-surface border-r border-border overflow-y-auto"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            {sidebar}
          </motion.aside>
        )}

        {/* Main content area */}
        <motion.main
          className={`flex-1 overflow-y-auto ${className}`}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          {children}
        </motion.main>
      </div>
    </div>
  );
};

export default AppShell;
