'use client';

import { useState } from 'react';
import { Play, Download, Share2, ChevronDown } from 'lucide-react';

interface OrganizerResource {
  id: string;
  type: 'video' | 'pdf' | 'doc' | 'template';
  title: string;
  description?: string;
  duration?: string; // for videos
  fileSize?: string;
  uploadedDate: string;
  url?: string;
}

interface OrganizerResourcesCardProps {
  stageId: string;
}

// Mock data - replace with real data from database
const RESOURCES: Record<string, OrganizerResource[]> = {
  design: [
    {
      id: 'vid-1',
      type: 'video',
      title: 'Design Thinking Fundamentals',
      duration: '12 min',
      uploadedDate: 'Oct 1',
      description: 'Introduction to design thinking principles',
    },
    {
      id: 'vid-2',
      type: 'video',
      title: 'User Research Methods',
      duration: '18 min',
      uploadedDate: 'Oct 2',
      description: 'How to conduct effective user interviews',
    },
    {
      id: 'pdf-1',
      type: 'pdf',
      title: 'Empathy Mapping Template.pdf',
      fileSize: '2.1 MB',
      uploadedDate: 'Oct 1',
    },
    {
      id: 'doc-1',
      type: 'doc',
      title: 'Interview Guide.doc',
      fileSize: '1.3 MB',
      uploadedDate: 'Oct 2',
    },
  ],
  build: [
    {
      id: 'vid-3',
      type: 'video',
      title: 'Prototyping Best Practices',
      duration: '15 min',
      uploadedDate: 'Sep 28',
    },
    {
      id: 'pdf-2',
      type: 'pdf',
      title: 'Materials & Tools Guide.pdf',
      fileSize: '3.4 MB',
      uploadedDate: 'Sep 27',
    },
  ],
  intelligize: [
    {
      id: 'vid-4',
      type: 'video',
      title: 'AI Integration Overview',
      duration: '20 min',
      uploadedDate: 'Oct 3',
    },
    {
      id: 'doc-2',
      type: 'doc',
      title: 'AI Ethics Framework.doc',
      fileSize: '1.8 MB',
      uploadedDate: 'Oct 3',
    },
  ],
};

const RESOURCE_ICONS: Record<string, string> = {
  video: '📹',
  pdf: '📄',
  doc: '📋',
  template: '📐',
};

export function OrganizerResourcesCard({ stageId }: OrganizerResourcesCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const resources = RESOURCES[stageId] || [];

  const videos = resources.filter((r) => r.type === 'video');
  const documents = resources.filter((r) => ['pdf', 'doc', 'template'].includes(r.type));

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
                      {RESOURCE_ICONS[resource.type]}
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
                        {resource.duration} · {resource.uploadedDate} · From STEAM Foundry
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
                      {RESOURCE_ICONS[resource.type]}
                    </div>
                    <div className="flex-grow min-w-0">
                      <h4 className="text-xs font-500 text-zinc-900 dark:text-zinc-100 truncate">
                        {resource.title}
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        {resource.fileSize} · {resource.uploadedDate} · From STEAM Foundry
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
        </div>
      )}
    </section>
  );
}
