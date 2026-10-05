'use client';

import React, { useState } from 'react';

type Tab = 'stages' | 'teams' | 'submissions' | 'scoring';

export function CompetitionModule() {
  const [activeTab, setActiveTab] = useState<Tab>('stages');

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div>
        <h3 className="text-2xl font-bold text-slate-900">APEN Competition</h3>
        <p className="text-sm text-slate-600 mt-1">
          Manage competition stages, teams, submissions, and scoring
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        {(['stages', 'teams', 'submissions', 'scoring'] as const).map(
          (tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 font-medium text-sm transition-colors ${
                activeTab === tab
                  ? 'border-b-2 border-secondary-600 text-secondary-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab.charAt(0).toUpperCase() + tab.slice(1)}
            </button>
          )
        )}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px] rounded-lg bg-slate-50 p-6">
        {activeTab === 'stages' && <StagesTab />}
        {activeTab === 'teams' && <TeamsTab />}
        {activeTab === 'submissions' && <SubmissionsTab />}
        {activeTab === 'scoring' && <ScoringTab />}
      </div>
    </div>
  );
}

function StagesTab() {
  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-slate-900">Competition Stages</h4>
      <p className="text-sm text-slate-600">
        Create and manage competition stages with timelines and requirements.
      </p>
      <button className="rounded-lg bg-secondary-600 px-4 py-2 text-sm font-medium text-white hover:bg-secondary-700">
        + New Stage
      </button>
    </div>
  );
}

function TeamsTab() {
  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-slate-900">Teams</h4>
      <p className="text-sm text-slate-600">
        Manage team registrations and team member assignments.
      </p>
      <button className="rounded-lg bg-secondary-600 px-4 py-2 text-sm font-medium text-white hover:bg-secondary-700">
        + Register Team
      </button>
    </div>
  );
}

function SubmissionsTab() {
  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-slate-900">Submissions</h4>
      <p className="text-sm text-slate-600">
        Review and track team submissions and project implementations.
      </p>
      <button className="rounded-lg bg-secondary-600 px-4 py-2 text-sm font-medium text-white hover:bg-secondary-700">
        View Submissions
      </button>
    </div>
  );
}

function ScoringTab() {
  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-slate-900">Scoring & Results</h4>
      <p className="text-sm text-slate-600">
        Grade submissions, assign scores, and generate final rankings.
      </p>
      <button className="rounded-lg bg-secondary-600 px-4 py-2 text-sm font-medium text-white hover:bg-secondary-700">
        Score Submissions
      </button>
    </div>
  );
}
