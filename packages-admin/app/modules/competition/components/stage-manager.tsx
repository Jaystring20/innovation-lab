'use client';

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { eventBus } from '@/lib/events';

const stageSchema = z.object({
  name: z.string().min(3, 'Stage name required'),
  description: z.string().min(10, 'Description required'),
  start_date: z.string().datetime('Invalid start date'),
  end_date: z.string().datetime('Invalid end date'),
  submission_deadline: z.string().datetime('Invalid deadline'),
  min_team_size: z.number().int().min(1, 'Minimum team size required'),
  max_team_size: z.number().int().min(1, 'Maximum team size required'),
  theme: z.string().optional(),
  requirements: z.string().optional(),
  order_index: z.number().int().min(1),
  status: z.enum(['draft', 'active', 'closed']),
});

type StageFormData = z.infer<typeof stageSchema>;

interface StageManagerProps {
  stageId?: string;
  onSuccess?: () => void;
}

export function StageManager({ stageId, onSuccess }: StageManagerProps) {
  const isEditing = !!stageId;

  // Fetch existing stage
  const { data: stage } = useQuery({
    queryKey: ['competition-stage', stageId],
    queryFn: async () => {
      if (!stageId) return null;
      const { data } = await supabase
        .from('competition_stages')
        .select('*')
        .eq('id', stageId)
        .single();
      return data;
    },
    enabled: !!isEditing,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = useForm<StageFormData>({
    resolver: zodResolver(stageSchema),
    defaultValues: stage || {
      name: '',
      description: '',
      start_date: new Date().toISOString().split('T')[0],
      end_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      submission_deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split('T')[0],
      min_team_size: 1,
      max_team_size: 6,
      status: 'draft',
      order_index: 1,
    },
  });

  const minTeamSize = watch('min_team_size');
  const maxTeamSize = watch('max_team_size');

  // Save stage mutation
  const saveMutation = useMutation({
    mutationFn: async (data: StageFormData) => {
      if (maxTeamSize < minTeamSize) {
        throw new Error('Max team size must be >= min team size');
      }

      if (isEditing) {
        const { error } = await supabase
          .from('competition_stages')
          .update(data)
          .eq('id', stageId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('competition_stages')
          .insert([data]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      eventBus.emit('admin:content-saved', {
        module: 'competition',
        contentType: 'stage',
        contentId: stageId || 'new',
      });
      onSuccess?.();
      reset();
    },
  });

  const onSubmit = async (data: StageFormData) => {
    await saveMutation.mutateAsync(data);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-4xl">
      {/* Stage Metadata */}
      <div className="space-y-4 border-b border-slate-200 pb-6">
        <h3 className="text-lg font-semibold text-slate-900">Stage Information</h3>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Stage Name
          </label>
          <input
            {...register('name')}
            type="text"
            placeholder="e.g., Round 1: Ideation"
            className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
          />
          {errors.name && (
            <p className="mt-1 text-sm text-error">{errors.name.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Description
          </label>
          <textarea
            {...register('description')}
            placeholder="What is this stage about?"
            rows={3}
            className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-error">{errors.description.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Order Index
          </label>
          <input
            {...register('order_index', { valueAsNumber: true })}
            type="number"
            min="1"
            className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
          />
        </div>
      </div>

      {/* Timeline */}
      <div className="space-y-4 border-b border-slate-200 pb-6">
        <h3 className="text-lg font-semibold text-slate-900">Timeline</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Start Date
            </label>
            <input
              {...register('start_date')}
              type="datetime-local"
              className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
            />
            {errors.start_date && (
              <p className="mt-1 text-sm text-error">{errors.start_date.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              End Date
            </label>
            <input
              {...register('end_date')}
              type="datetime-local"
              className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
            />
            {errors.end_date && (
              <p className="mt-1 text-sm text-error">{errors.end_date.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Submission Deadline
          </label>
          <input
            {...register('submission_deadline')}
            type="datetime-local"
            className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
          />
          {errors.submission_deadline && (
            <p className="mt-1 text-sm text-error">
              {errors.submission_deadline.message}
            </p>
          )}
        </div>
      </div>

      {/* Team Configuration */}
      <div className="space-y-4 border-b border-slate-200 pb-6">
        <h3 className="text-lg font-semibold text-slate-900">Team Configuration</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Minimum Team Size
            </label>
            <input
              {...register('min_team_size', { valueAsNumber: true })}
              type="number"
              min="1"
              className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
            />
            {errors.min_team_size && (
              <p className="mt-1 text-sm text-error">
                {errors.min_team_size.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Maximum Team Size
            </label>
            <input
              {...register('max_team_size', { valueAsNumber: true })}
              type="number"
              min="1"
              className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
            />
            {errors.max_team_size && (
              <p className="mt-1 text-sm text-error">
                {errors.max_team_size.message}
              </p>
            )}
          </div>
        </div>

        {minTeamSize > maxTeamSize && (
          <div className="rounded-lg bg-yellow-50 p-3 text-sm text-yellow-800">
            ⚠ Maximum team size must be greater than minimum
          </div>
        )}
      </div>

      {/* Challenge Theme */}
      <div className="space-y-4 border-b border-slate-200 pb-6">
        <h3 className="text-lg font-semibold text-slate-900">Challenge Details</h3>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Challenge Theme
          </label>
          <input
            {...register('theme')}
            type="text"
            placeholder="e.g., Smart IoT Solutions"
            className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-slate-600">Optional - helps teams understand the problem domain</p>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Requirements
          </label>
          <textarea
            {...register('requirements')}
            placeholder="Detailed requirements and expectations (one per line)..."
            rows={4}
            className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
          />
        </div>
      </div>

      {/* Status */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Stage Status
        </label>
        <select
          {...register('status')}
          className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
        >
          <option value="draft">Draft (Not visible to teams)</option>
          <option value="active">Active (Teams can register & submit)</option>
          <option value="closed">Closed (No new submissions)</option>
        </select>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={saveMutation.isPending || minTeamSize > maxTeamSize}
          className="rounded-lg bg-secondary-600 px-6 py-2 font-medium text-white hover:bg-secondary-700 disabled:opacity-50"
        >
          {saveMutation.isPending ? 'Saving...' : 'Save Stage'}
        </button>
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-lg border border-slate-300 px-6 py-2 font-medium text-slate-700 hover:bg-slate-50"
        >
          Reset
        </button>
      </div>

      {saveMutation.isSuccess && (
        <div className="rounded-lg bg-green-50 p-4 text-sm text-success">
          ✓ Stage saved successfully
        </div>
      )}
      {saveMutation.isError && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-error">
          ✗ Failed to save stage: {saveMutation.error?.message}
        </div>
      )}
    </form>
  );
}
