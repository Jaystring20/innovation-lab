# Running the Lab

The Lab is the competition itself: teams submit one deliverable per stage,
organizer-assigned judges score each submission on the handbook rubric, scores
aggregate to a division ranking, and an elimination gate after Stage 2 picks the
finalists. Everything a school sees — status, scores, judge comments — is scoped
by Row-Level Security; the organizer console is the only place the whole picture
is visible.

## Roles

| Role | How it is set | Sees |
|---|---|---|
| `teacher` | default on sign-up; organizer links it to a school | that school's teams, their 4-stage tracker, released feedback |
| `judge` | organizer promotes after sign-up | only submissions assigned to them (division + stage, no school name) |
| `organizer` | promoted in SQL (see `ORGANIZER_SETUP.md`) | everything: teams, submissions, judge assignment, standings, the gate |

Everyone signs in at **`/lab`**. The app routes each role to its own view.

## First-time setup

### 1. Create judge accounts

Each judge signs up at `/lab` (Register). Then promote them:

```sql
update public.profiles set role = 'judge', full_name = 'Judge Name'
where email = 'judge@example.com';
```

### 2. Link teachers to schools

A teacher signs up at `/lab`, then in the organizer console
(**Lab — Competition → People**) pick their account and the school it belongs
to. Or by SQL:

```sql
update public.profiles
set school_id = (select id from public.schools where contact_email = 'school@example.com')
where email = 'teacher@example.com';
```

A teacher can create as many teams as the school has non-cancelled kit orders
(`sum(orders.team_count)`).

### 3. Set the elimination cap

Stages 1 and 2 open automatically for every team. Stage 3 and 4 open only for
teams that pass the gate. In **Lab — Competition → Stage gate**, set how many
teams advance per division (the handbook cuts after Stage 2), preview the
ranked cut, then confirm. Confirming marks eliminations, opens Stages 3–4 for
advancers, and queues result emails.

### 4. Turn on scheduled emails

The daily mailer (`lab-notifications`) sends: stage opens, deadline in 3 / 1
days, feedback released, gate result — all to the school contact on file,
deduped via `public.notification_log`.

**a.** Set the Edge Function secrets (Supabase → Edge Functions → Secrets, or
CLI). The email secrets are shared with the order emails — see `EMAIL_SETUP.md`.

| Secret | Notes |
|---|---|
| `CRON_SECRET` | any long random string; the mailer refuses to run without it |
| `RESEND_API_KEY` | required for real sending; without it the mailer runs in dry-run |
| `ORDER_EMAIL_FROM` | e.g. `APEN 2026 <noreply@yourdomain.ng>` |
| `SITE_URL` | e.g. `https://apen2026.ng` — adds the "Open the Lab" button |

```bash
supabase secrets set --project-ref sctsrxuquhzdjjnlsqbm CRON_SECRET=$(openssl rand -hex 24)
```

**b.** Schedule the daily run. In the Supabase SQL editor, once:

```sql
-- store the same value you set as CRON_SECRET
select vault.create_secret('REPLACE_WITH_CRON_SECRET', 'lab_cron_secret');

select cron.schedule(
  'lab-daily-notifications',
  '0 7 * * *',                         -- 07:00 UTC daily
  $$
  select net.http_post(
    url     := 'https://sctsrxuquhzdjjnlsqbm.functions.supabase.co/lab-notifications',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'lab_cron_secret')
    ),
    body := '{}'::jsonb
  );
  $$
);
```

To change the secret later: `select vault.update_secret((select id from vault.secrets where name = 'lab_cron_secret'), 'NEW_VALUE');` and update the Edge Function secret to match.

Check it: `select * from cron.job;` and `select * from cron.job_run_details order by start_time desc limit 5;`.

## Scoring model

Each submission is scored by every assigned judge on the four rubric criteria
(20 / 30 / 30 / 20 = 100). The submission's score is the mean of the judge
totals. A team's overall is the weighted mean of its scored stages
(`stages.weight`, 0.25 each by default — editable per stage). Ranking is
`rank()` within division on that overall.

Automation, all in the database:
- filling a deliverable → `submitted`
- first judge assigned → `under_review`
- every assigned judge has scored → `scored`, and (unless the stage's
  `auto_release_feedback` is off) feedback opens and an email is queued
- the stage gate ranks, cuts, opens later stages, and queues result emails

## Adjusting stages

`public.stages` holds the calendar and weights. Edit `opens_at`, `due_at`,
`weight`, `advance_count`, `auto_release_feedback` in the organizer console or
directly. `key` and `ord` are fixed.

## Test data

Verification created rows prefixed `vt-` / `Verification Test Academy`. Remove
with:

```sql
delete from auth.users where email like 'vt-%@apentest.local';
delete from public.schools where contact_email = 'verify-test@example.invalid';
```

(Cascades clear the teams, submissions, scores, and assignments.)
