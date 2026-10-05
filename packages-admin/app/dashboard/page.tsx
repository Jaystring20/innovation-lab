'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { supabase } from '@/integrations/supabase/client';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { UserMenu } from '@/components/UserMenu';

interface DashboardStats {
  activeLevels: number;
  enrolledStudents: number;
  runningCompetitions: number;
  totalSubmissions: number;
  loading: boolean;
  error: string | null;
}

export default function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>({
    activeLevels: 0,
    enrolledStudents: 0,
    runningCompetitions: 0,
    totalSubmissions: 0,
    loading: true,
    error: null,
  });

  useEffect(() => {
    const fetchStats = async () => {
      try {
        // Fetch active levels
        const { count: levelCount } = await supabase
          .from('learning_paths')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');

        // Fetch enrolled students
        const { count: studentCount } = await supabase
          .from('profiles')
          .select('*', { count: 'exact', head: true })
          .eq('role', 'student');

        // Fetch running competitions
        const { count: competitionCount } = await supabase
          .from('competitions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'active');

        // Fetch total submissions
        const { count: submissionCount } = await supabase
          .from('submissions')
          .select('*', { count: 'exact', head: true });

        setStats({
          activeLevels: levelCount || 0,
          enrolledStudents: studentCount || 0,
          runningCompetitions: competitionCount || 0,
          totalSubmissions: submissionCount || 0,
          loading: false,
          error: null,
        });
      } catch (error) {
        setStats((prev) => ({
          ...prev,
          loading: false,
          error: error instanceof Error ? error.message : 'Failed to load stats',
        }));
      }
    };

    fetchStats();
  }, []);

  return (
    <ProtectedRoute>
      <div className="min-h-screen" style={{ backgroundColor: '#150f0b', color: '#faf8f6' }}>
        {/* Header */}
        <div style={{ borderBottom: '1px solid #2a2420', paddingTop: '2rem', paddingBottom: '2rem' }}>
          <div className="max-w-6xl mx-auto px-6 flex items-start justify-between">
            <div>
              <h1 className="text-5xl font-serif tracking-tight" style={{ color: '#faf8f6', letterSpacing: '-0.02em' }}>
                STEAM Foundry
              </h1>
              <p className="text-base mt-1" style={{ color: '#8b8680' }}>
                Admin Dashboard
              </p>
            </div>
            <UserMenu />
          </div>
        </div>

      <div className="max-w-6xl mx-auto px-6 py-12 space-y-16">
        {/* Key Metrics */}
        <section>
          <h2 className="text-xs font-medium uppercase tracking-widest mb-8" style={{ color: '#8b8680', letterSpacing: '0.15em' }}>
            Overview
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {/* Active Levels */}
            <div className="p-8 rounded-lg transition-colors" style={{ backgroundColor: 'rgba(31, 25, 23, 0.6)', border: '1px solid #2a2420' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = '#da8a1d'} onMouseLeave={(e) => e.currentTarget.style.borderColor = '#2a2420'}>
              <div className="flex flex-col">
                <div className="text-4xl font-bold">
                  {stats.loading ? '—' : stats.activeLevels}
                </div>
                <div className="text-xs mt-4 uppercase tracking-wide" style={{ color: '#8b8680' }}>
                  Active Levels
                </div>
              </div>
            </div>

            {/* Enrolled Students */}
            <div className="p-8 rounded-lg transition-colors" style={{ backgroundColor: 'rgba(31, 25, 23, 0.6)', border: '1px solid #2a2420' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = '#da8a1d'} onMouseLeave={(e) => e.currentTarget.style.borderColor = '#2a2420'}>
              <div className="flex flex-col">
                <div className="text-4xl font-bold">
                  {stats.loading ? '—' : stats.enrolledStudents}
                </div>
                <div className="text-xs mt-4 uppercase tracking-wide" style={{ color: '#8b8680' }}>
                  Enrolled Students
                </div>
              </div>
            </div>

            {/* Running Competitions */}
            <div className="p-8 rounded-lg transition-colors" style={{ backgroundColor: 'rgba(31, 25, 23, 0.6)', border: '1px solid #2a2420' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = '#da8a1d'} onMouseLeave={(e) => e.currentTarget.style.borderColor = '#2a2420'}>
              <div className="flex flex-col">
                <div className="text-4xl font-bold">
                  {stats.loading ? '—' : stats.runningCompetitions}
                </div>
                <div className="text-xs mt-4 uppercase tracking-wide" style={{ color: '#8b8680' }}>
                  Running Competitions
                </div>
              </div>
            </div>

            {/* Total Submissions */}
            <div className="p-8 rounded-lg transition-colors" style={{ backgroundColor: 'rgba(31, 25, 23, 0.6)', border: '1px solid #2a2420' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = '#da8a1d'} onMouseLeave={(e) => e.currentTarget.style.borderColor = '#2a2420'}>
              <div className="flex flex-col">
                <div className="text-4xl font-bold">
                  {stats.loading ? '—' : stats.totalSubmissions}
                </div>
                <div className="text-xs mt-4 uppercase tracking-wide" style={{ color: '#8b8680' }}>
                  Total Submissions
                </div>
              </div>
            </div>
          </div>
          {stats.error && (
            <div className="mt-6 p-4 rounded-lg text-sm" style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)', borderLeft: '3px solid #ef4444', color: '#ef4444' }}>
              {stats.error}
            </div>
          )}
        </section>

        {/* Module Navigation */}
        <section>
          <h2 className="text-xs font-medium uppercase tracking-widest mb-8" style={{ color: '#8b8680', letterSpacing: '0.15em' }}>
            Modules
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Store */}
            <Link href="/modules/store" className="group">
              <div className="p-8 h-full flex flex-col justify-between transition-all rounded-lg" style={{ backgroundColor: 'rgba(31, 25, 23, 0.6)', border: '1px solid #2a2420' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = '#da8a1d'} onMouseLeave={(e) => e.currentTarget.style.borderColor = '#2a2420'}>
                <div>
                  <div className="text-lg font-semibold mb-3">
                    Store
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: '#8b8680' }}>
                    Manage school orders, payments, and kit delivery
                  </p>
                </div>
                <div className="text-sm font-medium mt-6 inline-flex items-center transition-all" style={{ color: '#da8a1d' }}>
                  Access →
                </div>
              </div>
            </Link>

            {/* Learning Lab */}
            <Link href="/modules/learning-lab" className="group">
              <div className="p-8 h-full flex flex-col justify-between transition-all rounded-lg" style={{ backgroundColor: 'rgba(31, 25, 23, 0.6)', border: '1px solid #2a2420' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = '#da8a1d'} onMouseLeave={(e) => e.currentTarget.style.borderColor = '#2a2420'}>
                <div>
                  <div className="text-lg font-semibold mb-3">
                    Learning Lab
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: '#8b8680' }}>
                    Manage levels, lessons, assessments, and missions
                  </p>
                </div>
                <div className="text-sm font-medium mt-6 inline-flex items-center transition-all" style={{ color: '#da8a1d' }}>
                  Access →
                </div>
              </div>
            </Link>

            {/* Competition */}
            <Link href="/modules/competition" className="group">
              <div className="p-8 h-full flex flex-col justify-between transition-all rounded-lg" style={{ backgroundColor: 'rgba(31, 25, 23, 0.6)', border: '1px solid #2a2420' }} onMouseEnter={(e) => e.currentTarget.style.borderColor = '#da8a1d'} onMouseLeave={(e) => e.currentTarget.style.borderColor = '#2a2420'}>
                <div>
                  <div className="text-lg font-semibold mb-3">
                    Competition
                  </div>
                  <p className="text-sm leading-relaxed" style={{ color: '#8b8680' }}>
                    Manage stages, teams, submissions, and scoring
                  </p>
                </div>
                <div className="text-sm font-medium mt-6 inline-flex items-center transition-all" style={{ color: '#da8a1d' }}>
                  Access →
                </div>
              </div>
            </Link>
          </div>
        </section>
      </div>
    </div>
    </ProtectedRoute>
  );
}
