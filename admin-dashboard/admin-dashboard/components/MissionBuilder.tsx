'use client';

import React, { useState, useEffect } from 'react';
import { useUpdateMission } from '../hooks';
import type { LabMission } from '../types';

interface MissionBuilderProps {
  mission: LabMission;
  onSave?: (mission: LabMission) => void;
  onCancel?: () => void;
}

export const MissionBuilder: React.FC<MissionBuilderProps> = ({
  mission,
  onSave,
  onCancel,
}) => {
  const { updateMission, loading, error } = useUpdateMission();
  const [formData, setFormData] = useState<Partial<LabMission>>(mission);
  const [isDirty, setIsDirty] = useState(false);

  useEffect(() => {
    setFormData(mission);
    setIsDirty(false);
  }, [mission]);

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;
    const numericFields = ['duration_minutes', 'xp_reward'];
    setFormData((prev) => ({
      ...prev,
      [name]: numericFields.includes(name) ? parseInt(value, 10) : value,
    }));
    setIsDirty(true);
  };

  const handleArrayChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
    field: 'learning_objectives' | 'hints'
  ) => {
    const lines = e.target.value.split('\n').filter((line) => line.trim());
    setFormData((prev) => ({
      ...prev,
      [field]: lines,
    }));
    setIsDirty(true);
  };

  const handleSave = async () => {
    try {
      const updated = await updateMission(mission.id, formData);
      setIsDirty(false);
      onSave?.(updated);
    } catch (err) {
      console.error('Failed to save mission:', err);
    }
  };

  return (
    <div className="space-y-6 bg-white p-6 rounded-lg shadow">
      <div className="border-b pb-4">
        <h2 className="text-2xl font-bold text-gray-900">Edit Mission</h2>
        <p className="text-sm text-gray-500 mt-1">
          {mission.status === 'draft' ? '✏️ Draft' : '🔒 Published'}
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
            Mission Title
          </label>
          <input
            type="text"
            name="title"
            value={formData.title || ''}
            onChange={handleChange}
            placeholder="e.g., First Drive"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            disabled={mission.status === 'published'}
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            name="description"
            value={formData.description || ''}
            onChange={handleChange}
            placeholder="What will students do?"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            disabled={mission.status === 'published'}
          />
        </div>

        {/* Instructions */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Instructions
          </label>
          <textarea
            name="instructions"
            value={formData.instructions || ''}
            onChange={handleChange}
            placeholder="Step-by-step instructions for the mission"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            disabled={mission.status === 'published'}
          />
        </div>

        {/* Difficulty & Duration */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Difficulty
            </label>
            <select
              name="difficulty"
              value={formData.difficulty || 'Basic'}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              disabled={mission.status === 'published'}
            >
              <option>Basic</option>
              <option>Intermediate</option>
              <option>Advanced</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Duration (minutes)
            </label>
            <input
              type="number"
              name="duration_minutes"
              value={formData.duration_minutes || 30}
              onChange={handleChange}
              min="1"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={mission.status === 'published'}
            />
          </div>
        </div>

        {/* Language & TinkerCAD */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Language
            </label>
            <select
              name="language"
              value={formData.language || 'blockly'}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm"
              disabled={mission.status === 'published'}
            >
              <option value="blockly">Blockly</option>
              <option value="python">Python</option>
              <option value="cpp">C++</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              TinkerCAD Design ID
            </label>
            <input
              type="text"
              name="tinkercad_design_id"
              value={formData.tinkercad_design_id || ''}
              onChange={handleChange}
              placeholder="e.g., STEAM-primary-basic-chassis"
              className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              disabled={mission.status === 'published'}
            />
          </div>
        </div>

        {/* XP Reward */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            XP Reward
          </label>
          <input
            type="number"
            name="xp_reward"
            value={formData.xp_reward || 100}
            onChange={handleChange}
            min="0"
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            disabled={mission.status === 'published'}
          />
        </div>

        {/* Learning Objectives */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Learning Objectives (one per line)
          </label>
          <textarea
            value={(formData.learning_objectives || []).join('\n')}
            onChange={(e) => handleArrayChange(e, 'learning_objectives')}
            placeholder="First learning objective&#10;Second learning objective&#10;Third learning objective"
            rows={4}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            disabled={mission.status === 'published'}
          />
        </div>

        {/* Hints */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Hints (one per line)
          </label>
          <textarea
            value={(formData.hints || []).join('\n')}
            onChange={(e) => handleArrayChange(e, 'hints')}
            placeholder="Hint 1&#10;Hint 2&#10;Hint 3"
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            disabled={mission.status === 'published'}
          />
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
          disabled={!isDirty || loading || mission.status === 'published'}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : 'Save Mission'}
        </button>
      </div>
    </div>
  );
};
