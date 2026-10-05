'use client';

import Link from 'next/link';
import React from 'react';

export function Sidebar() {
  return (
    <aside className="w-64 border-r border-slate-200 bg-white">
      {/* Logo */}
      <div className="border-b border-slate-200 px-6 py-4">
        <Link href="/" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary-600 text-white font-bold">
            SF
          </div>
          <span className="font-semibold text-slate-900">STEAM Foundry</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="space-y-1 px-3 py-4">
        <NavItem href="/dashboard" label="Dashboard" />
        <NavItem href="/dashboard/learning-lab" label="Learning Lab" />
        <NavItem href="/dashboard/competition" label="Competition" />
        <NavItem href="/dashboard/analytics" label="Analytics" />
      </nav>

      {/* Footer */}
      <div className="absolute bottom-0 w-64 border-t border-slate-200 bg-white px-6 py-4">
        <div className="text-sm text-slate-600">
          <p className="font-medium text-slate-900">Admin</p>
          <p className="text-xs">Logged in</p>
        </div>
      </div>
    </aside>
  );
}

interface NavItemProps {
  href: string;
  label: string;
}

function NavItem({ href, label }: NavItemProps) {
  return (
    <Link
      href={href}
      className="block rounded-lg px-3 py-2 text-sm font-medium text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
    >
      {label}
    </Link>
  );
}
