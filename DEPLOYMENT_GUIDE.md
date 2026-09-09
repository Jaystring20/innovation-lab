# STEAM Foundry Team-Based Onboarding - Deployment Guide

## Overview
This document covers deploying the complete team-based seamless onboarding flow:
**Store Purchase → Auto-created Teacher Account → Teacher Dashboard → Student Team Login → Shared Dashboard**

## Files Created

### Frontend (Already Deployed ✅)
- src/pages/Store.tsx - Updated with teacher info & team composition fields
- src/contexts/AuthContext.tsx - Extended with team_id & is_team_account
- src/pages/Login.tsx - Updated routing for team accounts
- src/pages/StudentDashboard.tsx - Team-centric display (team name, "Shared Team Account")
- src/lib/student.ts - Complete student platform data layer

### Backend (Ready to Deploy 🚀)

#### Edge Functions
1. **supabase/functions/register-order/index.ts**
   - Triggered when order submitted from Store
   - Creates: School → Teacher Auth → Teacher Profile → Teams → Team Accounts → Order
   - Queues credential email

2. **supabase/functions/send-teacher-credentials/index.ts**
   - Sends email with all credentials to teacher
   - Format: Teacher login + Team credentials table
   - Uses Resend for delivery

#### Database Migrations
**supabase/migrations/20260905_add_team_accounts.sql**
- Adds 	eam_id, is_team_account to profiles
- Adds 	eacher_id to teams
- Creates 	eam_members table
- Adds RLS policies
- Creates performance indexes

## Deployment Checklist

### Step 1: Configure Environment Variables
In Supabase project settings, add:
\\\
RESEND_API_KEY=<your-resend-api-key>
SUPABASE_URL=<your-project-url>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
\\\

### Step 2: Run Database Migration
Execute the migration SQL:
\\\ash
supabase db push
# or run the SQL manually in Supabase dashboard
\\\

### Step 3: Deploy Edge Functions
Deploy both functions to Supabase:
\\\ash
supabase functions deploy register-order
supabase functions deploy send-teacher-credentials
\\\

### Step 4: Verify Schema
Check that these tables have new columns:
- \profiles\: team_id, is_team_account
- \	eams\: teacher_id
- \	eam_members\: NEW table (tracks students)

### Step 5: Test End-to-End
1. Submit order from Store with:
   - School: "Test School"
   - Teacher: "Jane Teacher" / jane@example.com
   - Teams: 1 team with 3 students
   - Division: Primary
   - Fulfilment: Delivery Lagos

2. Verify in Supabase:
   - School created
   - Teacher auth account created (email jane@example.com)
   - Team record created
   - Team account created with is_team_account=true
   - Order record created with status='registered'
   - Email queued/sent

3. Login as teacher:
   - Email: jane@example.com
   - Password: (temp password from email)
   - Redirects to /lab/dashboard

4. Login as team:
   - Email: team-account-xxx@steam-foundry.app
   - Password: (from email)
   - Redirects to /lab/student (StudentDashboard)
   - Shows team name + "Shared Team Account"
   - All team members see same dashboard

## Database Schema Reference

### profiles (updated)
- id (PK)
- role: 'teacher' | 'student' | 'organizer' | 'judge'
- full_name
- email
- school_id (FK)
- **team_id** (NEW - FK to teams)
- **is_team_account** (NEW - boolean)

### teams (updated)
- id (PK)
- school_id (FK)
- name
- division
- **teacher_id** (NEW - FK to profiles)

### team_members (NEW)
- id (PK)
- team_id (FK)
- user_id (FK to auth.users)
- student_name
- order_index
- created_at

### orders (existing)
- id (PK)
- order_reference (indexed)
- school_id (FK)
- status: 'registered' | 'payment_pending' | 'paid' | 'dispatched' | 'cancelled'
- ... (other fields)

## Flow Diagrams

### Registration Flow (register-order Edge Function)
\\\
POST /register-order
  ↓
1. Create school record
  ↓
2. Create teacher auth account (email_confirm: true)
  ↓
3. Create teacher profile (role: 'teacher', school_id)
  ↓
4. FOR EACH TEAM:
   ├─ Create team record (teacher_id link)
   ├─ Create team auth account (is_team_account: true, email_confirm: true)
   ├─ Create team profile (is_team_account: true, team_id link)
   └─ Create team_members rows (all students on team)
  ↓
5. Create order record (status: 'registered')
  ↓
6. Queue send-teacher-credentials (async)
  ↓
RETURN orderReference + teamAccounts
\\\

### Login Flow (Frontend)
\\\
Login.tsx
  ├─ Teacher Login
  │  └─ profile.role === 'teacher'
  │     └─ Navigate to /lab/dashboard (TeacherDashboard)
  │
  └─ Student/Team Login
     ├─ Check is_team_account flag
     ├─ Load team info (team_id, team members)
     └─ Navigate to /lab/student (StudentDashboard - team view)
\\\

### Student Dashboard (Team View)
\\\
StudentDashboard
  ├─ Header: team.name (not individual student name)
  ├─ Subtitle: "Primary • Shared Team Account"
  ├─ Tabs:
  │  ├─ Overview: Team XP, Team Rank, Team Badges, Team Progress
  │  ├─ Missions: All missions for division (team submits together)
  │  ├─ Team: Lists all students on team + their participation
  │  ├─ Leaderboard: Division standings (teams ranked by XP)
  │  ├─ Achievements: Team badges earned
  │  └─ Portfolio: Team submissions & projects
  │
  └─ All data scoped to team_id (not individual student)
\\\

## Troubleshooting

### Email Not Sending
1. Check RESEND_API_KEY is set in Edge Function env vars
2. Verify teacher email is valid
3. Check Resend dashboard for delivery status
4. Fallback: Teacher can reset password via "Forgot Password"

### Team Account Login Fails
1. Verify is_team_account=true in profiles table
2. Check team_id is set correctly
3. Verify team account email matches what was sent
4. Check RLS policy allows student profile access

### StudentDashboard Not Loading
1. Verify profile.team_id is set
2. Check teams table has correct school_id
3. Verify team_members table has rows for all students
4. Check browser console for errors

### Missing Data
1. Run migration: \supabase db push\
2. Verify all columns exist: \SELECT column_name FROM information_schema.columns WHERE table_name='profiles';\
3. Check RLS is disabled for testing (can enable after verification)

## Next Steps

### Phase 2: Teacher Dashboard
- Teacher can view all their teams
- Teacher can add more students/teams individually at own pace
- Teacher can view team progress and submissions

### Phase 3: Judge Integration
- Judges can view submissions from all schools/divisions
- Scoring system for Design → Build → Intelligize stages
- Feedback on team submissions

### Phase 4: Live Battle
- Teams prepare final presentation
- Real-time scoring during BATTLE event
- Leaderboard updates live

## Support
- Order reference: Used for all support queries
- Email: support@steam-foundry.app
- WhatsApp: +234 803 883 8094
