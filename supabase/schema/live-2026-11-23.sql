-- Snapshot of the live database (project sctsrxuquhzdjjnlsqbm), public schema
-- plus storage policies and the auth.users trigger, taken 2026-11-23 with
-- scripts/export-schema.sql. Structure only, no data.
--
-- This is a reference, not a migration: it records what production actually
-- is, including tables created outside supabase/migrations/. Diff against it
-- before writing a migration, and regenerate it after schema changes.

create type public.admin_role as enum ('super_admin', 'curriculum_editor', 'organizer', 'viewer');

create type public.asset_type as enum ('video', 'pdf', 'image', 'document', 'slide', 'audio', 'interactive', 'link');

create type public.content_status as enum ('draft', 'published', 'archived');

create type public.question_type as enum ('multiple_choice', 'true_false', 'drag_order', 'image_select');

create type public.user_role as enum ('organizer', 'judge', 'teacher', 'student');

create table public.admin_users (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  role admin_role not null default 'viewer'::admin_role,
  tier_scope uuid[],
  created_at timestamp with time zone default now()
);

create table public.assessment_attempts (
  id uuid not null default gen_random_uuid(),
  student_id uuid,
  team_id uuid,
  assessment_id uuid not null,
  assessment_snapshot jsonb,
  answers jsonb not null,
  score_pct integer not null,
  passed boolean not null,
  attempt_number integer not null default 1,
  xp_earned integer default 0,
  completed_at timestamp with time zone default now()
);

create table public.assessment_questions (
  id uuid not null default gen_random_uuid(),
  assessment_id uuid not null,
  question_type question_type not null default 'multiple_choice'::question_type,
  question_text text not null,
  image_url text,
  options jsonb not null,
  explanation text,
  order_index integer default 1,
  status content_status default 'draft'::content_status,
  created_at timestamp with time zone default now()
);

create table public.assessment_results (
  id uuid not null default gen_random_uuid(),
  submission_id uuid not null,
  assessment_type text not null,
  status text not null default 'pending'::text,
  error_message text,
  result jsonb,
  run_at timestamp without time zone,
  completed_at timestamp without time zone,
  created_at timestamp without time zone default now()
);

create table public.assessment_templates (
  id uuid not null default gen_random_uuid(),
  name text not null,
  description text,
  stage_key text,
  division text,
  criteria jsonb not null,
  judge_instructions text,
  scoring_guide jsonb,
  is_active boolean default true,
  created_at timestamp without time zone default now(),
  updated_at timestamp without time zone default now()
);

create table public.assessments (
  id uuid not null default gen_random_uuid(),
  document_id uuid default gen_random_uuid(),
  level_id uuid,
  title character varying not null,
  passing_score_pct integer not null default 70,
  max_attempts integer,
  status content_status default 'draft'::content_status,
  version integer default 1,
  last_edited_by uuid,
  last_edited_at timestamp with time zone default now(),
  created_at timestamp with time zone default now()
);

create table public.assets (
  id uuid not null,
  document_id uuid,
  file_name character varying,
  file_type character varying,
  file_url text,
  file_size integer,
  uploaded_by uuid,
  created_at timestamp with time zone
);

create table public.automation_log (
  id uuid not null default gen_random_uuid(),
  submission_id uuid,
  automation_type text not null,
  status text not null,
  details jsonb,
  created_at timestamp without time zone default now(),
  file_id uuid
);

create table public.content_assets (
  id uuid not null default gen_random_uuid(),
  document_id uuid not null,
  asset_type asset_type not null,
  title character varying not null,
  description text,
  file_name character varying,
  file_url text not null,
  file_size integer,
  storage_path text,
  is_external boolean default false,
  uploaded_by uuid,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public.content_version_history (
  id uuid not null default gen_random_uuid(),
  document_id uuid not null,
  table_name character varying not null,
  snapshot jsonb not null,
  published_by uuid,
  published_at timestamp with time zone default now()
);

create table public.custom_team_roles (
  id uuid not null default gen_random_uuid(),
  team_id uuid not null,
  role_name text not null,
  role_description text,
  role_order integer,
  created_by uuid not null,
  created_at timestamp with time zone default now()
);

create table public.file_upload_sessions (
  id uuid not null default gen_random_uuid(),
  submission_id uuid not null,
  file_name text not null,
  file_size bigint not null,
  file_type text not null,
  chunks_total integer,
  chunks_completed integer default 0,
  google_drive_folder_id text,
  status text default 'initiated'::text,
  session_token text,
  expires_at timestamp without time zone,
  created_at timestamp without time zone default now(),
  updated_at timestamp without time zone default now()
);

create table public.kits (
  id uuid not null default gen_random_uuid(),
  division text not null,
  name text not null,
  unit_price numeric(12,2) not null,
  bom jsonb not null,
  created_at timestamp with time zone not null default now()
);

create table public.lab_mission_progress (
  id uuid not null default gen_random_uuid(),
  student_id uuid,
  team_id uuid,
  lab_mission_id uuid not null,
  status character varying not null default 'not_started'::character varying,
  submission_code text,
  progress_percent integer default 0,
  score integer,
  started_at timestamp with time zone,
  submitted_at timestamp with time zone,
  completed_at timestamp with time zone,
  last_updated_by uuid,
  updated_at timestamp with time zone default now()
);

create table public.lab_missions (
  id uuid not null default gen_random_uuid(),
  document_id uuid default gen_random_uuid(),
  tier_id uuid not null,
  level_id uuid not null,
  title character varying not null,
  description text not null,
  instructions text not null,
  difficulty character varying not null default 'Basic'::character varying,
  duration_minutes integer not null default 30,
  language character varying default 'blockly'::character varying,
  tinkercad_design_id character varying,
  learning_objectives jsonb,
  hints jsonb,
  starter_code text,
  test_cases jsonb,
  xp_reward integer default 100,
  status content_status default 'draft'::content_status,
  version integer default 1,
  last_edited_by uuid,
  last_edited_at timestamp with time zone default now(),
  created_at timestamp with time zone default now(),
  supplementary_assets uuid[] default ARRAY[]::uuid[]
);

create table public.lesson_progress (
  id uuid not null default gen_random_uuid(),
  student_id uuid not null,
  lesson_id uuid not null,
  completed_at timestamp with time zone,
  xp_earned integer default 0
);

create table public.lessons (
  id uuid not null default gen_random_uuid(),
  document_id uuid default gen_random_uuid(),
  level_id uuid not null,
  title character varying not null,
  content_type character varying not null,
  content_url text,
  content_body text,
  estimated_minutes integer default 5,
  xp_reward integer default 10,
  order_index integer default 1,
  status content_status default 'draft'::content_status,
  version integer default 1,
  last_edited_by uuid,
  last_edited_at timestamp with time zone default now(),
  created_at timestamp with time zone default now(),
  supplementary_assets uuid[] default ARRAY[]::uuid[]
);

create table public.levels (
  id uuid not null default gen_random_uuid(),
  document_id uuid default gen_random_uuid(),
  tier_id uuid not null,
  stage_id text not null,
  title character varying not null,
  order_index integer not null,
  outcome_statement text not null,
  status content_status default 'draft'::content_status,
  version integer default 1,
  last_edited_by uuid,
  last_edited_at timestamp with time zone default now(),
  created_at timestamp with time zone default now()
);

create table public.live_sessions (
  id uuid not null default gen_random_uuid(),
  stage_id text not null,
  title text not null,
  description text,
  scheduled_date date,
  scheduled_time_start time without time zone,
  scheduled_time_end time without time zone,
  timezone text default 'Africa/Lagos'::text,
  meeting_url text,
  google_meet_id text,
  hosted_by text,
  status text default 'upcoming'::text,
  recording_url text,
  recording_duration text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public.material_sync_log (
  id uuid not null default gen_random_uuid(),
  material_id uuid not null,
  students_synced integer,
  total_students integer,
  sync_completed_at timestamp with time zone,
  sync_status text default 'pending'::text,
  error_message text,
  created_at timestamp with time zone default now()
);

create table public.mission_steps (
  id uuid not null default gen_random_uuid(),
  mission_id uuid not null,
  step_number integer not null,
  title text not null,
  description text,
  success_criteria text,
  estimated_time text,
  created_at timestamp with time zone default now()
);

create table public.notification_log (
  id uuid not null default gen_random_uuid(),
  kind text not null,
  team_id uuid,
  stage_id uuid,
  sent_at timestamp with time zone,
  created_at timestamp with time zone not null default now()
);

create table public.orders (
  id uuid not null default gen_random_uuid(),
  school_id uuid not null,
  kit_id uuid,
  division text not null,
  team_count integer not null,
  kit_unit_price numeric(12,2) not null,
  total_amount numeric(12,2),
  status text not null default 'registered'::text,
  payment_method text,
  payment_reference text,
  proof_of_payment_url text,
  order_reference text not null,
  created_at timestamp with time zone not null default now(),
  paid_at timestamp with time zone,
  dispatched_at timestamp with time zone,
  confirmation_sent_at timestamp with time zone,
  line_items jsonb,
  fulfilment text,
  delivery_fee numeric not null default 0,
  whatsapp_pinged_at timestamp with time zone,
  receipt_sent_at timestamp with time zone
);

create table public.organizer_missions (
  id uuid not null default gen_random_uuid(),
  stage_id text not null,
  stage_name text not null,
  title text not null,
  description text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public.organizer_resources (
  id uuid not null default gen_random_uuid(),
  stage_id text not null,
  resource_type text not null,
  title text not null,
  description text,
  file_size text,
  duration text,
  file_url text,
  gdrive_id text,
  gdrive_url text,
  uploaded_by text,
  uploaded_date timestamp with time zone default now(),
  created_at timestamp with time zone default now()
);

create table public.organizer_users (
  id uuid not null default gen_random_uuid(),
  auth_user_id uuid,
  name text not null,
  email text not null,
  created_at timestamp with time zone not null default now()
);

create table public.profiles (
  id uuid not null,
  role user_role not null default 'teacher'::user_role,
  full_name text,
  email text,
  created_at timestamp with time zone not null default now(),
  school_id uuid,
  team_id uuid,
  is_team_account boolean default false
);

create table public.review_assignments (
  id uuid not null default gen_random_uuid(),
  submission_id uuid not null,
  judge_id uuid not null,
  assigned_by uuid,
  assigned_at timestamp with time zone not null default now()
);

create table public.role_contributions (
  id uuid not null default gen_random_uuid(),
  team_id uuid not null,
  team_role_id uuid not null,
  stage_id text not null,
  mission_step_id uuid,
  status text default 'not-started'::text,
  contribution_description text,
  completed_date timestamp with time zone,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public.role_templates (
  id uuid not null default gen_random_uuid(),
  template_name text not null,
  description text,
  roles jsonb not null,
  is_default boolean default false,
  created_at timestamp with time zone default now()
);

create table public.schools (
  id uuid not null default gen_random_uuid(),
  name text not null,
  state text,
  contact_name text not null,
  contact_email text not null,
  contact_phone text not null,
  division text not null,
  created_at timestamp with time zone not null default now(),
  address text not null default ''::text
);

create table public.scores (
  id uuid not null default gen_random_uuid(),
  submission_id uuid not null,
  judge_id uuid not null,
  c_design integer not null,
  c_hardware integer not null,
  c_ai integer not null,
  c_presentation integer not null,
  total integer generated always as ((((c_design + c_hardware) + c_ai) + c_presentation)) stored,
  comments text,
  submitted_at timestamp with time zone not null default now()
);

create table public.stages (
  id uuid not null default gen_random_uuid(),
  ord integer not null,
  key text not null,
  name text not null,
  deliverable_kind text not null,
  opens_at date,
  due_at date,
  weight numeric not null default 0.25,
  advance_count integer,
  auto_release_feedback boolean not null default true
);

create table public.store_settings (
  id integer not null default 1,
  lagos_delivery_fee numeric not null default 10000,
  outside_lagos_delivery_fee numeric not null default 20000,
  pickup_enabled boolean not null default true,
  pickup_location text not null default 'A pickup address in Lagos will be sent with your payment confirmation.'::text,
  updated_at timestamp with time zone not null default now(),
  whatsapp_number text not null default '2348038838094'::text,
  dispatch_note_lagos text not null default '3–5 working days after payment is confirmed'::text,
  dispatch_note_outside text not null default '5–7 working days after payment is confirmed'::text
);

create table public.student_ai_models (
  id uuid not null default gen_random_uuid(),
  student_id uuid not null,
  lab_mission_id uuid,
  model_type character varying,
  teachable_machine_url text not null,
  classes jsonb,
  accuracy_score numeric(5,2),
  created_at timestamp with time zone default now()
);

create table public.submission_files (
  id uuid not null default gen_random_uuid(),
  submission_id uuid not null,
  file_type text not null,
  source_type text not null,
  source_url text not null,
  google_drive_id text,
  google_drive_url text,
  metadata jsonb,
  preview_image_url text,
  link_status text default 'unknown'::text,
  link_checked_at timestamp without time zone,
  created_at timestamp without time zone default now(),
  updated_at timestamp without time zone default now()
);

create table public.submissions (
  id uuid not null default gen_random_uuid(),
  team_id uuid not null,
  stage_id uuid not null,
  status text not null default 'not_started'::text,
  payload jsonb not null default '{}'::jsonb,
  submitted_at timestamp with time zone,
  feedback_released_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  updated_at timestamp with time zone not null default now(),
  google_drive_folder_id text,
  google_drive_folder_url text,
  preview_metadata jsonb default '{}'::jsonb,
  analysis_metadata jsonb default '{}'::jsonb,
  gdrive_synced_at timestamp without time zone,
  preview_generated_at timestamp without time zone,
  analysis_run_at timestamp without time zone,
  upload_status text default 'pending'::text,
  uploaded_files jsonb default '[]'::jsonb
);

create table public.teacher_supplementary_materials (
  id uuid not null default gen_random_uuid(),
  school_id uuid not null,
  teacher_id uuid not null,
  stage_id text not null,
  file_name text not null,
  file_size text,
  file_type text,
  gdrive_id text,
  gdrive_url text,
  sync_status text default 'pending'::text,
  students_synced integer default 0,
  total_students integer default 0,
  uploaded_date timestamp with time zone default now(),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

create table public.team_configurations (
  id uuid not null default gen_random_uuid(),
  team_id uuid not null,
  template_id uuid,
  is_custom boolean default false,
  roles_count integer default 4,
  configured_by uuid,
  configured_at timestamp with time zone default now()
);

create table public.team_folders (
  id uuid not null default gen_random_uuid(),
  team_id uuid not null,
  school_id uuid,
  root_folder_id text,
  root_folder_url text,
  design_folder_id text,
  build_folder_id text,
  intelligize_folder_id text,
  battle_folder_id text,
  created_at timestamp without time zone default now(),
  last_synced_at timestamp without time zone,
  updated_at timestamp without time zone default now()
);

create table public.team_member_profiles (
  id uuid not null default gen_random_uuid(),
  team_id uuid not null,
  student_id uuid not null,
  assigned_role text not null,
  full_name text,
  bio text,
  assigned_by uuid,
  assigned_date timestamp with time zone default now()
);

create table public.team_mission_progress (
  id uuid not null default gen_random_uuid(),
  team_id uuid not null,
  stage_id text not null,
  current_step integer default 0,
  total_steps integer default 0,
  overall_progress integer default 0,
  started_date timestamp with time zone,
  completed_date timestamp with time zone,
  last_updated timestamp with time zone default now(),
  created_at timestamp with time zone default now()
);

create table public.team_roles (
  id uuid not null default gen_random_uuid(),
  team_id uuid not null,
  role_name text not null,
  student_id uuid not null,
  assigned_date timestamp with time zone default now(),
  role_description text,
  student_full_name text,
  is_custom_role boolean default false
);

create table public.teams (
  id uuid not null default gen_random_uuid(),
  school_id uuid not null,
  division text not null,
  name text not null,
  order_id uuid,
  eliminated_after_stage integer,
  advanced_at timestamp with time zone,
  created_at timestamp with time zone not null default now(),
  teacher_id uuid
);

create table public.tiers (
  id uuid not null default gen_random_uuid(),
  name character varying not null,
  slug character varying not null,
  grade_range character varying,
  accent_color character varying,
  vibe character varying,
  description text,
  created_at timestamp with time zone default now()
);

create table public.uploaded_submission_files (
  id uuid not null default gen_random_uuid(),
  submission_id uuid not null,
  team_id uuid not null,
  stage_id uuid not null,
  file_name text not null,
  file_size bigint not null,
  file_type text not null,
  mime_type text,
  google_drive_id text,
  google_drive_url text,
  thumbnail_url text,
  preview_metadata jsonb,
  upload_status text default 'pending'::text,
  upload_started_at timestamp without time zone,
  upload_completed_at timestamp without time zone,
  error_message text,
  created_at timestamp without time zone default now(),
  updated_at timestamp without time zone default now()
);

alter table public.admin_users add constraint admin_users_pkey PRIMARY KEY (id);

alter table public.admin_users add constraint admin_users_user_id_key UNIQUE (user_id);

alter table public.assessment_attempts add constraint assessment_attempts_check CHECK ((((student_id IS NOT NULL) AND (team_id IS NULL)) OR ((student_id IS NULL) AND (team_id IS NOT NULL))));

alter table public.assessment_attempts add constraint assessment_attempts_pkey PRIMARY KEY (id);

alter table public.assessment_questions add constraint assessment_questions_pkey PRIMARY KEY (id);

alter table public.assessment_results add constraint assessment_results_pkey PRIMARY KEY (id);

alter table public.assessment_templates add constraint assessment_templates_pkey PRIMARY KEY (id);

alter table public.assessments add constraint assessments_pkey PRIMARY KEY (id);

alter table public.assets add constraint assets_pkey PRIMARY KEY (id);

alter table public.automation_log add constraint automation_log_pkey PRIMARY KEY (id);

alter table public.content_assets add constraint content_assets_pkey PRIMARY KEY (id);

alter table public.content_version_history add constraint content_version_history_pkey PRIMARY KEY (id);

alter table public.custom_team_roles add constraint custom_team_roles_pkey PRIMARY KEY (id);

alter table public.custom_team_roles add constraint custom_team_roles_team_id_role_name_key UNIQUE (team_id, role_name);

alter table public.file_upload_sessions add constraint file_upload_sessions_pkey PRIMARY KEY (id);

alter table public.file_upload_sessions add constraint file_upload_sessions_session_token_key UNIQUE (session_token);

alter table public.kits add constraint kits_division_check CHECK ((division = ANY (ARRAY['primary'::text, 'secondary'::text, 'sixth_form'::text])));

alter table public.kits add constraint kits_pkey PRIMARY KEY (id);

alter table public.lab_mission_progress add constraint lab_mission_progress_check CHECK ((((student_id IS NOT NULL) AND (team_id IS NULL)) OR ((student_id IS NULL) AND (team_id IS NOT NULL))));

alter table public.lab_mission_progress add constraint lab_mission_progress_pkey PRIMARY KEY (id);

alter table public.lab_missions add constraint lab_missions_pkey PRIMARY KEY (id);

alter table public.lesson_progress add constraint lesson_progress_pkey PRIMARY KEY (id);

alter table public.lesson_progress add constraint lesson_progress_student_id_lesson_id_key UNIQUE (student_id, lesson_id);

alter table public.lessons add constraint lessons_pkey PRIMARY KEY (id);

alter table public.levels add constraint levels_pkey PRIMARY KEY (id);

alter table public.live_sessions add constraint live_sessions_pkey PRIMARY KEY (id);

alter table public.material_sync_log add constraint material_sync_log_pkey PRIMARY KEY (id);

alter table public.mission_steps add constraint mission_steps_mission_id_step_number_key UNIQUE (mission_id, step_number);

alter table public.mission_steps add constraint mission_steps_pkey PRIMARY KEY (id);

alter table public.notification_log add constraint notification_log_kind_team_id_stage_id_key UNIQUE (kind, team_id, stage_id);

alter table public.notification_log add constraint notification_log_pkey PRIMARY KEY (id);

alter table public.orders add constraint orders_division_check CHECK ((division = ANY (ARRAY['primary'::text, 'secondary'::text, 'sixth_form'::text])));

alter table public.orders add constraint orders_fulfilment_check CHECK ((fulfilment = ANY (ARRAY['delivery_lagos'::text, 'delivery_outside'::text, 'pickup'::text, 'none'::text])));

alter table public.orders add constraint orders_order_reference_key UNIQUE (order_reference);

alter table public.orders add constraint orders_payment_method_check CHECK ((payment_method = ANY (ARRAY['bank_transfer'::text, 'paystack'::text])));

alter table public.orders add constraint orders_pkey PRIMARY KEY (id);

alter table public.orders add constraint orders_status_check CHECK ((status = ANY (ARRAY['registered'::text, 'payment_pending'::text, 'paid'::text, 'dispatched'::text, 'cancelled'::text])));

alter table public.orders add constraint orders_team_count_check CHECK (((team_count >= 1) AND (team_count <= 100)));

alter table public.organizer_missions add constraint organizer_missions_pkey PRIMARY KEY (id);

alter table public.organizer_missions add constraint organizer_missions_stage_id_key UNIQUE (stage_id);

alter table public.organizer_resources add constraint organizer_resources_pkey PRIMARY KEY (id);

alter table public.organizer_users add constraint organizer_users_email_key UNIQUE (email);

alter table public.organizer_users add constraint organizer_users_pkey PRIMARY KEY (id);

alter table public.profiles add constraint profiles_pkey PRIMARY KEY (id);

alter table public.review_assignments add constraint review_assignments_pkey PRIMARY KEY (id);

alter table public.review_assignments add constraint review_assignments_submission_id_judge_id_key UNIQUE (submission_id, judge_id);

alter table public.role_contributions add constraint role_contributions_pkey PRIMARY KEY (id);

alter table public.role_templates add constraint role_templates_pkey PRIMARY KEY (id);

alter table public.role_templates add constraint role_templates_template_name_key UNIQUE (template_name);

alter table public.schools add constraint schools_division_check CHECK ((division = ANY (ARRAY['primary'::text, 'secondary'::text, 'sixth_form'::text])));

alter table public.schools add constraint schools_pkey PRIMARY KEY (id);

alter table public.scores add constraint scores_c_ai_check CHECK (((c_ai >= 0) AND (c_ai <= 30)));

alter table public.scores add constraint scores_c_design_check CHECK (((c_design >= 0) AND (c_design <= 20)));

alter table public.scores add constraint scores_c_hardware_check CHECK (((c_hardware >= 0) AND (c_hardware <= 30)));

alter table public.scores add constraint scores_c_presentation_check CHECK (((c_presentation >= 0) AND (c_presentation <= 20)));

alter table public.scores add constraint scores_pkey PRIMARY KEY (id);

alter table public.scores add constraint scores_submission_id_judge_id_key UNIQUE (submission_id, judge_id);

alter table public.stages add constraint stages_deliverable_kind_check CHECK ((deliverable_kind = ANY (ARRAY['video'::text, 'prototype'::text, 'prompt_log'::text, 'live'::text])));

alter table public.stages add constraint stages_key_check CHECK ((key = ANY (ARRAY['design'::text, 'build'::text, 'intelligize'::text, 'battle'::text])));

alter table public.stages add constraint stages_key_key UNIQUE (key);

alter table public.stages add constraint stages_ord_check CHECK (((ord >= 1) AND (ord <= 4)));

alter table public.stages add constraint stages_ord_key UNIQUE (ord);

alter table public.stages add constraint stages_pkey PRIMARY KEY (id);

alter table public.stages add constraint stages_weight_check CHECK ((weight >= (0)::numeric));

alter table public.store_settings add constraint store_settings_id_check CHECK ((id = 1));

alter table public.store_settings add constraint store_settings_pkey PRIMARY KEY (id);

alter table public.student_ai_models add constraint student_ai_models_pkey PRIMARY KEY (id);

alter table public.submission_files add constraint submission_files_pkey PRIMARY KEY (id);

alter table public.submissions add constraint submissions_google_drive_folder_id_key UNIQUE (google_drive_folder_id);

alter table public.submissions add constraint submissions_pkey PRIMARY KEY (id);

alter table public.submissions add constraint submissions_status_check CHECK ((status = ANY (ARRAY['not_started'::text, 'submitted'::text, 'under_review'::text, 'scored'::text, 'returned'::text])));

alter table public.submissions add constraint submissions_team_id_stage_id_key UNIQUE (team_id, stage_id);

alter table public.teacher_supplementary_materials add constraint teacher_supplementary_materials_pkey PRIMARY KEY (id);

alter table public.team_configurations add constraint team_configurations_pkey PRIMARY KEY (id);

alter table public.team_configurations add constraint team_configurations_team_id_key UNIQUE (team_id);

alter table public.team_folders add constraint team_folders_pkey PRIMARY KEY (id);

alter table public.team_folders add constraint team_folders_root_folder_id_key UNIQUE (root_folder_id);

alter table public.team_folders add constraint team_folders_team_id_key UNIQUE (team_id);

alter table public.team_member_profiles add constraint team_member_profiles_pkey PRIMARY KEY (id);

alter table public.team_member_profiles add constraint team_member_profiles_team_id_student_id_assigned_role_key UNIQUE (team_id, student_id, assigned_role);

alter table public.team_mission_progress add constraint team_mission_progress_pkey PRIMARY KEY (id);

alter table public.team_mission_progress add constraint team_mission_progress_team_id_stage_id_key UNIQUE (team_id, stage_id);

alter table public.team_roles add constraint team_roles_pkey PRIMARY KEY (id);

alter table public.team_roles add constraint team_roles_team_id_student_id_key UNIQUE (team_id, student_id);

alter table public.team_roles add constraint team_roles_unique_role_per_team UNIQUE (team_id, role_name);

alter table public.teams add constraint teams_division_check CHECK ((division = ANY (ARRAY['primary'::text, 'secondary'::text, 'sixth_form'::text])));

alter table public.teams add constraint teams_pkey PRIMARY KEY (id);

alter table public.tiers add constraint tiers_pkey PRIMARY KEY (id);

alter table public.tiers add constraint tiers_slug_key UNIQUE (slug);

alter table public.uploaded_submission_files add constraint uploaded_submission_files_google_drive_id_key UNIQUE (google_drive_id);

alter table public.uploaded_submission_files add constraint uploaded_submission_files_pkey PRIMARY KEY (id);

alter table public.admin_users add constraint admin_users_user_id_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.assessment_attempts add constraint assessment_attempts_assessment_id_fkey FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE;

alter table public.assessment_attempts add constraint assessment_attempts_student_id_fkey FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.assessment_attempts add constraint assessment_attempts_team_id_fkey FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE;

alter table public.assessment_questions add constraint assessment_questions_assessment_id_fkey FOREIGN KEY (assessment_id) REFERENCES assessments(id) ON DELETE CASCADE;

alter table public.assessment_results add constraint assessment_results_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE;

alter table public.assessments add constraint assessments_level_id_fkey FOREIGN KEY (level_id) REFERENCES levels(id) ON DELETE CASCADE;

alter table public.automation_log add constraint automation_log_file_id_fkey FOREIGN KEY (file_id) REFERENCES uploaded_submission_files(id);

alter table public.automation_log add constraint automation_log_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE;

alter table public.content_assets add constraint content_assets_uploaded_by_fkey FOREIGN KEY (uploaded_by) REFERENCES auth.users(id) ON DELETE SET NULL;

alter table public.content_version_history add constraint content_version_history_published_by_fkey FOREIGN KEY (published_by) REFERENCES auth.users(id);

alter table public.custom_team_roles add constraint custom_team_roles_created_by_fkey FOREIGN KEY (created_by) REFERENCES auth.users(id);

alter table public.custom_team_roles add constraint custom_team_roles_team_id_fkey FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE;

alter table public.file_upload_sessions add constraint file_upload_sessions_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE;

alter table public.lab_mission_progress add constraint lab_mission_progress_lab_mission_id_fkey FOREIGN KEY (lab_mission_id) REFERENCES lab_missions(id) ON DELETE CASCADE;

alter table public.lab_mission_progress add constraint lab_mission_progress_last_updated_by_fkey FOREIGN KEY (last_updated_by) REFERENCES auth.users(id);

alter table public.lab_mission_progress add constraint lab_mission_progress_student_id_fkey FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.lab_mission_progress add constraint lab_mission_progress_team_id_fkey FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE;

alter table public.lab_missions add constraint lab_missions_level_id_fkey FOREIGN KEY (level_id) REFERENCES levels(id);

alter table public.lab_missions add constraint lab_missions_tier_id_fkey FOREIGN KEY (tier_id) REFERENCES tiers(id);

alter table public.lesson_progress add constraint lesson_progress_lesson_id_fkey FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE;

alter table public.lesson_progress add constraint lesson_progress_student_id_fkey FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.lessons add constraint lessons_level_id_fkey FOREIGN KEY (level_id) REFERENCES levels(id) ON DELETE CASCADE;

alter table public.levels add constraint levels_tier_id_fkey FOREIGN KEY (tier_id) REFERENCES tiers(id) ON DELETE CASCADE;

alter table public.material_sync_log add constraint material_sync_log_material_id_fkey FOREIGN KEY (material_id) REFERENCES teacher_supplementary_materials(id) ON DELETE CASCADE;

alter table public.mission_steps add constraint mission_steps_mission_id_fkey FOREIGN KEY (mission_id) REFERENCES organizer_missions(id) ON DELETE CASCADE;

alter table public.notification_log add constraint notification_log_stage_id_fkey FOREIGN KEY (stage_id) REFERENCES stages(id) ON DELETE CASCADE;

alter table public.notification_log add constraint notification_log_team_id_fkey FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE;

alter table public.orders add constraint orders_kit_id_fkey FOREIGN KEY (kit_id) REFERENCES kits(id);

alter table public.orders add constraint orders_school_id_fkey FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

alter table public.organizer_users add constraint organizer_users_auth_user_id_fkey FOREIGN KEY (auth_user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.profiles add constraint profiles_id_fkey FOREIGN KEY (id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.profiles add constraint profiles_school_id_fkey FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE SET NULL;

alter table public.profiles add constraint profiles_team_id_fkey FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL;

alter table public.review_assignments add constraint review_assignments_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES profiles(id) ON DELETE SET NULL;

alter table public.review_assignments add constraint review_assignments_judge_id_fkey FOREIGN KEY (judge_id) REFERENCES profiles(id) ON DELETE CASCADE;

alter table public.review_assignments add constraint review_assignments_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE;

alter table public.role_contributions add constraint role_contributions_mission_step_id_fkey FOREIGN KEY (mission_step_id) REFERENCES mission_steps(id) ON DELETE SET NULL;

alter table public.role_contributions add constraint role_contributions_team_id_fkey FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE;

alter table public.role_contributions add constraint role_contributions_team_role_id_fkey FOREIGN KEY (team_role_id) REFERENCES team_roles(id) ON DELETE CASCADE;

alter table public.scores add constraint scores_judge_id_fkey FOREIGN KEY (judge_id) REFERENCES profiles(id) ON DELETE CASCADE;

alter table public.scores add constraint scores_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE;

alter table public.student_ai_models add constraint student_ai_models_lab_mission_id_fkey FOREIGN KEY (lab_mission_id) REFERENCES lab_missions(id);

alter table public.student_ai_models add constraint student_ai_models_student_id_fkey FOREIGN KEY (student_id) REFERENCES auth.users(id);

alter table public.submission_files add constraint submission_files_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE;

alter table public.submissions add constraint submissions_stage_id_fkey FOREIGN KEY (stage_id) REFERENCES stages(id) ON DELETE CASCADE;

alter table public.submissions add constraint submissions_team_id_fkey FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE;

alter table public.teacher_supplementary_materials add constraint teacher_supplementary_materials_school_id_fkey FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

alter table public.teacher_supplementary_materials add constraint teacher_supplementary_materials_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.team_configurations add constraint team_configurations_configured_by_fkey FOREIGN KEY (configured_by) REFERENCES auth.users(id);

alter table public.team_configurations add constraint team_configurations_team_id_fkey FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE;

alter table public.team_configurations add constraint team_configurations_template_id_fkey FOREIGN KEY (template_id) REFERENCES role_templates(id) ON DELETE SET NULL;

alter table public.team_folders add constraint team_folders_school_id_fkey FOREIGN KEY (school_id) REFERENCES schools(id);

alter table public.team_folders add constraint team_folders_team_id_fkey FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE;

alter table public.team_member_profiles add constraint team_member_profiles_assigned_by_fkey FOREIGN KEY (assigned_by) REFERENCES auth.users(id);

alter table public.team_member_profiles add constraint team_member_profiles_student_id_fkey FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.team_member_profiles add constraint team_member_profiles_team_id_fkey FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE;

alter table public.team_mission_progress add constraint team_mission_progress_team_id_fkey FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE;

alter table public.team_roles add constraint team_roles_student_id_fkey FOREIGN KEY (student_id) REFERENCES auth.users(id) ON DELETE CASCADE;

alter table public.team_roles add constraint team_roles_team_id_fkey FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE;

alter table public.teams add constraint teams_order_id_fkey FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE SET NULL;

alter table public.teams add constraint teams_school_id_fkey FOREIGN KEY (school_id) REFERENCES schools(id) ON DELETE CASCADE;

alter table public.teams add constraint teams_teacher_id_fkey FOREIGN KEY (teacher_id) REFERENCES profiles(id) ON DELETE SET NULL;

alter table public.uploaded_submission_files add constraint uploaded_submission_files_stage_id_fkey FOREIGN KEY (stage_id) REFERENCES stages(id);

alter table public.uploaded_submission_files add constraint uploaded_submission_files_submission_id_fkey FOREIGN KEY (submission_id) REFERENCES submissions(id) ON DELETE CASCADE;

alter table public.uploaded_submission_files add constraint uploaded_submission_files_team_id_fkey FOREIGN KEY (team_id) REFERENCES teams(id);

CREATE INDEX idx_admin_users_role ON public.admin_users USING btree (role);

CREATE INDEX idx_assessment_attempts_student ON public.assessment_attempts USING btree (student_id, assessment_id);

CREATE INDEX idx_assessment_attempts_team ON public.assessment_attempts USING btree (team_id, assessment_id);

CREATE INDEX idx_questions_assessment ON public.assessment_questions USING btree (assessment_id);

CREATE INDEX idx_assessment_results_submission_id ON public.assessment_results USING btree (submission_id);

CREATE INDEX idx_assessment_results_type ON public.assessment_results USING btree (assessment_type);

CREATE INDEX idx_assessments_doc_status ON public.assessments USING btree (document_id, status);

CREATE INDEX idx_assessments_level ON public.assessments USING btree (level_id);

CREATE UNIQUE INDEX idx_assessments_one_draft_per_doc ON public.assessments USING btree (document_id) WHERE (status = 'draft'::content_status);

CREATE UNIQUE INDEX idx_assessments_one_published_per_doc ON public.assessments USING btree (document_id) WHERE (status = 'published'::content_status);

CREATE INDEX idx_automation_log_submission_id ON public.automation_log USING btree (submission_id);

CREATE INDEX idx_automation_log_type ON public.automation_log USING btree (automation_type);

CREATE INDEX idx_assets_created ON public.content_assets USING btree (created_at DESC);

CREATE INDEX idx_assets_document ON public.content_assets USING btree (document_id);

CREATE INDEX idx_assets_type ON public.content_assets USING btree (asset_type);

CREATE INDEX idx_content_history_doc ON public.content_version_history USING btree (document_id, published_at DESC);

CREATE INDEX idx_custom_team_roles_team ON public.custom_team_roles USING btree (team_id);

CREATE INDEX idx_upload_sessions_status ON public.file_upload_sessions USING btree (status);

CREATE INDEX idx_upload_sessions_submission_id ON public.file_upload_sessions USING btree (submission_id);

CREATE INDEX idx_lab_mission_progress_student ON public.lab_mission_progress USING btree (student_id);

CREATE INDEX idx_lab_mission_progress_team ON public.lab_mission_progress USING btree (team_id);

CREATE INDEX idx_lab_missions_doc_status ON public.lab_missions USING btree (document_id, status);

CREATE INDEX idx_lab_missions_level ON public.lab_missions USING btree (level_id);

CREATE INDEX idx_lab_missions_tier ON public.lab_missions USING btree (tier_id);

CREATE UNIQUE INDEX idx_lab_missions_one_draft_per_doc ON public.lab_missions USING btree (document_id) WHERE (status = 'draft'::content_status);

CREATE UNIQUE INDEX idx_lab_missions_one_published_per_doc ON public.lab_missions USING btree (document_id) WHERE (status = 'published'::content_status);

CREATE INDEX idx_lesson_progress_student ON public.lesson_progress USING btree (student_id);

CREATE INDEX idx_lessons_doc_status ON public.lessons USING btree (document_id, status);

CREATE INDEX idx_lessons_level ON public.lessons USING btree (level_id);

CREATE UNIQUE INDEX idx_lessons_one_draft_per_doc ON public.lessons USING btree (document_id) WHERE (status = 'draft'::content_status);

CREATE UNIQUE INDEX idx_lessons_one_published_per_doc ON public.lessons USING btree (document_id) WHERE (status = 'published'::content_status);

CREATE INDEX idx_levels_doc_status ON public.levels USING btree (document_id, status);

CREATE INDEX idx_levels_tier_stage ON public.levels USING btree (tier_id, stage_id);

CREATE UNIQUE INDEX idx_levels_one_draft_per_doc ON public.levels USING btree (document_id) WHERE (status = 'draft'::content_status);

CREATE UNIQUE INDEX idx_levels_one_published_per_doc ON public.levels USING btree (document_id) WHERE (status = 'published'::content_status);

CREATE INDEX idx_live_sessions_scheduled_date ON public.live_sessions USING btree (scheduled_date);

CREATE INDEX idx_live_sessions_stage ON public.live_sessions USING btree (stage_id);

CREATE INDEX idx_live_sessions_status ON public.live_sessions USING btree (status);

CREATE INDEX idx_material_sync_log_material ON public.material_sync_log USING btree (material_id);

CREATE INDEX idx_mission_steps_mission_id ON public.mission_steps USING btree (mission_id);

CREATE INDEX orders_division_idx ON public.orders USING btree (division);

CREATE INDEX orders_school_id_idx ON public.orders USING btree (school_id);

CREATE INDEX orders_status_idx ON public.orders USING btree (status);

CREATE INDEX idx_organizer_resources_stage ON public.organizer_resources USING btree (stage_id);

CREATE INDEX idx_organizer_resources_type ON public.organizer_resources USING btree (resource_type);

CREATE INDEX idx_profiles_is_team_account ON public.profiles USING btree (is_team_account);

CREATE INDEX idx_profiles_school_id ON public.profiles USING btree (school_id);

CREATE INDEX idx_profiles_team_id ON public.profiles USING btree (team_id);

CREATE INDEX review_assignments_judge_idx ON public.review_assignments USING btree (judge_id);

CREATE INDEX review_assignments_submission_idx ON public.review_assignments USING btree (submission_id);

CREATE INDEX idx_role_contributions_role ON public.role_contributions USING btree (team_role_id);

CREATE INDEX idx_role_contributions_stage ON public.role_contributions USING btree (stage_id);

CREATE INDEX idx_role_contributions_status ON public.role_contributions USING btree (status);

CREATE INDEX idx_role_contributions_team ON public.role_contributions USING btree (team_id);

CREATE INDEX idx_schools_created_at ON public.schools USING btree (created_at);

CREATE INDEX idx_schools_division ON public.schools USING btree (division);

CREATE INDEX idx_schools_state ON public.schools USING btree (state);

CREATE UNIQUE INDEX schools_contact_email_key ON public.schools USING btree (lower(contact_email));

CREATE INDEX scores_submission_idx ON public.scores USING btree (submission_id);

CREATE INDEX idx_ai_models_student ON public.student_ai_models USING btree (student_id);

CREATE INDEX idx_submission_files_source_type ON public.submission_files USING btree (source_type);

CREATE INDEX idx_submission_files_submission_id ON public.submission_files USING btree (submission_id);

CREATE INDEX idx_submissions_gdrive_folder_id ON public.submissions USING btree (google_drive_folder_id);

CREATE INDEX submissions_stage_idx ON public.submissions USING btree (stage_id);

CREATE INDEX submissions_team_idx ON public.submissions USING btree (team_id);

CREATE INDEX idx_supplementary_materials_school ON public.teacher_supplementary_materials USING btree (school_id);

CREATE INDEX idx_supplementary_materials_stage ON public.teacher_supplementary_materials USING btree (stage_id);

CREATE INDEX idx_supplementary_materials_teacher ON public.teacher_supplementary_materials USING btree (teacher_id);

CREATE INDEX idx_team_configurations_team ON public.team_configurations USING btree (team_id);

CREATE INDEX idx_team_folders_team_id ON public.team_folders USING btree (team_id);

CREATE INDEX idx_team_member_profiles_student ON public.team_member_profiles USING btree (student_id);

CREATE INDEX idx_team_member_profiles_team ON public.team_member_profiles USING btree (team_id);

CREATE INDEX idx_team_mission_progress_stage ON public.team_mission_progress USING btree (stage_id);

CREATE INDEX idx_team_mission_progress_team ON public.team_mission_progress USING btree (team_id);

CREATE INDEX idx_team_roles_student ON public.team_roles USING btree (student_id);

CREATE INDEX idx_team_roles_team ON public.team_roles USING btree (team_id);

CREATE INDEX idx_teams_school ON public.teams USING btree (school_id);

CREATE INDEX idx_teams_teacher_id ON public.teams USING btree (teacher_id);

CREATE INDEX teams_school_idx ON public.teams USING btree (school_id);

CREATE INDEX idx_uploaded_files_gdrive_id ON public.uploaded_submission_files USING btree (google_drive_id);

CREATE INDEX idx_uploaded_files_stage_id ON public.uploaded_submission_files USING btree (stage_id);

CREATE INDEX idx_uploaded_files_status ON public.uploaded_submission_files USING btree (upload_status);

CREATE INDEX idx_uploaded_files_submission_id ON public.uploaded_submission_files USING btree (submission_id);

CREATE INDEX idx_uploaded_files_team_id ON public.uploaded_submission_files USING btree (team_id);

create or replace view public.submission_scores as
 SELECT submission_id,
    count(*) AS judge_count,
    round(avg(c_design), 1) AS avg_design,
    round(avg(c_hardware), 1) AS avg_hardware,
    round(avg(c_ai), 1) AS avg_ai,
    round(avg(c_presentation), 1) AS avg_presentation,
    round(avg(total), 1) AS avg_total
   FROM scores s
  GROUP BY submission_id;

create or replace view public.team_standings as
 WITH per_stage AS (
         SELECT sub.team_id,
            st.ord AS stage_ord,
            st.weight,
            ss.avg_total
           FROM ((submissions sub
             JOIN stages st ON ((st.id = sub.stage_id)))
             JOIN submission_scores ss ON ((ss.submission_id = sub.id)))
          WHERE (sub.status = 'scored'::text)
        ), agg AS (
         SELECT per_stage.team_id,
            (sum((per_stage.weight * per_stage.avg_total)) / NULLIF(sum(per_stage.weight), (0)::numeric)) AS overall,
            jsonb_object_agg((per_stage.stage_ord)::text, per_stage.avg_total) AS stage_scores
           FROM per_stage
          GROUP BY per_stage.team_id
        )
 SELECT t.id AS team_id,
    t.name AS team_name,
    t.division,
    t.school_id,
    t.eliminated_after_stage,
    t.advanced_at,
    round(a.overall, 1) AS overall,
    COALESCE(a.stage_scores, '{}'::jsonb) AS stage_scores,
    rank() OVER (PARTITION BY t.division ORDER BY a.overall DESC NULLS LAST) AS division_rank
   FROM (teams t
     LEFT JOIN agg a ON ((a.team_id = t.id)));

CREATE OR REPLACE FUNCTION public.assignments_after_insert()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  update public.submissions
  set status = 'under_review'
  where id = new.submission_id and status = 'submitted';
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.current_school_id()
 RETURNS uuid
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select school_id from public.profiles where id = auth.uid();
$function$
;

CREATE OR REPLACE FUNCTION public.current_user_role()
 RETURNS user_role
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select role from public.profiles where id = auth.uid();
$function$
;

CREATE OR REPLACE FUNCTION public.get_lesson_with_assets(p_lesson_id uuid)
 RETURNS TABLE(lesson_id uuid, title character varying, content_type character varying, content_url text, estimated_minutes integer, xp_reward integer, assets jsonb)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    l.id,
    l.title,
    l.content_type,
    l.content_url,
    l.estimated_minutes,
    l.xp_reward,
    COALESCE(
      jsonb_agg(jsonb_build_object(
        'id', a.id,
        'title', a.title,
        'type', a.asset_type,
        'url', a.file_url,
        'fileName', a.file_name,
        'description', a.description
      )) FILTER (WHERE a.id IS NOT NULL),
      '[]'::jsonb
    ) AS assets
  FROM lessons l
  LEFT JOIN content_assets a ON a.id = ANY(l.supplementary_assets)
  WHERE l.id = p_lesson_id
  GROUP BY l.id, l.title, l.content_type, l.content_url, l.estimated_minutes, l.xp_reward;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_mission_with_assets(p_mission_id uuid)
 RETURNS TABLE(mission_id uuid, title character varying, description text, difficulty character varying, duration_minutes integer, xp_reward integer, assets jsonb)
 LANGUAGE plpgsql
AS $function$
BEGIN
  RETURN QUERY
  SELECT
    m.id,
    m.title,
    m.description,
    m.difficulty,
    m.duration_minutes,
    m.xp_reward,
    COALESCE(
      jsonb_agg(jsonb_build_object(
        'id', a.id,
        'title', a.title,
        'type', a.asset_type,
        'url', a.file_url,
        'fileName', a.file_name,
        'description', a.description
      )) FILTER (WHERE a.id IS NOT NULL),
      '[]'::jsonb
    ) AS assets
  FROM lab_missions m
  LEFT JOIN content_assets a ON a.id = ANY(m.supplementary_assets)
  WHERE m.id = p_mission_id
  GROUP BY m.id, m.title, m.description, m.difficulty, m.duration_minutes, m.xp_reward;
END;
$function$
;

CREATE OR REPLACE FUNCTION public.get_order_status(ref text)
 RETURNS TABLE(order_reference text, division text, team_count integer, kit_unit_price numeric, delivery_fee numeric, total_amount numeric, fulfilment text, line_items jsonb, status text, created_at timestamp with time zone, paid_at timestamp with time zone, dispatched_at timestamp with time zone, whatsapp_pinged_at timestamp with time zone)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select order_reference, division, team_count, kit_unit_price, delivery_fee,
         total_amount, fulfilment, line_items, status, created_at, paid_at,
         dispatched_at, whatsapp_pinged_at
  from orders
  where order_reference = ref;
$function$
;

CREATE OR REPLACE FUNCTION public.get_submission_feedback(p_submission_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_school   uuid;
  v_released timestamptz;
  result     jsonb;
begin
  select t.school_id, sub.feedback_released_at
    into v_school, v_released
  from public.submissions sub
  join public.teams t on t.id = sub.team_id
  where sub.id = p_submission_id;

  if not found then return null; end if;
  if not public.is_organizer()
     and (v_released is null or v_school is distinct from public.current_school_id()) then
    return null;
  end if;

  select jsonb_build_object(
    'released_at',      v_released,
    'judge_count',      count(*),
    'avg_design',       round(avg(c_design), 1),
    'avg_hardware',     round(avg(c_hardware), 1),
    'avg_ai',           round(avg(c_ai), 1),
    'avg_presentation', round(avg(c_presentation), 1),
    'avg_total',        round(avg(total), 1),
    'comments',         coalesce(
                          jsonb_agg(comments) filter (where comments is not null and btrim(comments) <> ''),
                          '[]'::jsonb)
  ) into result
  from public.scores where submission_id = p_submission_id;

  return result;
end $function$
;

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'name')
  on conflict (id) do nothing;
  return new;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.is_judge()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select coalesce((select role = 'judge' from public.profiles where id = auth.uid()), false);
$function$
;

CREATE OR REPLACE FUNCTION public.is_organizer()
 RETURNS boolean
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select coalesce((select role = 'organizer' from public.profiles where id = auth.uid()), false);
$function$
;

CREATE OR REPLACE FUNCTION public.judge_queue()
 RETURNS TABLE(submission_id uuid, stage_ord integer, stage_name text, stage_kind text, division text, payload jsonb, status text, due_at date, my_score jsonb)
 LANGUAGE sql
 STABLE SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select
    sub.id,
    st.ord,
    st.name,
    st.deliverable_kind,
    t.division,
    sub.payload,
    sub.status,
    st.due_at,
    (select jsonb_build_object(
        'c_design', sc.c_design, 'c_hardware', sc.c_hardware,
        'c_ai', sc.c_ai, 'c_presentation', sc.c_presentation,
        'comments', sc.comments)
     from public.scores sc
     where sc.submission_id = sub.id and sc.judge_id = auth.uid())
  from public.review_assignments ra
  join public.submissions sub on sub.id = ra.submission_id
  join public.stages st       on st.id = sub.stage_id
  join public.teams t         on t.id = sub.team_id
  where ra.judge_id = auth.uid()
  order by st.ord, sub.submitted_at nulls last;
$function$
;

CREATE OR REPLACE FUNCTION public.mark_whatsapp_pinged(ref text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  update public.orders
  set whatsapp_pinged_at = now()
  where order_reference = ref and whatsapp_pinged_at is null;
end $function$
;

CREATE OR REPLACE FUNCTION public.scores_after_write()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  sub_id      uuid := coalesce(new.submission_id, old.submission_id);
  n_assigned  int;
  n_scored    int;
  auto_rel    boolean;
  team        uuid;
  stage       uuid;
begin
  select count(*) into n_assigned from public.review_assignments where submission_id = sub_id;
  select count(*) into n_scored   from public.scores            where submission_id = sub_id;

  select s.team_id, s.stage_id, st.auto_release_feedback
    into team, stage, auto_rel
  from public.submissions s join public.stages st on st.id = s.stage_id
  where s.id = sub_id;

  if n_assigned > 0 and n_scored >= n_assigned then
    update public.submissions
    set status = 'scored',
        feedback_released_at = case
          when auto_rel and feedback_released_at is null then now()
          else feedback_released_at end
    where id = sub_id and status <> 'scored';

    if auto_rel then
      insert into public.notification_log (kind, team_id, stage_id)
      values ('feedback_ready', team, stage)
      on conflict (kind, team_id, stage_id) do nothing;
    end if;
  else
    update public.submissions
    set status = 'under_review'
    where id = sub_id and status = 'scored';
  end if;
  return null;
end $function$
;

CREATE OR REPLACE FUNCTION public.submissions_before_update()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  has_content boolean;
begin
  new.updated_at := now();

  if old.status = 'scored' and new.payload is distinct from old.payload then
    raise exception 'This submission has been scored and can no longer be edited.'
      using errcode = 'check_violation';
  end if;

  has_content := coalesce(new.payload->>'video_url','') <> ''
              or coalesce(new.payload->>'repo_url','')  <> ''
              or coalesce(new.payload->>'doc_url','')   <> '';

  if has_content and old.status in ('not_started','returned') then
    new.status := 'submitted';
    new.submitted_at := now();
  end if;
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.submit_payment_proof(ref text, proof_path text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  target public.orders%rowtype;
begin
  select * into target from orders where order_reference = ref;
  if not found then
    return; -- never disclose whether a reference exists
  end if;

  if proof_path is null or proof_path not like ref || '/%' then
    raise exception 'Proof path must be stored under this order reference.'
      using errcode = '22023';
  end if;

  if not exists (
    select 1 from storage.objects
    where bucket_id = 'payment-proofs' and name = proof_path
  ) then
    raise exception 'No uploaded file found at that path.'
      using errcode = '22023';
  end if;

  update orders
  set proof_of_payment_url = proof_path,
      payment_method = 'bank_transfer',
      status = case when status = 'registered' then 'payment_pending' else status end
  where order_reference = ref;
end;
$function$
;

CREATE OR REPLACE FUNCTION public.teams_after_insert()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
begin
  insert into public.submissions (team_id, stage_id)
  select new.id, s.id from public.stages s where s.ord <= 2;
  return new;
end $function$
;

CREATE OR REPLACE FUNCTION public.teams_before_insert()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  allowed int;
  used    int;
begin
  select division into new.division from public.schools where id = new.school_id;
  if new.division is null then
    raise exception 'Unknown school' using errcode = '23503';
  end if;

  select coalesce(sum(team_count), 0) into allowed
  from public.orders where school_id = new.school_id and status <> 'cancelled';

  select count(*) into used from public.teams where school_id = new.school_id;

  if used >= allowed then
    raise exception 'This school has registered % team(s); all slots are in use.', allowed
      using errcode = 'check_violation';
  end if;
  return new;
end $function$
;

alter table public.admin_users enable row level security;

alter table public.assessment_attempts enable row level security;

alter table public.assessment_questions enable row level security;

alter table public.assessment_results enable row level security;

alter table public.assessment_templates enable row level security;

alter table public.assessments enable row level security;

alter table public.assets enable row level security;

alter table public.automation_log enable row level security;

alter table public.content_assets enable row level security;

alter table public.content_version_history enable row level security;

alter table public.kits enable row level security;

alter table public.lab_mission_progress enable row level security;

alter table public.lab_missions enable row level security;

alter table public.lesson_progress enable row level security;

alter table public.lessons enable row level security;

alter table public.levels enable row level security;

alter table public.notification_log enable row level security;

alter table public.orders enable row level security;

alter table public.organizer_users enable row level security;

alter table public.profiles enable row level security;

alter table public.review_assignments enable row level security;

alter table public.role_contributions enable row level security;

alter table public.schools enable row level security;

alter table public.scores enable row level security;

alter table public.stages enable row level security;

alter table public.store_settings enable row level security;

alter table public.student_ai_models enable row level security;

alter table public.submission_files enable row level security;

alter table public.submissions enable row level security;

alter table public.teacher_supplementary_materials enable row level security;

alter table public.team_folders enable row level security;

alter table public.team_mission_progress enable row level security;

alter table public.teams enable row level security;

alter table public.tiers enable row level security;

create policy students_own_attempts on public.assessment_attempts as PERMISSIVE for ALL to public using ((student_id = auth.uid()));

create policy students_read_published_questions on public.assessment_questions as PERMISSIVE for SELECT to public using ((status = 'published'::content_status));

create policy students_read_published_assessments on public.assessments as PERMISSIVE for SELECT to public using ((status = 'published'::content_status));

create policy admin_manage_assets on public.content_assets as PERMISSIVE for ALL to public using ((EXISTS ( SELECT 1
   FROM admin_users
  WHERE ((admin_users.user_id = auth.uid()) AND (admin_users.role = ANY (ARRAY['super_admin'::admin_role, 'curriculum_editor'::admin_role]))))));

create policy students_read_published_assets on public.content_assets as PERMISSIVE for SELECT to public using ((document_id IN ( SELECT levels.id
   FROM levels
  WHERE (levels.status = 'published'::content_status)
UNION
 SELECT lessons.id
   FROM lessons
  WHERE (lessons.status = 'published'::content_status)
UNION
 SELECT assessments.id
   FROM assessments
  WHERE (assessments.status = 'published'::content_status)
UNION
 SELECT lab_missions.id
   FROM lab_missions
  WHERE (lab_missions.status = 'published'::content_status))));

create policy "public can view kits" on public.kits as PERMISSIVE for SELECT to public using (true);

create policy students_own_mission_progress on public.lab_mission_progress as PERMISSIVE for ALL to public using ((student_id = auth.uid()));

create policy students_read_published_missions on public.lab_missions as PERMISSIVE for SELECT to public using ((status = 'published'::content_status));

create policy students_own_lesson_progress on public.lesson_progress as PERMISSIVE for ALL to public using ((student_id = auth.uid()));

create policy students_read_published_lessons on public.lessons as PERMISSIVE for SELECT to public using ((status = 'published'::content_status));

create policy students_read_published_levels on public.levels as PERMISSIVE for SELECT to public using ((status = 'published'::content_status));

create policy "organizers read notification log" on public.notification_log as PERMISSIVE for SELECT to public using (is_organizer());

create policy "organizers update orders" on public.orders as PERMISSIVE for UPDATE to public using (is_organizer()) with check (is_organizer());

create policy "organizers view orders" on public.orders as PERMISSIVE for SELECT to public using (is_organizer());

create policy "organizers view organizer_users" on public.organizer_users as PERMISSIVE for SELECT to public using (is_organizer());

create policy "organizers read all profiles" on public.profiles as PERMISSIVE for SELECT to public using (is_organizer());

create policy "organizers write profiles" on public.profiles as PERMISSIVE for ALL to public using (is_organizer()) with check (is_organizer());

create policy "read own profile" on public.profiles as PERMISSIVE for SELECT to public using ((id = auth.uid()));

create policy "judges read own assignments" on public.review_assignments as PERMISSIVE for SELECT to public using ((judge_id = auth.uid()));

create policy "organizers manage assignments" on public.review_assignments as PERMISSIVE for ALL to public using (is_organizer()) with check (is_organizer());

create policy "Team members view contributions" on public.role_contributions as PERMISSIVE for SELECT to public using (true);

create policy "organizers read and write schools" on public.schools as PERMISSIVE for ALL to public using (is_organizer()) with check (is_organizer());

create policy "organizers update schools" on public.schools as PERMISSIVE for UPDATE to public using (is_organizer()) with check (is_organizer());

create policy "organizers view schools" on public.schools as PERMISSIVE for SELECT to public using (is_organizer());

create policy "public can insert schools during registration" on public.schools as PERMISSIVE for INSERT to public with check (true);

create policy "judges manage own scores" on public.scores as PERMISSIVE for ALL to public using ((judge_id = auth.uid())) with check (((judge_id = auth.uid()) AND (EXISTS ( SELECT 1
   FROM review_assignments ra
  WHERE ((ra.submission_id = scores.submission_id) AND (ra.judge_id = auth.uid()))))));

create policy "organizers read scores" on public.scores as PERMISSIVE for SELECT to public using (is_organizer());

create policy "anyone signed in reads stages" on public.stages as PERMISSIVE for SELECT to public using ((auth.uid() IS NOT NULL));

create policy "organizers write stages" on public.stages as PERMISSIVE for ALL to public using (is_organizer()) with check (is_organizer());

create policy "anyone can read store settings" on public.store_settings as PERMISSIVE for SELECT to public using (true);

create policy "organizers change store settings" on public.store_settings as PERMISSIVE for ALL to public using (is_organizer()) with check (is_organizer());

create policy "judges read assigned submissions" on public.submissions as PERMISSIVE for SELECT to public using ((EXISTS ( SELECT 1
   FROM review_assignments ra
  WHERE ((ra.submission_id = submissions.id) AND (ra.judge_id = auth.uid())))));

create policy "organizers manage submissions" on public.submissions as PERMISSIVE for ALL to public using (is_organizer()) with check (is_organizer());

create policy "teachers read own submissions" on public.submissions as PERMISSIVE for SELECT to public using ((EXISTS ( SELECT 1
   FROM teams t
  WHERE ((t.id = submissions.team_id) AND (t.school_id = current_school_id())))));

create policy "teachers update own submissions" on public.submissions as PERMISSIVE for UPDATE to public using (((EXISTS ( SELECT 1
   FROM teams t
  WHERE ((t.id = submissions.team_id) AND (t.school_id = current_school_id())))) AND (status <> 'scored'::text))) with check ((EXISTS ( SELECT 1
   FROM teams t
  WHERE ((t.id = submissions.team_id) AND (t.school_id = current_school_id())))));

create policy "Teachers create own materials" on public.teacher_supplementary_materials as PERMISSIVE for INSERT to public with check ((auth.uid() = teacher_id));

create policy "Teachers update own materials" on public.teacher_supplementary_materials as PERMISSIVE for UPDATE to public using ((auth.uid() = teacher_id));

create policy "Teachers view own materials" on public.teacher_supplementary_materials as PERMISSIVE for SELECT to public using ((auth.uid() = teacher_id));

create policy "Teams view their progress" on public.team_mission_progress as PERMISSIVE for SELECT to public using (true);

create policy "organizers manage teams" on public.teams as PERMISSIVE for ALL to public using (is_organizer()) with check (is_organizer());

create policy "teachers create own school teams" on public.teams as PERMISSIVE for INSERT to public with check ((school_id = current_school_id()));

create policy "teachers read own school teams" on public.teams as PERMISSIVE for SELECT to public using ((school_id = current_school_id()));

create policy "teachers rename own school teams" on public.teams as PERMISSIVE for UPDATE to public using ((school_id = current_school_id())) with check ((school_id = current_school_id()));

create policy "organizers read payment proofs" on storage.objects as PERMISSIVE for SELECT to public using (((bucket_id = 'payment-proofs'::text) AND is_organizer()));

create policy "public can upload payment proof" on storage.objects as PERMISSIVE for INSERT to public with check (((bucket_id = 'payment-proofs'::text) AND (name ~ '^APEN-[A-Z0-9]{6,7}/[^/]+$'::text)));

CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION handle_new_user();

CREATE TRIGGER assignments_after_insert AFTER INSERT ON public.review_assignments FOR EACH ROW EXECUTE FUNCTION assignments_after_insert();

CREATE TRIGGER scores_after_write AFTER INSERT OR DELETE OR UPDATE ON public.scores FOR EACH ROW EXECUTE FUNCTION scores_after_write();

CREATE TRIGGER submissions_before_update BEFORE UPDATE ON public.submissions FOR EACH ROW EXECUTE FUNCTION submissions_before_update();

CREATE TRIGGER teams_after_insert AFTER INSERT ON public.teams FOR EACH ROW EXECUTE FUNCTION teams_after_insert();

CREATE TRIGGER teams_before_insert BEFORE INSERT ON public.teams FOR EACH ROW EXECUTE FUNCTION teams_before_insert();
