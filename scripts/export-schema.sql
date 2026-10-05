-- Exports the live database structure (no data) as runnable SQL, for when
-- `supabase db dump` is unavailable (it needs Docker). Paste into the Supabase
-- SQL Editor, run, then Export -> Download CSV; the one cell holds the schema.
with
tbl as (
  select c.oid, c.relname::text as name
  from pg_class c join pg_namespace n on n.oid = c.relnamespace
  where n.nspname = 'public' and c.relkind in ('r', 'p')
),
stmts(ord, k, stmt) as (
  -- enum types
  select 1, t.typname::text,
         format('create type public.%I as enum (%s);', t.typname,
                string_agg(quote_literal(e.enumlabel), ', ' order by e.enumsortorder))
  from pg_type t
  join pg_enum e on e.enumtypid = t.oid
  join pg_namespace n on n.oid = t.typnamespace
  where n.nspname = 'public'
  group by t.typname
  union all
  -- tables and columns
  select 2, t.name,
         format(E'create table public.%I (\n%s\n);', t.name,
                string_agg(format('  %I %s%s%s', a.attname,
                                  format_type(a.atttypid, a.atttypmod),
                                  case when a.attnotnull then ' not null' else '' end,
                                  coalesce(' default ' || pg_get_expr(d.adbin, d.adrelid), '')),
                           E',\n' order by a.attnum))
  from tbl t
  join pg_attribute a on a.attrelid = t.oid and a.attnum > 0 and not a.attisdropped
  left join pg_attrdef d on d.adrelid = t.oid and d.adnum = a.attnum
  group by t.name
  union all
  -- primary keys, unique and check constraints, then foreign keys
  select case when con.contype = 'f' then 4 else 3 end, t.name,
         format('alter table public.%I add constraint %I %s;', t.name, con.conname,
                pg_get_constraintdef(con.oid))
  from tbl t join pg_constraint con on con.conrelid = t.oid
  union all
  -- indexes that do not back a constraint
  select 5, i.tablename::text, i.indexdef || ';'
  from pg_indexes i
  where i.schemaname = 'public'
    and not exists (select 1 from pg_constraint c where c.conname = i.indexname)
  union all
  -- views
  select 6, v.viewname::text, format(E'create or replace view public.%I as\n%s', v.viewname, v.definition)
  from pg_views v where v.schemaname = 'public'
  union all
  -- functions (skips ones installed by extensions)
  select 7, p.proname::text, pg_get_functiondef(p.oid) || ';'
  from pg_proc p join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public' and p.prokind in ('f', 'p')
    and not exists (select 1 from pg_depend dep where dep.objid = p.oid and dep.deptype = 'e')
  union all
  -- row level security switches
  select 8, t.name, format('alter table public.%I enable row level security;', t.name)
  from tbl t join pg_class c on c.oid = t.oid where c.relrowsecurity
  union all
  -- policies, including storage buckets (payment proofs, uploads)
  select 9, p.schemaname || '.' || p.tablename,
         format('create policy %I on %I.%I as %s for %s to %s%s%s;', p.policyname,
                p.schemaname, p.tablename, p.permissive, p.cmd, array_to_string(p.roles, ', '),
                coalesce(' using (' || p.qual || ')', ''),
                coalesce(' with check (' || p.with_check || ')', ''))
  from pg_policies p where p.schemaname in ('public', 'storage')
  union all
  -- triggers on app tables and on auth.users (new-profile trigger)
  select 10, n.nspname || '.' || c.relname, pg_get_triggerdef(tg.oid) || ';'
  from pg_trigger tg
  join pg_class c on c.oid = tg.tgrelid
  join pg_namespace n on n.oid = c.relnamespace
  where not tg.tgisinternal
    and (n.nspname = 'public' or (n.nspname = 'auth' and c.relname = 'users'))
)
select string_agg(stmt, E'\n\n' order by ord, k, stmt) as schema_sql from stmts;
