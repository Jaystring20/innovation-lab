-- APEN 2026 — role model and access control.
--
-- Before this migration every RLS policy on orders/schools/organizer_users
-- granted access on `auth.role() = 'authenticated'`, i.e. to ANY signed-in
-- user. That was safe only while organizers were the sole account holders.
-- The Lab introduces teacher and judge accounts, which would have turned that
-- condition into a data leak. Roles are explicit from here on.

create type public.user_role as enum ('organizer', 'judge', 'teacher');

create table public.profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  role       public.user_role not null default 'teacher',
  full_name  text,
  email      text,
  created_at timestamptz not null default now()
);

alter table public.profiles enable row level security;

-- Read the caller's role without RLS recursion: a policy on orders that
-- selected from profiles directly would re-enter profiles' own policies.
create or replace function public.is_organizer()
returns boolean language sql stable security definer set search_path = public as $$
  select coalesce((select role = 'organizer' from public.profiles where id = auth.uid()), false);
$$;

create or replace function public.current_user_role()
returns public.user_role language sql stable security definer set search_path = public as $$
  select role from public.profiles where id = auth.uid();
$$;

-- New signups land as 'teacher' (least privilege). A fresh teacher profile has
-- no school attached, so it can reach nothing until an organizer links it.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data ->> 'name')
  on conflict (id) do nothing;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

revoke execute on function public.handle_new_user() from anon, authenticated;

-- Profiles: read your own; organizers read all. Only organizers may write —
-- this is what stops a teacher promoting themselves to organizer.
create policy "read own profile"           on public.profiles for select using (id = auth.uid());
create policy "organizers read all profiles" on public.profiles for select using (public.is_organizer());
create policy "organizers write profiles"    on public.profiles for all
  using (public.is_organizer()) with check (public.is_organizer());

-- Replace every "any authenticated user" policy with an explicit role check.
-- Public INSERT policies are retained: schools register without an account.
drop policy if exists "organizers can view orders"           on public.orders;
drop policy if exists "organizers can update orders"         on public.orders;
drop policy if exists "organizers can view schools"          on public.schools;
drop policy if exists "organizers can update schools"        on public.schools;
drop policy if exists "organizers can view organizer_users"  on public.organizer_users;
drop policy if exists "organizers can read payment proofs"   on storage.objects;

create policy "organizers view orders"   on public.orders  for select using (public.is_organizer());
create policy "organizers update orders" on public.orders  for update
  using (public.is_organizer()) with check (public.is_organizer());

create policy "organizers view schools"   on public.schools for select using (public.is_organizer());
create policy "organizers update schools" on public.schools for update
  using (public.is_organizer()) with check (public.is_organizer());

create policy "organizers view organizer_users" on public.organizer_users
  for select using (public.is_organizer());

create policy "organizers read payment proofs" on storage.objects
  for select using (bucket_id = 'payment-proofs' and public.is_organizer());
