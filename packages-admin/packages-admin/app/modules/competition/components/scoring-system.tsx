'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { eventBus } from '@/lib/events';

const scoringSchema = z.object({
  submission_id: z.string().uuid('Must select a submission'),
  innovation_score: z.number().int().min(0).max(100),
  implementation_score: z.number().int().min(0).max(100),
  collaboration_score: z.number().int().min(0).max(100),
  sustainability_score: z.number().int().min(0).max(100),
  presentation_score: z.number().int().min(0).max(100),
  feedback: z.string().optional(),
});

type ScoringFormData = z.infer<typeof scoringSchema>;

interface ScoringSystemProps {
  stageId?: string;
}

export function ScoringSystem({ stageId }: ScoringSystemProps) {
  const [selectedSubmissionId, setSelectedSubmissionId] = useState<string | null>(null);

  // Fetch submissions
  const { data: submissions, isLoading: submissionsLoading } = useQuery({
    queryKey: ['scorable-submissions', stageId],
    queryFn: async () => {
      let query = supabase
        .from('submissions')
        .select('*, teams(name), submission_reviews(*)');

      if (stageId) {
        query = query.eq('stage_id', stageId);
      }

      const { data } = await query.eq('status', 'accepted').order('created_at');
      return data || [];
    },
    enabled: !!stageId,
  });

  // Fetch existing scores
  const { data: existingScore } = useQuery({
    queryKey: ['submission-score', selectedSubmissionId],
    queryFn: async () => {
      if (!selectedSubmissionId) return null;
      const { data } = await supabase
        .from('submission_scores')
        .select('*')
        .eq('submission_id', selectedSubmissionId)
        .single();
      return data;
    },
    enabled: !!selectedSubmissionId,
  });

  const {
    register,
    handleSubmit,
    watch,
    reset,
  } = useForm<ScoringFormData>({
    resolver: zodResolver(scoringSchema),
    defaultValues: existingScore || {
      submission_id: selectedSubmissionId || '',
      innovation_score: 0,
      implementation_score: 0,
      collaboration_score: 0,
      sustainability_score: 0,
      presentation_score: 0,
      feedback: '',
    },
  });

  const scores = {
    innovation: watch('innovation_score'),
    implementation: watch('implementation_score'),
    collaboration: watch('collaboration_score'),
    sustainability: watch('sustainability_score'),
    presentation: watch('presentation_score'),
  };

  const totalScore = Object.values(scores).reduce((a, b) => a + b, 0);
  const averageScore = totalScore / 5;

  // Save scores mutation
  const saveMutation = useMutation({
    mutationFn: async (data: ScoringFormData) => {
      if (existingScore) {
        const { error } = await supabase
          .from('submission_scores')
          .update(data)
          .eq('submission_id', selectedSubmissionId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('submission_scores')
          .insert([{ ...data, submission_id: selectedSubmissionId }]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      eventBus.emit('admin:content-saved', {
        module: 'competition',
        contentType: 'score',
        contentId: selectedSubmissionId || 'new',
      });
    },
  });

  const onSubmit = async (data: ScoringFormData) => {
    await saveMutation.mutateAsync(data);
  };

  return (
    <div className="grid grid-cols-4 gap-6 h-full">
      {/* Submissions List */}
      <div className="col-span-1 space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">Submissions</h3>

        {submissionsLoading ? (
          <div className="text-slate-600 text-sm">Loading...</div>
        ) : submissions && submissions.length > 0 ? (
          <div className="space-y-2 max-h-[700px] overflow-y-auto">
            {submissions.map((submission: any) => (
              <button
                key={submission.id}
                onClick={() => {
                  setSelectedSubmissionId(submission.id);
                  reset();
                }}
                className={`w-full text-left p-3 rounded-lg border transition-all ${
                  selectedSubmissionId === submission.id
                    ? 'border-secondary-500 bg-secondary-50'
                    : 'border-slate-200 bg-white hover:border-slate-300'
                }`}
              >
                <p className="font-medium text-slate-900 text-sm">
                  {submission.teams?.name}
                </p>
                {submission.submission_reviews && submission.submission_reviews.length > 0 && (
                  <p className="text-xs text-success mt-1">✓ Has reviews</p>
                )}
              </button>
            ))}
          </div>
        ) : (
          <div className="text-slate-600 text-sm">No submissions to score</div>
        )}
      </div>

      {/* Scoring Form */}
      <div className="col-span-3">
        {selectedSubmissionId ? (
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            {/* Score Criteria */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-slate-900">Score Criteria</h3>

              <div className="grid grid-cols-2 gap-4">
                {/* Innovation */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Innovation (0-100)
                  </label>
                  <div className="space-y-2">
                    <input
                      {...register('innovation_score', { valueAsNumber: true })}
                      type="range"
                      min="0"
                      max="100"
                      className="w-full"
                    />
                    <div className="flex justify-between items-center">
                      <input
                        {...register('innovation_score', { valueAsNumber: true })}
                        type="number"
                        min="0"
                        max="100"
                        className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-sm text-center"
                      />
                      <span className="text-sm text-slate-600">
                        Creative & original approach
                      </span>
                    </div>
                  </div>
                </div>

                {/* Implementation */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Implementation (0-100)
                  </label>
                  <div className="space-y-2">
                    <input
                      {...register('implementation_score', { valueAsNumber: true })}
                      type="range"
                      min="0"
                      max="100"
                      className="w-full"
                    />
                    <div className="flex justify-between items-center">
                      <input
                        {...register('implementation_score', { valueAsNumber: true })}
                        type="number"
                        min="0"
                        max="100"
                        className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-sm text-center"
                      />
                      <span className="text-sm text-slate-600">Code quality</span>
                    </div>
                  </div>
                </div>

                {/* Collaboration */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Collaboration (0-100)
                  </label>
                  <div className="space-y-2">
                    <input
                      {...register('collaboration_score', { valueAsNumber: true })}
                      type="range"
                      min="0"
                      max="100"
                      className="w-full"
                    />
                    <div className="flex justify-between items-center">
                      <input
                        {...register('collaboration_score', { valueAsNumber: true })}
                        type="number"
                        min="0"
                        max="100"
                        className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-sm text-center"
                      />
                      <span className="text-sm text-slate-600">Teamwork</span>
                    </div>
                  </div>
                </div>

                {/* Sustainability */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Sustainability (0-100)
                  </label>
                  <div className="space-y-2">
                    <input
                      {...register('sustainability_score', { valueAsNumber: true })}
                      type="range"
                      min="0"
                      max="100"
                      className="w-full"
                    />
                    <div className="flex justify-between items-center">
                      <input
                        {...register('sustainability_score', { valueAsNumber: true })}
                        type="number"
                        min="0"
                        max="100"
                        className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-sm text-center"
                      />
                      <span className="text-sm text-slate-600">Scalability</span>
                    </div>
                  </div>
                </div>

                {/* Presentation */}
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-slate-700">
                    Presentation (0-100)
                  </label>
                  <div className="space-y-2">
                    <input
                      {...register('presentation_score', { valueAsNumber: true })}
                      type="range"
                      min="0"
                      max="100"
                      className="w-full"
                    />
                    <div className="flex justify-between items-center">
                      <input
                        {...register('presentation_score', { valueAsNumber: true })}
                        type="number"
                        min="0"
                        max="100"
                        className="w-16 rounded-lg border border-slate-200 px-2 py-1 text-sm text-center"
                      />
                      <span className="text-sm text-slate-600">Documentation</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Score Summary */}
            <div className="grid grid-cols-3 gap-4 p-4 bg-slate-50 rounded-lg">
              <div className="text-center">
                <p className="text-sm text-slate-600 mb-1">Total Score</p>
                <p className="text-3xl font-bold text-secondary-600">{totalScore}</p>
                <p className="text-xs text-slate-600 mt-1">/500</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-slate-600 mb-1">Average Score</p>
                <p className="text-3xl font-bold text-primary-600">
                  {averageScore.toFixed(1)}
                </p>
                <p className="text-xs text-slate-600 mt-1">/100</p>
              </div>
              <div className="text-center">
                <p className="text-sm text-slate-600 mb-1">Ranking</p>
                <p className="text-3xl font-bold text-secondary-600">#1</p>
                <p className="text-xs text-slate-600 mt-1">vs submissions</p>
              </div>
            </div>

            {/* Feedback */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Detailed Feedback
              </label>
              <textarea
                {...register('feedback')}
                placeholder="Provide detailed feedback and suggestions for improvement..."
                rows={4}
                className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saveMutation.isPending}
                className="rounded-lg bg-secondary-600 px-6 py-2 font-medium text-white hover:bg-secondary-700 disabled:opacity-50"
              >
                {saveMutation.isPending ? 'Saving...' : 'Save Scores'}
              </button>
            </div>

            {saveMutation.isSuccess && (
              <div className="rounded-lg bg-green-50 p-4 text-sm text-success">
                ✓ Scores saved successfully (Average: {averageScore.toFixed(1)}/100)
              </div>
            )}
            {saveMutation.isError && (
              <div className="rounded-lg bg-red-50 p-4 text-sm text-error">
                ✗ Failed to save scores
              </div>
            )}
          </form>
        ) : (
          <div className="flex items-center justify-center h-full text-slate-600">
            Select a submission to score
          </div>
        )}
      </div>
    </div>
  );
}
