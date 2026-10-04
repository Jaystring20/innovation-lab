# Complete Judge Setup Guide

## Current Status

✅ **What's Working:**
- Judge account created in auth: `digitalcreativeshubltd@gmail.com`
- Judge Dashboard code is complete and ready
- Judge scoring interface with 4-rubric criteria is built
- Organizer can view and manage judges in the Lab console

❌ **What Needs Completion:**
- Judge's role needs to be updated from default to 'judge' in the profiles table

## Step-by-Step Judge Setup

### Step 1: Promote Judge in Supabase (REQUIRED)

The judge account needs to have its `role` field updated to `'judge'` in the Supabase `profiles` table.

**Option A: Via Supabase Dashboard SQL Editor** (Recommended)

1. Go to https://supabase.com/dashboard/project/sctsrxuquhzdjjnlsqbm/sql/new
2. Sign in with your Supabase account
3. Copy and paste this SQL query:

```sql
update public.profiles 
set role = 'judge', full_name = 'Test Judge'
where email = 'digitalcreativeshubltd@gmail.com';
```

4. Click "Run" (Ctrl+Enter)
5. You should see "1 row updated"

**Option B: Via Supabase CLI** (If you have SERVICE_ROLE_KEY)

```bash
cd innovation-lab-repo
node scripts/promote-judge.mjs <YOUR_SERVICE_ROLE_KEY> digitalcreativeshubltd@gmail.com "Test Judge"
```

To find your SERVICE_ROLE_KEY:
1. Go to https://supabase.com/dashboard/project/sctsrxuquhzdjjnlsqbm/settings/api
2. Copy the value from "service_role" (the long secret key, not the anon key)

### Step 2: Verify Judge Account is Promoted

In the Organizer Console (Lab → Competition → People tab):
- The judge should no longer appear in "TEACHER ACCOUNTS WAITING TO BE LINKED"
- A new section "JUDGES" should show the promoted judge account

### Step 3: Judge Logs In and Scores

The judge can now:
1. Go to https://innovation-lab-seven.vercel.app/lab
2. Sign in with credentials:
   - Email: `digitalcreativeshubltd@gmail.com`
   - Password: `@Welcome2026&judge`
3. They'll see the **Judge Dashboard** → "Review queue" page
4. Once the organizer assigns them to submissions, they can:
   - View submitted deliverables (videos, docs, code)
   - Score on the 4-rubric criteria (Design, Hardware, AI, Presentation)
   - Provide comments for the school
   - See their score live update to /100

## Complete Workflow Once Judge is Promoted

### For the Organizer:
1. **Organizer Console** → Lab → Competition → **Judge assignment tab**
   - Select submissions
   - Assign the judge to those submissions
2. Judge appears with assignments in their Review queue

### For the Judge:
1. Log in at `/lab`
2. Review queue shows assigned submissions (anonymized by stage + division only, no school names)
3. Expand each submission to see:
   - Video/demo links
   - Code/documentation links
   - Team notes
4. Fill in rubric scores (each criterion has a max):
   - Design Thinking & Empathy (max 20)
   - Hardware Execution & Build Quality (max 30)
   - AI Innovation & "Intelligize" Layer (max 30)
   - Presentation & Documentation (max 20)
   - **Total: /100**
5. Add comments for the school
6. Click "Submit score"

### For the Teacher:
1. After judge scores, organizer releases feedback
2. Teacher sees in their dashboard:
   - Judge feedback comments
   - Average scores from all judges
   - Can advance to next stage once scoring is complete

## Testing the Full Workflow

### Test Scenario Setup:
- **School:** APEN Test School — DELETE (Primary Division)
- **Teacher Account:** jaydigitalstrategist@gmail.com (already linked, already created team)
- **Team:** Test Team Alpha (already created, in Design stage)
- **Judge Account:** digitalcreativeshubltd@gmail.com (needs promotion - Step 1 above)

### Test Sequence:
1. ✅ Teacher submits a design deliverable (video + code URL)
2. ✅ Organizer sees submission in Submissions tab
3. ⚠️ Organizer assigns judge in Judge assignment tab (requires judge to be promoted)
4. ⚠️ Judge logs in and sees submission in their queue
5. ⚠️ Judge scores submission using 4-rubric
6. ⚠️ Judge comments appear in submission
7. ⚠️ Organizer releases feedback
8. ⚠️ Teacher sees feedback in their dashboard

**⚠️ = Cannot test until judge is promoted (Step 1)**

## Key Files for Reference

- **Judge Dashboard:** `src/pages/JudgeDashboard.tsx` - Review queue interface
- **Judge Scoring:** `src/components/lab/ScoreForm.tsx` - 4-rubric scoring form
- **Judge Data Layer:** `src/lib/lab.ts` - `judgeQueue()` and `submitScore()` functions
- **Setup Docs:** `LAB_SETUP.md` - Complete Lab documentation

## Next Steps

1. **Complete Step 1 above** to promote the judge account
2. The judge can then log in and test scoring
3. Then build out remaining tabs:
   - Submissions Matrix (organizer view of all submissions)
   - Judge Assignment (interface to assign judges)
   - Standings (team rankings)
   - Stage Gate (advance/eliminate logic)

## Troubleshooting

**"No judges yet" message still showing after promotion:**
- Refresh the page (Organizer Console → Refresh button)
- Clear browser cache and reload
- Check SQL query ran successfully (should show "1 row updated")

**Judge sees "Waiting to be linked to your school":**
- Judge's `role` field is still not 'judge'
- Go back to Step 1 and ensure SQL query executed
- Query should update the role field, not the school_id

**"Nothing assigned to you yet" in Review queue:**
- Judge is promoted ✅
- But no submissions have been assigned yet
- Organizer needs to go to "Judge assignment" tab and assign submissions
