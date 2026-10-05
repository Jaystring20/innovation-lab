'use client';

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { eventBus } from '@/lib/events';

const questionSchema = z.object({
  question_text: z.string().min(5, 'Question must be at least 5 characters'),
  question_type: z.enum(['multiple_choice', 'true_false', 'image_select', 'drag_order']),
  options: z.array(z.string()).min(2, 'At least 2 options required'),
  correct_answer_index: z.number().int().min(0),
  explanation: z.string().optional(),
  points: z.number().int().min(1).default(1),
});

const quizSchema = z.object({
  title: z.string().min(3, 'Title required'),
  description: z.string().optional(),
  level_id: z.string().uuid('Must select a level'),
  passing_score: z.number().int().min(50).max(100).default(70),
  time_limit_minutes: z.number().int().min(1).optional(),
  questions: z.array(questionSchema).min(1, 'At least one question required'),
});

type QuizFormData = z.infer<typeof quizSchema>;
type QuestionData = z.infer<typeof questionSchema>;

interface QuizBuilderProps {
  assessmentId?: string;
  onSuccess?: () => void;
}

export function QuizBuilder({ assessmentId, onSuccess }: QuizBuilderProps) {
  const [questions, setQuestions] = useState<QuestionData[]>([
    {
      question_text: '',
      question_type: 'multiple_choice',
      options: ['', '', ''],
      correct_answer_index: 0,
      points: 1,
    },
  ]);

  const isEditing = !!assessmentId;

  // Fetch existing quiz
  const { data: assessment } = useQuery({
    queryKey: ['assessment', assessmentId],
    queryFn: async () => {
      if (!assessmentId) return null;
      const { data } = await supabase
        .from('assessments')
        .select('*, assessment_questions(*)')
        .eq('id', assessmentId)
        .single();
      return data;
    },
    enabled: !!assessmentId,
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
    watch,
  } = useForm<QuizFormData>({
    resolver: zodResolver(quizSchema),
    defaultValues: {
      title: assessment?.title || '',
      description: assessment?.description || '',
      level_id: assessment?.level_id || '',
      passing_score: assessment?.passing_score || 70,
      time_limit_minutes: assessment?.time_limit_minutes,
      questions,
    },
  });

  const passingScore = watch('passing_score');

  // Save assessment mutation
  const saveMutation = useMutation({
    mutationFn: async (data: QuizFormData) => {
      const assessmentData = {
        title: data.title,
        description: data.description,
        level_id: data.level_id,
        passing_score: data.passing_score,
        time_limit_minutes: data.time_limit_minutes,
        status: 'draft' as const,
      };

      if (isEditing) {
        const { error } = await supabase
          .from('assessments')
          .update(assessmentData)
          .eq('id', assessmentId);
        if (error) throw error;
      } else {
        const { data: newAssessment, error } = await supabase
          .from('assessments')
          .insert([assessmentData])
          .select()
          .single();
        if (error) throw error;

        // Save questions
        if (data.questions.length > 0) {
          const { error: qError } = await supabase
            .from('assessment_questions')
            .insert(
              data.questions.map((q, idx) => ({
                ...q,
                assessment_id: newAssessment.id,
                order_index: idx,
              }))
            );
          if (qError) throw qError;
        }
      }
    },
    onSuccess: () => {
      eventBus.emit('admin:content-saved', {
        module: 'learning-lab',
        contentType: 'assessment',
        contentId: assessmentId || 'new',
      });
      onSuccess?.();
    },
  });

  const onSubmit = async (data: QuizFormData) => {
    await saveMutation.mutateAsync({ ...data, questions });
  };

  const addQuestion = () => {
    setQuestions([
      ...questions,
      {
        question_text: '',
        question_type: 'multiple_choice',
        options: ['', '', ''],
        correct_answer_index: 0,
        points: 1,
      },
    ]);
  };

  const removeQuestion = (index: number) => {
    setQuestions(questions.filter((_, i) => i !== index));
  };

  const updateQuestion = (index: number, updates: Partial<QuestionData>) => {
    const updated = [...questions];
    updated[index] = { ...updated[index], ...updates };
    setQuestions(updated);
  };

  const addOption = (questionIdx: number) => {
    updateQuestion(questionIdx, {
      options: [...questions[questionIdx].options, ''],
    });
  };

  const removeOption = (questionIdx: number, optionIdx: number) => {
    const newOptions = questions[questionIdx].options.filter(
      (_, i) => i !== optionIdx
    );
    updateQuestion(questionIdx, { options: newOptions });
  };

  const updateOption = (questionIdx: number, optionIdx: number, text: string) => {
    const newOptions = [...questions[questionIdx].options];
    newOptions[optionIdx] = text;
    updateQuestion(questionIdx, { options: newOptions });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-8 max-w-4xl">
      {/* Quiz Metadata */}
      <div className="space-y-4 border-b border-slate-200 pb-6">
        <h3 className="text-lg font-semibold text-slate-900">Quiz Information</h3>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Quiz Title
          </label>
          <input
            {...register('title')}
            type="text"
            placeholder="e.g., Circuit Design Quiz"
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

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Passing Score (%)
            </label>
            <div className="flex items-center gap-2">
              <input
                {...register('passing_score', { valueAsNumber: true })}
                type="range"
                min="50"
                max="100"
                className="flex-1"
              />
              <span className="w-12 text-center font-semibold text-slate-900">
                {passingScore}%
              </span>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Time Limit (minutes, optional)
            </label>
            <input
              {...register('time_limit_minutes', { valueAsNumber: true })}
              type="number"
              min="1"
              placeholder="No limit"
              className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Description
          </label>
          <textarea
            {...register('description')}
            placeholder="Quiz description and instructions..."
            rows={2}
            className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
          />
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-900">Questions</h3>
          <span className="text-sm text-slate-600">{questions.length} question(s)</span>
        </div>

        {questions.map((question, qIdx) => (
          <div key={qIdx} className="p-6 border border-slate-200 rounded-lg space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-slate-900">Question {qIdx + 1}</h4>
              {questions.length > 1 && (
                <button
                  type="button"
                  onClick={() => removeQuestion(qIdx)}
                  className="text-error hover:text-red-700 text-sm font-medium"
                >
                  Remove
                </button>
              )}
            </div>

            {/* Question Text */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Question Text
              </label>
              <textarea
                value={question.question_text}
                onChange={(e) =>
                  updateQuestion(qIdx, { question_text: e.target.value })
                }
                placeholder="Enter question..."
                rows={2}
                className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
              />
            </div>

            {/* Question Type */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Question Type
                </label>
                <select
                  value={question.question_type}
                  onChange={(e) =>
                    updateQuestion(qIdx, {
                      question_type: e.target.value as QuestionData['question_type'],
                    })
                  }
                  className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
                >
                  <option value="multiple_choice">Multiple Choice</option>
                  <option value="true_false">True/False</option>
                  <option value="image_select">Image Select</option>
                  <option value="drag_order">Drag & Order</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Points
                </label>
                <input
                  type="number"
                  min="1"
                  value={question.points}
                  onChange={(e) =>
                    updateQuestion(qIdx, { points: parseInt(e.target.value) })
                  }
                  className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
                />
              </div>
            </div>

            {/* Options */}
            {question.question_type !== 'true_false' && (
              <div className="space-y-3">
                <label className="block text-sm font-medium text-slate-700">
                  Options
                </label>
                {question.options.map((option, oIdx) => (
                  <div key={oIdx} className="flex gap-2">
                    <input
                      type="radio"
                      name={`correct-${qIdx}`}
                      checked={question.correct_answer_index === oIdx}
                      onChange={() =>
                        updateQuestion(qIdx, { correct_answer_index: oIdx })
                      }
                      className="mt-2"
                    />
                    <input
                      type="text"
                      value={option}
                      onChange={(e) => updateOption(qIdx, oIdx, e.target.value)}
                      placeholder={`Option ${oIdx + 1}`}
                      className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm"
                    />
                    {question.options.length > 2 && (
                      <button
                        type="button"
                        onClick={() => removeOption(qIdx, oIdx)}
                        className="text-error hover:text-red-700 font-medium"
                      >
                        ✕
                      </button>
                    )}
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => addOption(qIdx)}
                  className="text-sm text-primary-600 hover:text-primary-700 font-medium"
                >
                  + Add Option
                </button>
              </div>
            )}

            {/* Explanation */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-2">
                Explanation (optional)
              </label>
              <textarea
                value={question.explanation || ''}
                onChange={(e) => updateQuestion(qIdx, { explanation: e.target.value })}
                placeholder="Explain why the correct answer is right..."
                rows={2}
                className="w-full rounded-lg border border-slate-200 px-4 py-2 text-sm"
              />
            </div>
          </div>
        ))}

        <button
          type="button"
          onClick={addQuestion}
          className="w-full rounded-lg border-2 border-dashed border-primary-300 py-3 font-medium text-primary-600 hover:bg-primary-50 transition-colors"
        >
          + Add Question
        </button>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4">
        <button
          type="submit"
          disabled={saveMutation.isPending}
          className="rounded-lg bg-primary-600 px-6 py-2 font-medium text-white hover:bg-primary-700 disabled:opacity-50"
        >
          {saveMutation.isPending ? 'Saving...' : 'Save Assessment'}
        </button>
      </div>

      {saveMutation.isSuccess && (
        <div className="rounded-lg bg-green-50 p-4 text-sm text-success">
          ✓ Assessment saved successfully
        </div>
      )}
      {saveMutation.isError && (
        <div className="rounded-lg bg-red-50 p-4 text-sm text-error">
          ✗ Failed to save assessment
        </div>
      )}
    </form>
  );
}
