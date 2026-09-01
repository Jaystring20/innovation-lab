'use client';

import { useState } from 'react';
import { Play, Copy, Calendar, Share2, ChevronDown } from 'lucide-react';

interface LiveSession {
  id: string;
  title: string;
  description?: string;
  scheduledDate: string; // "Fri, Oct 8"
  scheduledTime: string; // "3:00 PM - 4:30 PM Lagos Time"
  hostedBy: string;
  daysUntil?: number;
  meetingUrl?: string;
  status: 'upcoming' | 'recording';
  duration?: string; // "35 minutes"
  recordingUrl?: string;
}

interface OrganizerLiveSessionsCardProps {
  stageId: string;
}

// Mock data - replace with real data from database
const LIVE_SESSIONS: Record<string, LiveSession[]> = {
  design: [
    {
      id: 'session-1',
      title: 'AI Ethics Masterclass',
      scheduledDate: 'Fri, Oct 8',
      scheduledTime: '3:00 PM – 4:30 PM Lagos Time',
      hostedBy: 'STEAM Foundry organizers',
      daysUntil: 5,
      meetingUrl: 'https://meet.google.com/abc-defg-hij',
      status: 'upcoming',
    },
    {
      id: 'session-2',
      title: 'Hardware Design Deep Dive',
      scheduledDate: 'Tue, Oct 15',
      scheduledTime: '2:00 PM – 3:30 PM Lagos Time',
      hostedBy: 'STEAM Foundry organizers',
      daysUntil: 12,
      meetingUrl: 'https://meet.google.com/xyz-uvwx-yz',
      status: 'upcoming',
    },
  ],
  build: [
    {
      id: 'session-3',
      title: 'Prototyping Workshop',
      scheduledDate: 'Wed, Oct 9',
      scheduledTime: '4:00 PM – 5:30 PM Lagos Time',
      hostedBy: 'STEAM Foundry organizers',
      daysUntil: 6,
      meetingUrl: 'https://meet.google.com/pqr-stuv-wxy',
      status: 'upcoming',
    },
  ],
  intelligize: [
    {
      id: 'session-4',
      title: 'AI Integration Masterclass',
      scheduledDate: 'Mon, Oct 13',
      scheduledTime: '2:00 PM – 3:30 PM Lagos Time',
      hostedBy: 'STEAM Foundry organizers',
      daysUntil: 10,
      meetingUrl: 'https://meet.google.com/abc-mnop-qrst',
      status: 'upcoming',
    },
  ],
};

const PAST_SESSIONS: LiveSession[] = [
  {
    id: 'past-1',
    title: 'Intro to AI Ethics',
    hostedBy: 'STEAM Foundry organizers',
    duration: '35 minutes',
    status: 'recording',
    recordingUrl: 'https://drive.google.com/file/d/abc123/view',
  },
  {
    id: 'past-2',
    title: 'Design Fundamentals',
    hostedBy: 'STEAM Foundry organizers',
    duration: '42 minutes',
    status: 'recording',
    recordingUrl: 'https://drive.google.com/file/d/xyz789/view',
  },
];

export function OrganizerLiveSessionsCard({ stageId }: OrganizerLiveSessionsCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const upcomingSessions = LIVE_SESSIONS[stageId] || [];

  const handleCopyLink = (url: string, sessionId: string) => {
    navigator.clipboard.writeText(url);
    setCopiedId(sessionId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <section className="border border-zinc-300 dark:border-zinc-700 rounded-lg overflow-hidden">
      {/* Header */}
      <div
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition bg-white dark:bg-zinc-950"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <span className="text-lg">📹</span>
          <div>
            <h3 className="text-sm font-500 text-zinc-900 dark:text-zinc-100">
              Live Sessions Hosted by Organizers
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Join to learn alongside your students
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
          {/* Upcoming Sessions */}
          <div>
            <p className="text-xs font-600 uppercase text-zinc-600 dark:text-zinc-400 mb-3">
              Upcoming Sessions
            </p>

            {upcomingSessions.length > 0 ? (
              <div className="space-y-2">
                {upcomingSessions.map((session) => (
                  <div
                    key={session.id}
                    className="p-4 border border-blue-200 dark:border-blue-900 bg-blue-50 dark:bg-blue-950/30 rounded-lg"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h4 className="text-sm font-500 text-zinc-900 dark:text-zinc-100">
                          {session.title}
                        </h4>
                        <p className="text-xs text-zinc-600 dark:text-zinc-300 mt-1">
                          {session.scheduledDate} · {session.scheduledTime}
                        </p>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                          {session.hostedBy}
                        </p>
                      </div>
                      {session.daysUntil !== undefined && (
                        <span className="flex-shrink-0 text-xs font-500 text-blue-600 dark:text-blue-400 bg-blue-100 dark:bg-blue-900/50 px-2 py-1 rounded">
                          {session.daysUntil === 0
                            ? 'TODAY'
                            : `${session.daysUntil} DAYS`}
                        </span>
                      )}
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-2 flex-wrap">
                      <button className="flex-1 min-w-max px-3 py-2 bg-blue-600 text-white text-xs font-500 rounded hover:bg-blue-700 transition flex items-center justify-center gap-1">
                        <Play className="w-3 h-3" />
                        Join Live as Teacher
                      </button>
                      <button
                        onClick={() =>
                          handleCopyLink(session.meetingUrl || '', session.id)
                        }
                        className="px-3 py-2 border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 text-xs font-500 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition flex items-center gap-1"
                      >
                        <Copy className="w-3 h-3" />
                        {copiedId === session.id ? 'Copied!' : 'Get Link'}
                      </button>
                      <button className="px-3 py-2 border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 text-xs font-500 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Add to Calendar
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-500 dark:text-zinc-400 italic">
                No upcoming sessions scheduled for this stage.
              </p>
            )}
          </div>

          {/* Past Recordings */}
          {PAST_SESSIONS.length > 0 && (
            <div className="border-t border-zinc-200 dark:border-zinc-700 pt-4">
              <p className="text-xs font-600 uppercase text-zinc-600 dark:text-zinc-400 mb-3">
                Past Recordings
              </p>
              <div className="space-y-2">
                {PAST_SESSIONS.map((session) => (
                  <div
                    key={session.id}
                    className="flex gap-3 p-3 border border-zinc-200 dark:border-zinc-800 rounded-lg hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition"
                  >
                    <div className="flex-shrink-0 w-12 h-12 bg-zinc-200 dark:bg-zinc-800 rounded flex items-center justify-center text-lg">
                      ▶
                    </div>
                    <div className="flex-grow">
                      <h4 className="text-xs font-500 text-zinc-900 dark:text-zinc-100">
                        {session.title}
                      </h4>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                        {session.duration} · From organizers
                      </p>
                    </div>
                    <div className="flex-shrink-0 flex gap-1">
                      <button className="px-2 py-1 text-xs font-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition flex items-center gap-1">
                        <Play className="w-3 h-3" />
                        Watch
                      </button>
                      <button className="px-2 py-1 text-xs font-500 text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded transition flex items-center gap-1">
                        <Share2 className="w-3 h-3" />
                        Share
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </section>
  );
}
