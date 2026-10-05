'use client';

import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export default function StudentPortalPage() {
  const [activeTab, setActiveTab] = useState<'learning' | 'competition' | 'progress'>('learning');

  // Fetch current user
  const { data: user } = useQuery({
    queryKey: ['current-user'],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      return user;
    },
  });

  // Fetch assigned lessons
  const { data: assignedLessons } = useQuery({
    queryKey: ['assigned-lessons', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('student_lessons')
        .select('*, lessons(title, description, duration_minutes, level_id, levels(title))')
        .eq('student_id', user.id)
        .order('assigned_at', { ascending: false });
      return data || [];
    },
    enabled: !!user?.id && activeTab === 'learning',
  });

  // Fetch competitions
  const { data: competitions } = useQuery({
    queryKey: ['student-competitions', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await supabase
        .from('team_members')
        .select('*, teams(name, description, competition_stages(name))')
        .eq('email', user.email)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!user?.id && activeTab === 'competition',
  });

  // Fetch student progress
  const { data: progress } = useQuery({
    queryKey: ['student-progress', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('student_progress')
        .select('*')
        .eq('student_id', user.id)
        .single();
      return data;
    },
    enabled: !!user?.id && activeTab === 'progress',
  });

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Sign in Required</h1>
          <p className="text-slate-600">Please sign in to access the learning portal</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="bg-white border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-slate-900">Learning Portal</h1>
              <p className="text-slate-600 mt-1">Welcome, {user.user_metadata?.name || user.email}</p>
            </div>
            <button className="px-4 py-2 text-slate-700 hover:text-slate-900">
              Account Settings →
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="flex gap-4 mb-8 border-b border-slate-200">
          {(['learning', 'competition', 'progress'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-3 font-medium transition-colors ${
                activeTab === tab
                  ? 'border-b-2 border-primary-600 text-primary-600'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab === 'learning' && '📚 Learning Lab'}
              {tab === 'competition' && '🏆 Competitions'}
              {tab === 'progress' && '📊 My Progress'}
            </button>
          ))}
        </div>

        {/* Learning Tab */}
        {activeTab === 'learning' && (
          <div className="space-y-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="p-6 bg-white rounded-lg border border-slate-200">
                <p className="text-sm text-slate-600 mb-1">Lessons Completed</p>
                <p className="text-4xl font-bold text-primary-600">
                  {assignedLessons?.filter((l: any) => l.completed_at)?.length || 0}
                </p>
              </div>
              <div className="p-6 bg-white rounded-lg border border-slate-200">
                <p className="text-sm text-slate-600 mb-1">XP Earned</p>
                <p className="text-4xl font-bold text-secondary-600">{progress?.xp_earned || 0}</p>
              </div>
              <div className="p-6 bg-white rounded-lg border border-slate-200">
                <p className="text-sm text-slate-600 mb-1">Current Level</p>
                <p className="text-2xl font-bold text-slate-900">{progress?.current_level || 'Level 1'}</p>
              </div>
            </div>

            {/* Assigned Lessons */}
            <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
              <div className="p-6 border-b border-slate-200">
                <h2 className="text-xl font-bold text-slate-900">Your Lessons</h2>
              </div>

              {assignedLessons && assignedLessons.length > 0 ? (
                <div className="divide-y divide-slate-200">
                  {assignedLessons.map((item: any) => (
                    <div key={item.id} className="p-6 hover:bg-slate-50 transition-colors">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <p className="text-sm text-slate-600">
                            {item.lessons?.levels?.title}
                          </p>
                          <h3 className="text-lg font-semibold text-slate-900">
                            {item.lessons?.title}
                          </h3>
                          <p className="text-sm text-slate-600 mt-1">
                            {item.lessons?.description}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          {item.completed_at ? (
                            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-success">
                              ✓ Completed
                            </span>
                          ) : (
                            <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700">
                              Start Lesson
                            </button>
                          )}
                        </div>
                      </div>

                      {!item.completed_at && (
                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs text-slate-600">Progress</span>
                            <span className="text-xs font-medium text-slate-900">
                              {Math.round((item.progress || 0) * 100)}%
                            </span>
                          </div>
                          <div className="w-full bg-slate-200 rounded-full h-2">
                            <div
                              className="bg-primary-600 h-2 rounded-full transition-all"
                              style={{ width: `${(item.progress || 0) * 100}%` }}
                            />
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-slate-600">
                  No lessons assigned yet
                </div>
              )}
            </div>
          </div>
        )}

        {/* Competition Tab */}
        {activeTab === 'competition' && (
          <div className="space-y-6">
            {competitions && competitions.length > 0 ? (
              competitions.map((item: any) => (
                <div key={item.id} className="p-6 bg-white rounded-lg border border-slate-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm text-slate-600 mb-1">
                        {item.teams?.competition_stages?.name}
                      </p>
                      <h3 className="text-xl font-bold text-slate-900">
                        {item.teams?.name}
                      </h3>
                      <p className="text-slate-600 mt-2">{item.teams?.description}</p>
                      <div className="mt-3">
                        <p className="text-sm text-slate-600">
                          Your role: <span className="font-medium text-slate-900">{item.role}</span>
                        </p>
                      </div>
                    </div>
                    <button className="px-4 py-2 bg-secondary-600 text-white rounded-lg hover:bg-secondary-700">
                      View Team
                    </button>
                  </div>
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-600 bg-white rounded-lg border border-slate-200">
                You're not part of any competition teams yet
              </div>
            )}
          </div>
        )}

        {/* Progress Tab */}
        {activeTab === 'progress' && progress && (
          <div className="grid grid-cols-2 gap-6">
            {/* Stats */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Statistics</h2>
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                  <span className="text-slate-600">Lessons Completed</span>
                  <span className="font-bold text-lg text-slate-900">
                    {progress.lessons_completed || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                  <span className="text-slate-600">Assessments Passed</span>
                  <span className="font-bold text-lg text-slate-900">
                    {progress.assessments_passed || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between pb-4 border-b border-slate-200">
                  <span className="text-slate-600">Missions Completed</span>
                  <span className="font-bold text-lg text-slate-900">
                    {progress.missions_completed || 0}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-600">Average Quiz Score</span>
                  <span className="font-bold text-lg text-slate-900">
                    {progress.average_quiz_score || 0}%
                  </span>
                </div>
              </div>
            </div>

            {/* XP & Rank */}
            <div className="bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Level & Rewards</h2>
              <div className="space-y-6">
                <div>
                  <p className="text-sm text-slate-600 mb-2">Current Level</p>
                  <p className="text-4xl font-bold text-secondary-600">
                    {progress.current_level || 'Level 1'}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-slate-600 mb-2">XP Earned</p>
                  <p className="text-3xl font-bold text-primary-600">{progress.xp_earned || 0}</p>
                  <div className="mt-3 w-full bg-slate-200 rounded-full h-3">
                    <div
                      className="bg-primary-600 h-3 rounded-full"
                      style={{ width: `${((progress.xp_earned || 0) % 1000) / 10}%` }}
                    />
                  </div>
                  <p className="text-xs text-slate-600 mt-1">
                    {1000 - ((progress.xp_earned || 0) % 1000)} XP to next level
                  </p>
                </div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="col-span-2 bg-white rounded-lg border border-slate-200 p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Recent Activity</h2>
              <p className="text-slate-600">Activity log coming soon...</p>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
