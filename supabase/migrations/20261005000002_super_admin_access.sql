-- Wire super_admin into access control. Applying this changes nobody's access:
-- no profile holds super_admin until one is promoted by hand (see the note at
-- the end).

create or replace function public.is_super_admin()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'super_admin' from public.profiles where id = auth.uid()), false);
$$;

-- Every organizer policy goes through is_organizer(), so widening it here gives
-- super admins the whole organizer console without touching each policy.
create or replace function public.is_organizer()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role in ('organizer', 'super_admin') from public.profiles where id = auth.uid()), false);
$$;

-- "organizers write profiles" lets any organizer change any role, including
-- making someone else an organizer. From here, only a super admin may grant,
-- remove, or delete organizer and super admin access. Calls with no signed-in
-- user (the service role in Edge Functions, the SQL editor) are trusted, as
-- they already bypass RLS.
create or replace function public.guard_privileged_roles()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if auth.uid() is null or public.is_super_admin() then
    return coalesce(new, old);
  end if;

  if tg_op = 'UPDATE' and new.role is not distinct from old.role then
    return new;
  end if;

  if (tg_op <> 'DELETE' and new.role in ('organizer', 'super_admin'))
     or (tg_op <> 'INSERT' and old.role in ('organizer', 'super_admin')) then
    raise exception 'Only a super admin can grant or remove organizer or super admin access'
      using errcode = '42501';
  end if;

  return coalesce(new, old);
end;
$$;

revoke execute on function public.guard_privileged_roles() from anon, authenticated;

drop trigger if exists guard_privileged_roles on public.profiles;
create trigger guard_privileged_roles
  before insert or update of role or delete on public.profiles
  for each row execute function public.guard_privileged_roles();

-- Promoting the first super admin is a one-off, run by hand in the SQL editor
-- AFTER the app and the run-stage-gate function that understand super_admin
-- are deployed (otherwise the account is bounced out of the organizer console):
--
--   update public.profiles set role = 'super_admin' where email = '<owner email>';
