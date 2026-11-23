# Instructional Materials Integration Guide

**Quick Start:** How to add the Instructional Materials section to Teacher Lab Dashboard

---

## Step 1: Import the Component

In your **Teacher Dashboard** page (`src/pages/Dashboard.tsx` or `src/components/lab/Dashboard.tsx`):

```tsx
import { InstructionalMaterials } from '@/components/lab/InstructionalMaterials';
```

---

## Step 2: Add to Your Layout

```tsx
export default function TeacherLabDashboard() {
  const { user } = useAuth();
  const schoolId = useSchoolContext(); // your school context
  const stageId = 'design'; // or 'build', 'intelligize'
  const stageName = 'Design Phase';
  const teamCount = 7; // number of teams in this class

  return (
    <div className="max-w-7xl mx-auto px-4 py-8 space-y-8">
      {/* Existing dashboard sections */}
      <DashboardHeader />

      {/* NEW: Instructional Materials Section */}
      <InstructionalMaterials
        schoolId={schoolId}
        teacherId={user.id}
        stageId={stageId}
        stageName={stageName}
        teamCount={teamCount}
      />

      {/* Other sections */}
      <StudentProgressSection />
      <EvidenceCollectionSection />
    </div>
  );
}
```

---

## Step 3: Replace Mock Data with Real Queries

### OrganizerMissionsCard.tsx

Replace this:
```tsx
const MISSION_STEPS: Record<string, MissionStep[]> = {
  design: [ /* mock data */ ]
};
```

With this:
```tsx
'use client';
import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

export function OrganizerMissionsCard({ stageId, stageName }: Props) {
  const [steps, setSteps] = useState<MissionStep[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMission = async () => {
      const { data } = await supabase
        .from('organizer_missions')
        .select('*, steps:mission_steps(*)')
        .eq('stage_id', stageId)
        .single();

      if (data?.steps) {
        setSteps(
          data.steps
            .sort((a, b) => a.step_number - b.step_number)
            .map(step => ({
              stepNumber: step.step_number,
              title: step.title,
              description: step.description,
              successCriteria: step.success_criteria,
              estimatedTime: step.estimated_time,
            }))
        );
      }
      setLoading(false);
    };

    fetchMission();
  }, [stageId]);

  if (loading) return <div>Loading mission...</div>;

  // ... rest of component
}
```

### OrganizerResourcesCard.tsx

```tsx
const [resources, setResources] = useState<OrganizerResource[]>([]);

useEffect(() => {
  const fetchResources = async () => {
    const { data } = await supabase
      .from('organizer_resources')
      .select('*')
      .eq('stage_id', stageId)
      .order('uploaded_date', { ascending: false });

    setResources(data || []);
  };

  fetchResources();
}, [stageId]);
```

### TeacherSupplementaryUpload.tsx

```tsx
const [materials, setMaterials] = useState<SupplementaryMaterial[]>([]);

useEffect(() => {
  const fetchMaterials = async () => {
    const { data } = await supabase
      .from('teacher_supplementary_materials')
      .select('*')
      .eq('teacher_id', teacherId)
      .eq('stage_id', stageId)
      .order('uploaded_date', { ascending: false });

    setMaterials(
      data?.map(m => ({
        id: m.id,
        name: m.file_name,
        size: m.file_size,
        type: m.file_type,
        uploadedDate: m.uploaded_date,
        syncStatus: m.sync_status as 'synced' | 'syncing' | 'failed',
        studentsSynced: m.students_synced,
        totalStudents: m.total_students,
      })) || []
    );
  };

  fetchMaterials();
  
  // Subscribe to realtime updates
  const subscription = supabase
    .from('teacher_supplementary_materials')
    .on('*', payload => {
      if (payload.new) {
        setMaterials(prev => [
          {
            id: payload.new.id,
            name: payload.new.file_name,
            // ... other fields
          },
          ...prev,
        ]);
      }
    })
    .subscribe();

  return () => subscription.unsubscribe();
}, [teacherId, stageId]);
```

### TeamMissionProgress.tsx

```tsx
const [teams, setTeams] = useState<TeamProgress[]>([]);

useEffect(() => {
  const fetchTeamProgress = async () => {
    // Get all teams for this school
    const { data: teamData } = await supabase
      .from('teams')
      .select(
        `
        *,
        team_roles (
          id,
          role_name,
          student:auth.users(user_metadata),
          contributions:role_contributions(*)
        ),
        progress:team_mission_progress(*)
        `
      )
      .eq('school_id', schoolId);

    if (!teamData) return;

    const formattedTeams = teamData.map(team => {
      const progress = team.progress.find(p => p.stage_id === stageId);
      
      return {
        teamId: team.id,
        teamName: team.team_name,
        studentCount: team.team_roles.length,
        overallProgress: progress?.overall_progress || 0,
        currentStep: progress?.current_step || 0,
        totalSteps: progress?.total_steps || 3,
        startedDate: progress?.started_date,
        lastUpdated: progress?.last_updated,
        roles: team.team_roles.map(role => {
          const contrib = role.contributions
            .find(c => c.stage_id === stageId);
          
          return {
            id: role.id,
            name: role.role_name,
            studentName: role.student.user_metadata?.name || 'Unknown',
            studentId: role.student.id,
            status: contrib?.status || 'not-started',
            completedDate: contrib?.completed_date,
            contribution: contrib?.contribution_description,
          };
        }),
      };
    });

    setTeams(formattedTeams);
  };

  fetchTeamProgress();
}, [schoolId, stageId]);
```

---

## Step 4: Update Student Dashboard

Add same Instructional Materials to student view (`src/pages/StudentDashboard.tsx`):

```tsx
import { InstructionalMaterials } from '@/components/lab/InstructionalMaterials';

export default function StudentDashboard() {
  // For students, we show same materials but also their team progress
  return (
    <InstructionalMaterials
      schoolId={schoolId}
      teacherId={undefined} // Students don't have this
      stageId={stageId}
      stageName={stageName}
      teamCount={teamCount}
    />
  );
}
```

But modify `TeamMissionProgress.tsx` to show "Your Team Progress":

```tsx
interface TeamMissionProgressProps {
  schoolId: string;
  teacherId?: string; // Optional - if undefined, fetch student's team only
  stageId: string;
  stageName: string;
  teamCount: number;
}

// In component:
const [studentTeamId, setStudentTeamId] = useState<string | null>(null);

useEffect(() => {
  if (!teacherId) {
    // Student view: find their team
    const fetchStudentTeam = async () => {
      const { data } = await supabase
        .from('team_roles')
        .select('team_id')
        .eq('student_id', user.id)
        .single();

      setStudentTeamId(data?.team_id);
    };
    fetchStudentTeam();
  }
}, [teacherId, user.id]);

// Filter teams based on view
const visibleTeams = teacherId
  ? teams // Teacher sees all teams
  : teams.filter(t => t.teamId === studentTeamId); // Student sees only their team
```

---

## Step 5: Build Edge Functions

### `sync-materials-to-students` Function

**File:** `supabase/functions/sync-materials-to-students/index.ts`

```typescript
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseKey);

serve(async (req: Request) => {
  try {
    const { materialId } = await req.json();

    // Get the material
    const { data: material } = await supabase
      .from('teacher_supplementary_materials')
      .select('*')
      .eq('id', materialId)
      .single();

    if (!material) {
      return new Response('Material not found', { status: 404 });
    }

    // Update sync status to syncing
    await supabase
      .from('teacher_supplementary_materials')
      .update({ sync_status: 'syncing' })
      .eq('id', materialId);

    // Get all students in the school
    const { data: students } = await supabase
      .from('students')
      .select('id')
      .eq('school_id', material.school_id);

    const studentIds = students?.map(s => s.id) || [];

    // Sync to student dashboard (via realtime subscription)
    // Students listening to teacher_supplementary_materials changes will auto-update

    // Update sync status to synced
    await supabase
      .from('teacher_supplementary_materials')
      .update({
        sync_status: 'synced',
        students_synced: studentIds.length,
        total_students: studentIds.length,
      })
      .eq('id', materialId);

    // Log the sync
    await supabase.from('material_sync_log').insert({
      material_id: materialId,
      students_synced: studentIds.length,
      total_students: studentIds.length,
      sync_completed_at: new Date().toISOString(),
      sync_status: 'completed',
    });

    return new Response('Sync complete', { status: 200 });
  } catch (error) {
    console.error('Sync failed:', error);
    return new Response('Sync failed', { status: 500 });
  }
});
```

### `update-team-progress` Function

```typescript
// Updates team_mission_progress when role contribution changes
serve(async (req: Request) => {
  try {
    const { teamId, stageId } = await req.json();

    // Get all role contributions for this team + stage
    const { data: contributions } = await supabase
      .from('role_contributions')
      .select('*')
      .eq('team_id', teamId)
      .eq('stage_id', stageId);

    if (!contributions) return;

    // Calculate progress
    const totalRoles = 4; // Designer, Developer, PM, Communicator
    const completedRoles = contributions.filter(c => c.status === 'completed').length;
    const overallProgress = Math.round((completedRoles / totalRoles) * 100);

    // Update team_mission_progress
    await supabase
      .from('team_mission_progress')
      .update({
        overall_progress: overallProgress,
        current_step: contributions[0]?.mission_step_id ? 1 : 0,
        last_updated: new Date().toISOString(),
      })
      .eq('team_id', teamId)
      .eq('stage_id', stageId);

    return new Response('Progress updated', { status: 200 });
  } catch (error) {
    console.error('Update failed:', error);
    return new Response('Update failed', { status: 500 });
  }
});
```

---

## Step 6: Deploy Database

```bash
# Deploy migration to Supabase
cd innovation-lab-repo
supabase db push

# Deploy Edge Functions
supabase functions deploy sync-materials-to-students
supabase functions deploy update-team-progress
```

---

## Step 7: Test

### Manual Test Checklist

- [ ] Teacher logs in → sees Instructional Materials section
- [ ] Organizer missions display correctly
- [ ] Organizer resources load
- [ ] Teacher can upload supplementary material
- [ ] Material appears in upload list
- [ ] Material syncs to students within 5 seconds
- [ ] Team progress shows for all teams
- [ ] Expanding team shows role contributions
- [ ] Collaboration assessment appears
- [ ] Student views materials (auto-synced)
- [ ] Student sees team progress (read-only)
- [ ] Dark mode working
- [ ] Mobile responsive

---

## Common Issues & Fixes

### Materials not syncing to students

**Symptom:** Teacher uploads → students don't see it

**Fix:**
1. Check `material_sync_log` table for errors
2. Verify student records exist in `students` table
3. Check Supabase realtime subscription is active

### Team progress not updating

**Symptom:** Role contributions added but progress stays 0%

**Fix:**
1. Verify `role_contributions` records created
2. Check `update-team-progress` Edge Function logs
3. Manually trigger: `POST /update-team-progress` with teamId + stageId

### Organizer missions not loading

**Symptom:** "Loading mission..." stays forever

**Fix:**
1. Verify `organizer_missions` table has data
2. Check migration deployed successfully
3. Verify stage_id parameter is correct

---

## Performance Optimizations

### Query Optimization

```tsx
// BAD: N+1 query problem
teams.forEach(team => {
  supabase.from('team_roles').select(...); // 7 separate queries
});

// GOOD: Single joined query
supabase
  .from('teams')
  .select('*, roles:team_roles(*), progress:team_mission_progress(*)')
  .eq('school_id', schoolId);
```

### Caching

```tsx
// Cache organizer missions (read-only)
const [mission, setMission] = useState<Mission | null>(null);
const queryKey = `mission:${stageId}`;

useEffect(() => {
  const cached = localStorage.getItem(queryKey);
  if (cached) {
    setMission(JSON.parse(cached));
    return;
  }

  fetchMission().then(data => {
    localStorage.setItem(queryKey, JSON.stringify(data));
    setMission(data);
  });
}, [stageId]);
```

---

## Done! 

The Instructional Materials system is now fully integrated. Teachers can:
✅ View organizer missions  
✅ Access organizer resources  
✅ Upload supplementary materials (auto-sync)  
✅ Join organizer live sessions  
✅ Monitor team progress + role contributions  

Students can:
✅ See all materials  
✅ Join live sessions  
✅ Watch recordings  
✅ See team progress  

Organizers can:
✅ See role contributions in submission review  
✅ Assess collaboration quality  
✅ Score teamwork  

