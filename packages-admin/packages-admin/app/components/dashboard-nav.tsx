'use client';

import React from 'react';

export function DashboardNav() {
  return (
    <header className="border-b border-slate-200 bg-white px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-slate-900">
            Dashboard
          </h2>
        </div>

        {/* Right side actions */}
        <div className="flex items-center gap-4">
          <button className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700 transition-colors">
            New Content
          </button>

          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-slate-50 px-3 py-2">
            <span className="text-sm text-slate-600">Admin</span>
          </div>
        </div>
      </div>
    </header>
  );
}
