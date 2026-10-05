'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { eventBus } from '@/lib/events';

const levelSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  order_index: z.number().int().min(1, 'Order must be positive'),
  outcome_statement: z.string().min(10, 'Outcome statement must be detailed'),
  tier_id: z.string().uuid('Must select a tier'),
  stage_id: z.string().uuid('Must select a stage'),
});

type LevelFormData = z.infer<typeof levelSchema>;

interface LevelEditorProps {
  levelId?: string;
  onSuccess?: () => void;
}

export function LevelEditor({ levelId, onSuccess }: LevelEditorProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const isEditing = !!levelId;

  // Fetch existing level if editing
  const { data: level } = useQuery({
    queryKey: ['level', levelId],
    queryFn: async () => {
      if (!levelId) return null;
      const { data } = await supabase
        .from('levels')
        .select('*')
        .eq('id', levelId)
        .single();
      return data;
    },
    enabled: !!levelId,
  });

  // Fetch tiers and stages for dropdowns
  const { data: tiers } = useQuery({
    queryKey: ['tiers'],
    queryFn: async () => {
      const { data } = await supabase
        .from('tiers')
        .select('id, name')
        .order('name');
      return data || [];
    },
  });

  const { data: stages } = useQuery({
    queryKey: ['stages'],
    queryFn: async () => {
      const { data } = await supabase
        .from('stages')
        .select('id, name')
        .order('name');
      return data || [];
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<LevelFormData>({
    resolver: zodResolver(levelSchema),
    defaultValues: level || {
      title: '',
      order_index: 1,
      outcome_statement: '',
      tier_id: '',
      stage_id: '',
    },
  });

  // Save level mutation
  const saveMutation = useMutation({
    mutationFn: async (data: LevelFormData) => {
      if (isEditing) {
        const { error } = await supabase
          .from('levels')
          .update(data)
          .eq('id', levelId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('levels')
          .insert([{ ...data, status: 'draft' }]);
        if (error) throw error;
      }
    },
    onSuccess: async () => {
      eventBus.emit('admin:content-saved', {
        module: 'learning-lab',
        contentType: 'level',
        contentId: levelId || 'new',
      });
      onSuccess?.();
      reset();
    },
    onError: (error) => {
      console.error('Failed to save level:', error);
    },
  });

  const onSubmit = async (data: LevelFormData) => {
    setIsSubmitting(true);
    try {
      await saveMutation.mutateAsync(data);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-2xl">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Level Title
        </label>
        <input
          {...register('title')}
          type="text"
          placeholder="e.g., Introduction to Robotics"
          className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
        />
        {errors.title && (
          <p className="mt-1 text-sm text-error">{errors.title.message}</p>
        )}
      </div>

      {/* Tier Selection */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Tier
        </label>
        <select
          {...register('tier_id')}
          className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
        >
          <option value="">Select a tier</option>
          {tiers?.map((tier) => (
            <option key={tier.id} value={tier.id}>
              {tier.name}
            </option>
          ))}
        </select>
        {errors.tier_id && (
          <p className="mt-1 text-sm text-error">{errors.tier_id.message}</p>
        )}
      </div>

      {/* Stage Selection */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Stage
        </label>
        <select
          {...register('stage_id')}
          className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
        >
          <option value="">Select a stage</option>
          {stages?.map((stage) => (
            <option key={stage.id} value={stage.id}>
              {stage.name}
            </option>
          ))}
        </select>
        {errors.stage_id && (
          <p className="mt-1 text-sm text-error">{errors.stage_id.message}</p>
        )}
      </div>

      {/* Order Index */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Order Index
        </label>
        <input
          {...register('order_index', { valueAsNumber: true })}
          type="number"
          min="1"
          className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
        />
        {errors.order_index && (
          <p className="mt-1 text-sm text-error">{errors.order_index.message}</p>
        )}
      </div>

      {/* Outcome Statement */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Learning Outcome Statement
        </label>
        <textarea
          {...register('outcome_statement')}
          placeholder="Describe what students will be able to do after completing this level..."
          rows={4}
          className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
        />
        {errors.outcome_statement && (
          <p className="mt-1 text-sm text-error">
            {errors.outcome_statement.message}
          </p>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={isSubmitting || saveMutation.isPending}
          className="rounded-lg bg-primary-600 px-6 py-2 font-medium text-white hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          {isSubmitting || saveMutation.isPending ? 'Saving...' : 'Save Level'}
        </button>
        <button
          type="button"
          onClick={() => reset()}
          className="rounded-lg border border-slate-300 px-6 py-2 font-medium text-slate-700 hover:bg-slate-50 transition-colors"
        >
          Reset
        </button>
      </div>

      {/* Success/Error Messages */}
      {saveMutation.isSuccess && (
        <div className="rounded-lg bg-green-50 p-4 text-sm text-success">
          ✓ Level saved successfully
        </div>
      )}
      {saveMutation.isError && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-error">
          ✗ Failed to save level. Please try again.
        </div>
      )}
    </form>
  );
}
