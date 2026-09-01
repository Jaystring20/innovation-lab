-- ============================================================================
-- DYNAMIC TEAM ROLES - REPLACE HARDCODED ROLES WITH FLEXIBLE SYSTEM
-- ============================================================================
-- This migration updates the team roles system to support:
-- - Dynamic number of roles per team (not fixed at 4)
-- - Teacher input for team member names
-- - Custom role creation per team
-- - Role templates for quick setup
-- ============================================================================

-- ============================================================================
-- [1] DROP CONSTRAINTS (Update existing team_roles table)
-- ============================================================================
-- We need to allow multiple rows per team with different role combinations
-- Remove the UNIQUE constraint on (team_id, role_name)

ALTER TABLE team_roles DROP CONSTRAINT IF EXISTS team_roles_team_id_role_name_key;

-- ============================================================================
-- [2] ROLE TEMPLATES (Predefined role sets teachers can use)
-- ============================================================================
CREATE TABLE IF NOT EXISTS role_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_name TEXT NOT NULL, -- "Classic 4", "Tech-Heavy", "Leadership", "Balanced"
  description TEXT,
  roles JSONB NOT NULL, -- Array of {name, description}
  is_default BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(template_name)
);

-- Insert default templates
INSERT INTO role_templates (template_name, description, roles, is_default) VALUES
  (
    'Classic 4-Role',
    'Standard team structure: Designer, Developer, Project Manager, Communicator',
    '[
      {"name": "Designer", "description": "UX/UI and design decisions"},
      {"name": "Developer", "description": "Hardware/software implementation"},
      {"name": "Project Manager", "description": "Coordination and timeline"},
      {"name": "Communicator", "description": "Documentation and presentation"}
    ]'::jsonb,
    TRUE
  ),
  (
    'Tech-Heavy',
    'Focus on technical roles: Lead Developer, Hardware Engineer, AI Specialist, Tester',
    '[
      {"name": "Lead Developer", "description": "Software architecture"},
      {"name": "Hardware Engineer", "description": "Physical build"},
      {"name": "AI Specialist", "description": "Machine learning integration"},
      {"name": "QA Tester", "description": "Testing and validation"}
    ]'::jsonb,
    FALSE
  ),
  (
    'Leadership',
    'Leadership-focused: Project Lead, Technical Lead, Business Lead, Communications Lead',
    '[
      {"name": "Project Lead", "description": "Overall project management"},
      {"name": "Technical Lead", "description": "Technical decision-making"},
      {"name": "Business Lead", "description": "Market research and strategy"},
      {"name": "Communications Lead", "description": "Stakeholder communication"}
    ]'::jsonb,
    FALSE
  ),
  (
    'Balanced 5-Role',
    'Larger teams: Designer, Frontend Dev, Backend Dev, Project Manager, Communicator',
    '[
      {"name": "Designer", "description": "Product design"},
      {"name": "Frontend Developer", "description": "User interface"},
      {"name": "Backend Developer", "description": "System logic"},
      {"name": "Project Manager", "description": "Coordination"},
      {"name": "Communicator", "description": "Documentation"}
    ]'::jsonb,
    FALSE
  );

-- ============================================================================
-- [3] UPDATE team_roles TABLE - Add flexibility
-- ============================================================================
-- Add column for role description
ALTER TABLE team_roles
ADD COLUMN IF NOT EXISTS role_description TEXT,
ADD COLUMN IF NOT EXISTS student_full_name TEXT, -- Teacher inputs this
ADD COLUMN IF NOT EXISTS is_custom_role BOOLEAN DEFAULT FALSE;

-- Make the constraint more flexible: allow same student in multiple roles (if needed)
-- But keep UNIQUE on (team_id, role_name) to prevent duplicate roles
ALTER TABLE team_roles
ADD CONSTRAINT team_roles_unique_role_per_team
UNIQUE (team_id, role_name)
ON CONFLICT DO NOTHING; -- Allow re-adding if it exists

-- ============================================================================
-- [4] TEAM CONFIGURATIONS - Track which template each team used
-- ============================================================================
CREATE TABLE IF NOT EXISTS team_configurations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  template_id UUID REFERENCES role_templates(id) ON DELETE SET NULL,
  is_custom BOOLEAN DEFAULT FALSE, -- TRUE if teacher created custom roles
  roles_count INTEGER DEFAULT 4,
  configured_by UUID REFERENCES auth.users(id), -- Teacher who configured
  configured_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id)
);

CREATE INDEX idx_team_configurations_team ON team_configurations(team_id);

-- ============================================================================
-- [5] CUSTOM ROLES (For teams with custom role sets)
-- ============================================================================
CREATE TABLE IF NOT EXISTS custom_team_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  role_name TEXT NOT NULL,
  role_description TEXT,
  role_order INTEGER, -- Display order
  created_by UUID NOT NULL REFERENCES auth.users(id), -- Teacher
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, role_name)
);

CREATE INDEX idx_custom_team_roles_team ON custom_team_roles(team_id);

-- ============================================================================
-- [6] TEAM MEMBER PROFILES - Store more detailed student info per team
-- ============================================================================
CREATE TABLE IF NOT EXISTS team_member_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  assigned_role TEXT NOT NULL, -- Role name assigned to this student
  full_name TEXT, -- Teacher can override/provide full name
  bio TEXT, -- Student role description/bio
  assigned_by UUID REFERENCES auth.users(id), -- Teacher who assigned
  assigned_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(team_id, student_id, assigned_role)
);

CREATE INDEX idx_team_member_profiles_team ON team_member_profiles(team_id);
CREATE INDEX idx_team_member_profiles_student ON team_member_profiles(student_id);

-- ============================================================================
-- [7] UPDATE role_contributions TO USE FLEXIBLE ROLES
-- ============================================================================
-- Ensure role_contributions can reference any role name (not just predefined ones)
ALTER TABLE role_contributions
ADD CONSTRAINT fk_role_contributions_role
FOREIGN KEY (team_role_id) REFERENCES team_roles(id) ON DELETE CASCADE;

-- ============================================================================
-- ROW-LEVEL SECURITY - UPDATED
-- ============================================================================

-- Teachers can see their school's teams and configurations
ALTER TABLE team_configurations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers see their school teams" ON team_configurations
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_configurations.team_id
      AND teams.school_id IN (
        SELECT DISTINCT school_id FROM teachers WHERE user_id = auth.uid()
      )
    )
  );

-- Teachers can configure their school's teams
CREATE POLICY "Teachers configure their school teams" ON team_configurations
  FOR INSERT WITH CHECK (
    EXISTS (
      SELECT 1 FROM teams
      WHERE teams.id = team_id
      AND teams.school_id IN (
        SELECT DISTINCT school_id FROM teachers WHERE user_id = auth.uid()
      )
    )
  );

-- Teachers can view custom roles they created
ALTER TABLE custom_team_roles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Teachers see custom roles they created" ON custom_team_roles
  FOR SELECT USING (created_by = auth.uid());

CREATE POLICY "Teachers create custom roles for their teams" ON custom_team_roles
  FOR INSERT WITH CHECK (created_by = auth.uid());

-- Team members can view their role assignments
ALTER TABLE team_member_profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Students see their team role" ON team_member_profiles
  FOR SELECT USING (student_id = auth.uid() OR assigned_by = auth.uid());

Create POLICY "Teachers assign roles" ON team_member_profiles
  FOR INSERT WITH CHECK (assigned_by = auth.uid());

-- ============================================================================
-- DOCUMENTATION / COMMENTS
-- ============================================================================
COMMENT ON TABLE role_templates IS 'Predefined role templates for quick team setup';
COMMENT ON TABLE team_configurations IS 'Track which template/config each team uses';
COMMENT ON TABLE custom_team_roles IS 'Custom roles created by teachers for specific teams';
COMMENT ON TABLE team_member_profiles IS 'Student -> Role assignments with teacher-provided names';
