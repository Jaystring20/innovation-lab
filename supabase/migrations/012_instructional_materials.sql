-- ============================================================================
-- INSTRUCTIONAL MATERIALS & TEAM MISSION TRACKING
-- ============================================================================
-- Tables to support organizer-provided materials, teacher supplements,
-- and team-based mission progress tracking with role contributions

-- ============================================================================
-- [1] ORGANIZER MISSIONS (Read-only by teachers)
-- ============================================================================
CREATE TABLE IF NOT EXISTS organizer_missions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id TEXT NOT NULL, -- 'design', 'build', 'intelligize'
  stage_name TEXT NOT NULL, -- "Design Phase", etc.
  title TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(stage_id)
);

CREATE TABLE IF NOT EXISTS mission_steps (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  mission_id UUID NOT NULL REFERENCES organizer_missions(id) ON DELETE CASCADE,
  step_number INTEGER NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  success_criteria TEXT,
  estimated_time TEXT, -- "2 class periods", etc.
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(mission_id, step_number)
);

CREATE INDEX idx_mission_steps_mission_id ON mission_steps(mission_id);

-- ============================================================================
-- [2] ORGANIZER LESSONS & RESOURCES
-- ============================================================================
CREATE TABLE IF NOT EXISTS organizer_resources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id TEXT NOT NULL, -- 'design', 'build', 'intelligize'
  resource_type TEXT NOT NULL, -- 'video', 'pdf', 'doc', 'template'
  title TEXT NOT NULL,
  description TEXT,
  file_size TEXT,
  duration TEXT, -- for videos
  file_url TEXT,
  gdrive_id TEXT, -- Google Drive file ID
  gdrive_url TEXT,
  uploaded_by TEXT, -- organizer name or "STEAM Foundry"
  uploaded_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(id)
);

CREATE INDEX idx_organizer_resources_stage ON organizer_resources(stage_id);
CREATE INDEX idx_organizer_resources_type ON organizer_resources(resource_type);

-- ============================================================================
-- [3] TEACHER SUPPLEMENTARY MATERIALS
-- ============================================================================
CREATE TABLE IF NOT EXISTS teacher_supplementary_materials (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  teacher_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  stage_id TEXT NOT NULL, -- 'design', 'build', 'intelligize'
  file_name TEXT NOT NULL,
  file_size TEXT,
  file_type TEXT, -- 'video', 'pdf', 'doc', etc.
  gdrive_id TEXT,
  gdrive_url TEXT,
  sync_status TEXT DEFAULT 'pending', -- 'pending', 'syncing', 'synced', 'failed'
  students_synced INTEGER DEFAULT 0,
  total_students INTEGER DEFAULT 0,
  uploaded_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_supplementary_materials_teacher ON teacher_supplementary_materials(teacher_id);
CREATE INDEX idx_supplementary_materials_school ON teacher_supplementary_materials(school_id);
CREATE INDEX idx_supplementary_materials_stage ON teacher_supplementary_materials(stage_id);

-- ============================================================================
-- [4] TEAMS (Collaborative groups of students)
-- ============================================================================
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  school_id UUID NOT NULL REFERENCES schools(id) ON DELETE CASCADE,
  team_name TEXT NOT NULL,
  team_number INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(school_id, team_name)
);

CREATE INDEX idx_teams_school ON teams(school_id);

-- ============================================================================
-- [5] TEAM ROLES (Define roles within a team)
-- ============================================================================
CREATE TABLE IF NOT EXISTS team_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  role_name TEXT NOT NULL, -- 'Designer', 'Developer', 'Project Manager', 'Communicator'
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, student_id),
  UNIQUE(team_id, role_name)
);

CREATE INDEX idx_team_roles_team ON team_roles(team_id);
CREATE INDEX idx_team_roles_student ON team_roles(student_id);

-- ============================================================================
-- [6] TEAM MISSION PROGRESS (Track team progress on each stage)
-- ============================================================================
CREATE TABLE IF NOT EXISTS team_mission_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  stage_id TEXT NOT NULL, -- 'design', 'build', 'intelligize'
  current_step INTEGER DEFAULT 0,
  total_steps INTEGER DEFAULT 0,
  overall_progress INTEGER DEFAULT 0, -- 0-100%
  started_date TIMESTAMP WITH TIME ZONE,
  completed_date TIMESTAMP WITH TIME ZONE,
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, stage_id)
);

CREATE INDEX idx_team_mission_progress_team ON team_mission_progress(team_id);
CREATE INDEX idx_team_mission_progress_stage ON team_mission_progress(stage_id);

-- ============================================================================
-- [7] ROLE CONTRIBUTIONS (Track individual contributions within team)
-- ============================================================================
CREATE TABLE IF NOT EXISTS role_contributions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  team_role_id UUID NOT NULL REFERENCES team_roles(id) ON DELETE CASCADE,
  stage_id TEXT NOT NULL,
  mission_step_id UUID REFERENCES mission_steps(id) ON DELETE SET NULL,
  status TEXT DEFAULT 'not-started', -- 'not-started', 'in-progress', 'completed'
  contribution_description TEXT,
  completed_date TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_role_contributions_team ON role_contributions(team_id);
CREATE INDEX idx_role_contributions_role ON role_contributions(team_role_id);
CREATE INDEX idx_role_contributions_stage ON role_contributions(stage_id);
CREATE INDEX idx_role_contributions_status ON role_contributions(status);

-- ============================================================================
-- [8] LIVE SESSIONS (Organizer-hosted Google Meet sessions)
-- ============================================================================
CREATE TABLE IF NOT EXISTS live_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  stage_id TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  scheduled_date DATE,
  scheduled_time_start TIME,
  scheduled_time_end TIME,
  timezone TEXT DEFAULT 'Africa/Lagos',
  meeting_url TEXT,
  google_meet_id TEXT,
  hosted_by TEXT, -- organizer name
  status TEXT DEFAULT 'upcoming', -- 'upcoming', 'in-progress', 'completed'
  recording_url TEXT,
  recording_duration TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_live_sessions_stage ON live_sessions(stage_id);
CREATE INDEX idx_live_sessions_status ON live_sessions(status);
CREATE INDEX idx_live_sessions_scheduled_date ON live_sessions(scheduled_date);

-- ============================================================================
-- REALTIME SYNC TABLE
-- ============================================================================
-- Tracks when teacher materials are synced to student dashboards
CREATE TABLE IF NOT EXISTS material_sync_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  material_id UUID NOT NULL REFERENCES teacher_supplementary_materials(id) ON DELETE CASCADE,
  students_synced INTEGER,
  total_students INTEGER,
  sync_completed_at TIMESTAMP WITH TIME ZONE,
  sync_status TEXT DEFAULT 'pending', -- 'pending', 'in-progress', 'completed', 'failed'
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_material_sync_log_material ON material_sync_log(material_id);

-- ============================================================================
-- ROW-LEVEL SECURITY
-- ============================================================================

-- Teachers can only see their own supplementary materials
ALTER TABLE teacher_supplementary_materials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers view own materials" ON teacher_supplementary_materials
  FOR SELECT USING (auth.uid() = teacher_id);

CREATE POLICY "Teachers create own materials" ON teacher_supplementary_materials
  FOR INSERT WITH CHECK (auth.uid() = teacher_id);

CREATE POLICY "Teachers update own materials" ON teacher_supplementary_materials
  FOR UPDATE USING (auth.uid() = teacher_id);

-- Students can view team progress
ALTER TABLE team_mission_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teams view their progress" ON team_mission_progress
  FOR SELECT USING (true); -- TODO: join through teams to verify student membership

-- Role contributions visible to team members
ALTER TABLE role_contributions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Team members view contributions" ON role_contributions
  FOR SELECT USING (true); -- TODO: join through teams to verify student membership

-- ============================================================================
-- AUTOMATION LOG UPDATES
-- ============================================================================
-- Extend automation_log to track material sync events
-- (automation_log already exists from previous migrations)

-- Example automation events:
-- event_type: 'material_upload' - when teacher uploads supplementary material
-- event_type: 'material_sync' - when material syncs to students
-- event_type: 'mission_progress_updated' - when team progress changes
-- event_type: 'role_contribution_recorded' - when role contribution logged

