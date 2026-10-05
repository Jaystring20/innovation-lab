'use client';

import React, { useState } from 'react';

type Tab = 'levels' | 'lessons' | 'assessments' | 'missions' | 'publish';

export function LearningLabModule() {
  const [activeTab, setActiveTab] = useState<Tab>('levels');

  return (
    <div className="space-y-6">
      {/* Module Header */}
      <div>
        <h3 className="text-2xl font-bold text-slate-900">Learning Lab</h3>
        <p className="text-sm text-slate-600 mt-1">
          Manage lessons, assessments, missions, and content publishing
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-slate-200">
        {(['levels', 'lessons', 'assessments', 'missions', 'publish'] as const).map(
          (tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 font-medium text-sm transition-colors ${
                activeTab === tab
                  ? 'border-b-2 border-primary-600 text-primary-600'
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
        {activeTab === 'levels' && <LevelsTab />}
        {activeTab === 'lessons' && <LessonsTab />}
        {activeTab === 'assessments' && <AssessmentsTab />}
        {activeTab === 'missions' && <MissionsTab />}
        {activeTab === 'publish' && <PublishTab />}
      </div>
    </div>
  );
}

function LevelsTab() {
  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-slate-900">Levels</h4>
      <p className="text-sm text-slate-600">
        Create and manage learning levels for different tiers and stages.
      </p>
      <button className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
        + New Level
      </button>
    </div>
  );
}

function LessonsTab() {
  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-slate-900">Lessons</h4>
      <p className="text-sm text-slate-600">
        Add lesson content with learning objectives and assets.
      </p>
      <button className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
        + New Lesson
      </button>
    </div>
  );
}

function AssessmentsTab() {
  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-slate-900">Assessments</h4>
      <p className="text-sm text-slate-600">
        Create quizzes with multiple-choice, true/false, and other question types.
      </p>
      <button className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
        + New Assessment
      </button>
    </div>
  );
}

function MissionsTab() {
  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-slate-900">Lab Missions</h4>
      <p className="text-sm text-slate-600">
        Design practical hands-on missions with TinkerCAD and code editing.
      </p>
      <button className="rounded-lg bg-primary-600 px-4 py-2 text-sm font-medium text-white hover:bg-primary-700">
        + New Mission
      </button>
    </div>
  );
}

function PublishTab() {
  return (
    <div className="space-y-4">
      <h4 className="font-semibold text-slate-900">Publishing Queue</h4>
      <p className="text-sm text-slate-600">
        Review and publish draft content to make it available to students.
      </p>
      <button className="rounded-lg bg-success px-4 py-2 text-sm font-medium text-white hover:bg-green-600">
        Publish Draft Content
      </button>
    </div>
  );
}
