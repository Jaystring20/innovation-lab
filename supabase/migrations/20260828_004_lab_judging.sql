-- APEN 2026 — Lab: submissions, judging, standings, and automation.
--
-- Replaces the mock Lab dashboard (XP / badges / leaderboards) with the
-- handbook's 4-Stage Innovation Funnel: teams submit one deliverable per
-- stage, organizer-assigned judges score each submission on the fixed rubric
-- (Design Thinking 20 / Hardware 30 / AI 30 / Presentation 20), scores
-- aggregate to a division ranking, and an elimination gate after Stage 2
-- selects finalists.
--
-- Additive only: no change to the store flow (kits / schools / orders) or to
-- handle_new_user(). New signups are still 'teacher' and see nothing until an
-- organizer links them to a school.

-- Automation plumbing. The daily notification cron is scheduled separately
-- (see LAB_SETUP.md) so the shared secret stays out of version control.
create extension if not exists pg_net;
create extension if not exists pg_cron;

------------------------------------------------------------------------
-- Teacher ↔ school link
------------------------------------------------------------------------
alter table public.profiles
  add column if not exists school_id uuid references public.schools(id) on delete set null;

create or replace function public.current_school_id()
returns uuid language sql stable security definer set search_path = public as $$
  select school_id from public.profiles where id = auth.uid();
$$;

create or replace function public.is_judge()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'judge' from public.profiles where id = auth.uid()), false);
$$;

------------------------------------------------------------------------
-- Competition calendar (static — 4 rows)
------------------------------------------------------------------------
create table public.stages (
  id                     uuid primary key default gen_random_uuid(),
  ord                    int  not null unique check (ord between 1 and 4),
  key                    text not null unique check (key in ('design','build','intelligize','battle')),
  name                   text not null,
  deliverable_kind       text not null check (deliverable_kind in ('video','prototype','prompt_log','live')),
  opens_at               date,
  due_at                 date,
  weight                 numeric not null default 0.25 check (weight >= 0),
  advance_count          int,                    -- finalist cap; set on the gate stage
  auto_release_feedback  boolean not null default true
);

insert into public.stages (ord, key, name, deliverable_kind, opens_at, due_at, weight) values
  (1, 'design',      'Stage 1 — Design',      'video',      date '2026-09-15', date '2026-10-04', 0.25),
  (2, 'build',       'Stage 2 — Build',       'prototype',  date '2026-10-05', date '2026-10-23', 0.25),
  (3, 'intelligize', 'Stage 3 — Intelligize', 'prompt_log', date '2026-11-01', date '2026-11-22', 0.25),
  (4, 'battle',      'Stage 4 — BATTLE',      'live',       date '2026-11-26', date '2026-11-26', 0.25);

alter table public.stages enable row level security;
create policy "anyone signed in reads stages" on public.stages for select using (auth.uid() is not null);
create policy "organizers write stages" on public.stages for all
  using (public.is_organizer()) with check (public.is_organizer());

------------------------------------------------------------------------
-- Teams — the competing unit
------------------------------------------------------------------------
create table public.teams (
  id                      uuid primary key default gen_random_uuid(),
  school_id               uuid not null references public.schools(id) on delete cascade,
  division                text not null check (division in ('primary','secondary','sixth_form')),
  name                    text not null,
  order_id                uuid references public.orders(id) on delete set null,
  eliminated_after_stage  int,
  advanced_at             timestamptz,
  created_at              timestamptz not null default now()
);

create index teams_school_idx on public.teams (school_id);

-- Force division to the school's own, and cap the number of teams at the
-- team_count the school has ordered (any non-cancelled order counts — a school
-- registers its team count up front, before kits dispatch).
create or replace function public.teams_before_insert()
returns trigger language plpgsql security definer set search_path = public as $$
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
end $$;

create trigger teams_before_insert
  before insert on public.teams
  for each row execute function public.teams_before_insert();

-- Open Stages 1 and 2 for every new team. Stages 3 and 4 are opened by the
-- stage gate for teams that advance.
create or replace function public.teams_after_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.submissions (team_id, stage_id)
  select new.id, s.id from public.stages s where s.ord <= 2;
  return new;
end $$;

create trigger teams_after_insert
  after insert on public.teams
  for each row execute function public.teams_after_insert();

alter table public.teams enable row level security;
create policy "organizers manage teams" on public.teams for all
  using (public.is_organizer()) with check (public.is_organizer());
create policy "teachers read own school teams" on public.teams for select
  using (school_id = public.current_school_id());
create policy "teachers create own school teams" on public.teams for insert
  with check (school_id = public.current_school_id());
create policy "teachers rename own school teams" on public.teams for update
  using (school_id = public.current_school_id())
  with check (school_id = public.current_school_id());

------------------------------------------------------------------------
-- Submissions — one per team per stage
------------------------------------------------------------------------
create table public.submissions (
  id                    uuid primary key default gen_random_uuid(),
  team_id               uuid not null references public.teams(id) on delete cascade,
  stage_id              uuid not null references public.stages(id) on delete cascade,
  status                text not null default 'not_started'
                          check (status in ('not_started','submitted','under_review','scored','returned')),
  payload               jsonb not null default '{}'::jsonb,  -- { video_url, repo_url, doc_url, notes }
  submitted_at          timestamptz,
  feedback_released_at   timestamptz,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  unique (team_id, stage_id)
);

create index submissions_team_idx  on public.submissions (team_id);
create index submissions_stage_idx on public.submissions (stage_id);

-- Automation: a filled-in payload submits the work; a scored submission is
-- frozen against further edits.
create or replace function public.submissions_before_update()
returns trigger language plpgsql security definer set search_path = public as $$
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
end $$;

create trigger submissions_before_update
  before update on public.submissions
  for each row execute function public.submissions_before_update();

alter table public.submissions enable row level security;
create policy "organizers manage submissions" on public.submissions for all
  using (public.is_organizer()) with check (public.is_organizer());
create policy "teachers read own submissions" on public.submissions for select
  using (exists (
    select 1 from public.teams t
    where t.id = submissions.team_id and t.school_id = public.current_school_id()
  ));
create policy "teachers update own submissions" on public.submissions for update
  using (exists (
    select 1 from public.teams t
    where t.id = submissions.team_id and t.school_id = public.current_school_id()
  ) and status <> 'scored')
  with check (exists (
    select 1 from public.teams t
    where t.id = submissions.team_id and t.school_id = public.current_school_id()
  ));
-- "judges read assigned submissions" is created after review_assignments below.

------------------------------------------------------------------------
-- Judge assignments
------------------------------------------------------------------------
create table public.review_assignments (
  id            uuid primary key default gen_random_uuid(),
  submission_id uuid not null references public.submissions(id) on delete cascade,
  judge_id      uuid not null references public.profiles(id) on delete cascade,
  assigned_by   uuid references public.profiles(id) on delete set null,
  assigned_at   timestamptz not null default now(),
  unique (submission_id, judge_id)
);

create index review_assignments_judge_idx on public.review_assignments (judge_id);
create index review_assignments_submission_idx on public.review_assignments (submission_id);

-- Automation: assigning the first judge moves a submitted work into review.
create or replace function public.assignments_after_insert()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.submissions
  set status = 'under_review'
  where id = new.submission_id and status = 'submitted';
  return new;
end $$;

create trigger assignments_after_insert
  after insert on public.review_assignments
  for each row execute function public.assignments_after_insert();

alter table public.review_assignments enable row level security;
create policy "organizers manage assignments" on public.review_assignments for all
  using (public.is_organizer()) with check (public.is_organizer());
create policy "judges read own assignments" on public.review_assignments for select
  using (judge_id = auth.uid());

-- Deferred from the submissions block: judges see a submission once assigned.
create policy "judges read assigned submissions" on public.submissions for select
  using (exists (
    select 1 from public.review_assignments ra
    where ra.submission_id = submissions.id and ra.judge_id = auth.uid()
  ));

------------------------------------------------------------------------
-- Scores — one per judge per submission, on the four rubric criteria
------------------------------------------------------------------------
create table public.scores (
  id              uuid primary key default gen_random_uuid(),
  submission_id   uuid not null references public.submissions(id) on delete cascade,
  judge_id        uuid not null references public.profiles(id) on delete cascade,
  c_design        int not null check (c_design       between 0 and 20),
  c_hardware      int not null check (c_hardware     between 0 and 30),
  c_ai            int not null check (c_ai           between 0 and 30),
  c_presentation  int not null check (c_presentation between 0 and 20),
  total           int generated always as (c_design + c_hardware + c_ai + c_presentation) stored,
  comments        text,
  submitted_at    timestamptz not null default now(),
  unique (submission_id, judge_id)
);

create index scores_submission_idx on public.scores (submission_id);

-- Automation: once every assigned judge has scored, the submission is scored;
-- if the stage auto-releases, feedback opens and a notification is queued.
create or replace function public.scores_after_write()
returns trigger language plpgsql security definer set search_path = public as $$
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
    -- a judge un-scored (row deleted): fall back to under_review
    update public.submissions
    set status = 'under_review'
    where id = sub_id and status = 'scored';
  end if;
  return null;
end $$;

create trigger scores_after_write
  after insert or update or delete on public.scores
  for each row execute function public.scores_after_write();

alter table public.scores enable row level security;
create policy "organizers read scores" on public.scores for select using (public.is_organizer());
create policy "judges manage own scores" on public.scores for all
  using (judge_id = auth.uid())
  with check (
    judge_id = auth.uid()
    and exists (
      select 1 from public.review_assignments ra
      where ra.submission_id = scores.submission_id and ra.judge_id = auth.uid()
    )
  );

------------------------------------------------------------------------
-- Notification queue (dedupes the daily mailer)
------------------------------------------------------------------------
create table public.notification_log (
  id         uuid primary key default gen_random_uuid(),
  kind       text not null,
  team_id    uuid references public.teams(id) on delete cascade,
  stage_id   uuid references public.stages(id) on delete cascade,
  sent_at    timestamptz,
  created_at timestamptz not null default now(),
  unique (kind, team_id, stage_id)
);

alter table public.notification_log enable row level security;
create policy "organizers read notification log" on public.notification_log for select
  using (public.is_organizer());

------------------------------------------------------------------------
-- Aggregation views
------------------------------------------------------------------------
create view public.submission_scores
with (security_invoker = true) as
  select
    s.submission_id,
    count(*)                        as judge_count,
    round(avg(s.c_design), 1)       as avg_design,
    round(avg(s.c_hardware), 1)     as avg_hardware,
    round(avg(s.c_ai), 1)           as avg_ai,
    round(avg(s.c_presentation), 1) as avg_presentation,
    round(avg(s.total), 1)          as avg_total
  from public.scores s
  group by s.submission_id;

create view public.team_standings
with (security_invoker = true) as
  with per_stage as (
    select sub.team_id, st.ord as stage_ord, st.weight, ss.avg_total
    from public.submissions sub
    join public.stages st on st.id = sub.stage_id
    join public.submission_scores ss on ss.submission_id = sub.id
    where sub.status = 'scored'
  ),
  agg as (
    select team_id,
           sum(weight * avg_total) / nullif(sum(weight), 0) as overall,
           jsonb_object_agg(stage_ord::text, avg_total)     as stage_scores
    from per_stage group by team_id
  )
  select
    t.id   as team_id,
    t.name as team_name,
    t.division,
    t.school_id,
    t.eliminated_after_stage,
    t.advanced_at,
    round(a.overall, 1)                                                              as overall,
    coalesce(a.stage_scores, '{}'::jsonb)                                            as stage_scores,
    rank() over (partition by t.division order by a.overall desc nulls last)         as division_rank
  from public.teams t
  left join agg a on a.team_id = t.id;

------------------------------------------------------------------------
-- Feedback for teachers — the only path to score data they get
------------------------------------------------------------------------
create or replace function public.get_submission_feedback(p_submission_id uuid)
returns jsonb language plpgsql stable security definer set search_path = public as $$
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
end $$;

revoke execute on function public.get_submission_feedback(uuid) from anon;

------------------------------------------------------------------------
-- Judge queue — submission detail scoped to the caller's assignments,
-- with team identity reduced to division to limit bias.
------------------------------------------------------------------------
create or replace function public.judge_queue()
returns table (
  submission_id uuid,
  stage_ord     int,
  stage_name    text,
  stage_kind    text,
  division      text,
  payload       jsonb,
  status        text,
  due_at        date,
  my_score      jsonb
) language sql stable security definer set search_path = public as $$
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
$$;

revoke execute on function public.judge_queue() from anon;
