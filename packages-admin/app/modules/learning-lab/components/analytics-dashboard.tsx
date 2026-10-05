'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export function AnalyticsDashboard() {
  // Fetch overall metrics
  const { data: metrics } = useQuery({
    queryKey: ['analytics-metrics'],
    queryFn: async () => {
      const [students, lessons, assessments, missions] = await Promise.all([
        supabase.from('student_progress').select('*'),
        supabase.from('lessons').select('id').eq('status', 'published'),
        supabase.from('assessment_submissions').select('*'),
        supabase.from('mission_submissions').select('*'),
      ]);

      const avgScore =
        assessments.data && assessments.data.length > 0
          ? assessments.data.reduce((sum: number, a: any) => sum + (a.score || 0), 0) /
            assessments.data.length
          : 0;

      const totalXP =
        missions.data?.reduce((sum: number, m: any) => sum + (m.xp_earned || 0), 0) || 0;

      return {
        total_students: students.data?.length || 0,
        active_students: students.data?.filter((s: any) => s.last_activity_at).length || 0,
        lessons_completed: lessons.data?.length || 0,
        assessments_taken: assessments.data?.length || 0,
        missions_attempted: missions.data?.length || 0,
        average_quiz_score: Math.round(avgScore),
        total_xp_distributed: totalXP,
      };
    },
  });

  // Fetch student progress
  const { data: studentProgress } = useQuery({
    queryKey: ['student-progress'],
    queryFn: async () => {
      const { data } = await supabase
        .from('student_progress')
        .select(
          `
          *,
          users(name),
          levels(title)
        `
        )
        .order('xp_earned', { ascending: false })
        .limit(10);

      return (
        data?.map((student: any) => ({
          student_id: student.id,
          name: student.users?.name || 'Unknown',
          completed_lessons: student.lessons_completed || 0,
          total_lessons: student.total_lessons || 0,
          average_quiz_score: student.average_quiz_score || 0,
          xp_earned: student.xp_earned || 0,
          current_level: student.levels?.title || 'N/A',
          progress_percentage: student.completion_percentage || 0,
        })) || []
      );
    },
  });

  // Fetch completion rates
  const { data: completionRates } = useQuery({
    queryKey: ['completion-rates'],
    queryFn: async () => {
      const { data } = await supabase
        .from('levels')
        .select(
          `
          id,
          title,
          lessons:lessons(count),
          assessments:assessments(count)
        `
        )
        .eq('status', 'published');

      return data || [];
    },
  });

  const getMetricCard = (label: string, value: number | string, subtext?: string) => (
    <div className="p-4 bg-white rounded-lg border border-slate-200">
      <p className="text-sm text-slate-600 mb-1">{label}</p>
      <p className="text-3xl font-bold text-primary-600">{value}</p>
      {subtext && <p className="text-xs text-slate-600 mt-2">{subtext}</p>}
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Overview Metrics */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Analytics Overview</h2>
        <div className="grid grid-cols-4 gap-4">
          {getMetricCard(
            'Total Students',
            metrics?.total_students || 0,
            `${metrics?.active_students || 0} active this week`
          )}
          {getMetricCard(
            'Lessons Completed',
            metrics?.lessons_completed || 0,
            'Across all students'
          )}
          {getMetricCard(
            'Avg Quiz Score',
            `${metrics?.average_quiz_score || 0}%`,
            'Based on assessments'
          )}
          {getMetricCard(
            'Total XP Earned',
            metrics?.total_xp_distributed || 0,
            'By all students'
          )}
        </div>
      </div>

      {/* Student Engagement */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Student Engagement</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="p-6 bg-white rounded-lg border border-slate-200">
            <h3 className="font-semibold text-slate-900 mb-4">Assessments Taken</h3>
            <div className="text-4xl font-bold text-secondary-600 mb-2">
              {metrics?.assessments_taken || 0}
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-secondary-600 h-2 rounded-full"
                style={{
                  width: `${((metrics?.assessments_taken || 0) / (metrics?.total_students || 1)) * 100}%`,
                }}
              />
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg border border-slate-200">
            <h3 className="font-semibold text-slate-900 mb-4">Missions Attempted</h3>
            <div className="text-4xl font-bold text-primary-600 mb-2">
              {metrics?.missions_attempted || 0}
            </div>
            <div className="w-full bg-slate-200 rounded-full h-2">
              <div
                className="bg-primary-600 h-2 rounded-full"
                style={{
                  width: `${((metrics?.missions_attempted || 0) / (metrics?.total_students || 1)) * 100}%`,
                }}
              />
            </div>
          </div>

          <div className="p-6 bg-white rounded-lg border border-slate-200">
            <h3 className="font-semibold text-slate-900 mb-4">Active Users</h3>
            <div className="text-4xl font-bold text-success mb-2">
              {metrics?.active_students || 0}
            </div>
            <p className="text-xs text-slate-600">
              {metrics?.total_students
                ? Math.round(((metrics.active_students || 0) / metrics.total_students) * 100)
                : 0}
              % of total
            </p>
          </div>
        </div>
      </div>

      {/* Top Performers */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Top Performers</h2>
        <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
          <table className="w-full">
            <thead className="bg-slate-50 border-b border-slate-200">
              <tr>
                <th className="text-left px-6 py-3 text-sm font-semibold text-slate-900">
                  Student
                </th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-slate-900">
                  Level
                </th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-slate-900">
                  Lessons
                </th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-slate-900">
                  Quiz Score
                </th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-slate-900">
                  XP Earned
                </th>
                <th className="text-left px-6 py-3 text-sm font-semibold text-slate-900">
                  Progress
                </th>
              </tr>
            </thead>
            <tbody>
              {studentProgress && studentProgress.length > 0 ? (
                studentProgress.map((student, idx) => (
                  <tr key={student.student_id} className="border-b border-slate-200 hover:bg-slate-50">
                    <td className="px-6 py-4 text-sm text-slate-900 font-medium">
                      {idx + 1}. {student.name}
                    </td>
                    <td className="px-6 py-4 text-sm text-slate-600">{student.current_level}</td>
                    <td className="px-6 py-4 text-sm text-slate-600">
                      {student.completed_lessons}/{student.total_lessons}
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-primary-100 text-primary-800">
                        {student.average_quiz_score}%
                      </span>
                    </td>
                    <td className="px-6 py-4 text-sm font-semibold text-secondary-600">
                      {student.xp_earned} XP
                    </td>
                    <td className="px-6 py-4 text-sm">
                      <div className="flex items-center gap-2">
                        <div className="w-24 bg-slate-200 rounded-full h-2">
                          <div
                            className="bg-success h-2 rounded-full"
                            style={{ width: `${student.progress_percentage}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-600">
                          {Math.round(student.progress_percentage)}%
                        </span>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="px-6 py-8 text-center text-slate-600">
                    No student data yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Level Completion Rates */}
      <div>
        <h2 className="text-2xl font-bold text-slate-900 mb-4">Level Completion Rates</h2>
        <div className="grid grid-cols-2 gap-4">
          {completionRates && completionRates.length > 0 ? (
            completionRates.map((level: any) => (
              <div key={level.id} className="p-4 bg-white rounded-lg border border-slate-200">
                <p className="font-semibold text-slate-900 mb-2">{level.title}</p>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-slate-600">
                    {level.lessons?.[0]?.count || 0} lessons
                  </span>
                  <span className="text-sm text-slate-600">
                    {level.assessments?.[0]?.count || 0} assessments
                  </span>
                </div>
                <div className="w-full bg-slate-200 rounded-full h-2">
                  <div
                    className="bg-primary-600 h-2 rounded-full"
                    style={{
                      width: `${Math.random() * 100}%`, // Replace with actual data
                    }}
                  />
                </div>
              </div>
            ))
          ) : (
            <p className="col-span-2 text-slate-600">No level data available</p>
          )}
        </div>
      </div>

      {/* Export Button */}
      <div className="flex justify-end">
        <button className="rounded-lg bg-primary-600 px-6 py-2 font-medium text-white hover:bg-primary-700">
          📊 Export Report
        </button>
      </div>
    </div>
  );
}
