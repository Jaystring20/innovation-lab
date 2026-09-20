'use client';

import React, { useState, useEffect } from 'react';
import { useUpdateLevel } from '../hooks';
import type { Level } from '../types';

interface LevelEditorProps {
  level: Level;
  onSave?: (level: Level) => void;
  onCancel?: () => void;
}

export const LevelEditor: React.FC<LevelEditorProps> = ({
  level,
  onSave,
  onCancel,
}) => {
  const { updateLevel, loading, error } = useUpdateLevel();
  const [formData, setFormData] = useState<Partial<Level>>(level);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setFormData(level);
    setIsDirty(false);
  }, [level]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: name === 'order_index' ? parseInt(value, 10) : value,
    }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    try {
      const updated = await updateLevel(level.id, formData);
      setIsDirty(false);
      onSave?.(updated);
    } catch (err) {
      console.error('Failed to save level:', err);
    }
  };

  return (
    <div className="space-y-6 bg-white p-6 rounded-lg shadow">
      <div className="border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-900">Edit Level</h2>
        <p className="text-sm text-gray-500 mt-1">
          {level.status === 'draft' ? '✏️ Draft' : '🔒 Published'}
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {/* Title */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Level Title
          </label>
          <input
            type="text"
            name="title"
            value={formData.title || ''}
            onChange={handleChange}
            placeholder="e.g., Motors & Movement"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            disabled={level.status === 'published'}
          />
        </div>

        {/* Order Index */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Order Index
          </label>
          <input
            type="number"
            name="order_index"
            value={formData.order_index || 1}
            onChange={handleChange}
            min="1"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            disabled={level.status === 'published'}
          />
        </div>

        {/* Outcome Statement */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Outcome Statement
          </label>
          <textarea
            name="outcome_statement"
            value={formData.outcome_statement || ''}
            onChange={handleChange}
            placeholder="What will students be able to do after completing this level?"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            disabled={level.status === 'published'}
          />
          <p className="text-xs text-gray-500 mt-1">
            Pedagogical objective for this level
          </p>
        </div>

        {/* Metadata */}
        <div className="grid grid-cols-2 gap-4 bg-gray-50 p-4 rounded">
          <div>
            <p className="text-sm text-gray-600">Status</p>
            <p className="font-semibold">
              {formData.status === 'draft' ? 'Draft' : 'Published'}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Version</p>
            <p className="font-semibold">{formData.version}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Created</p>
            <p className="font-semibold text-xs">
              {new Date(formData.created_at || '').toLocaleDateString()}
            </p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Last Edited</p>
            <p className="font-semibold text-xs">
              {formData.last_edited_at
                ? new Date(formData.last_edited_at).toLocaleDateString()
                : 'N/A'}
            </p>
          </div>
        </div>
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
          disabled={!isDirty || loading || level.status === 'published'}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </div>
  );
};
