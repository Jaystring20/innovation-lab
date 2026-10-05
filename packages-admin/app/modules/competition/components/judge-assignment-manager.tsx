'use client';

import { useEffect, useState } from 'react';
import { Loader2, Plus, X, AlertCircle } from 'lucide-react';
import { listJudges, listAssignments, assignJudge, unassignJudge, type JudgeProfile, type Assignment } from '@/lib/judge';

interface JudgeAssignmentManagerProps {
  submissions: Array<{
    id: string;
    team_name: string;
    stage_name: string;
    division: string;
  }>;
  onAssignmentChange?: () => void;
}

export default function JudgeAssignmentManager({
  submissions,
  onAssignmentChange,
}: JudgeAssignmentManagerProps) {
  const [judges, setJudges] = useState<JudgeProfile[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedSubmission, setSelectedSubmission] = useState<string | null>(null);
  const [selectedJudge, setSelectedJudge] = useState<string | null>(null);
  const [assigning, setAssigning] = useState(false);
  const [unassigning, setUnassigning] = useState<string | null>(null);

  useEffect(() => {
    load();
  }, []);

  async function load() {
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

  async function handleAssign() {
    if (!selectedSubmission || !selectedJudge) return;

    setAssigning(true);
    setError(null);
    try {
      // Get current user ID (from session)
      const currentUser = 'organizer'; // TODO: Get from auth context
      await assignJudge(selectedSubmission, selectedJudge, currentUser);
      setSelectedJudge(null);
      await load();
      onAssignmentChange?.();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setAssigning(false);
    }
  }

  async function handleUnassign(assignmentId: string, submissionId: string, judgeId: string) {
    setUnassigning(assignmentId);
    setError(null);
    try {
      await unassignJudge(submissionId, judgeId);
      await load();
      onAssignmentChange?.();
    } catch (e) {
      setError((e as Error).message);
    } finally {
      setUnassigning(null);
    }
  }

  const submissionAssignments = assignments.reduce(
    (acc, a) => {
      if (!acc[a.submission_id]) acc[a.submission_id] = [];
      acc[a.submission_id].push(a);
      return acc;
    },
    {} as Record<string, Assignment[]>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center p-6">
        <Loader2 className="w-4 h-4 animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error && (
        <div className="flex gap-2 p-3 rounded-lg bg-red-500/10 border border-red-500/20">
          <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Assignment Form */}
      <div className="border border-border rounded-lg p-4 bg-muted/30">
        <h3 className="font-semibold mb-3">Assign Judge to Submission</h3>
        <div className="space-y-3">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Submission</label>
            <select
              value={selectedSubmission || ''}
              onChange={(e) => setSelectedSubmission(e.target.value)}
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">Select submission...</option>
              {submissions.map((sub) => (
                <option key={sub.id} value={sub.id}>
                  {sub.team_name} — {sub.stage_name} ({sub.division})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Judge</label>
            <select
              value={selectedJudge || ''}
              onChange={(e) => setSelectedJudge(e.target.value)}
              className="w-full rounded border border-border bg-background px-3 py-2 text-sm"
            >
              <option value="">Select judge...</option>
              {judges.map((judge) => (
                <option key={judge.id} value={judge.id}>
                  {judge.full_name || 'Unnamed'} ({judge.email})
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleAssign}
            disabled={!selectedSubmission || !selectedJudge || assigning}
            className="w-full px-3 py-2 bg-primary text-primary-foreground rounded text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
          >
            {assigning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            Assign Judge
          </button>
        </div>
      </div>

      {/* Assignments by Submission */}
      <div className="space-y-3">
        <h3 className="font-semibold">Current Assignments</h3>
        {submissions.length === 0 ? (
          <p className="text-sm text-muted-foreground">No submissions</p>
        ) : (
          <div className="space-y-2">
            {submissions.map((submission) => {
              const subs = submissionAssignments[submission.id] || [];
              return (
                <div
                  key={submission.id}
                  className="border border-border rounded-lg p-3 bg-muted/30 space-y-2"
                >
                  <div>
                    <p className="font-medium text-sm">{submission.team_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {submission.stage_name} • {submission.division}
                    </p>
                  </div>

                  {subs.length === 0 ? (
                    <p className="text-xs text-muted-foreground">No judges assigned</p>
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {subs.map((assignment) => {
                        const judge = judges.find((j) => j.id === assignment.judge_id);
                        return (
                          <div
                            key={assignment.id}
                            className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-xs"
                          >
                            <span>{judge?.full_name || 'Unknown'}</span>
                            <button
                              onClick={() =>
                                handleUnassign(
                                  assignment.id,
                                  assignment.submission_id,
                                  assignment.judge_id
                                )
                              }
                              disabled={unassigning === assignment.id}
                              className="hover:opacity-70 disabled:opacity-50"
                            >
                              {unassigning === assignment.id ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <X className="w-3 h-3" />
                              )}
                            </button>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Judge Stats */}
      <div className="border border-border rounded-lg p-4 bg-muted/30">
        <h3 className="font-semibold mb-3">Judges</h3>
        <div className="space-y-2">
          {judges.map((judge) => {
            const assignmentCount = assignments.filter((a) => a.judge_id === judge.id).length;
            return (
              <div key={judge.id} className="flex items-center justify-between text-sm">
                <div>
                  <p className="font-medium">{judge.full_name || 'Unnamed'}</p>
                  <p className="text-xs text-muted-foreground">{judge.email}</p>
                </div>
                <span className="text-xs bg-primary/20 text-primary px-2.5 py-1 rounded-full">
                  {assignmentCount} assignment{assignmentCount !== 1 ? 's' : ''}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
