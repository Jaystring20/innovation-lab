-- APEN 2026 moved to the second term of the 2026/2027 school year, with the
-- Grand Finale on Tuesday 23 March 2027 (Lagos State harmonised calendar).
--
--   Registration closes  Tue 19 Jan (after the Sat 16 Jan election)
--   Kits delivered by    Mon 25 Jan
--   Design               Mon 25 Jan - Fri 29 Jan   no cut afterwards
--   Build                Mon  1 Feb - Sun 21 Feb   cut after judging in mid-term (22-26 Feb)
--   Intelligize          Mon  1 Mar - Sun 14 Mar   judges review submissions 15-18 Mar
--   Battle               Tue 23 Mar                live presentations, then the judges' final verdict
--
-- Build opens while Design is being judged: every team already has its Design
-- and Build submissions (teams_after_insert), so "no cut after Design" means
-- the stage gate is simply not run for stage 1. Running it would eliminate any
-- team without a Design score.
--
-- lab-notifications reads opens_at / due_at, so the "stage is open" and
-- deadline reminder emails follow these dates on their own.

update public.stages set opens_at = date '2027-01-25', due_at = date '2027-01-29' where key = 'design';
update public.stages set opens_at = date '2027-02-01', due_at = date '2027-02-21' where key = 'build';
update public.stages set opens_at = date '2027-03-01', due_at = date '2027-03-14' where key = 'intelligize';
update public.stages set opens_at = date '2027-03-23', due_at = date '2027-03-23' where key = 'battle';
