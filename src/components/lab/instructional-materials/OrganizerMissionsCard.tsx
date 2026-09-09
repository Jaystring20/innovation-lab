'use client';

import { useState, useEffect } from 'react';
import { ChevronDown, Download, AlertCircle } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface MissionStep {
  id?: string;
  step_number: number;
  title: string;
  description: string;
  success_criteria: string;
  estimated_time: string;
}

interface OrganizerMissionsCardProps {
  stageId: string;
  stageName: string;
}

export function OrganizerMissionsCard({
  stageId,
  stageName,
}: OrganizerMissionsCardProps) {
  const [isExpanded, setIsExpanded] = useState(true);
  const [steps, setSteps] = useState<MissionStep[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load mission steps from Supabase
  useEffect(() => {
    const loadMissionSteps = async () => {
      try {
        setLoading(true);
        setError(null);

        // Fetch mission for this stage
        const { data: mission, error: missionError } = await supabase
          .from('organizer_missions')
          .select('id')
          .eq('stage_id', stageId)
          .single();

        if (missionError) throw missionError;
        if (!mission) {
          setSteps([]);
          return;
        }

        // Fetch all steps for this mission
        const { data: stepsData, error: stepsError } = await supabase
          .from('mission_steps')
          .select('*')
          .eq('mission_id', mission.id)
          .order('step_number', { ascending: true });

        if (stepsError) throw stepsError;
        setSteps(stepsData || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load mission steps');
        // Fallback to empty steps
        setSteps([]);
      } finally {
        setLoading(false);
      }
    };

    loadMissionSteps();
  }, [stageId]);

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
          {loading ? (
            <div className="text-center py-4">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Loading mission steps...</p>
            </div>
          ) : error ? (
            <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900 rounded p-3 flex gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-700 dark:text-red-200">{error}</p>
            </div>
          ) : steps.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-zinc-600 dark:text-zinc-400">No mission steps available</p>
            </div>
          ) : (
            <>
              {steps.map((step, index) => (
                <div key={step.id || step.step_number} className="pl-4 border-l-2 border-blue-400">
                  <div className="flex items-start gap-2">
                    <span className="flex-shrink-0 w-6 h-6 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 flex items-center justify-center text-xs font-600 rounded-full">
                      {step.step_number}
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
                            {step.success_criteria}
                          </span>
                        </p>
                      </div>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                        ⏱️ Est. time: {step.estimated_time}
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
            </>
          )}
        </div>
      )}
    </section>
  );
}
