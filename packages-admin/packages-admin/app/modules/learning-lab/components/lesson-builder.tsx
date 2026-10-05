'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { eventBus } from '@/lib/events';

const assetSchema = z.object({
  url: z.string().url('Must be a valid URL'),
  asset_type: z.enum(['video', 'pdf', 'image', 'document', 'slide', 'audio', 'interactive', 'link']),
  title: z.string().min(1, 'Asset title required'),
});

const lessonSchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description is required'),
  content: z.string().min(20, 'Content must be detailed'),
  learning_objectives: z.string().min(10, 'Learning objectives required'),
  duration_minutes: z.number().int().min(5, 'Duration must be at least 5 minutes'),
  level_id: z.string().uuid('Must select a level'),
  assets: z.array(assetSchema).optional(),
});

type LessonFormData = z.infer<typeof lessonSchema>;

interface LessonBuilderProps {
  lessonId?: string;
  onSuccess?: () => void;
}

export function LessonBuilder({ lessonId, onSuccess }: LessonBuilderProps) {
  const [assets, setAssets] = useState<z.infer<typeof assetSchema>[]>([]);
  const [newAsset, setNewAsset] = useState<z.infer<typeof assetSchema>>({
    url: '',
    asset_type: 'video',
    title: '',
  });
  const isEditing = !!lessonId;

  // Fetch existing lesson
  const { data: lesson } = useQuery({
    queryKey: ['lesson', lessonId],
    queryFn: async () => {
      if (!lessonId) return null;
      const { data } = await supabase
        .from('lessons')
        .select('*, lesson_assets(*)')
        .eq('id', lessonId)
        .single();
      return data;
    },
    enabled: !!lessonId,
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
  } = useForm<LessonFormData>({
    resolver: zodResolver(lessonSchema),
    defaultValues: lesson || {
      title: '',
      description: '',
      content: '',
      learning_objectives: '',
      duration_minutes: 30,
      level_id: '',
      assets: [],
    },
  });

  // Save lesson mutation
  const saveMutation = useMutation({
    mutationFn: async (data: LessonFormData) => {
      const lessonData = {
        title: data.title,
        description: data.description,
        content: data.content,
        learning_objectives: data.learning_objectives,
        duration_minutes: data.duration_minutes,
        level_id: data.level_id,
        status: 'draft' as const,
      };

      if (isEditing) {
        const { error } = await supabase
          .from('lessons')
          .update(lessonData)
          .eq('id', lessonId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('lessons')
          .insert([lessonData]);
        if (error) throw error;
      }

      // Save assets
      if (assets.length > 0) {
        const { error: assetError } = await supabase
          .from('lesson_assets')
          .insert(
            assets.map((asset) => ({
              ...asset,
              lesson_id: lessonId,
            }))
          );
        if (assetError) throw assetError;
      }
    },
    onSuccess: () => {
      eventBus.emit('admin:content-saved', {
        module: 'learning-lab',
        contentType: 'lesson',
        contentId: lessonId || 'new',
      });
      onSuccess?.();
      reset();
      setAssets([]);
    },
  });

  const onSubmit = async (data: LessonFormData) => {
    await saveMutation.mutateAsync(data);
  };

  const addAsset = () => {
    if (newAsset.url && newAsset.title) {
      setAssets([...assets, { ...newAsset }]);
      setNewAsset({ url: '', asset_type: 'video', title: '' });
    }
  };

  const removeAsset = (index: number) => {
    setAssets(assets.filter((_, i) => i !== index));
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 max-w-3xl">
      {/* Title */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Lesson Title
        </label>
        <input
          {...register('title')}
          type="text"
          placeholder="e.g., Fundamentals of Circuit Design"
          className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
        />
        {errors.title && (
          <p className="mt-1 text-sm text-error">{errors.title.message}</p>
        )}
      </div>

      {/* Level Selection */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Level
        </label>
        <select
          {...register('level_id')}
          className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
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

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Description
        </label>
        <textarea
          {...register('description')}
          placeholder="Brief overview of the lesson..."
          rows={2}
          className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
        />
        {errors.description && (
          <p className="mt-1 text-sm text-error">{errors.description.message}</p>
        )}
      </div>

      {/* Content */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Lesson Content
        </label>
        <textarea
          {...register('content')}
          placeholder="Detailed lesson content and explanations..."
          rows={6}
          className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
        />
        {errors.content && (
          <p className="mt-1 text-sm text-error">{errors.content.message}</p>
        )}
      </div>

      {/* Learning Objectives */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Learning Objectives
        </label>
        <textarea
          {...register('learning_objectives')}
          placeholder="What students will learn from this lesson (one per line)..."
          rows={3}
          className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
        />
        {errors.learning_objectives && (
          <p className="mt-1 text-sm text-error">
            {errors.learning_objectives.message}
          </p>
        )}
      </div>

      {/* Duration */}
      <div>
        <label className="block text-sm font-medium text-slate-700 mb-2">
          Duration (minutes)
        </label>
        <input
          {...register('duration_minutes', { valueAsNumber: true })}
          type="number"
          min="5"
          className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm focus:border-primary-500 focus:outline-none focus:ring-2 focus:ring-primary-100"
        />
        {errors.duration_minutes && (
          <p className="mt-1 text-sm text-error">
            {errors.duration_minutes.message}
          </p>
        )}
      </div>

      {/* Assets Section */}
      <div className="border-t border-slate-200 pt-6">
        <h4 className="font-semibold text-slate-900 mb-4">Lesson Assets</h4>

        {/* Add Asset Form */}
        <div className="space-y-3 mb-4 p-4 bg-slate-50 rounded-lg">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Asset Title
            </label>
            <input
              type="text"
              value={newAsset.title}
              onChange={(e) => setNewAsset({ ...newAsset, title: e.target.value })}
              placeholder="e.g., Introduction Video"
              className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Asset Type
            </label>
            <select
              value={newAsset.asset_type}
              onChange={(e) =>
                setNewAsset({
                  ...newAsset,
                  asset_type: e.target.value as typeof newAsset.asset_type,
                })
              }
              className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
            >
              <option value="video">Video</option>
              <option value="pdf">PDF</option>
              <option value="image">Image</option>
              <option value="document">Document</option>
              <option value="slide">Presentation</option>
              <option value="audio">Audio</option>
              <option value="interactive">Interactive</option>
              <option value="link">Link</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Asset URL
            </label>
            <input
              type="url"
              value={newAsset.url}
              onChange={(e) => setNewAsset({ ...newAsset, url: e.target.value })}
              placeholder="https://example.com/asset"
              className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
            />
          </div>

          <button
            type="button"
            onClick={addAsset}
            className="w-full rounded-lg bg-primary-100 px-4 py-2 font-medium text-primary-600 hover:bg-primary-200 transition-colors"
          >
            + Add Asset
          </button>
        </div>

        {/* Assets List */}
        {assets.length > 0 && (
          <div className="space-y-2">
            {assets.map((asset, idx) => (
              <div key={idx} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                <div>
                  <p className="font-medium text-slate-900">{asset.title}</p>
                  <p className="text-xs text-slate-600">
                    {asset.asset_type} • <a href={asset.url} target="_blank" rel="noopener noreferrer" className="text-primary-600 hover:underline">View</a>
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => removeAsset(idx)}
                  className="text-error hover:text-red-700 font-medium text-sm"
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={saveMutation.isPending}
          className="rounded-lg bg-primary-600 px-6 py-2 font-medium text-white hover:bg-primary-700 disabled:opacity-50 transition-colors"
        >
          {saveMutation.isPending ? 'Saving...' : 'Save Lesson'}
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
          ✓ Lesson saved successfully
        </div>
      )}
      {saveMutation.isError && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-error">
          ✗ Failed to save lesson
        </div>
      )}
    </form>
  );
}
