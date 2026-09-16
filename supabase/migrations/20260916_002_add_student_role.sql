-- Add 'student' to the user_role enum
-- Team accounts (student profiles) need this role, but the enum only had
-- organizer, judge, teacher — causing "invalid input value for enum user_role"
-- when register-order tries to set role='student' on team profiles.

ALTER TYPE public.user_role ADD VALUE IF NOT EXISTS 'student';
