# STEAM Foundry Lab — Phase 1 Component Specifications

**Phase:** MVP Dashboard (Teacher + Student read-only view)  
**Priority:** Deploy by Week 2  
**Scope:** Stage card, teacher roster, XP bar, feedback display  

---

## 1. Stage Card Component (Core)

**File Path:** `src/components/lab/StageCard.tsx`

### Props Interface
```tsx
interface StageCardProps {
  stageNumber: 1 | 2 | 3 | 4;
  stageName: string;           // "Design Pitch", "Build", etc.
  division: 'primary' | 'secondary' | 'sixth_form';
  status: 'locked' | 'in_progress' | 'under_review' | 'feedback_ready' | 'completed';
  brief: string;               // 1-line description
  submittedDate?: string;      // "Oct 4, 2:15 PM"
  completionPercent: number;   // 0-100
  components: {
    name: string;
    completed: boolean;
    optional?: boolean;
  }[];
  feedbackCount: number;       // Number of judge comments
  onViewFeedback?: () => void;
  onSubmit?: () => void;
  onRequestHint?: () => void;
  canSubmit: boolean;
}
```

### Layout (Desktop, 100% width)

```
┌─ [Stage 1 badge] DESIGN PITCH ─────────── Status: In Progress ─┐
│                                                                   │
│ 📋 BRIEF                                                          │
│ 3-minute video pitch showing field research & problem statement │
│ [Read full brief →]                                              │
│                                                                   │
│ 📊 PROGRESS: [████████░░] 75% (3 of 4 components ready)         │
│                                                                   │
│ 📦 COMPONENT CHECKLIST:                                          │
│ ☑ Research findings documented                     12 KB  Oct 3  │
│ ☑ Problem statement written                      850 words Oct 4  │
│ ○ Pitch video recorded                               0 MB pending │
│ [optional] Prototype sketches                    [not uploaded]  │
│                                                                   │
│ 💬 JUDGE FEEDBACK (3 comments):                   [View all →]  │
│ Judge 1: "Great field research. Focus the pitch."                │
│ Judge 2: "Needs stronger problem articulation."                  │
│                                                                   │
│ 🔗 UPLOAD RESOURCES:                                            │
│ [File] [YouTube] [Google Drive] [Link]                          │
│                                                                   │
│ 🎯 NEXT STEPS: Record pitch video, refine based on feedback    │
│                                                                   │
│ [Request Hint]  [Save Draft]  [Submit Stage] (enabled)         │
│                                                                   │
└───────────────────────────────────────────────────────────────┘
```

### State-Specific Renders

**Locked State:**
```
┌─ [Stage 2 badge, greyed] HARDWARE BUILD ───── Unlocks Oct 23 ──┐
│                                                                   │
│ 🔒 This stage unlocks on October 23.                            │
│    Your team must complete Stage 1 first.                       │
│                                                                   │
│ Progress: Stage 1 is 75% complete.                              │
│ Estimated completion: Oct 5                                      │
│                                                                   │
│ [View Stage 1 →]                                                │
│                                                                   │
└───────────────────────────────────────────────────────────────┘
```

**Completed State:**
```
┌─ [Stage 1 badge] DESIGN PITCH ─────────────── ✅ Completed ────┐
│                                                                   │
│ Submitted Oct 4, 2:15 PM                                        │
│                                                                   │
│ 📊 Final Score: 28/30 (93%) — Excellent!                       │
│    Design: 10/10  |  Innovation: 9/10  |  Presentation: 9/10   │
│                                                                   │
│ 💬 Judge Feedback (3 reviews)                                   │
│ Judge 1: "Excellent field research methodology."                │
│ Judge 2: "The problem is well-articulated. Build on this."     │
│ Judge 3: "Video clarity could improve, but content is strong." │
│                                                                   │
│ [Archive] [Download Feedback PDF]                              │
│                                                                   │
└───────────────────────────────────────────────────────────────┘
```

### Division-Specific Styling

| Division | Badge BG | Border | Icon Tint | Font Scale |
|----------|----------|--------|-----------|------------|
| Primary | Brass `#E0A944` | Brass hairline | 🟡 | Standard (scale: 1) |
| Secondary | Ember `#E85D3A` | Ember hairline | 🟠 | Standard (scale: 1) |
| Sixth Form | Indigo `#6B7DFF` | Indigo hairline | 🔵 | Standard (scale: 0.95, tighter) |

### Responsive Behavior

**Desktop (≥ 1024px):**
- Full width, 1-column stack
- 3-column feedback display (judge 1 | judge 2 | judge 3)
- Inline upload component

**Tablet (768–1023px):**
- Full width, 1-column stack
- 2-column feedback display (with scroll)
- Stacked upload component

**Mobile (< 768px):**
- Full width
- Feedback display: accordion ("View 3 comments")
- Upload: native file picker only (no drag-drop)
- Brief: expandable (collapsed by default)

---

## 2. Teacher Dashboard Layout

**File Path:** `src/pages/Lab/TeacherDashboard.tsx`

### Overall Structure
```
┌─ Header: [Wordmark] [School name] | [Teacher name] [Dropdown] ──┐
├─────────────────────────────────────────────────────────────────┤
│ SIDEBAR (24%)          │ MAIN CONTENT (76%)                      │
├────────────────────────┼────────────────────────────────────────┤
│ 📋 Team Roster (7)     │ 🎯 ACTIVE TEAM: Innovators United    │
│  • Innovators United   │                                         │
│  • TechGirls           │ [Stage 1] DESIGN PITCH (75%)           │
│  • CodeWeavers         │ [Stage 2] HARDWARE BUILD (locked)      │
│  • BuildMasters        │ [Stage 3] AI INTELLIGIZE (locked)      │
│  • Future Engineers    │ [Stage 4] BATTLE (locked)              │
│  • The Disruptors      │                                         │
│  • Smart Solutions     │ 📊 Team XP: 3,450 / 5,000 (69%)       │
│                        │ Achievement Badges:                     │
│ 💬 Feedback Inbox (2)  │ 🏅 First Idea Submitted (Oct 4)       │
│  ► Innovators: reply   │ 🏅 Early Submission (submitted on day 1) │
│    pending             │                                         │
│  ► TechGirls: awaiting │ 📈 Standings:                          │
│    submission          │ 1. CodeWeavers    4,200 XP ⭐          │
│                        │ 2. BuildMasters   3,900 XP              │
│ 🏆 Standings (live)    │ 3. Innovators...  3,450 XP (you)       │
│  1. CodeWeavers        │ 4. TechGirls      2,800 XP              │
│  2. BuildMasters       │                                         │
│  3. Innovators (you)   │ 🔔 Notifications:                       │
│  4. TechGirls          │ ✓ All Stage 1 submissions received      │
│  5. (more)             │ ⚠ Judge feedback arrives by Oct 11      │
│                        │                                         │
└────────────────────────┴────────────────────────────────────────┘
```

### Sidebar Components

**Team Roster Card:**
```tsx
<div className="space-y-2">
  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
    Team Roster (7)
  </h3>
  <ul className="space-y-1 border-l border-border pl-3">
    {teams.map(team => (
      <li
        key={team.id}
        className={cn(
          'text-sm cursor-pointer py-1 hover:text-primary transition-colors',
          activeTeamId === team.id && 'text-primary font-semibold'
        )}
        onClick={() => setActiveTeam(team.id)}
      >
        {team.name}
      </li>
    ))}
  </ul>
</div>
```

**Feedback Inbox Card:**
```tsx
<div className="space-y-2">
  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
    Feedback Inbox (2)
  </h3>
  <ul className="space-y-2 text-xs">
    <li className="border border-border rounded px-2 py-1 hover:bg-surface cursor-pointer">
      <div className="font-semibold">Innovators: reply pending</div>
      <div className="text-muted-foreground">Judge 1 asked about research...</div>
    </li>
    <li className="border border-border rounded px-2 py-1 hover:bg-surface cursor-pointer">
      <div className="font-semibold">TechGirls: awaiting submission</div>
      <div className="text-muted-foreground">Stage 1 due Oct 6</div>
    </li>
  </ul>
</div>
```

**Standings Card:**
```tsx
<div className="space-y-2">
  <h3 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
    Live Standings
  </h3>
  <ol className="space-y-1 text-xs">
    {standings.map((team, i) => (
      <li key={team.id} className="flex items-center justify-between">
        <span className={cn('font-mono tabular-nums', i === 2 && 'text-primary font-bold')}>
          {i + 1}. {team.name}
        </span>
        <span className={cn('text-muted-foreground', i === 2 && 'text-primary')}>
          {team.xp} XP
        </span>
      </li>
    ))}
  </ol>
</div>
```

### Mobile Collapse

On mobile (< 768px):
- Sidebar becomes hamburger menu
- Main content takes full width
- Standings card shown as scroll-snap tiles below stage cards
- Feedback inbox as collapsible

---

## 3. Student View (Variant)

When the student logs in to `/lab/team/{teamId}`, they see **the same stage cards** but with **different actions:**

### Changes from Teacher View
- **Upload component is interactive** (not read-only)
- **"Submit Stage" button is live** (not just showing status)
- **Feedback replies are enabled** (not read-only)
- **No sidebar** (focused single-team view)
- **Full-screen stage card** (not in a dashboard grid)
- **"Request Hint" button is live** (sends notification to teacher)

### Student Stage Card Actions
```tsx
// Teacher sees: "Feedback Ready" status
// Student sees: "Reply to feedback" button + hint request

if (status === 'feedback_ready' && !isTeacher) {
  return (
    <>
      {/* Feedback display with reply inputs */}
      <div className="space-y-3">
        {feedback.map(comment => (
          <div key={comment.id} className="border-l-2 border-primary pl-4 py-2">
            <p className="text-sm">{comment.text}</p>
            <input
              placeholder="Reply to this feedback..."
              className="mt-2 w-full text-sm"
            />
          </div>
        ))}
      </div>
      {/* Upload & Submit buttons */}
      <div className="flex gap-3">
        <Button onClick={onRequestHint} variant="secondary">
          Request Hint
        </Button>
        <Button onClick={onResubmit} disabled={!canResubmit}>
          Resubmit Stage
        </Button>
      </div>
    </>
  );
}
```

---

## 4. XP Progress Bar Component

**File Path:** `src/components/lab/XPBar.tsx`

```tsx
interface XPBarProps {
  current: number;      // Current XP
  max: number;          // Total XP needed (5000)
  badges: Badge[];      // Unlocked badges at 1000, 2500, 4000, 5000
}

<div className="space-y-2">
  <div className="flex items-center justify-between">
    <p className="text-sm font-semibold">Team XP Progress</p>
    <p className="text-xs text-muted-foreground">{current} / {max}</p>
  </div>

  {/* Progress bar */}
  <div className="h-6 bg-surface border border-border rounded-full overflow-hidden">
    <div
      className="h-full bg-gradient-to-r from-primary to-primary/80 transition-all duration-500"
      style={{ width: `${(current / max) * 100}%` }}
    />
  </div>

  {/* Badge milestones */}
  <div className="flex justify-between text-xs text-muted-foreground">
    <span>Bronze 1k</span>
    <span>Silver 2.5k</span>
    <span>Gold 4k</span>
    <span>Platinum 5k</span>
  </div>

  {/* Earned badges */}
  <div className="flex gap-2">
    {badges.map(badge => (
      <div key={badge.id} className="flex items-center gap-1 text-sm">
        <span className="text-lg">{badge.emoji}</span>
        <span className="font-medium">{badge.name}</span>
      </div>
    ))}
  </div>
</div>
```

---

## 5. Feedback Thread Component

**File Path:** `src/components/lab/FeedbackThread.tsx`

```tsx
interface FeedbackThreadProps {
  judgeId?: string;           // Hidden from student, shown to teacher
  judgeName?: string;         // "Judge 1", "Anonymous", etc.
  text: string;               // The feedback comment
  submittedDate: string;      // "Oct 5, 10:30 AM"
  replies: Reply[];           // Student/teacher replies
  onReply?: (text: string) => void;  // Callback to submit reply
  isStudent?: boolean;        // If true, show reply input
}

<div className="border-l-4 border-primary pl-4 py-3 space-y-2">
  <div className="flex items-start justify-between">
    <p className="font-semibold text-sm">
      {judgeName || 'Judge 1'}
    </p>
    <p className="text-xs text-muted-foreground">{submittedDate}</p>
  </div>

  <p className="text-sm text-foreground">{text}</p>

  {/* Replies (threaded) */}
  {replies.map(reply => (
    <div key={reply.id} className="ml-4 pt-2 border-t border-border">
      <p className="text-xs font-semibold text-muted-foreground">
        {reply.authorName} replied:
      </p>
      <p className="text-sm mt-1">{reply.text}</p>
    </div>
  ))}

  {/* Reply input (student only) */}
  {isStudent && (
    <input
      placeholder="Reply to this comment..."
      className="w-full text-sm border border-border rounded px-2 py-1"
      onKeyDown={(e) => {
        if (e.key === 'Enter') onReply?.(e.currentTarget.value);
      }}
    />
  )}
</div>
```

---

## 6. Upload Component (Multi-source)

**File Path:** `src/components/lab/ResourceUpload.tsx`

Supports:
- File picker (drag-drop + button)
- YouTube URL embed
- Google Drive link
- GitHub repo link
- Generic URL (auto-preview with og:image)

```tsx
interface ResourceUploadProps {
  onUpload: (resource: Resource) => void;
  maxFiles?: number;
  allowedTypes?: string[];
}

<div className="space-y-3 border border-dashed border-border rounded-lg p-6">
  <p className="text-sm font-semibold">Upload Resources</p>

  {/* Drag-drop zone (file input) */}
  <input
    type="file"
    multiple
    onDrop={handleDrop}
    onChange={handleFileSelect}
    className="block w-full text-sm text-foreground
      file:mr-4 file:py-2 file:px-4
      file:rounded file:border-0
      file:text-sm file:font-semibold
      file:bg-primary file:text-primary-foreground
      hover:file:bg-primary/80"
  />

  {/* Tab buttons for quick-add */}
  <div className="flex gap-2 border-t border-border pt-3">
    <Button variant="ghost" size="sm" onClick={() => setMode('youtube')}>
      🎥 YouTube
    </Button>
    <Button variant="ghost" size="sm" onClick={() => setMode('drive')}>
      📊 Google Drive
    </Button>
    <Button variant="ghost" size="sm" onClick={() => setMode('github')}>
      🐙 GitHub
    </Button>
    <Button variant="ghost" size="sm" onClick={() => setMode('link')}>
      🔗 Link
    </Button>
  </div>

  {/* Mode-specific input */}
  {mode === 'youtube' && (
    <input
      placeholder="Paste YouTube URL..."
      onKeyDown={(e) => {
        if (e.key === 'Enter') onUpload({ type: 'youtube', url: e.currentTarget.value });
      }}
    />
  )}
  {/* ... repeat for drive, github, link ... */}
</div>
```

---

## 7. Implementation Timeline (Phase 1)

| Component | Effort | Dependencies | Due |
|-----------|--------|--------------|-----|
| StageCard (base) | 3h | Design tokens ✓ | Day 1 |
| TeacherDashboard (layout) | 4h | StageCard | Day 2 |
| XPBar | 1.5h | StageCard | Day 2 |
| FeedbackThread | 2h | Component styles | Day 3 |
| ResourceUpload | 3h | Upload API | Day 3 |
| StudentView (variant) | 2h | StageCard | Day 4 |
| **Total Phase 1** | **15.5h** | | **Week 1** |

---

## 8. Critical Interactions Checklist

- [ ] Clicking a team in sidebar loads their stage cards
- [ ] Progress bar updates in real-time when components are uploaded
- [ ] Feedback thread replies send a notification to the judge
- [ ] YouTube/Drive links auto-embed (no external page opens)
- [ ] File drag-drop shows a preview before final upload
- [ ] "Request Hint" button disables after one use per stage
- [ ] Mobile collapse verified at 375px and 768px breakpoints
- [ ] Division color coding applies correctly across all components
- [ ] Reduced motion: no infinite animations, only fade-in on load

---

**Next Step:** Begin StageCard implementation Day 1. Verify component isolation before integrating into TeacherDashboard.
