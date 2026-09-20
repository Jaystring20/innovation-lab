'use client';

import React, { useState, useEffect } from 'react';
import { useUpdateAssessment } from '../hooks';
import type { Assessment, AssessmentQuestion } from '../types';

interface QuizBuilderProps {
  assessment: Assessment;
  onSave?: (assessment: Assessment) => void;
  onCancel?: () => void;
}

export const QuizBuilder: React.FC<QuizBuilderProps> = ({
  assessment,
  onSave,
  onCancel,
}) => {
  const { updateAssessment, loading, error } = useUpdateAssessment();
  const [formData, setFormData] = useState<Partial<Assessment>>(assessment);
  const [questions, setQuestions] = useState<AssessmentQuestion[]>(
    assessment.questions || []
  );
  const [isDirty, setIsDirty] = useState(false);
  const [newQuestion, setNewQuestion] = useState<Partial<AssessmentQuestion> | null>(null);

  useEffect(() => {
    setFormData(assessment);
    setQuestions(assessment.questions || []);
    setIsDirty(false);
  }, [assessment]);

  const handleAssessmentChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'passing_score_pct' ? parseInt(value, 10) : value,
    }));
    setIsDirty(true);
  };

  const handleAddQuestion = () => {
    const question: AssessmentQuestion = {
      assessment_id: assessment.id,
      question_type: 'multiple_choice',
      question_text: '',
      options: [],
      explanation: '',
      order_index: questions.length + 1,
      status: 'draft',
    };
    setNewQuestion(question);
  };

  const handleSaveQuestion = () => {
    if (!newQuestion?.question_text) {
      alert('Please enter a question');
      return;
    }
    setQuestions((prev) => [
      ...prev,
      {
        ...newQuestion,
        order_index: prev.length + 1,
      } as AssessmentQuestion,
    ]);
    setNewQuestion(null);
    setIsDirty(true);
  };

  const handleDeleteQuestion = (index: number) => {
    setQuestions((prev) => prev.filter((_, i) => i !== index));
    setIsDirty(true);
  };

  const handleSave = async () => {
    try {
      const updated = await updateAssessment(assessment.id, {
        ...formData,
        questions,
      });
      setIsDirty(false);
      onSave?.(updated);
    } catch (err) {
      console.error('Failed to save assessment:', err);
    }
  };

  return (
    <div className="space-y-6 bg-white p-6 rounded-lg shadow">
      <div className="border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-900">Edit Assessment</h2>
        <p className="text-sm text-gray-500 mt-1">
          {assessment.status === 'draft' ? '✏️ Draft' : '🔒 Published'}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          {error}
        </div>
      )}

      {/* Assessment Details */}
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Assessment Title
          </label>
          <input
            type="text"
            name="title"
            value={formData.title || ''}
            onChange={handleAssessmentChange}
            placeholder="e.g., Motors & Movement Quiz"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            disabled={assessment.status === 'published'}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Passing Score (%)
          </label>
          <input
            type="number"
            name="passing_score_pct"
            value={formData.passing_score_pct || 70}
            onChange={handleAssessmentChange}
            min="0"
            max="100"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            disabled={assessment.status === 'published'}
          />
        </div>
      </div>

      {/* Questions */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <h3 className="text-lg font-semibold text-gray-900">
            Questions ({questions.length})
          </h3>
          {assessment.status === 'draft' && (
            <button
              onClick={handleAddQuestion}
              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition text-sm"
            >
              + Add Question
            </button>
          )}
        </div>

        {/* Questions List */}
        <div className="space-y-3 max-h-96 overflow-y-auto">
          {questions.map((q, idx) => (
            <div key={idx} className="border rounded p-3 bg-gray-50">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p className="font-medium text-sm">{q.question_text}</p>
                  <p className="text-xs text-gray-500 mt-1">
                    Type: {q.question_type} • Order: {q.order_index}
                  </p>
                </div>
                {assessment.status === 'draft' && (
                  <button
                    onClick={() => handleDeleteQuestion(idx)}
                    className="text-red-600 hover:text-red-800 text-sm ml-2"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        {/* New Question Form */}
        {newQuestion && (
          <div className="border-2 border-blue-300 rounded p-4 bg-blue-50 space-y-3">
            <h4 className="font-semibold text-gray-900">New Question</h4>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Question Text
              </label>
              <textarea
                value={newQuestion.question_text || ''}
                onChange={(e) =>
                  setNewQuestion((prev) => ({
                    ...prev!,
                    question_text: e.target.value,
                  }))
                }
                placeholder="Enter question"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Question Type
              </label>
              <select
                value={newQuestion.question_type || 'multiple_choice'}
                onChange={(e) =>
                  setNewQuestion((prev) => ({
                    ...prev!,
                    question_type: e.target.value as any,
                  }))
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                <option value="multiple_choice">Multiple Choice</option>
                <option value="true_false">True/False</option>
                <option value="image_select">Image Select</option>
                <option value="drag_order">Drag & Order</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Explanation
              </label>
              <textarea
                value={newQuestion.explanation || ''}
                onChange={(e) =>
                  setNewQuestion((prev) => ({
                    ...prev!,
                    explanation: e.target.value,
                  }))
                }
                placeholder="Why is this the correct answer?"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div className="flex gap-2 justify-end">
              <button
                onClick={() => setNewQuestion(null)}
                className="px-3 py-1 text-gray-700 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveQuestion}
                className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Save Question
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="flex gap-3 justify-end border-t pt-4">
        <button
          onClick={onCancel}
          className="px-4 py-2 text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 transition"
          disabled={loading}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={!isDirty || loading || assessment.status === 'published'}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : 'Save Assessment'}
        </button>
      </div>
    </div>
  );
};
