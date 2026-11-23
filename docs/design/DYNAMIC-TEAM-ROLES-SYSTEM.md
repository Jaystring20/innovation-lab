# Dynamic Team Roles System — Flexible Role Assignment

**Date:** 2026-09-01  
**Status:** ✅ Complete (Components + Schema)

---

## Overview

The **Dynamic Team Roles System** replaces hardcoded 4-role teams with flexible, teacher-configurable team structures. Teachers can:

1. **Choose a template** — use predefined role sets or create custom roles
2. **Define team members** — assign students to roles with their full names
3. **Customize roles** — add custom roles specific to each team's needs

---

## Why This Matters

**Before:** All teams had same 4 roles (Designer, Developer, PM, Communicator)
- ❌ Doesn't fit all team dynamics
- ❌ No flexibility for different team sizes
- ❌ Teachers can't input student names

**After:** Each team configures its own roles + members
- ✅ Teams of any size (3, 4, 5+ members)
- ✅ Custom roles per team (Tech-Heavy, Leadership, Balanced, Custom)
- ✅ Teacher enters student names and role assignments
- ✅ Role templates for fast setup

---

## Role Templates (Predefined)

### Classic 4-Role (Default)
**For:** Standard balanced teams

```
1. Designer — UX/UI and design decisions
2. Developer — Hardware/software implementation
3. Project Manager — Coordination and timeline
4. Communicator — Documentation and presentation
```

### Tech-Heavy
**For:** Technical teams with multiple developer roles

```
1. Lead Developer — Software architecture
2. Hardware Engineer — Physical build
3. AI Specialist — Machine learning integration
4. QA Tester — Testing and validation
```

### Leadership
**For:** Leadership-focused teams

```
1. Project Lead — Overall project management
2. Technical Lead — Technical decision-making
3. Business Lead — Market research and strategy
4. Communications Lead — Stakeholder communication
```

### Balanced 5-Role
**For:** Larger teams with more specialization

```
1. Designer — Product design
2. Frontend Developer — User interface
3. Backend Developer — System logic
4. Project Manager — Coordination
5. Communicator — Documentation
```

### Custom
**For:** Any other team structure

Teachers define their own roles with custom names and descriptions.

---

## Database Schema Updates

### New Tables

| Table | Purpose |
|---|---|
| `role_templates` | Predefined role sets (4 templates) |
| `team_configurations` | Which template each team uses |
| `custom_team_roles` | Custom roles created by teachers |
| `team_member_profiles` | Student → Role assignments + names |

### Updated Tables

| Table | Changes |
|---|---|
| `team_roles` | Now supports flexible roles per team |
| `role_contributions` | References flexible roles |

### Key Relationships

```
role_templates (predefined: 4 templates)
  └─ Used by team_configurations (team selects template)
     └─ OR team_configurations uses custom_team_roles

team_member_profiles
  ├─ Stores: student_id + assigned_role + full_name
  └─ References: team_id + role_name

role_contributions
  └─ Now references flexible roles from team configuration
```

---

## TeamSetup Component

### File Location
`src/components/lab/TeamSetup.tsx`

### Props
```tsx
interface TeamSetupProps {
  schoolId: string;
  teacherId: string;
  teamId: string;
  teamName: string;
  students: Array<{ id: string; email: string; name: string }>;
  onSave?: (config: TeamSetup) => void;
}
```

### Three-Step Wizard

#### Step 1: Choose Roles
```
┌─ Role Template Selection ──────────────────┐
│                                            │
│ ○ Classic 4-Role (Default)                 │
│   ✓ Standard balanced team structure       │
│   Tags: Designer, Developer, PM, Communicator│
│                                            │
│ ○ Tech-Heavy                               │
│   Focus on technical roles                 │
│   Tags: Lead Dev, Hardware, AI, QA         │
│                                            │
│ ○ Leadership                               │
│   Leadership-focused structure             │
│   Tags: Project Lead, Tech Lead...         │
│                                            │
│ ○ Balanced 5-Role                          │
│   Larger teams with specialization         │
│   Tags: Designer, Frontend, Backend, PM... │
│                                            │
│ ○ Create Custom Roles                      │
│   Define your own role names               │
│                                            │
│                    [Next: Review Roles]    │
└────────────────────────────────────────────┘
```

#### Step 2: Review Roles

**If template selected:** Display role list (read-only)

**If custom roles:** Add new roles form

```
┌─ Create Custom Roles ──────────────────────┐
│                                            │
│ Existing Roles:                            │
│ ┌─ Role 1: Design Lead                    │
│ │  Description: Product design             │
│ │  [Delete]                                │
│ └─                                        │
│                                            │
│ Add New Role:                              │
│ [Role name input field]                    │
│ [Role description textarea]                │
│          [+ Add Role]                      │
│                                            │
│         [Back] [Next: Assign Members]      │
└────────────────────────────────────────────┘
```

#### Step 3: Assign Members

```
┌─ Assign Students to Roles ─────────────────┐
│ You have 28 students and 4 roles.          │
│                                            │
│ ┌─ Sarah Ahmed (sarah@school.com) ──────┐ │
│ │ [Click to edit]                        │ │
│ │                                        │ │
│ │ Role: Designer                         │ │
│ │ Description: UX/UI and design...       │ │
│ └────────────────────────────────────────┘ │
│                                            │
│ ┌─ Alex Okafor (alex@school.com) ───────┐ │
│ │ [Click to edit]                        │ │
│ │                                        │ │
│ │ Role: Developer                        │ │
│ │ Description: Hardware/software...      │ │
│ └────────────────────────────────────────┘ │
│                                            │
│ [+ Add Another Member]                     │
│                                            │
│         [Back] [✅ Save Configuration]     │
└────────────────────────────────────────────┘
```

### Editing Member

When teacher clicks to edit a member:

```
┌─ Edit Member ──────────────────────────────┐
│ [Student name input field]                 │
│ [Role dropdown: Designer, Developer, ...]  │
│                         [✓ Save] [✗ Cancel]│
└────────────────────────────────────────────┘
```

---

## Integration with InstructionalMaterials

The flexible roles system integrates with team mission progress:

```
TeamMissionProgress
└─ Fetch team configuration
   ├─ Get template or custom roles
   └─ Get team_member_profiles
      └─ Display role contributions
         ├─ Sarah (Designer) — ✅ Completed
         ├─ Alex (Developer) — ⏳ In Progress
         ├─ Maria (PM) — ⏳ In Progress
         └─ James (Communicator) — ⏳ In Progress
```

---

## Database Deployment

### Migration File
`supabase/migrations/013_dynamic_team_roles.sql`

**What it does:**
1. Creates `role_templates` table with 4 predefined templates
2. Creates `team_configurations` table
3. Creates `custom_team_roles` table
4. Creates `team_member_profiles` table
5. Updates `team_roles` table with flexibility
6. Adds RLS policies
7. Sets up indexes

### Deploy
```bash
supabase db push
```

---

## Usage Workflow

### As a Teacher

**Step 1: After school registers**
- Navigate to "/lab/setup-teams"
- Click on Team Alpha

**Step 2: Choose template**
- Select "Classic 4-Role" (or other)
- [Next]

**Step 3: Review roles**
- See roles and descriptions
- [Next]

**Step 4: Assign members**
- See list of 28 students
- Assign first 4 to roles (Designer, Developer, PM, Communicator)
- Enter their full names
- Click [✅ Save Configuration]

**Step 5: Repeat for other teams**
- Team Beta: Use Tech-Heavy template
- Team Gamma: Create custom roles

### Result

Each team has:
- ✅ Specific roles (template or custom)
- ✅ Assigned students with names
- ✅ Role descriptions stored
- ✅ Ready for mission progress tracking

---

## Data Model Example

```json
{
  "team": {
    "id": "team-alpha",
    "name": "Team Alpha",
    "school_id": "school-123"
  },
  "configuration": {
    "template_id": "template-classic-4",
    "is_custom": false,
    "roles_count": 4
  },
  "roles": [
    {
      "name": "Designer",
      "description": "UX/UI and design decisions"
    },
    {
      "name": "Developer",
      "description": "Hardware/software implementation"
    },
    {
      "name": "Project Manager",
      "description": "Coordination and timeline"
    },
    {
      "name": "Communicator",
      "description": "Documentation and presentation"
    }
  ],
  "members": [
    {
      "student_id": "student-001",
      "full_name": "Sarah Ahmed",
      "assigned_role": "Designer",
      "role_description": "UX/UI and design decisions"
    },
    {
      "student_id": "student-002",
      "full_name": "Alex Okafor",
      "assigned_role": "Developer",
      "role_description": "Hardware/software implementation"
    },
    {
      "student_id": "student-003",
      "full_name": "Maria Silva",
      "assigned_role": "Project Manager",
      "role_description": "Coordination and timeline"
    },
    {
      "student_id": "student-004",
      "full_name": "James Obi",
      "assigned_role": "Communicator",
      "role_description": "Documentation and presentation"
    }
  ]
}
```

---

## Key Features

### ✅ Template-Based Setup
- 4 predefined templates
- Fast configuration (one click)
- Consistent team structures

### ✅ Custom Roles
- Teachers define their own roles
- Per-team customization
- Flexible team sizes (3, 4, 5+ members)

### ✅ Teacher Input
- Enter student full names
- Assign roles explicitly
- Edit assignments anytime

### ✅ Collaboration Tracking
- Role contributions tracked per student
- Evidence of who did what
- Assessment of role handoffs

### ✅ RLS Security
- Teachers only see their school's teams
- Students only see their own role
- Proper access control

---

## Integration Points

### 1. TeamSetup Component
```tsx
<TeamSetup
  schoolId={schoolId}
  teacherId={teacherId}
  teamId={teamId}
  teamName={teamName}
  students={allStudents}
  onSave={(config) => {
    // Save to database
    // Update team_configurations + team_member_profiles
  }}
/>
```

### 2. Team Mission Progress
```tsx
// Fetch flexible roles instead of hardcoded ones
const { data: config } = await supabase
  .from('team_configurations')
  .select('*, roles:role_templates(*)')
  .eq('team_id', teamId)
  .single();

const roles = config.roles || [];
```

### 3. Role Contributions
```tsx
// Track contributions to flexible roles
const { data: contributions } = await supabase
  .from('role_contributions')
  .select('*, team_role:team_roles(*)')
  .eq('team_id', teamId)
  .eq('stage_id', stageId);

// Display: Sarah (Designer) — ✅ Completed
```

---

## Next Steps

1. **Deploy migration:** `supabase db push`
2. **Create team setup page:** `/lab/setup-teams`
3. **Integrate with InstructionalMaterials:** Use flexible roles in TeamMissionProgress
4. **Teacher onboarding:** Guide through setup wizard after registration
5. **Testing:** Test with custom roles, different team sizes

---

## Files

✅ `supabase/migrations/013_dynamic_team_roles.sql` — Database schema  
✅ `src/components/lab/TeamSetup.tsx` — Three-step wizard component  
✅ `DYNAMIC-TEAM-ROLES-SYSTEM.md` — This documentation

---

## Success Metrics

✅ Teacher can choose role template  
✅ Teacher can create custom roles  
✅ Teacher can assign 4+ students to roles  
✅ Teacher can enter student full names  
✅ System tracks role contributions  
✅ Organizers see who did what  

