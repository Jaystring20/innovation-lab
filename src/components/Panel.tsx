/**
 * Panel Component
 *
 * Solid surface + hairline border (not frosted)
 * Replaces GlassCard — opaque, lighter on hover
 *
 * Props:
 * - children: ReactNode
 * - className?: string (additional classes)
 * - hover?: boolean (default: true, brightens border on hover)
 */

import { ReactNode } from 'react';

interface PanelProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export default function Panel({ children, className = '', hover = true }: PanelProps) {
  const hoverClass = hover ? 'hover:border-border/80' : '';

  return (
    <div
      className={`
        bg-surface
        border
        border-border
        rounded-[var(--radius)]
        transition-colors
        duration-200
        ${hoverClass}
        ${className}
      `}
    >
      {children}
    </div>
  );
}
