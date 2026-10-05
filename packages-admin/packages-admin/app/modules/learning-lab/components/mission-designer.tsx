'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { eventBus } from '@/lib/events';

const missionSchema = z.object({
  title: z.string().min(3, 'Title required'),
  description: z.string().min(10, 'Description required'),
  instructions: z.string().min(20, 'Instructions required'),
  learning_objectives: z.string().min(10, 'Objectives required'),
  difficulty: z.enum(['beginner', 'intermediate', 'advanced']),
  estimated_duration_minutes: z.number().int().min(10),
  language: z.enum(['blockly', 'python', 'cpp']),
  tinkercad_design_id: z.string().optional(),
  xp_reward: z.number().int().min(10).default(100),
  hints: z.array(z.string()).optional(),
  level_id: z.string().uuid('Must select a level'),
});

type MissionFormData = z.infer<typeof missionSchema>;

interface MissionDesignerProps {
  missionId?: string;
  onSuccess?: () => void;
}

export function MissionDesigner({ missionId, onSuccess }: MissionDesignerProps) {
  const [hints, setHints] = useState<string[]>([]);
  const [newHint, setNewHint] = useState('');
  const isEditing = !!missionId;

  // Fetch existing mission
  const { data: mission } = useQuery({
    queryKey: ['mission', missionId],
    queryFn: async () => {
      if (!missionId) return null;
      const { data } = await supabase
        .from('lab_missions')
        .select('*')
        .eq('id', missionId)
        .single();
      return data;
    },
    enabled: !!isEditing,
  });

  // Fetch levels
  const { data: levels } = useQuery({
    queryKey: ['levels'],
    queryFn: async () => {
      const { data } = await supabase
        .from('levels')
        .select('id, title')
        .order('order_index');
      return data || [];
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<MissionFormData>({
    resolver: zodResolver(missionSchema),
    defaultValues: mission || {
      title: '',
      description: '',
      instructions: '',
      learning_objectives: '',
      difficulty: 'intermediate',
      estimated_duration_minutes: 45,
      language: 'blockly',
      xp_reward: 100,
      level_id: '',
    },
  });

  // Save mission mutation
  const saveMutation = useMutation({
    mutationFn: async (data: MissionFormData) => {
      const missionData = {
        ...data,
        hints: hints.length > 0 ? hints : null,
        status: 'draft' as const,
      };

      if (isEditing) {
        const { error } = await supabase
          .from('lab_missions')
          .update(missionData)
          .eq('id', missionId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('lab_missions')
          .insert([missionData]);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      eventBus.emit('admin:content-saved', {
        module: 'learning-lab',
        contentType: 'mission',
        contentId: missionId || 'new',
      });
      onSuccess?.();
      reset();
      setHints([]);
    },
  });

  const onSubmit = async (data: MissionFormData) => {
    await saveMutation.mutateAsync(data);
  };

  const addHint = () => {
    if (newHint.trim()) {
      setHints([...hints, newHint]);
      setNewHint('');
    }
  };

  const removeHint = (index: number) => {
    setHints(hints.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-4xl">
      {/* Mission Metadata */}
      <div className="space-y-4 border-b border-slate-200 pb-6">
        <h3 className="text-lg font-semibold text-slate-900">Mission Information</h3>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Mission Title
          </label>
          <input
            {...register('title')}
            type="text"
            placeholder="e.g., Build a Smart Home System"
            className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
          />
          {errors.title && (
            <p className="mt-1 text-sm text-error">{errors.title.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Level
          </label>
          <select
            {...register('level_id')}
            className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
          >
            <option value="">Select a level</option>
            {levels?.map((level) => (
              <option key={level.id} value={level.id}>
                {level.title}
              </option>
            ))}
          </select>
          {errors.level_id && (
            <p className="mt-1 text-sm text-error">{errors.level_id.message}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Description
          </label>
          <textarea
            {...register('description')}
            placeholder="Brief overview of the mission..."
            rows={2}
            className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
          />
          {errors.description && (
            <p className="mt-1 text-sm text-error">{errors.description.message}</p>
          )}
        </div>
      </div>

      {/* Mission Configuration */}
      <div className="space-y-4 border-b border-slate-200 pb-6">
        <h3 className="text-lg font-semibold text-slate-900">Configuration</h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Difficulty Level
            </label>
            <select
              {...register('difficulty')}
              className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
            >
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Programming Language
            </label>
            <select
              {...register('language')}
              className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
            >
              <option value="blockly">Blockly</option>
              <option value="python">Python</option>
              <option value="cpp">C++</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Estimated Duration (minutes)
            </label>
            <input
              {...register('estimated_duration_minutes', { valueAsNumber: true })}
              type="number"
              min="10"
              className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
            />
            {errors.estimated_duration_minutes && (
              <p className="mt-1 text-sm text-error">
                {errors.estimated_duration_minutes.message}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              XP Reward
            </label>
            <input
              {...register('xp_reward', { valueAsNumber: true })}
              type="number"
              min="10"
              className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
            />
            {errors.xp_reward && (
              <p className="mt-1 text-sm text-error">{errors.xp_reward.message}</p>
            )}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            TinkerCAD Design ID (optional)
          </label>
          <input
            {...register('tinkercad_design_id')}
            type="text"
            placeholder="Paste TinkerCAD project ID here"
            className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
          />
          <p className="mt-1 text-xs text-slate-600">
            Students will see the embedded TinkerCAD project
          </p>
        </div>
      </div>

      {/* Learning Content */}
      <div className="space-y-4 border-b border-slate-200 pb-6">
        <h3 className="text-lg font-semibold text-slate-900">Learning Content</h3>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Learning Objectives
          </label>
          <textarea
            {...register('learning_objectives')}
            placeholder="What will students learn? (one per line)"
            rows={3}
            className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
          />
          {errors.learning_objectives && (
            <p className="mt-1 text-sm text-error">
              {errors.learning_objectives.message}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Instructions
          </label>
          <textarea
            {...register('instructions')}
            placeholder="Step-by-step instructions for completing the mission..."
            rows={5}
            className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
          />
          {errors.instructions && (
            <p className="mt-1 text-sm text-error">{errors.instructions.message}</p>
          )}
        </div>
      </div>

      {/* Hints Section */}
      <div className="space-y-4">
        <h3 className="text-lg font-semibold text-slate-900">Hints</h3>

        <div className="p-4 bg-slate-50 rounded-lg space-y-3">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Add Hint
            </label>
            <div className="flex gap-2">
              <textarea
                value={newHint}
                onChange={(e) => setNewHint(e.target.value)}
                placeholder="Add a helpful hint for students..."
                rows={2}
                className="flex-1 rounded-lg border border-slate-200 px-3 py-2 text-sm"
              />
              <button
                type="button"
                onClick={addHint}
                className="rounded-lg bg-primary-100 px-4 py-2 font-medium text-primary-600 hover:bg-primary-200"
              >
                Add
              </button>
            </div>
          </div>

          {hints.length > 0 && (
            <div className="space-y-2">
              <p className="text-sm font-medium text-slate-700">Hints ({hints.length})</p>
              {hints.map((hint, idx) => (
                <div
                  key={idx}
                  className="flex items-start justify-between gap-3 p-3 bg-white rounded border border-slate-200"
                >
                  <div className="flex-1">
                    <p className="text-sm text-slate-900">
                      <span className="font-medium text-slate-600">Hint {idx + 1}:</span> {hint}
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeHint(idx)}
                    className="text-error hover:text-red-700 font-medium text-sm whitespace-nowrap"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={saveMutation.isPending}
          className="rounded-lg bg-primary-600 px-6 py-2 font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {saveMutation.isPending ? 'Saving...' : 'Save Mission'}
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
          ✓ Mission saved successfully with {hints.length} hint(s)
        </div>
      )}
      {saveMutation.isError && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-error">
          ✗ Failed to save mission
        </div>
      )}
    </form>
  );
}
