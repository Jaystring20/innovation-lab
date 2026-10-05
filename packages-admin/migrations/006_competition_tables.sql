-- 006_competition_tables.sql
-- Create Competition module tables

-- Competition Stages table
CREATE TABLE IF NOT EXISTS competition_stages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  description TEXT,
  start_date TIMESTAMPTZ NOT NULL,
  end_date TIMESTAMPTZ NOT NULL,
  submission_deadline TIMESTAMPTZ NOT NULL,
  min_team_size INT NOT NULL CHECK (min_team_size >= 1),
  max_team_size INT NOT NULL CHECK (max_team_size >= min_team_size),
  theme VARCHAR,
  requirements TEXT,
  order_index INT NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'active', 'closed')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Teams table
CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR NOT NULL,
  description TEXT,
  school_or_org VARCHAR NOT NULL,
  stage_id UUID NOT NULL REFERENCES competition_stages(id) ON DELETE CASCADE,
  mentor_name VARCHAR,
  mentor_email VARCHAR,
  status VARCHAR NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'disqualified')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Team Members table
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  name VARCHAR NOT NULL,
  email VARCHAR NOT NULL,
  role VARCHAR NOT NULL CHECK (role IN ('leader', 'developer', 'designer', 'researcher')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Submissions table
CREATE TABLE IF NOT EXISTS submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  stage_id UUID NOT NULL REFERENCES competition_stages(id) ON DELETE CASCADE,
  title VARCHAR NOT NULL,
  description TEXT,
  repo_url VARCHAR,
  demo_url VARCHAR,
  status VARCHAR NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'under_review', 'accepted', 'rejected')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Submission Reviews table
CREATE TABLE IF NOT EXISTS submission_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  reviewer_comments TEXT,
  status VARCHAR NOT NULL DEFAULT 'reviewing' CHECK (status IN ('reviewing', 'pending_revision', 'approved')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Submission Scores table
CREATE TABLE IF NOT EXISTS submission_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE UNIQUE,
  innovation_score INT NOT NULL CHECK (innovation_score >= 0 AND innovation_score <= 100),
  implementation_score INT NOT NULL CHECK (implementation_score >= 0 AND implementation_score <= 100),
  collaboration_score INT NOT NULL CHECK (collaboration_score >= 0 AND collaboration_score <= 100),
  sustainability_score INT NOT NULL CHECK (sustainability_score >= 0 AND sustainability_score <= 100),
  presentation_score INT NOT NULL CHECK (presentation_score >= 0 AND presentation_score <= 100),
  feedback TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_competition_stages_status ON competition_stages(status);
CREATE INDEX idx_teams_stage_id ON teams(stage_id);
CREATE INDEX idx_team_members_team_id ON team_members(team_id);
CREATE INDEX idx_submissions_team_id ON submissions(team_id);
CREATE INDEX idx_submissions_stage_id ON submissions(stage_id);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_submission_reviews_submission_id ON submission_reviews(submission_id);
CREATE INDEX idx_submission_scores_submission_id ON submission_scores(submission_id);

-- Enable RLS
ALTER TABLE competition_stages ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE submission_scores ENABLE ROW LEVEL SECURITY;

-- RLS Policies (admin access)
CREATE POLICY "Admins can view all competition_stages"
  ON competition_stages FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.role IN ('super_admin', 'organizer')
    )
  );

CREATE POLICY "Admins can manage competition_stages"
  ON competition_stages FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.role IN ('super_admin', 'organizer')
    )
  );

-- Similar policies for other tables (abbreviated for brevity)
CREATE POLICY "Admins can view all teams"
  ON teams FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.role IN ('super_admin', 'organizer')
    )
  );

CREATE POLICY "Admins can manage teams"
  ON teams FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.role IN ('super_admin', 'organizer')
    )
  );
