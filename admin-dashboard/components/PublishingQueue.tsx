'use client';

import React, { useState, useEffect } from 'react';
import { usePublishContent, useLevels } from '../hooks';
import type { Level } from '../types';

interface PublishingQueueProps {
  tierId: string;
}

export const PublishingQueue: React.FC<PublishingQueueProps> = ({ tierId }) => {
  const { levels, fetchLevels } = useLevels(tierId);
  const { publishLevel, loading, error } = usePublishContent();
  const [selectedForPublish, setSelectedForPublish] = useState<string[]>([]);

  const draftLevels = levels.filter((l) => l.status === 'draft');
  const publishedLevels = levels.filter((l) => l.status === 'published');

  useEffect(() => {
    fetchLevels();
  }, [fetchLevels]);

  const handleSelectLevel = (levelId: string) => {
    setSelectedForPublish((prev) =>
      prev.includes(levelId) ? prev.filter((id) => id !== levelId) : [...prev, levelId]
    );
  };

  const handlePublish = async () => {
    if (selectedForPublish.length === 0) {
      alert('Select levels to publish');
      return;
    }

    try {
      for (const levelId of selectedForPublish) {
        await publishLevel(levelId);
      }
      setSelectedForPublish([]);
      await fetchLevels();
    } catch (err) {
      console.error('Publish failed:', err);
    }
  };

  return (
    <div className="space-y-6">
      {/* Draft Content */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="border-b pb-4 mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            📝 Draft Content ({draftLevels.length})
          </h3>
          <p className="text-sm text-gray-500 mt-1">Ready to review and publish</p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded mb-4">
            {error}
          </div>
        )}

        {draftLevels.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No draft levels</p>
          </div>
        ) : (
          <div className="space-y-3">
            {draftLevels.map((level) => (
              <div
                key={level.id}
                className="border rounded-lg p-4 hover:bg-gray-50 transition"
              >
                <div className="flex items-start gap-4">
                  <input
                    type="checkbox"
                    checked={selectedForPublish.includes(level.id)}
                    onChange={() => handleSelectLevel(level.id)}
                    className="mt-1 w-5 h-5 text-blue-600 rounded focus:ring-blue-500"
                  />
                  <div className="flex-1 min-w-0">
                    <h4 className="font-semibold text-gray-900">{level.title}</h4>
                    <p className="text-sm text-gray-600 mt-1">
                      {level.outcome_statement}
                    </p>
                    <div className="flex gap-4 mt-3 text-xs text-gray-500">
                      <span>Level {level.order_index}</span>
                      <span>v{level.version}</span>
                      <span>
                        Created:{' '}
                        {new Date(level.created_at).toLocaleDateString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Publish Button */}
            <div className="border-t pt-4 mt-4">
              <button
                onClick={handlePublish}
                disabled={selectedForPublish.length === 0 || loading}
                className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed font-semibold"
              >
                {loading
                  ? '🔄 Publishing...'
                  : `🚀 Publish ${selectedForPublish.length} Level${
                      selectedForPublish.length !== 1 ? 's' : ''
                    }`}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Published Content */}
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="border-b pb-4 mb-4">
          <h3 className="text-lg font-semibold text-gray-900">
            ✅ Published Content ({publishedLevels.length})
          </h3>
          <p className="text-sm text-gray-500 mt-1">Live and available to students</p>
        </div>

        {publishedLevels.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <p>No published levels yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {publishedLevels.map((level) => (
              <div
                key={level.id}
                className="border rounded-lg p-4 bg-green-50 border-green-200"
              >
                <div>
                  <h4 className="font-semibold text-gray-900">{level.title}</h4>
                  <p className="text-sm text-gray-600 mt-1">
                    {level.outcome_statement}
                  </p>
                  <div className="flex gap-4 mt-3 text-xs text-gray-500">
                    <span>Level {level.order_index}</span>
                    <span>v{level.version}</span>
                    <span className="text-green-600 font-semibold">
                      Published:{' '}
                      {new Date(level.last_edited_at || level.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Publishing Guide */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="font-semibold text-blue-900 mb-2">📋 Publishing Guide</h4>
        <ul className="text-sm text-blue-800 space-y-1 list-disc list-inside">
          <li>Review all draft content before publishing</li>
          <li>Check that lessons, assessments, and missions are complete</li>
          <li>Verify resources and assets are properly attached</li>
          <li>Published content is immediately visible to students</li>
          <li>To edit published content, create a new draft version</li>
        </ul>
      </div>
    </div>
  );
};
