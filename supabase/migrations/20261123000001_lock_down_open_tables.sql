-- Close twelve tables that had row level security off, so anyone holding the
-- public (anon) key could read, change or delete every row, including
-- students' names in team_roles and team_member_profiles. Also scope two
-- tables whose only read policy was `using (true)`.
--
-- Who keeps access:
--   organizers         everything, as before
--   teachers           their own school's teams (team setup keeps working)
--   students           read their own team's rows
--   any signed-in user read shared reference content (role templates,
--                      organizer missions and resources, live sessions)
--   Edge Functions     unchanged: they use the service role, which bypasses RLS
--
-- Safe to re-run.

------------------------------------------------------------------------
-- Helpers
------------------------------------------------------------------------

-- Organizers, or a teacher whose school owns the team.
create or replace function public.can_manage_team(p_team uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_organizer() or exists (
    select 1
    from public.teams t
    join public.profiles p on p.id = auth.uid()
    where t.id = p_team and p.role = 'teacher' and t.school_id = p.school_id
  );
$$;

-- Anyone who can manage the team, plus the team's own (student) accounts.
create or replace function public.can_view_team(p_team uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.can_manage_team(p_team) or exists (
    select 1 from public.profiles p where p.id = auth.uid() and p.team_id = p_team
  );
$$;

------------------------------------------------------------------------
-- Team tables: written by teachers during team setup
------------------------------------------------------------------------

alter table public.team_roles enable row level security;
alter table public.team_member_profiles enable row level security;
alter table public.team_configurations enable row level security;
alter table public.custom_team_roles enable row level security;

drop policy if exists "team can read" on public.team_roles;
drop policy if exists "teachers and organizers manage" on public.team_roles;
create policy "team can read" on public.team_roles
  for select using (public.can_view_team(team_id));
create policy "teachers and organizers manage" on public.team_roles
  for all using (public.can_manage_team(team_id)) with check (public.can_manage_team(team_id));

drop policy if exists "team can read" on public.team_member_profiles;
drop policy if exists "teachers and organizers manage" on public.team_member_profiles;
create policy "team can read" on public.team_member_profiles
  for select using (public.can_view_team(team_id));
create policy "teachers and organizers manage" on public.team_member_profiles
  for all using (public.can_manage_team(team_id)) with check (public.can_manage_team(team_id));

drop policy if exists "team can read" on public.team_configurations;
drop policy if exists "teachers and organizers manage" on public.team_configurations;
create policy "team can read" on public.team_configurations
  for select using (public.can_view_team(team_id));
create policy "teachers and organizers manage" on public.team_configurations
  for all using (public.can_manage_team(team_id)) with check (public.can_manage_team(team_id));

drop policy if exists "team can read" on public.custom_team_roles;
drop policy if exists "teachers and organizers manage" on public.custom_team_roles;
create policy "team can read" on public.custom_team_roles
  for select using (public.can_view_team(team_id));
create policy "teachers and organizers manage" on public.custom_team_roles
  for all using (public.can_manage_team(team_id)) with check (public.can_manage_team(team_id));

-- These had RLS on but let anyone read every row.
drop policy if exists "Team members view contributions" on public.role_contributions;
drop policy if exists "team can read" on public.role_contributions;
create policy "team can read" on public.role_contributions
  for select using (public.can_view_team(team_id));

drop policy if exists "Teams view their progress" on public.team_mission_progress;
drop policy if exists "team can read" on public.team_mission_progress;
create policy "team can read" on public.team_mission_progress
  for select using (public.can_view_team(team_id));

------------------------------------------------------------------------
-- Submission files: written only by Edge Functions (service role)
------------------------------------------------------------------------

alter table public.uploaded_submission_files enable row level security;
alter table public.file_upload_sessions enable row level security;

drop policy if exists "team and assigned judges read" on public.uploaded_submission_files;
drop policy if exists "organizers manage" on public.uploaded_submission_files;
create policy "team and assigned judges read" on public.uploaded_submission_files
  for select using (
    public.can_view_team(team_id)
    or exists (
      select 1 from public.review_assignments ra
      where ra.submission_id = uploaded_submission_files.submission_id and ra.judge_id = auth.uid()
    )
  );
create policy "organizers manage" on public.uploaded_submission_files
  for all using (public.is_organizer()) with check (public.is_organizer());

-- Holds upload session tokens: organizers only.
drop policy if exists "organizers manage" on public.file_upload_sessions;
create policy "organizers manage" on public.file_upload_sessions
  for all using (public.is_organizer()) with check (public.is_organizer());

------------------------------------------------------------------------
-- Shared reference content: any signed-in user reads, organizers write
------------------------------------------------------------------------

alter table public.role_templates enable row level security;
alter table public.organizer_missions enable row level security;
alter table public.mission_steps enable row level security;
alter table public.organizer_resources enable row level security;
alter table public.live_sessions enable row level security;

drop policy if exists "signed-in users read" on public.role_templates;
drop policy if exists "organizers manage" on public.role_templates;
create policy "signed-in users read" on public.role_templates
  for select using (auth.uid() is not null);
create policy "organizers manage" on public.role_templates
  for all using (public.is_organizer()) with check (public.is_organizer());

drop policy if exists "signed-in users read" on public.organizer_missions;
drop policy if exists "organizers manage" on public.organizer_missions;
create policy "signed-in users read" on public.organizer_missions
  for select using (auth.uid() is not null);
create policy "organizers manage" on public.organizer_missions
  for all using (public.is_organizer()) with check (public.is_organizer());

drop policy if exists "signed-in users read" on public.mission_steps;
drop policy if exists "organizers manage" on public.mission_steps;
create policy "signed-in users read" on public.mission_steps
  for select using (auth.uid() is not null);
create policy "organizers manage" on public.mission_steps
  for all using (public.is_organizer()) with check (public.is_organizer());

drop policy if exists "signed-in users read" on public.organizer_resources;
drop policy if exists "organizers manage" on public.organizer_resources;
create policy "signed-in users read" on public.organizer_resources
  for select using (auth.uid() is not null);
create policy "organizers manage" on public.organizer_resources
  for all using (public.is_organizer()) with check (public.is_organizer());

drop policy if exists "signed-in users read" on public.live_sessions;
drop policy if exists "organizers manage" on public.live_sessions;
create policy "signed-in users read" on public.live_sessions
  for select using (auth.uid() is not null);
create policy "organizers manage" on public.live_sessions
  for all using (public.is_organizer()) with check (public.is_organizer());

------------------------------------------------------------------------
-- Material sync log: organizers, and the teacher who owns the material
------------------------------------------------------------------------

alter table public.material_sync_log enable row level security;

drop policy if exists "owning teacher reads" on public.material_sync_log;
drop policy if exists "organizers manage" on public.material_sync_log;
create policy "owning teacher reads" on public.material_sync_log
  for select using (exists (
    select 1 from public.teacher_supplementary_materials m
    where m.id = material_sync_log.material_id and m.teacher_id = auth.uid()
  ));
create policy "organizers manage" on public.material_sync_log
  for all using (public.is_organizer()) with check (public.is_organizer());
