'use client';

import { useState } from 'react';
import { ChevronDown, Download } from 'lucide-react';

interface MissionStep {
  stepNumber: number;
  title: string;
  description: string;
  successCriteria: string;
  estimatedTime: string; // "2 class periods"
}

interface OrganizerMissionsCardProps {
  stageId: string;
  stageName: string;
}

// Mock data - replace with real data from database
const MISSION_STEPS: Record<string, MissionStep[]> = {
  design: [
    {
      stepNumber: 1,
      title: 'Empathy Mapping',
      description: 'Understand your user\'s needs, pain points, and motivations',
      successCriteria: 'Map at least 3 user personas with complete empathy matrices',
      estimatedTime: '2 class periods',
    },
    {
      stepNumber: 2,
      title: 'Problem Statement',
      description: 'Define the core problem to solve based on user research',
      successCriteria: 'One clear, specific problem statement that aligns with user needs',
      estimatedTime: '1 class period',
    },
    {
      stepNumber: 3,
      title: 'Rapid Ideation',
      description: 'Generate multiple solution ideas without judgment',
      successCriteria: 'At least 10 distinct ideas sketched and described',
      estimatedTime: '2 class periods',
    },
  ],
  build: [
    {
      stepNumber: 1,
      title: 'Prototype Planning',
      description: 'Plan the MVP (Minimum Viable Product) based on design ideas',
      successCriteria: 'Detailed prototype plan with materials list and timeline',
      estimatedTime: '1 class period',
    },
    {
      stepNumber: 2,
      title: 'Hardware Assembly',
      description: 'Build the physical prototype using provided materials',
      successCriteria: 'Functional prototype that addresses core design problem',
      estimatedTime: '3-4 class periods',
    },
    {
      stepNumber: 3,
      title: 'Testing & Iteration',
      description: 'Test the prototype and iterate based on feedback',
      successCriteria: 'At least 2 successful test cycles with documented improvements',
      estimatedTime: '2 class periods',
    },
  ],
  intelligize: [
    {
      stepNumber: 1,
      title: 'AI Integration Planning',
      description: 'Identify where AI can enhance the solution',
      successCriteria: 'Clear use case for AI with success metrics defined',
      estimatedTime: '1 class period',
    },
    {
      stepNumber: 2,
      title: 'AI Implementation',
      description: 'Integrate AI using provided APIs and tools',
      successCriteria: 'Working AI component that improves user experience',
      estimatedTime: '2-3 class periods',
    },
    {
      stepNumber: 3,
      title: 'Ethics & Impact Review',
      description: 'Evaluate ethical implications and societal impact',
      successCriteria: 'Written reflection on AI ethics and impact considerations',
      estimatedTime: '1 class period',
    },
  ],
};

export function OrganizerMissionsCard({
  stageId,
  stageName,
}: OrganizerMissionsCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const steps = MISSION_STEPS[stageId] || [];

  return (
    <section className="border border-zinc-300 dark:border-zinc-700 rounded-lg overflow-hidden bg-zinc-50 dark:bg-zinc-900/30">
      {/* Header */}
      <div
        className="p-4 flex items-center justify-between cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded flex items-center justify-center">
            <span className="text-sm font-600 text-blue-600 dark:text-blue-400">
              ✓
            </span>
          </div>
          <div>
            <h3 className="text-sm font-500 text-zinc-900 dark:text-zinc-100">
              {stageName} – Mission Breakdown
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              From organizers · Reference guide for your teaching
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
        <div className="border-t border-zinc-200 dark:border-zinc-700 px-4 py-4 space-y-4">
          {steps.map((step, index) => (
            <div key={step.stepNumber} className="pl-4 border-l-2 border-blue-400">
              <div className="flex items-start gap-2">
                <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-600 rounded-full">
                  {step.stepNumber}
                </span>
                <div className="flex-grow">
                  <h4 className="text-xs font-600 uppercase text-zinc-900 dark:text-zinc-100">
                    {step.title}
                  </h4>
                  <p className="text-xs text-zinc-700 dark:text-zinc-300 mt-1">
                    {step.description}
                  </p>
                  <div className="mt-2 p-2 bg-white dark:bg-zinc-900/50 rounded border border-zinc-200 dark:border-zinc-700">
                    <p className="text-xs">
                      <strong className="text-zinc-900 dark:text-zinc-100">
                        Success Criteria:
                      </strong>{' '}
                      <span className="text-zinc-700 dark:text-zinc-300">
                        {step.successCriteria}
                      </span>
                    </p>
                  </div>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                    ⏱️ Est. time: {step.estimatedTime}
                  </p>
                </div>
              </div>

              {index < steps.length - 1 && (
                <div className="mt-4 mb-2" />
              )}
            </div>
          ))}

          {/* Teacher tip */}
          <div className="p-3 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/30 rounded-lg">
            <p className="text-xs text-amber-900 dark:text-amber-100">
              💡 <strong>Teacher tip:</strong> You can expand on each step with
              your own teaching methods, examples, real-world case studies, and
              deeper exploration. Use these steps as your foundation.
            </p>
          </div>

          {/* Action buttons */}
          <div className="flex gap-2 pt-2 border-t border-zinc-200 dark:border-zinc-700">
            <button className="flex-1 px-3 py-2 text-xs font-500 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition">
              Read Full Breakdown
            </button>
            <button className="px-3 py-2 text-xs font-500 text-zinc-600 dark:text-zinc-400 border border-zinc-300 dark:border-zinc-600 rounded hover:bg-zinc-100 dark:hover:bg-zinc-800 transition flex items-center gap-1">
              <Download className="w-3 h-3" />
              PDF
            </button>
          </div>
        </div>
      )}
    </section>
  );
}
