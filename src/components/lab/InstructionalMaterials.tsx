'use client';

import { useState } from 'react';
import { OrganizerMissionsCard } from './instructional-materials/OrganizerMissionsCard';
import { OrganizerResourcesCard } from './instructional-materials/OrganizerResourcesCard';
import { TeacherSupplementaryUpload } from './instructional-materials/TeacherSupplementaryUpload';
import { OrganizerLiveSessionsCard } from './instructional-materials/OrganizerLiveSessionsCard';
import { TeamMissionProgress } from './instructional-materials/TeamMissionProgress';

interface InstructionalMaterialsProps {
  schoolId: string;
  teacherId: string;
  stageId: string; // 'design' | 'build' | 'intelligize'
  stageName: string; // "Design Phase"
  teamCount: number; // Number of teams in this class
}

export function InstructionalMaterials({
  schoolId,
  teacherId,
  stageId,
  stageName,
  teamCount,
}: InstructionalMaterialsProps) {
  const [refreshKey, setRefreshKey] = useState(0);

  const handleMaterialsUploaded = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-600 text-zinc-900 dark:text-zinc-100">
          📚 Instructional Materials
        </h2>
        <span className="text-xs font-500 text-zinc-500 dark:text-zinc-400">
          {stageName}
        </span>
      </div>

      {/* [1] ORGANIZER MISSIONS (Reference Guide) */}
      <OrganizerMissionsCard stageId={stageId} stageName={stageName} />

      {/* [2] ORGANIZER LESSONS & RESOURCES */}
      <OrganizerResourcesCard stageId={stageId} />

      {/* [3] TEACHER'S SUPPLEMENTARY MATERIALS */}
      <TeacherSupplementaryUpload
        schoolId={schoolId}
        teacherId={teacherId}
        stageId={stageId}
        onUploaded={handleMaterialsUploaded}
        key={refreshKey}
      />

      {/* [4] LIVE SESSIONS (Hosted by Organizers) */}
      <OrganizerLiveSessionsCard stageId={stageId} />

      {/* [5] TEAM MISSION PROGRESS & ROLE CONTRIBUTIONS */}
      <TeamMissionProgress
        schoolId={schoolId}
        teacherId={teacherId}
        stageId={stageId}
        stageName={stageName}
        teamCount={teamCount}
      />
    </div>
  );
}
