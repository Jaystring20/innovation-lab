-- Follow-up to 004: address database linter warnings.

-- pg_net belongs in a dedicated schema, not public.
create schema if not exists extensions;
drop extension if exists pg_net;
create extension pg_net with schema extensions;

-- Trigger functions and the two data RPCs are not meant to be reachable through
-- the REST /rpc surface for anon. Close those paths; keep the RPCs open to
-- signed-in users (they self-check the caller anyway).
revoke execute on function public.teams_before_insert()        from public;
revoke execute on function public.teams_after_insert()         from public;
revoke execute on function public.submissions_before_update()  from public;
revoke execute on function public.assignments_after_insert()   from public;
revoke execute on function public.scores_after_write()         from public;

revoke execute on function public.judge_queue()                 from public, anon;
revoke execute on function public.get_submission_feedback(uuid) from public, anon;
grant  execute on function public.judge_queue()                 to authenticated;
grant  execute on function public.get_submission_feedback(uuid) to authenticated;
