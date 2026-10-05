-- 007_analytics_tables.sql
-- Create Analytics, Notifications, and Assets tables

-- Content Assets table
CREATE TABLE IF NOT EXISTS content_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  document_id UUID NOT NULL,
  asset_type VARCHAR NOT NULL CHECK (asset_type IN ('video', 'pdf', 'image', 'document', 'slide', 'audio', 'interactive', 'link')),
  file_name VARCHAR NOT NULL,
  file_size INT,
  file_url VARCHAR NOT NULL,
  mime_type VARCHAR,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Student Progress table
CREATE TABLE IF NOT EXISTS student_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  level_id UUID NOT NULL,
  lessons_completed INT NOT NULL DEFAULT 0,
  assessments_completed INT NOT NULL DEFAULT 0,
  missions_completed INT NOT NULL DEFAULT 0,
  total_xp INT NOT NULL DEFAULT 0,
  current_xp INT NOT NULL DEFAULT 0,
  xp_to_next_level INT NOT NULL DEFAULT 1000,
  current_level INT NOT NULL DEFAULT 1,
  quiz_scores JSONB DEFAULT '[]',
  last_activity_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- User Notification Preferences table
CREATE TABLE IF NOT EXISTS user_notification_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  email_notifications BOOLEAN DEFAULT true,
  lesson_published BOOLEAN DEFAULT true,
  assessment_available BOOLEAN DEFAULT true,
  mission_unlocked BOOLEAN DEFAULT true,
  submission_reviewed BOOLEAN DEFAULT true,
  score_published BOOLEAN DEFAULT true,
  team_invitation BOOLEAN DEFAULT true,
  deadline_reminder BOOLEAN DEFAULT true,
  webhook_url VARCHAR,
  webhook_enabled BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notification Queue table (for async processing)
CREATE TABLE IF NOT EXISTS notification_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  notification_type VARCHAR NOT NULL,
  recipient_email VARCHAR NOT NULL,
  subject VARCHAR NOT NULL,
  content JSONB NOT NULL,
  status VARCHAR NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'sent', 'failed', 'retry')),
  retry_count INT DEFAULT 0,
  error_message TEXT,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Notification Events table (for analytics)
CREATE TABLE IF NOT EXISTS notification_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type VARCHAR NOT NULL,
  event_data JSONB NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes
CREATE INDEX idx_content_assets_document_id ON content_assets(document_id);
CREATE INDEX idx_content_assets_asset_type ON content_assets(asset_type);
CREATE INDEX idx_student_progress_student_id ON student_progress(student_id);
CREATE INDEX idx_student_progress_level_id ON student_progress(level_id);
CREATE INDEX idx_user_notification_preferences_user_id ON user_notification_preferences(user_id);
CREATE INDEX idx_notification_queue_user_id ON notification_queue(user_id);
CREATE INDEX idx_notification_queue_status ON notification_queue(status);
CREATE INDEX idx_notification_events_user_id ON notification_events(user_id);
CREATE INDEX idx_notification_events_event_type ON notification_events(event_type);
CREATE INDEX idx_notification_events_created_at ON notification_events(created_at);

-- Enable RLS
ALTER TABLE content_assets ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_notification_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE notification_events ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Content Assets: Public read for admins, user-scoped for students
CREATE POLICY "Admins can view all content_assets"
  ON content_assets FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.role IN ('super_admin', 'editor')
    )
  );

CREATE POLICY "Admins can manage content_assets"
  ON content_assets FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.role IN ('super_admin', 'editor')
    )
  );

-- Student Progress: Users can view their own, admins can view all
CREATE POLICY "Students can view their own progress"
  ON student_progress FOR SELECT
  TO authenticated
  USING (student_id = auth.uid() OR EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid()
  ));

CREATE POLICY "Admins can manage student_progress"
  ON student_progress FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.role IN ('super_admin', 'organizer')
    )
  );

-- Notification Preferences: Users manage their own
CREATE POLICY "Users can view their own notification_preferences"
  ON user_notification_preferences FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR EXISTS (
    SELECT 1 FROM admin_users
    WHERE admin_users.user_id = auth.uid()
  ));

CREATE POLICY "Users can update their own notification_preferences"
  ON user_notification_preferences FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert their own notification_preferences"
  ON user_notification_preferences FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Notification Queue: Admins only
CREATE POLICY "Admins can manage notification_queue"
  ON notification_queue FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
      AND admin_users.role IN ('super_admin', 'organizer')
    )
  );

-- Notification Events: Admins only
CREATE POLICY "Admins can view notification_events"
  ON notification_events FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM admin_users
      WHERE admin_users.user_id = auth.uid()
    )
  );
