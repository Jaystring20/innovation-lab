'use client';

import { useEffect, useState } from 'react';
import { Users, Loader2, RefreshCw, AlertCircle } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useRouter } from 'next/navigation';
import { listJudges, listAssignments, type JudgeProfile, type Assignment } from '@/lib/judge';

export default function JudgesPage() {
  const router = useRouter();
  const { user, isAdmin } = useAuth();
  const [judges, setJudges] = useState<JudgeProfile[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    if (!isAdmin) {
      router.push('/dashboard');
      return;
    }
    refresh();
  }, [user, isAdmin, router]);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const [judgesData, assignmentsData] = await Promise.all([listJudges(), listAssignments()]);
      setJudges(judgesData);
      setAssignments(assignmentsData);
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setLoading(false);
    }
  }

  if (!user || !isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-6 h-6 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <Users className="w-8 h-8" />
            Judge Management
          </h1>
          <p className="text-muted-foreground mt-1">Manage judges and their assignments</p>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div className="flex gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <StatCard
          label="Total Judges"
          value={String(judges.length)}
          description={`${judges.length} judge${judges.length !== 1 ? 's' : ''} available`}
        />
        <StatCard
          label="Total Assignments"
          value={String(assignments.length)}
          description={`${assignments.length} submission${assignments.length !== 1 ? 's' : ''} assigned`}
        />
        <StatCard
          label="Avg Submissions/Judge"
          value={(judges.length > 0 ? (assignments.length / judges.length).toFixed(1) : '0')}
          description="Load balance across judges"
        />
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {loading ? 'Loading…' : `${judges.length} judge${judges.length !== 1 ? 's' : ''}`}
        </p>
        <button
          onClick={refresh}
          disabled={loading}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-primary disabled:opacity-50 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
        </button>
      </div>

      {/* Judges Table */}
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted-foreground border-b border-border bg-muted/30">
                <th className="p-3 font-medium">Judge Name</th>
                <th className="p-3 font-medium">Email</th>
                <th className="p-3 font-medium">Assignments</th>
                <th className="p-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-muted-foreground">
                    <Loader2 className="w-4 h-4 animate-spin inline" /> Loading judges…
                  </td>
                </tr>
              )}
              {!loading && judges.length === 0 && (
                <tr>
                  <td colSpan={4} className="p-6 text-center text-muted-foreground">
                    No judges found.
                  </td>
                </tr>
              )}
              {judges.map((judge) => {
                const judgeAssignments = assignments.filter((a) => a.judge_id === judge.id);
                return (
                  <tr key={judge.id} className="border-b border-border/30 last:border-0 hover:bg-muted/30">
                    <td className="p-3 font-medium text-foreground">{judge.full_name || 'Unnamed'}</td>
                    <td className="p-3 text-muted-foreground">{judge.email}</td>
                    <td className="p-3">
                      <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full">
                        {judgeAssignments.length}
                      </span>
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full ${
                          judgeAssignments.length === 0
                            ? 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400'
                            : 'bg-green-500/10 text-green-600 dark:text-green-400'
                        }`}
                      >
                        {judgeAssignments.length === 0 ? 'Unassigned' : 'Active'}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Assignment Distribution */}
      <div className="rounded-lg border border-border p-6 bg-muted/30">
        <h2 className="font-semibold mb-4">Assignment Distribution</h2>
        <div className="space-y-3">
          {judges.length === 0 ? (
            <p className="text-sm text-muted-foreground">No judges to display</p>
          ) : (
            judges.map((judge) => {
              const judgeAssignments = assignments.filter((a) => a.judge_id === judge.id);
              const maxAssignments = Math.max(...judges.map((j) => assignments.filter((a) => a.judge_id === j.id).length), 1);
              const percentage = (judgeAssignments.length / maxAssignments) * 100;
              return (
                <div key={judge.id}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{judge.full_name || 'Unnamed'}</span>
                    <span className="text-xs text-muted-foreground">{judgeAssignments.length}</span>
                  </div>
                  <div className="h-2 rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full bg-primary transition-all"
                      style={{ width: `${percentage}%` }}
                    />
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}

const StatCard = ({ label, value, description }: { label: string; value: string; description?: string }) => (
  <div className="rounded-lg border border-border p-4 bg-muted/30">
    <p className="text-xs text-muted-foreground">{label}</p>
    <p className="text-2xl font-bold text-foreground mt-1">{value}</p>
    {description && <p className="text-xs text-muted-foreground mt-1">{description}</p>}
  </div>
);
