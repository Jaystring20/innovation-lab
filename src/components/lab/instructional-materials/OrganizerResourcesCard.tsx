'use client';

import { useState, useEffect } from 'react';
import { Play, Download, Share2, ChevronDown, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface OrganizerResource {
  id: string;
  resource_type: 'video' | 'pdf' | 'doc' | 'template';
  title: string;
  description?: string;
  duration?: string;
  file_size?: string;
  uploaded_date: string;
  gdrive_url?: string;
  uploaded_by?: string;
}

interface OrganizerResourcesCardProps {
  stageId: string;
}

const RESOURCE_ICONS: Record<string, string> = {
  video: '📹',
  pdf: '📄',
  doc: '📋',
  template: '📐',
};

export function OrganizerResourcesCard({ stageId }: OrganizerResourcesCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [resources, setResources] = useState<OrganizerResource[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load resources from Supabase
  useEffect(() => {
    const loadResources = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('organizer_resources')
          .select('*')
          .eq('stage_id', stageId)
          .order('uploaded_date', { ascending: false });

        if (fetchError) throw fetchError;
        setResources(data || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load resources');
        setResources([]);
      } finally {
        setLoading(false);
      }
    };

    loadResources();
  }, [stageId]);

  const videos = resources.filter((r) => r.resource_type === 'video');
  const documents = resources.filter((r) =>
    ['pdf', 'doc', 'template'].includes(r.resource_type)
  );

  return (
    <section className="border border-zinc-300 dark:border-zinc-700 rounded-lg overflow-hidden">
      {/* Header */}
      <div
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition bg-white dark:bg-zinc-950"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">📚</span>
          <div>
            <h3 className="text-sm font-500 text-zinc-900 dark:text-zinc-100">
              Organizer Lessons & Resources
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Reference materials provided by organizers
            </p>
          </div>
        </div>
        <ChevronDown
          className={`w-4 h-4 text-zinc-500 transition ${
            isExpanded ? 'rotate-180' : ''
          }`}
        />
      </div>

      {/* Content */}
      {isExpanded && (
        <div className="border-t border-zinc-300 dark:border-zinc-700 p-4 space-y-4 bg-white dark:bg-zinc-950">
          {loading ? (
            <div className="text-center py-4">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading resources...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded p-3 flex gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 dark:text-red-200">{error}</p>
            </div>
          ) : resources.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">No resources available</p>
            </div>
          ) : (
            <>
              {/* Videos */}
              {videos.length > 0 && (
                <div>
                  <p className="text-xs font-600 uppercase text-zinc-600 dark:text-zinc-400 mb-3">
                    Videos
                  </p>
                  <div className="space-y-2">
                    {videos.map((resource) => (
                      <div
                        key={resource.id}
                        className="flex gap-3 p-3 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition"
                      >
                        <div className="flex-shrink-0 w-14 h-14 bg-zinc-200 dark:bg-zinc-800 rounded flex items-center justify-center text-lg">
                          {RESOURCE_ICONS[resource.resource_type]}
                        </div>
                        <div className="flex-grow min-w-0">
                          <h4 className="text-xs font-500 text-zinc-900 dark:text-zinc-100 truncate">
                            {resource.title}
                          </h4>
                          {resource.description && (
                            <p className="text-xs text-zinc-600 dark:text-zinc-400 mt-1">
                              {resource.description}
                            </p>
                          )}
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                            {resource.duration && `${resource.duration} · `}
                            {resource.uploaded_date ? new Date(resource.uploaded_date).toLocaleDateString() : ''} · From{' '}
                            {resource.uploaded_by || 'STEAM Foundry'}
                          </p>
                        </div>
                        <div className="flex-shrink-0 flex gap-1">
                          <button className="p-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-xs font-500">
                            <Play className="w-3 h-3" />
                          </button>
                          <button className="p-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-xs font-500">
                            <Share2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Documents/Resources */}
              {documents.length > 0 && (
                <div>
                  <p className="text-xs font-600 uppercase text-zinc-600 dark:text-zinc-400 mb-3">
                    Documents & Templates
                  </p>
                  <div className="space-y-2">
                    {documents.map((resource) => (
                      <div
                        key={resource.id}
                        className="flex gap-3 p-3 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition"
                      >
                        <div className="flex-shrink-0 w-14 h-14 bg-zinc-200 dark:bg-zinc-800 rounded flex items-center justify-center text-lg">
                          {RESOURCE_ICONS[resource.resource_type]}
                        </div>
                        <div className="flex-grow min-w-0">
                          <h4 className="text-xs font-500 text-zinc-900 dark:text-zinc-100 truncate">
                            {resource.title}
                          </h4>
                          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                            {resource.file_size && `${resource.file_size} · `}
                            {resource.uploaded_date ? new Date(resource.uploaded_date).toLocaleDateString() : ''} · From{' '}
                            {resource.uploaded_by || 'STEAM Foundry'}
                          </p>
                        </div>
                        <div className="flex-shrink-0 flex gap-1">
                          <button className="p-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-xs font-500">
                            <Download className="w-3 h-3" />
                          </button>
                          <button className="p-2 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded text-xs font-500">
                            <Share2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Browse all link */}
              <button className="w-full text-xs font-500 text-blue-600 dark:text-blue-400 hover:underline py-2">
                Browse all organizer materials →
              </button>
            </>
          )}
        </div>
      )}
    </section>
  );
}
