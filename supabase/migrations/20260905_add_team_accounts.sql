-- Add team_id and is_team_account columns to profiles table
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE SET NULL;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS is_team_account BOOLEAN DEFAULT false;

-- Add teacher_id column to teams table to link teacher to team
ALTER TABLE teams ADD COLUMN IF NOT EXISTS teacher_id UUID REFERENCES profiles(id) ON DELETE SET NULL;

-- Create team_members table to track students in each team account
CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL REFERENCES teams(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  student_name TEXT NOT NULL,
  order_index INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  UNIQUE(team_id, user_id)
);

-- Add RLS policies for team_members
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;

-- Allow teachers to see team members in their school
CREATE POLICY "Teachers can view team members" ON team_members
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM teams t
      INNER JOIN profiles p ON p.id = t.teacher_id
      WHERE t.id = team_members.team_id AND p.id = auth.uid()
    )
  );

-- Allow team account users to see other team members
CREATE POLICY "Team members can view team members" ON team_members
  FOR SELECT USING (
    user_id = auth.uid() OR
    EXISTS (
      SELECT 1 FROM teams t
      WHERE t.id = team_members.team_id AND t.id IN (
        SELECT team_id FROM profiles WHERE id = auth.uid() AND is_team_account = true
      )
    )
  );

-- Update RLS policies on profiles table to support team accounts
CREATE POLICY "Team account users can view their team" ON profiles
  FOR SELECT USING (
    id = auth.uid() OR
    (is_team_account AND school_id = (SELECT school_id FROM profiles WHERE id = auth.uid())) OR
    EXISTS (
      SELECT 1 FROM profiles p2 WHERE p2.id = auth.uid() AND p2.team_id = profiles.team_id
    )
  );

-- Create index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_team_id ON profiles(team_id);
CREATE INDEX IF NOT EXISTS idx_profiles_is_team_account ON profiles(is_team_account);
CREATE INDEX IF NOT EXISTS idx_team_members_team_id ON team_members(team_id);
CREATE INDEX IF NOT EXISTS idx_team_members_user_id ON team_members(user_id);
