# Instructional Materials System — Complete Architecture

**Date:** 2026-09-01  
**Status:** ✅ Component & Schema Complete (Ready for Integration)

---

## Overview

The **Instructional Materials System** is the core of teacher-facilitated learning in STEAM Foundry Lab. It provides:

1. **Organizer-provided missions** — read-only reference for teachers
2. **Organizer lessons & resources** — videos, PDFs, templates from organizers
3. **Teacher supplementary materials** — teacher uploads their own resources
4. **Organizer live sessions** — teachers join organizer-hosted Google Meet sessions
5. **Team mission progress** — track team progress + role contributions

---

## Key Architectural Decision: Team-Based Collaboration Tracking

### The Problem We Solve

**Traditional approach:** Track individual student progress
- ❌ Doesn't show WHO did WHAT in a team
- ❌ Hides collaboration (or lack thereof)
- ❌ Organizers can't assess cross-functional teamwork

**STEAM Foundry approach:** Track ROLE contributions within TEAMS
- ✅ Shows **what each role did** (Designer, Developer, PM, Communicator)
- ✅ Verifies **collaboration actually happened**
- ✅ Measures **collaboration extent** (did all roles contribute? was there handoff?)
- ✅ Provides **evidence of teamwork** for organizer judging

### Example: Design Phase Completion

```
Team Alpha (4 students, 4 roles):
├─ Sarah (Designer)
│  ├─ Step 1: Empathy Mapping ✅ Completed Oct 3
│  │  → "Completed empathy mapping with 3 user personas"
│  └─ Step 2: Problem Statement ✅ Completed Oct 4
│     → "Synthesized problem statement from research"
│
├─ Alex (Developer)
│  ├─ Step 1: ⏳ In Progress
│  │  → "Validating user insights"
│  └─ Step 2: ✅ Completed Oct 4
│     → "Finalized problem statement (aligned with design)"
│
├─ Maria (Project Manager)
│  ├─ Step 1: ✅ Completed Oct 3
│  │  → "Coordinated user interviews"
│  └─ Step 2: ⏳ In Progress
│     → "Organizing ideation session - coordinated Designer & Developer"
│
└─ James (Communicator)
   ├─ Step 1: ⏳ In Progress
   │  → "Documenting user research insights"
   └─ Step 2: Not Started
      → "Awaiting finalized problem statement to document"

👉 COLLABORATION ASSESSMENT:
   ✅ All 4 roles have been engaged (high collaboration)
   ✅ Roles are dependent on each other (Designer → PM → Developer → Communicator handoffs)
   ✅ Contributions show evidence of teamwork, not individual work
   ⚠️ Communicator needs to catch up (likely bottleneck in documentation)
```

This level of detail is what organizers need to assess group dynamics and individual contributions.

---

## Database Schema

### Tables

| Table | Purpose |
|---|---|
| `organizer_missions` | Mission breakdowns created by organizers (immutable reference) |
| `mission_steps` | Individual steps within each mission |
| `organizer_resources` | Lessons, videos, PDFs provided by organizers |
| `teacher_supplementary_materials` | Materials uploaded by teachers |
| `teams` | Collaborative groups of students |
| `team_roles` | Role assignments within each team |
| `team_mission_progress` | Overall progress tracking per team per stage |
| `role_contributions` | Individual role contributions to specific steps |
| `live_sessions` | Organizer-hosted Google Meet sessions |
| `material_sync_log` | Tracks when materials sync to student dashboards |

### Key Relationships

```
organizer_missions (immutable)
├─ mission_steps
└─ Referenced by role_contributions

organizer_resources (read-only)
└─ Teacher references these in class

teacher_supplementary_materials
└─ Syncs to student_dashboard (realtime)

teams
├─ team_roles (4 roles per team typically)
└─ team_mission_progress
   └─ role_contributions (one per role per step)
```

---

## Component Architecture

### InstructionalMaterials.tsx (Main Container)

```tsx
<InstructionalMaterials
  schoolId="school-123"
  teacherId="teacher-456"
  stageId="design"
  stageName="Design Phase"
  teamCount={7}
>
  [All 5 sub-components below]
</InstructionalMaterials>
```

### [1] OrganizerMissionsCard (Read-Only Reference)

**What teacher sees:**
- Mission breakdown from organizers
- Step-by-step guidance with success criteria
- Estimated time per step
- "Teacher tip" suggesting how to expand beyond organizer structure

**Actions:**
- [Read Full Breakdown]
- [Download as PDF]

**Key:** This is READ-ONLY. Teachers use it as a guide, but don't edit it.

### [2] OrganizerResourcesCard (Read-Only Materials)

**What teacher sees:**
- Videos from organizers
- PDFs, templates, worksheets
- Grouped by type (Videos / Documents)
- File size, upload date

**Actions:**
- [Play] or [Download]
- [Share with students]

### [3] TeacherSupplementaryUpload (Teacher Creates)

**Upload your own materials:**
- Drag & drop upload
- Auto-syncs to 28 students
- Shows sync status per material
- Can delete materials

**Examples:**
- "My Design Template - Simplified.fig"
- "Extra Practice: 5 More Ideas.pdf"
- "Design Inspiration Case Studies.pptx"

### [4] OrganizerLiveSessionsCard (Join Sessions)

**Upcoming sessions:**
- Organizer-hosted Google Meet
- [Join Live as Teacher]
- [Get Link to Share]
- [Add to Calendar]

**Past recordings:**
- [▶ Watch Recording]
- [Share with students]

### [5] TeamMissionProgress (Collaboration Tracking) ← KEY COMPONENT

**For each team:**
- Overall progress bar (0-100%)
- Current step indicator
- Last updated timestamp

**Expand to see role contributions:**
- Designer: ✅ Step 1 + Step 2 completed
- Developer: ✅ Step 2 + ⏳ Step 3 in progress
- PM: ⏳ Step 2 in progress
- Communicator: ⏳ Step 2 in progress

**Collaboration Assessment:**
- How many roles completed their part
- Which roles are dependent on each other
- Team momentum indicators

---

## Data Flow: How Materials Get to Students

### Teacher Uploads Supplementary Material

```
Teacher clicks [+ Upload Your Own Resource]
  ↓
FileUploadField (drag-drop)
  ↓
Sends file to Edge Function: upload-submission-file
  ↓
File stored in Google Drive
  ↓
Record created in teacher_supplementary_materials
  ↓
Edge Function calls: sync-materials-to-students
  ↓
Updates student_dashboard materialsSync flag
  ↓
Student dashboard queries materialsSynced() hook
  ↓
Student sees material within 5 seconds ✅
```

### Real-time Sync

**Trigger:** `teacher_supplementary_materials.sync_status = 'pending'`

**Action:**
1. Edge Function `sync-materials-to-students()` fires
2. For each student in class: update student dashboard
3. Mark as `sync_status = 'synced'`
4. Log in `material_sync_log`

**Delay:** Typically 5-10 seconds (realtime Supabase subscription)

---

## Team Mission Progress Tracking: How It Works

### Setup (During Registration)

**When school registers with 28 students:**
1. Create 7 teams (28 ÷ 4 = 7 teams)
2. Each team gets 4 roles: Designer, Developer, PM, Communicator
3. Assign students to roles
4. Create team_mission_progress record per stage

### During Learning

**Step 1: Empathy Mapping**

Teacher inputs: "Sarah (Designer) completed empathy mapping"
- Updates `role_contributions` record
- Sets status: 'completed'
- Adds contribution_description: "Completed empathy mapping with 3 user personas"
- Sets completed_date: today

System calculates:
- Designer progress: 1/3 steps done → 33%
- Team Alpha progress: 1/3 × (1 Designer + 0 other roles) → weighted calculation

### Collaboration Verification

**Question for organizers:** "Did this team really collaborate?"

**Evidence from role_contributions:**
- ✅ All 4 roles have entries (yes, all engaged)
- ✅ Roles have dependencies (Designer → PM → Developer → Communicator)
- ✅ Handoff timing shows handoffs (Designer finished Oct 3, PM started Oct 3)
- ⚠️ Communicator is lagging (potential bottleneck)

This is what organizers need for judging criteria like **"Teamwork Score"**.

---

## Integration Checklist

### Phase 1: Database (DONE ✅)

- [x] Create schema: `012_instructional_materials.sql`
- [x] Add RLS policies
- [x] Create indexes

**Next step:** Deploy migration to Supabase

```bash
supabase db push
```

### Phase 2: Components (DONE ✅)

- [x] InstructionalMaterials.tsx
- [x] OrganizerMissionsCard.tsx
- [x] OrganizerResourcesCard.tsx
- [x] TeacherSupplementaryUpload.tsx
- [x] OrganizerLiveSessionsCard.tsx
- [x] TeamMissionProgress.tsx

**Next step:** Connect to real database

### Phase 3: Edge Functions (TODO)

| Function | Purpose |
|---|---|
| `sync-materials-to-students` | When teacher uploads → sync to students |
| `update-team-progress` | When role contribution logged → recalculate progress |
| `calculate-collaboration-score` | Assess team collaboration |

### Phase 4: Student Dashboard Updates (TODO)

**Student view should show:**
- Organizer missions (same breakdown)
- Organizer resources (same materials)
- Teacher supplementary materials (auto-synced)
- Organizer live sessions (same as teacher)
- Team mission progress (read-only, see own team's progress)

### Phase 5: Google Meet Integration (TODO)

**When user clicks [Join Live]:**
1. Retrieve meeting_url from live_sessions table
2. Open in new tab (or embedded Google Meet iframe)
3. Log join event to automation_log

**After session ends:**
1. Google Meet webhook → recording_url received
2. Update live_sessions.recording_url + status
3. Push recording to student dashboard within 60 seconds

---

## UI/UX Details

### Mission Reference Layout

```
┌─ OrganizerMissionsCard ─────────────────────────┐
│                                                 │
│ Design Phase (Stage 1) – Mission Breakdown      │
│ [Read Full Breakdown] [Download PDF]            │
│                                                 │
│ Step 1: Empathy Mapping                         │
│ "Understand your user's needs..."              │
│ Success: 3 user personas with empathy matrices │
│ Time: 2 class periods                          │
│                                                 │
│ Step 2: Problem Statement                      │
│ Step 3: Rapid Ideation                         │
│                                                 │
│ 💡 Teacher tip: You can expand on each step... │
└─────────────────────────────────────────────────┘
```

### Teacher Upload Layout

```
┌─ TeacherSupplementaryUpload ──────────────┐
│ Your Supplementary Materials ✅ Auto-syncs│
│                                           │
│ [Drag files here or click to browse]     │
│                                           │
│ ✅ My Design Template.fig                 │
│    4.2 MB · Oct 3                        │
│    ✅ Synced to 28 students              │
│    [👁 View] [🗑 Delete]                  │
│                                           │
│ ✅ Extra Practice: 5 Ideas.pdf            │
│    1.8 MB · Oct 3                        │
│    ✅ Synced to 28 students              │
│    [👁 View] [🗑 Delete]                  │
│                                           │
│ 💡 What to upload: Videos, PDFs...       │
└───────────────────────────────────────────┘
```

### Team Progress Layout

```
┌─ TeamMissionProgress ──────────────────────┐
│ 📊 Team Mission Progress & Role Contrib.   │
│                                            │
│ ▼ Team Alpha (4 students)                  │
│   ████░░░░░ 75% · Step 2/3                 │
│   ✅ 2 roles done · ⏳ 2 in progress       │
│                                            │
│   ✅ Sarah (Designer) - Empathy Mapping    │
│   ✅ Alex (Developer) - Problem Statement  │
│   ⏳ Maria (PM) - Coordinating ideation    │
│   ⏳ James (Comm) - Documenting process    │
│                                            │
│   📌 Collaboration: High (all roles active)│
│   [Send Encouragement] [View Details]     │
│                                            │
│ ▼ Team Beta (4 students)                   │
│   ████░░░░░ 50% · Step 2/3                 │
│   ...                                      │
│                                            │
│ Summary:                                   │
│ ✅ 0 teams complete · ⏳ 7 in progress    │
│ 📊 Class average: 42%                      │
└────────────────────────────────────────────┘
```

---

## Color Scheme & Badges

| Status | Color | Icon |
|---|---|---|
| Completed | Green (`bg-green-50`) | ✅ |
| In Progress | Amber (`bg-amber-50`) | ⏳ |
| Not Started | Gray (`bg-gray-50`) | ⚠️ |
| Organizer Content | Blue (`bg-blue-50`) | 📌 |
| Teacher Upload | Blue (`bg-blue-50`) | 💙 |

---

## Next Implementation Steps

### 1. Deploy Database Schema

```bash
cd innovation-lab-repo
supabase db push
```

### 2. Connect Components to Real Data

Replace mock data in components with real queries:

```tsx
// OrganizerMissionsCard.tsx
const { data: mission } = await supabase
  .from('organizer_missions')
  .select('*, steps:mission_steps(*)')
  .eq('stage_id', stageId)
  .single();
```

### 3. Build Edge Functions

- `sync-materials-to-students` — realtime sync
- `update-team-progress` — progress calculation
- `get-team-collaboration-score` — collaboration metrics

### 4. Implement Google Meet Integration

When organizer creates live session:
- MCP creates Google Meet
- Returns meeting_url
- Store in live_sessions table
- Auto-webhook for recording capture

### 5. Update Student Dashboard

Add same Instructional Materials section to student view, but:
- Teacher materials appear automatically
- Team progress visible (read-only)
- Can join live sessions from their view

---

## FAQ

**Q: Can teachers edit mission breakdowns?**
A: No. Teachers view organizer missions as read-only reference. They can expand in-class, but edits are not persisted.

**Q: How many teams should a class have?**
A: Typically 4-5 students per team. So 28 students = 5-7 teams.

**Q: What if a student misses part of a mission step?**
A: Their role's contribution is recorded as "in-progress" or "not-started". Organizers can see this when judging.

**Q: How is "collaboration" measured?**
A: By tracking role dependencies, handoff timing, and whether all roles engaged. See role_contributions table.

**Q: Do students see recordings immediately?**
A: Yes. Google Meet webhook delivers recording_url within 60 seconds, and student dashboard updates in real-time.

**Q: What if teacher uploads a 500MB video?**
A: FileUploadField has max 1GB limit. File goes to Google Drive. Teacher sees sync progress (28/28 students).

---

## Success Metrics

Teacher will see:
- ✅ Clear mission breakdown when they log in
- ✅ Organizer resources available for reference
- ✅ Their own materials auto-sync to students within 5 seconds
- ✅ Team progress visible at a glance (overall + per role)
- ✅ Collaboration evident (all roles active, handoffs visible)
- ✅ Can join organizer live sessions

Students will see:
- ✅ Mission breakdown (same as teacher)
- ✅ Organizer resources (videos, templates)
- ✅ Teacher supplementary materials (auto-synced)
- ✅ Can join live sessions with teacher
- ✅ Can see recordings within 60 seconds of session end
- ✅ See team progress (own team only)

Organizers will see:
- ✅ Role contributions visible in submission review
- ✅ Evidence of collaboration (or lack thereof)
- ✅ Can judge teamwork quality based on role handoffs

---

## Files Created

```
✅ src/components/lab/InstructionalMaterials.tsx
✅ src/components/lab/instructional-materials/OrganizerMissionsCard.tsx
✅ src/components/lab/instructional-materials/OrganizerResourcesCard.tsx
✅ src/components/lab/instructional-materials/TeacherSupplementaryUpload.tsx
✅ src/components/lab/instructional-materials/OrganizerLiveSessionsCard.tsx
✅ src/components/lab/instructional-materials/TeamMissionProgress.tsx
✅ supabase/migrations/012_instructional_materials.sql
```

---

## Deployment Checklist

- [ ] Deploy migration (`supabase db push`)
- [ ] Import components in Teacher Lab Dashboard
- [ ] Replace mock data with real queries
- [ ] Build Edge Functions (sync, progress, collaboration)
- [ ] Test with real organizer missions & materials
- [ ] Test teacher uploads (sync to students)
- [ ] Test team progress tracking
- [ ] Update student dashboard with same materials
- [ ] Integrate Google Meet MCP
- [ ] Test recording capture & sync
- [ ] Organizer console: display role contributions
- [ ] Dark mode testing
- [ ] Mobile responsiveness testing
- [ ] Go live

