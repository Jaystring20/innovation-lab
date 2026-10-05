# STEAM Foundry — Role-Based Unified Account Architecture

## 🎯 **The Core Principle: ONE Account, Multiple Roles**

```
NOT THIS ❌
├─ Student Account
├─ Teacher Account  
├─ Organizer Account
└─ Admin Account

BUT THIS ✅
└─ ONE UNIFIED ACCOUNT with Role-Based Access Control
   ├─ Role: teacher → See teacher interface & tools
   ├─ Role: student → See student interface & learning
   ├─ Role: organizer → See organizer console
   └─ Switch between roles seamlessly
```

---

## 🏗️ **Architecture: Teacher-Facilitated Learning**

```
┌─────────────────────────────────────────────────────────────────┐
│                    STEAM FOUNDRY ECOSYSTEM                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  SCHOOL ACCOUNT SYSTEM                                   │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │  ONE Account Per Person with Role-Based Access           │   │
│  │                                                          │   │
│  │  Teacher Account:                                        │   │
│  │  ├─ Email: stem.teacher@school.edu.ng                    │   │
│  │  ├─ Password: [same account]                             │   │
│  │  ├─ Roles: ["teacher", "student" (optional)]             │   │
│  │  └─ School: School Name (linked)                         │   │
│  │                                                          │   │
│  │  Student Account:                                        │   │
│  │  ├─ Email: student.name@school.edu.ng                    │   │
│  │  ├─ Password: [same account]                             │   │
│  │  ├─ Role: ["student"]                                    │   │
│  │  └─ School: School Name (linked)                         │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  When Teacher Logs In (with role: teacher):                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  TEACHER LAB DASHBOARD (/lab/dashboard)                  │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │                                                          │   │
│  │  ┌─ SECTION 1: Instructional Materials                  │   │
│  │  │  ├─ Stage Overview (Design, Build, Intelligize, Battle)
│  │  │  ├─ Learning Objectives for current stage            │   │
│  │  │  ├─ Teacher's Guide (how to facilitate)              │   │
│  │  │  ├─ Resource Library (PDFs, videos, templates)       │   │
│  │  │  ├─ Equipment needed checklist                       │   │
│  │  │  └─ Timeline (weeks, lessons, milestones)            │   │
│  │  │                                                      │   │
│  │  ├─ SECTION 2: Mission Breakdown & Student Guidance     │   │
│  │  │  ├─ Mission Details (Build a Solar-Powered Robot)    │   │
│  │  │  ├─ Step-by-step breakdown (Week 1, Week 2, etc.)    │   │
│  │  │  ├─ Learning Outcomes for each step                  │   │
│  │  │  ├─ Success Criteria (what does "done" look like)    │   │
│  │  │  ├─ Common misconceptions & solutions                │   │
│  │  │  ├─ Differentiation options (for advanced/struggling)│   │
│  │  │  └─ Assessment rubric                                │   │
│  │  │                                                      │   │
│  │  ├─ SECTION 3: Student Progress Monitoring              │   │
│  │  │  ├─ Student List (30 students)                       │   │
│  │  │  │  ├─ Student 1: Submitted evidence for Week 1 ✓    │   │
│  │  │  │  ├─ Student 2: In progress on Week 2              │   │
│  │  │  │  ├─ Student 3: Needs help on Step 3               │   │
│  │  │  │  └─ Student 30: Advanced, completed full mission  │   │
│  │  │  ├─ Real-time Dashboard:                             │   │
│  │  │  │  ├─ % of students on track                        │   │
│  │  │  │  ├─ Common blockers (what they're stuck on)       │   │
│  │  │  │  └─ Who needs help                                │   │
│  │  │  └─ Individual Student View:                         │   │
│  │  │     ├─ Progress on mission steps                     │   │
│  │  │     ├─ Evidence submitted (photos, videos)           │   │
│  │  │     ├─ Teacher notes from observations               │   │
│  │  │     └─ Feedback given so far                         │   │
│  │  │                                                      │   │
│  │  └─ SECTION 4: Submission & Evidence Collection         │   │
│  │     ├─ Evidence Upload Form (for current stage)         │   │
│  │     │  ├─ Instructional material links                  │   │
│  │     │  ├─ Mission breakdown reference                   │   │
│  │     │  ├─ File uploads:                                 │   │
│  │     │  │  ├─ Video demonstration (5-minute video)       │   │
│  │     │  │  ├─ Documentation (PDFs, design drawings)      │   │
│  │     │  │  ├─ Code/technical files (if applicable)       │   │
│  │     │  │  └─ Photos of project (before/after)           │   │
│  │     │  ├─ Teacher reflection:                           │   │
│  │     │  │  ├─ How students performed                      │   │
│  │     │  │  ├─ Lessons learned                            │   │
│  │     │  │  └─ Evidence of learning outcomes met          │   │
│  │     │  └─ Submit for organizer review ✅ (FILE UPLOAD)  │   │
│  │     │                                                   │   │
│  │     └─ Submission History:                              │   │
│  │        ├─ Design Stage: Submitted ✓ (Jan 15)            │   │
│  │        ├─ Build Stage: Ready to submit (Jan 30)         │   │
│  │        └─ Intelligize Stage: In progress                │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
│  When Student Logs In (with role: student):                     │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  STUDENT LEARNING DASHBOARD (/dashboard)                │   │
│  ├──────────────────────────────────────────────────────────┤   │
│  │                                                          │   │
│  │  ├─ Current Mission (teacher-facilitated)               │   │
│  │  │  ├─ Mission: Build a Solar-Powered Robot             │   │
│  │  │  ├─ This Week's Focus: Week 1 - Planning & Design    │   │
│  │  │  ├─ What Teacher is Guiding:                         │   │
│  │  │  │  ├─ Today: Learn about solar energy               │   │
│  │  │  │  ├─ Tomorrow: Design your robot                   │   │
│  │  │  │  └─ This week: Build prototype                    │   │
│  │  │  ├─ Progress: 25% complete                           │   │
│  │  │  └─ My Submissions: [See teacher feedback]           │   │
│  │  │                                                      │   │
│  │  ├─ Learning Materials (from teacher's section)          │   │
│  │  │  ├─ Today's Lesson (auto-synced from teacher materials)
│  │  │  ├─ Resources (PDFs, videos teacher selected)         │   │
│  │  │  ├─ Step-by-step guide (from teacher's breakdown)     │   │
│  │  │  └─ Success criteria (from teacher's rubric)          │   │
│  │  │                                                      │   │
│  │  ├─ My Evidence                                          │   │
│  │  │  ├─ Photo uploads (from today's work)                 │   │
│  │  │  ├─ Submitted evidence (that teacher collected)       │   │
│  │  │  └─ Teacher feedback on submissions                   │   │
│  │  │                                                      │   │
│  │  ├─ Innovation Points & Badges                           │   │
│  │  │  ├─ Points: 245 XP                                    │   │
│  │  │  ├─ Badges: Roboticist, Problem Solver               │   │
│  │  │  └─ Level: 3 (Primary • Ages 7-12)                   │   │
│  │  │                                                      │   │
│  │  └─ Leaderboard                                          │   │
│  │     ├─ This Week's Top Students                          │   │
│  │     └─ Your Rank: 4th in class                           │   │
│  │                                                          │   │
│  └──────────────────────────────────────────────────────────┘   │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 🔄 **Complete Teacher-Facilitated Learning Flow**

### **The Unified Seamless Handoff**

```
BEFORE SCHOOL YEAR:
├─ Kit arrives
├─ Teacher creates account (from registration)
├─ Teacher logs in → Lab Dashboard
├─ Teacher reviews instructional materials
├─ Teacher prepares mission breakdown
└─ Teacher onboards students (30 students)

WEEK 1 - DESIGN STAGE:
├─ Teacher logs in → Lab Dashboard
│  ├─ Reviews "Design Stage Instructional Materials"
│  ├─ Reviews "Mission: Build Solar Robot - Design Phase"
│  ├─ Sees student progress:
│  │  ├─ Student 1: Working on step 1 (understand solar energy)
│  │  ├─ Student 2: Completed step 1, starting design sketch
│  │  ├─ Student 3: Stuck on solar panel concepts (needs help)
│  │  └─ All students: Dashboard shows real-time progress
│  │
│  └─ Facilitates learning throughout the week:
│     ├─ Uses teacher guide to explain concepts
│     ├─ Circulates classroom monitoring students
│     ├─ Takes photos/videos of student work
│     ├─ Provides real-time feedback
│     └─ Students submit evidence (via their dashboard)
│
├─ Students log in → Learning Dashboard
│  ├─ See "This Week's Focus: Design Phase"
│  ├─ See instructional materials (teacher's resources)
│  ├─ See mission breakdown (teacher's step-by-step guide)
│  ├─ Work on tasks (with teacher facilitating in classroom)
│  ├─ Submit evidence (photos of designs, sketches)
│  ├─ Receive teacher feedback (posted on their dashboard)
│  ├─ Earn XP for progress
│  └─ Check leaderboard (class ranking)
│
└─ Teacher & students work together in-class

WEEK 4 - DESIGN STAGE COMPLETE:
├─ Teacher collects all evidence:
│  ├─ Compiled from student submissions
│  ├─ Additional photos teacher took
│  ├─ Design documents
│  ├─ Student reflections
│  └─ Teacher observations
│
├─ Teacher logs in → Lab Dashboard → "Submission for Design Stage"
│  ├─ Reviews all instructional materials they taught ✓
│  ├─ Reviews mission breakdown ✓
│  ├─ Uploads evidence:
│  │  ├─ "Design_presentations.mp4" (5-minute video of final designs)
│  │  ├─ "Design_rubric_scores.pdf" (teacher assessment)
│  │  ├─ "Student_design_sketches.pdf" (all student designs)
│  │  └─ "Lesson_reflection.txt" (teacher's notes)
│  │
│  ├─ Writes submission notes:
│  │  ├─ "All students completed design phase"
│  │  ├─ "Focused on solar panel efficiency"
│  │  ├─ "3 students excelled, 2 needed extra support (evidence in files)"
│  │  └─ "Learning outcomes achieved: [specific evidence]"
│  │
│  └─ SUBMIT → Goes to Organizer ✅
│
└─ Organizer reviews submission (our file upload system)

WEEK 5-8 - BUILD STAGE:
├─ Teacher log in → Lab Dashboard
│  ├─ Reviews "Build Stage Instructional Materials"
│  ├─ Reviews "Mission: Build Solar Robot - Build Phase"
│  ├─ Sees new student progress (building prototypes)
│  └─ Facilitates learning (same cycle as Design)
│
├─ Students log in → Learning Dashboard
│  ├─ See "This Week's Focus: Build Phase"
│  ├─ See new instructional materials (synced from teacher)
│  ├─ See new mission breakdown (teacher's build guide)
│  ├─ Build prototypes (with teacher guiding)
│  ├─ Submit evidence of building
│  └─ Continue earning XP
│
└─ Same seamless facilitation continues

WEEK 12 - SUBMISSION AGAIN:
├─ Teacher collects Build phase evidence
├─ Submits to organizer (file upload system)
└─ Cycle continues...

FINAL - BATTLE STAGE (Live Event):
├─ Teacher prepares students for live competition
├─ Students build final version
├─ Teacher coordinates with organizers
├─ Students present work at live event
└─ Organizers score final presentation
```

---

## 🔗 **The Data Connections**

```
Instructional Materials (Teacher creates/selects)
    ↓
Student Learning Dashboard (auto-synced)
    ↓
Students learn with teacher facilitation
    ↓
Student Evidence Submissions (photos, work)
    ↓
Teacher's Lab Dashboard (sees all evidence)
    ↓
Teacher compiles & uploads to Organizer
    ↓
Organizer reviews (with file upload system we built)
    ↓
Scores & feedback
    ↓
Results go back to Student Dashboard
    ↓
Students see their performance, feedback, badges
```

---

## 📊 **Database Schema for Unified Role-Based System**

```sql
-- ONE Account System (not separate)
CREATE TABLE auth_accounts (
  id UUID PRIMARY KEY (from Supabase Auth),
  email TEXT UNIQUE,
  roles TEXT[] ('teacher', 'student', 'organizer', 'admin'),
  school_id UUID REFERENCES schools(id),
  name TEXT,
  created_at TIMESTAMP
);

-- Instructional Materials (Teacher creates)
CREATE TABLE instructional_materials (
  id UUID PRIMARY KEY,
  school_id UUID REFERENCES schools(id),
  stage_id UUID REFERENCES stages(id),
  teacher_id UUID REFERENCES auth_accounts(id),
  title TEXT,
  description TEXT,
  learning_objectives TEXT[],
  resources JSONB (links to PDFs, videos, templates),
  equipment_checklist TEXT[],
  timeline_weeks INTEGER,
  created_at TIMESTAMP
);

-- Mission Breakdown (Teacher facilitates with this)
CREATE TABLE mission_breakdown (
  id UUID PRIMARY KEY,
  school_id UUID REFERENCES schools(id),
  stage_id UUID REFERENCES stages(id),
  teacher_id UUID REFERENCES auth_accounts(id),
  mission_title TEXT,
  steps JSONB (step 1, step 2, ... step N),
  learning_outcomes TEXT[],
  success_criteria JSONB,
  differentiation_strategies JSONB,
  assessment_rubric JSONB,
  created_at TIMESTAMP
);

-- Student Progress (Real-time tracking)
CREATE TABLE student_progress (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES auth_accounts(id),
  mission_id UUID REFERENCES mission_breakdown(id),
  current_step INTEGER,
  status TEXT ('not_started', 'in_progress', 'completed'),
  evidence_submitted JSONB (photo links, file IDs),
  teacher_feedback TEXT,
  last_updated TIMESTAMP
);

-- Teacher Evidence Collection (for submission)
CREATE TABLE teacher_evidence_collection (
  id UUID PRIMARY KEY,
  teacher_id UUID REFERENCES auth_accounts(id),
  stage_id UUID REFERENCES stages(id),
  collected_student_evidence JSONB (array of student submissions),
  teacher_additional_evidence JSONB (files teacher added),
  collected_at TIMESTAMP
);

-- Submissions (what we already built - file upload system)
CREATE TABLE submissions (
  id UUID PRIMARY KEY,
  school_id UUID REFERENCES schools(id),
  teacher_id UUID REFERENCES auth_accounts(id),
  stage_id UUID REFERENCES stages(id),
  mission_id UUID REFERENCES mission_breakdown(id),
  instructional_materials_link UUID REFERENCES instructional_materials(id),
  uploaded_files JSONB (THE FILE UPLOAD SYSTEM WE BUILT),
  teacher_notes TEXT,
  submission_status TEXT ('draft', 'submitted', 'under_review', 'scored'),
  submitted_at TIMESTAMP
);
```

---

## 🎯 **What Needs to Be Built**

### **Current State ✅**
- One account system (auth)
- Student learning dashboard
- File upload system (just built!)
- Organizer review console

### **Missing: Teacher Facilitation Hub** ⏳

**Need to build in Lab Dashboard:**

1. **Instructional Materials Section**
   - Teacher uploads/organizes learning materials per stage
   - Links to resources, videos, PDFs, templates
   - Equipment checklists
   - Timeline and milestones

2. **Mission Breakdown Section**
   - Step-by-step guidance for facilitation
   - Learning outcomes for each step
   - Success criteria/rubrics
   - Differentiation strategies
   - Assessment rubrics

3. **Student Progress Monitoring**
   - Real-time dashboard of student progress
   - See which step each student is on
   - Identify who needs help
   - Track submissions of evidence

4. **Evidence Collection Hub**
   - Aggregate all student submissions
   - Add teacher-collected evidence (photos from class)
   - Preview all evidence before submitting
   - Then submit to organizers (using file upload system)

---

## ✅ **The Seamless Handoff You Described**

```
WHEN EVERYTHING IS BUILT:

Teacher logs in → Lab Dashboard

Sees EVERYTHING needed to facilitate learning:
├─ Instructional materials ← What to teach
├─ Mission breakdown ← How to guide students step-by-step
├─ Student progress ← Who's where, who needs help (real-time)
└─ Submission system ← Collect all evidence and submit to organizers

Students log in → Learning Dashboard

See EVERYTHING needed to learn:
├─ Teacher's materials (auto-synced from teacher's section)
├─ Mission breakdown (auto-synced from teacher's section)
├─ Their progress on steps
├─ Place to submit evidence
├─ Teacher feedback on submissions
└─ XP, badges, leaderboard

SEAMLESS FLOW:
Teacher teaches ↔ Students learn ↔ Evidence collected ↔ Submitted to organizers

NO DELAYS, NO DISCONNECTS, ONE UNIFIED SYSTEM!
```

---

## 🏁 **Summary: What This Means**

**Your Insight:**
✅ Teacher-facilitated learning (not independent)
✅ One account system with roles (not separate accounts)
✅ Instructional materials in teacher dashboard
✅ Mission breakdown in teacher dashboard
✅ Student dashboard syncs with teacher materials
✅ Real-time student progress monitoring
✅ Seamless evidence collection
✅ Submission system connects to organizer (file upload we built!)
✅ Complete handoff from learning → submission → judging

**That's a professional, integrated Learning Management System (LMS)!**

---

## 📝 **Next Steps**

Should I build:
1. **Instructional Materials Section** (teacher uploads materials per stage)
2. **Mission Breakdown Section** (teacher creates step-by-step guides)
3. **Student Progress Dashboard** (real-time monitoring)
4. **Evidence Collection Hub** (aggregates submissions before submitting)

These 4 pieces + the file upload system we already built = **Complete Teacher-Facilitated Learning Platform** ✅
