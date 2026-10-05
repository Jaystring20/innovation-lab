-- Super admin: the platform owner. Everything an organizer can do, plus the
-- sole right to grant or remove organizer and super admin access.
--
-- Postgres refuses to use an enum value in the transaction that adds it, so the
-- value gets a migration of its own; 20261005000002 is the one that uses it.
alter type public.user_role add value if not exists 'super_admin';
