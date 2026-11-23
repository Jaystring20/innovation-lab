# School Onboarding Flow — Complete Architecture

## 🎯 The Complete STEAM Foundry Journey

```
STORE PHASE → REGISTRATION PHASE → PAYMENT PHASE → ACCOUNT CREATION → LIVE ACCESS
```

---

## 📋 **Phase 1: Store (Kit Purchase)**

**What Happens:**
- School browses kits on `/store`
- School adds kits to cart
- School proceeds to checkout

**Data Collected:**
- Kit details
- Quantity
- Price

**Database:**
- `orders` table (pending payment)

---

## 📝 **Phase 2: Registration (School Details)**

**URL:** After checkout clicked → `/order/[ORDER_ID]/register`

**What Happens:**
School fills registration form with:
```
SCHOOL INFORMATION:
├─ School name (required)
├─ State/Location (required)
├─ School type (public/private)
├─ Student count (expected)
├─ Teacher count (expected)
└─ School address

TEACHER INFORMATION (Primary Contact):
├─ Teacher full name (required)
├─ Teacher email (required) ⭐ CRITICAL
├─ Teacher phone (required)
├─ Teacher expertise (STEM areas)
└─ Teacher role (STEM Coordinator, etc.)

ADDITIONAL INFO:
├─ Expected student age group (7-12, 13-18, etc.)
├─ Learning goals
└─ Preferred start date
```

**Database:**
- `schools` table created
- Teacher contact info stored (temporary)

---

## 💳 **Phase 3: Payment Confirmation**

**What Happens:**
1. Payment processed
2. Order marked as `paid`
3. Confirmation sent to teacher email
4. **TRIGGER: Account creation automation** ← HERE IS WHERE THE MAGIC HAPPENS!

**Database:**
- `orders.status` = `paid`
- `orders.payment_confirmed_at` = timestamp

---

## 🔑 **Phase 4: Automatic Account Creation (THE GAP TO FILL)**

**When:** Immediately after payment confirmed

**What Should Happen:**

### **Step 1: Create Teacher Account** (Supabase Auth)
```
CREATE AUTH USER:
├─ Email: [teacher_email_from_registration]
├─ Password: [send reset link to email]
├─ Metadata: {
│   ├─ role: "teacher"
│   ├─ school_id: [newly_created_school_id]
│   ├─ phone: [teacher_phone]
│   └─ name: [teacher_name]
│  }
└─ Status: active
```

### **Step 2: Create School Account** (Database)
```
INSERT INTO schools:
├─ id: [UUID]
├─ name: [school_name]
├─ state: [state]
├─ address: [address]
├─ teacher_id: [teacher_account_id]
├─ status: "active"
├─ created_at: [now]
└─ order_id: [order_id]
```

### **Step 3: Link Order to School** (Database)
```
UPDATE orders:
├─ school_id: [school_id]
├─ status: "fulfilled"
└─ fulfilled_at: [now]
```

### **Step 4: Create Student Accounts** (Database + Auth)
```
FOR EACH student_slot (based on kit type/quantity):
├─ Create student record in `students` table
│  ├─ id: [UUID]
│  ├─ school_id: [school_id]
│  ├─ grade_level: [from_school_profile]
│  ├─ status: "pending_activation"
│  └─ created_at: [now]
│
├─ Create auth user (batch or on-demand)
│  ├─ Email: auto-generated [studentN@school.edu.ng]
│  ├─ Password: [temporary, reset on first login]
│  ├─ Metadata: {
│  │   ├─ role: "student"
│  │   ├─ school_id: [school_id]
│  │   └─ student_id: [student_id]
│  │  }
│  └─ Status: active
│
└─ Create student profile
   ├─ First login: false
   ├─ Dashboard: not yet viewed
   └─ Missions: not yet started
```

### **Step 5: Initialize Learning Dashboard** (Database)
```
FOR EACH student:
├─ Create dashboard_state record
│  ├─ student_id: [student_id]
│  ├─ current_division: "Primary" | "Secondary" | "Sixth_Form"
│  ├─ current_stage: "Design" (stage 1)
│  ├─ innovation_points: 0
│  ├─ missions_completed: 0
│  └─ created_at: [now]
│
└─ Create mission_progress records
   └─ One record for each stage's missions (empty, not started)
```

### **Step 6: Send Welcome Emails** (Email Service)
```
TO TEACHER:
├─ Subject: "STEAM Foundry Account Created - Start Submitting!"
├─ Body:
│  ├─ Welcome [teacher_name]!
│  ├─ Your school [school_name] is ready to go
│  ├─ [X] students created and ready to learn
│  ├─ Login to Lab Dashboard: [URL]/lab/dashboard
│  ├─ Manage students: [URL]/lab/students
│  ├─ Reset password link (temporary)
│  └─ Support contact info
└─ Attachment: Getting started guide

TO STUDENTS (via teacher email, or via student emails):
├─ Subject: "Your STEAM Foundry Learning Dashboard is Ready!"
├─ Body:
│  ├─ Welcome to STEAM Foundry!
│  ├─ Your learning dashboard is ready: [URL]
│  ├─ Temporary login: [auto_email@school.edu.ng]
│  ├─ First login: change password
│  └─ Start learning: [First Mission]
└─ Attachment: Student getting started guide
```

### **Step 7: Log Everything** (Audit Trail)
```
INSERT INTO automation_log:
├─ event_type: "school_onboarding"
├─ school_id: [school_id]
├─ teacher_id: [teacher_id]
├─ students_created: [count]
├─ status: "completed"
├─ completed_at: [now]
└─ details: {
   ├─ order_id: [order_id]
   ├─ accounts_created: [teacher_id, ...student_ids]
   └─ emails_sent: [count]
   }
```

---

## ✅ **Phase 5: Live Access (Seamless)**

**What Happens:**

### **Teacher Can:**
✅ Go to `/lab/dashboard`  
✅ See their school name  
✅ See their students listed  
✅ See submission forms for each stage  
✅ Upload files (the system we just built!)  
✅ View student progress  

### **Students Can:**
✅ Go to `/` (home/login)  
✅ Login with auto-created credentials  
✅ See their dashboard (missions, XP, leaderboard)  
✅ Start learning immediately  
✅ Complete missions and earn badges  

### **Organizer Can:**
✅ Go to `/organizer`  
✅ See all school submissions  
✅ View uploaded files from teachers  
✅ Score and judge submissions  

---

## 🔄 **Complete Data Flow Diagram**

```
┌─────────────────────────────────────────────────────────────────────┐
│  STORE CHECKOUT                                                      │
├─────────────────────────────────────────────────────────────────────┤
│  School orders kits → Proceeds to payment                            │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│  REGISTRATION FORM                                                   │
├─────────────────────────────────────────────────────────────────────┤
│  ✓ School name, location, address                                   │
│  ✓ Teacher name, email, phone                                       │
│  ✓ Student count, age groups                                        │
│  ✓ Learning goals, start date                                       │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│  PAYMENT PROCESSING                                                  │
├─────────────────────────────────────────────────────────────────────┤
│  💳 Payment confirmed → Trigger automation                           │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
        🎯 AUTOMATIC ACCOUNT CREATION (NEW FEATURE NEEDED)
                              ↓
┌──────────────────┬──────────────────┬──────────────────────────────┐
│ Teacher Account  │ School Record    │ Student Accounts (Batch)     │
├──────────────────┼──────────────────┼──────────────────────────────┤
│ ✓ Auth user      │ ✓ School table   │ ✓ Auth users created         │
│ ✓ Email/password │ ✓ Linked teacher │ ✓ Dashboard initialized      │
│ ✓ Linked to school │ ✓ Active status │ ✓ First missions set up      │
│ ✓ Role: teacher  │                  │ ✓ XP = 0                     │
│                  │                  │ ✓ Status: active             │
└──────────────────┴──────────────────┴──────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│  WELCOME EMAILS SENT                                                 │
├─────────────────────────────────────────────────────────────────────┤
│  ✉️ Teacher: Lab dashboard link, password reset                      │
│  ✉️ Students: Learning dashboard link, credentials                   │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│  TEACHER LOGS IN → Lab Dashboard                                     │
├─────────────────────────────────────────────────────────────────────┤
│  ✓ Sees school name                                                  │
│  ✓ Sees student list                                                 │
│  ✓ Sees submission forms for each stage                              │
│  ✓ Can upload files (Design stage deliverables)                      │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│  STUDENTS LOG IN → Learning Dashboard                                │
├─────────────────────────────────────────────────────────────────────┤
│  ✓ See missions (Design stage)                                       │
│  ✓ Start learning and building                                       │
│  ✓ Earn XP and badges                                                │
│  ✓ Complete missions over weeks                                      │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│  TEACHER SUBMITS WORK → Lab Dashboard (File Upload)                  │
├─────────────────────────────────────────────────────────────────────┤
│  ✓ Collects student evidence (videos, PDFs, code)                   │
│  ✓ Uploads via submission form (THE SYSTEM WE BUILT!)                │
│  ✓ Writes notes for judges                                           │
│  ✓ Submits for judging                                               │
└─────────────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────────────┐
│  ORGANIZER REVIEWS → Organizer Console                               │
├─────────────────────────────────────────────────────────────────────┤
│  ✓ Views all school submissions                                      │
│  ✓ Sees uploaded files with thumbnails                               │
│  ✓ Scores teams (Design, Hardware, AI, Presentation)                 │
│  ✓ Releases feedback                                                 │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🏗️ **What Needs to Be Built**

### **Current State ✅**
- Store checkout flow (exists)
- Registration form (exists)
- Payment processing (exists)
- Teacher account login (exists)
- Lab dashboard (just built file upload!)
- Student learning dashboard (exists)

### **Missing: Account Creation Automation** ⏳

**What to build:**
1. **Edge Function: `create-school-accounts`**
   - Triggered when payment confirmed
   - Creates teacher auth account
   - Creates school database record
   - Creates student auth accounts (batch)
   - Initializes learning dashboard
   - Sends welcome emails

2. **Database Trigger or Webhook**
   - Listen for payment confirmation
   - Call the Edge Function automatically

3. **Student Account Management**
   - Bulk student creation UI (for teacher to manage)
   - Allow teacher to add/remove students
   - Generate credentials

---

## 📊 **Database Schema for Onboarding**

```sql
-- Schools table
CREATE TABLE schools (
  id UUID PRIMARY KEY,
  name TEXT NOT NULL,
  state TEXT,
  address TEXT,
  teacher_id UUID REFERENCES auth.users(id),
  order_id UUID REFERENCES orders(id),
  status TEXT ('active', 'inactive', 'suspended'),
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Students table
CREATE TABLE students (
  id UUID PRIMARY KEY,
  school_id UUID REFERENCES schools(id),
  email TEXT UNIQUE,
  grade_level INTEGER,
  division TEXT ('Primary', 'Secondary', 'Sixth_Form'),
  status TEXT ('active', 'inactive'),
  first_login BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Student dashboard state
CREATE TABLE student_dashboard (
  id UUID PRIMARY KEY,
  student_id UUID REFERENCES students(id),
  current_division TEXT,
  current_stage TEXT,
  innovation_points INTEGER DEFAULT 0,
  missions_completed INTEGER DEFAULT 0,
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- Onboarding log
CREATE TABLE onboarding_log (
  id UUID PRIMARY KEY,
  school_id UUID REFERENCES schools(id),
  order_id UUID REFERENCES orders(id),
  event TEXT ('payment_confirmed', 'accounts_created', 'emails_sent'),
  status TEXT ('pending', 'in_progress', 'completed', 'failed'),
  details JSONB,
  created_at TIMESTAMP
);
```

---

## 🔐 **Email Templates**

### **Teacher Welcome Email**
```
Subject: Welcome to STEAM Foundry - Your School is Ready! 🚀

Dear [Teacher Name],

Congratulations! Your school [School Name] has been set up on STEAM Foundry.

✅ What's Ready for You:
- Teacher Lab Dashboard: [URL]/lab/dashboard
- [X] Students created and ready to learn
- Student learning dashboard activated
- File submission system ready for stages

🔑 Your Login Credentials:
- Email: [teacher_email]
- Temporary Password: [reset_link]

📋 Next Steps:
1. Reset your password: [LINK]
2. View your students: [LINK]
3. Start a test submission: [LINK]
4. Watch the tutorial: [LINK]

Your students will receive their learning dashboard credentials separately.

Questions? Contact support: [EMAIL]

Best regards,
STEAM Foundry Team
```

### **Student Welcome Email**
```
Subject: Your STEAM Foundry Learning Dashboard is Ready! 🎮

Dear [Student Name],

Welcome to STEAM Foundry! Your learning dashboard is ready.

🎯 Start Learning:
Go to: [URL]

🔑 Your Login:
Email: [auto_email@school.edu.ng]
Password: [temporary, change on first login]

🚀 What's Waiting:
- Design Mission: Build a Solar-Powered Robot
- Innovation Points to earn
- Badges to unlock
- Leaderboard to climb

Let's build something amazing!

STEAM Foundry Team
```

---

## ⏰ **Implementation Timeline**

| Phase | Task | Time | Status |
|-------|------|------|--------|
| 1 | Create `create-school-accounts` Edge Function | 2-3 hours | ⏳ TODO |
| 2 | Implement payment webhook/trigger | 1-2 hours | ⏳ TODO |
| 3 | Batch student account creation | 2-3 hours | ⏳ TODO |
| 4 | Welcome email templates | 1 hour | ⏳ TODO |
| 5 | Test full flow (order → live access) | 2-3 hours | ⏳ TODO |
| 6 | Student management UI (for teacher) | 2-3 hours | ⏳ TODO |

**Total: ~11-15 hours of development**

---

## ✅ **After Onboarding Automation is Built**

**The seamless flow becomes:**

```
1. School orders kits on /store
2. Completes registration with teacher & school info
3. Pays for kits
4. ✨ AUTOMATIC ✨
5. Teacher gets email → clicks reset password → logs into Lab Dashboard
6. Students get emails → reset password → log into Learning Dashboard
7. Teacher and students are LIVE and ready to go!

Zero manual account creation!
Zero delays!
Seamless experience!
```

---

## 🎯 **Why This Matters**

**Current State (Broken):**
- School pays for kits
- Manually create teacher account (error-prone)
- Manually create student accounts (time-consuming)
- Send credentials separately (confusing)
- Delays and friction

**With Automation (Seamless):**
- School pays for kits
- ✨ Automatic account creation
- ✨ Auto-emails sent
- ✨ Everyone ready to go in minutes
- No manual work
- Professional experience

---

## 📞 **Ready to Build This?**

This is the **missing piece** that connects the whole system together seamlessly. Should I:

1. **Build the Edge Function** for account creation?
2. **Create the payment webhook** to trigger it?
3. **Design the student management UI** for teachers?
4. **Set up welcome email templates**?

Which would you like me to start with? 🚀
