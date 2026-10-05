'use client';

import React, { useState } from 'react';
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { eventBus } from '@/lib/events';

interface SubmissionReviewerProps {
  stageId?: string;
}

export function SubmissionReviewer({ stageId }: SubmissionReviewerProps) {
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);
  const [reviewerComment, setReviewerComment] = useState('');

  // Fetch submissions
  const { data: submissions, isLoading: submissionsLoading } = useQuery({
    queryKey: ['submissions', stageId],
    queryFn: async () => {
      let query = supabase
        .from('submissions')
        .select('*, teams(name, school_or_org), competition_stages(name)');

      if (stageId) {
        query = query.eq('stage_id', stageId);
      }

      const { data } = await query.order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!stageId,
  });

  // Fetch selected submission details
  const { data: submissionDetail } = useQuery({
    queryKey: ['submission-detail', selectedSubmissionId],
    queryFn: async () => {
      if (!selectedSubmissionId) return null;
      const { data } = await supabase
        .from('submissions')
        .select(`
          *,
          teams(name, school_or_org),
          submission_reviews(*)
        `)
        .eq('id', selectedSubmissionId)
        .single();
      return data;
    },
    enabled: !!selectedSubmissionId,
  });

  // Add review comment mutation
  const addCommentMutation = useMutation({
    mutationFn: async (comment: string) => {
      const { error } = await supabase.from('submission_reviews').insert([
        {
          submission_id: selectedSubmissionId,
          reviewer_comments: comment,
          status: 'reviewing',
        },
      ]);
      if (error) throw error;
    },
    onSuccess: () => {
      eventBus.emit('admin:content-saved', {
        module: 'competition',
        contentType: 'submission_review',
        contentId: selectedSubmissionId || 'new',
      });
      setReviewerComment('');
    },
  });

  // Update submission status mutation
  const updateStatusMutation = useMutation({
    mutationFn: async (status: 'pending' | 'under_review' | 'accepted' | 'rejected') => {
      const { error } = await supabase
        .from('submissions')
        .update({ status })
        .eq('id', selectedSubmissionId);
      if (error) throw error;
    },
    onSuccess: () => {
      eventBus.emit('admin:content-saved', {
        module: 'competition',
        contentType: 'submission_status',
        contentId: selectedSubmissionId || 'new',
      });
    },
  });

  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'under_review':
        return 'bg-blue-100 text-blue-800';
      case 'accepted':
        return 'bg-green-100 text-success';
      case 'rejected':
        return 'bg-red-100 text-error';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <div className="grid grid-cols-3 gap-6 h-full">
      {/* Submissions List */}
      <div className="col-span-1 space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">Submissions</h3>

        {submissionsLoading ? (
          <div className="text-slate-600">Loading submissions...</div>
        ) : submissions && submissions.length > 0 ? (
          <div className="space-y-2 max-h-[600px] overflow-y-auto">
            {submissions.map((submission: any) => (
              <button
                key={submission.id}
                onClick={() => setSelectedSubmissionId(submission.id)}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedSubmissionId === submission.id
                    ? 'border-secondary-500 bg-secondary-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <p className="font-medium text-slate-900 text-sm">
                  {submission.teams?.name}
                </p>
                <p className="text-xs text-slate-600">
                  {submission.competition_stages?.name}
                </p>
                <div className="mt-2 flex items-center justify-between">
                  <span
                    className={`text-xs px-2 py-1 rounded ${getStatusBadgeColor(
                      submission.status
                    )}`}
                  >
                    {submission.status}
                  </span>
                  <time className="text-xs text-slate-600">
                    {new Date(submission.created_at).toLocaleDateString()}
                  </time>
                </div>
              </button>
            ))}
          </div>
        ) : (
          <div className="text-slate-600 text-sm">No submissions yet</div>
        )}
      </div>

      {/* Submission Details */}
      <div className="col-span-2 space-y-6">
        {selectedSubmissionId && submissionDetail ? (
          <>
            {/* Submission Header */}
            <div className="border-b border-slate-200 pb-4">
              <h2 className="text-2xl font-bold text-slate-900">
                {submissionDetail.teams?.name}
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                {submissionDetail.teams?.school_or_org}
              </p>
              <div className="mt-3 flex items-center gap-3">
                <span
                  className={`text-sm px-3 py-1 rounded-full font-medium ${getStatusBadgeColor(
                    submissionDetail.status
                  )}`}
                >
                  {submissionDetail.status}
                </span>
                <time className="text-sm text-slate-600">
                  Submitted:{' '}
                  {new Date(submissionDetail.created_at).toLocaleDateString()}
                </time>
              </div>
            </div>

            {/* Submission Content */}
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Submission Title
                </h3>
                <p className="text-slate-700">
                  {submissionDetail.title || 'Untitled Submission'}
                </p>
              </div>

              {submissionDetail.description && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    Description
                  </h3>
                  <p className="text-slate-700 whitespace-pre-wrap">
                    {submissionDetail.description}
                  </p>
                </div>
              )}

              {submissionDetail.repo_url && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    Repository
                  </h3>
                  <a
                    href={submissionDetail.repo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700 underline text-sm"
                  >
                    View Code Repository →
                  </a>
                </div>
              )}

              {submissionDetail.demo_url && (
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">
                    Live Demo
                  </h3>
                  <a
                    href={submissionDetail.demo_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary-600 hover:text-primary-700 underline text-sm"
                  >
                    View Live Demo →
                  </a>
                </div>
              )}
            </div>

            {/* Status Update */}
            <div className="border-t border-slate-200 pt-4">
              <h3 className="text-lg font-semibold text-slate-900 mb-3">
                Update Status
              </h3>
              <div className="grid grid-cols-2 gap-2">
                {(['pending', 'under_review', 'accepted', 'rejected'] as const).map(
                  (status) => (
                    <button
                      key={status}
                      onClick={() => updateStatusMutation.mutate(status)}
                      disabled={updateStatusMutation.isPending}
                      className={`px-3 py-2 rounded-lg font-medium text-sm transition-all ${
                        submissionDetail.status === status
                          ? 'bg-secondary-600 text-white'
                          : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                      } disabled:opacity-50`}
                    >
                      {status.replace('_', ' ').toUpperCase()}
                    </button>
                  )
                )}
              </div>
            </div>

            {/* Review Comments */}
            <div className="border-t border-slate-200 pt-4 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-slate-900 mb-3">
                  Reviewer Comments
                </h3>
                <textarea
                  value={reviewerComment}
                  onChange={(e) => setReviewerComment(e.target.value)}
                  placeholder="Add feedback, suggestions, or questions for the team..."
                  rows={4}
                  className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
                />
              </div>

              <button
                onClick={() => {
                  if (reviewerComment.trim()) {
                    addCommentMutation.mutate(reviewerComment);
                  }
                }}
                disabled={addCommentMutation.isPending || !reviewerComment.trim()}
                className="rounded-lg bg-secondary-600 px-4 py-2 font-medium text-white hover:bg-secondary-700 disabled:opacity-50"
              >
                {addCommentMutation.isPending ? 'Posting...' : 'Post Comment'}
              </button>

              {/* Previous Comments */}
              {submissionDetail.submission_reviews &&
                submissionDetail.submission_reviews.length > 0 && (
                  <div className="space-y-3 pt-4">
                    <p className="text-sm font-medium text-slate-700">
                      Previous Comments ({submissionDetail.submission_reviews.length})
                    </p>
                    {submissionDetail.submission_reviews.map((review: any) => (
                      <div
                        key={review.id}
                        className="p-3 bg-slate-50 rounded-lg border border-slate-200"
                      >
                        <p className="text-sm text-slate-900">
                          {review.reviewer_comments}
                        </p>
                        <time className="text-xs text-slate-600 mt-2 block">
                          {new Date(review.created_at).toLocaleDateString()}
                        </time>
                      </div>
                    ))}
                  </div>
                )}
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-600">
            Select a submission to review
          </div>
        )}
      </div>
    </div>
  );
}
