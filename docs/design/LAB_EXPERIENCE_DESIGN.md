# STEAM Foundry Lab — Experiential Learning Experience Design Brief

**Status:** In Active Design  
**Priority:** CRITICAL — this is the core interface schools interact with  
**Audience:** Students (Ages 7–18, 3 divisions), Teachers, Judges  

---

## 1. Core Thesis

The **Lab** transforms a competition into an **experiential learning journey**. Instead of discrete "upload deliverables and wait for scores," students experience a **progression system** that mirrors how real innovation happens:

- **Ideation** (Design Pitch) — brainstorm, prototype thinking, iterate
- **Building** (Hardware Build) — hands-on assembly, problem-solving, real iteration
- **Intelligizing** (AI Layer) — experiment with prompts, test outputs, refine
- **Battle** (Live Finals) — present, compete, showcase mastery

The interface must make this journey **visible, motivating, and achievable across age groups**.

---

## 2. Information Architecture (IA) — Teacher Dashboard Focus

### Primary Paths (by role)
| Role | Entry | Primary Job | Critical Interface |
|------|-------|------------|-------------------|
| **Teacher** | `/lab/dashboard` | Monitor team progress, unlock stages, provide feedback | Team roster → Submission tracker → Feedback interface |
| **Student** | `/lab/team` | Submit work, receive feedback, iterate | Mission brief → Upload component → See feedback → Iterate |
| **Judge** | `/lab/judge` | Review submissions, score, provide feedback | Review queue → Submission detail → Scoring rubric → Comments |
| **Organizer** | `/organizer` | Holistic view of all teams, stage gates, standing | Leaderboard, stage controls, judge management |

### Teacher Dashboard Zones (Desktop Layout)
```
┌─ Header: Wordmark · School name · Sign out ────────────────┐
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ SIDEBAR (24% left)          MAIN CONTENT (76% right)        │
├────────────────────────┬──────────────────────────────────┤
│                        │                                  │
│ • Team Roster         │ ACTIVE TEAM:                      │
│ • Submissions         │ ═════════════════════════════    │
│ • Feedback Inbox      │                                  │
│ • Stage Map           │ 🎯 Design Pitch (Stage 1)        │
│ • Leaderboard (live)  │    [████████░░] 75% complete    │
│                        │    Status: Submitted Oct 4       │
│ Status dot legend     │    Judge feedback: [📌 3 comments]│
│ 🟢 In Progress        │                                  │
│ 🟡 Under Review       │ → NEXT: Hardware Build           │
│ 🟢 Feedback Ready     │    [░░░░░░░░░░] 0% ready         │
│ 🔵 Completed          │    Unlocks: Oct 23                │
│                        │    Estimate: 2 weeks             │
│                        │                                  │
│                        │ 📊 Team XP: 3,450 / 5,000       │
│                        │    Achievement badges:          │
│                        │    🏅 First Idea Submitted      │
│                        │    🏅 Early Bird (submitted on day 1) │
│                        │                                  │
└────────────────────────┴──────────────────────────────────┘
```

### Mobile Collapse (< 768px)
- Sidebar becomes a hamburger menu
- Main content takes full width
- Stage map → accordion stack
- Leaderboard → scroll-snap tiles

---

## 3. Core UI Components (Per-Stage)

### Stage Card (appears 4× on page)
```
┌─ DESIGN PITCH ──────────────────────────────────────────┐
│ Ages 7–12        Ages 13–16        Ages 16–18           │
│ Simple hero      Intermediate      Technical            │
│ Clear CTA        Rich details      Full specs           │
│ 1 hint button    2 resource links  3 resource links     │
├─────────────────────────────────────────────────────────┤
│ Status: ⚙️ In Progress   Submitted: Oct 4, 2:15 PM     │
│                                                         │
│ 📝 Submission Brief (expandable):                      │
│   "3-minute video pitch showing field research &       │
│    your team's problem statement."                     │
│                                                         │
│ 📊 Progress: [████████░░] 75% (video recorded)         │
│                                                         │
│ 📦 Component Checklist:                                │
│   ☑ Research findings documented (12 KB)               │
│   ☑ Problem statement written (850 words)              │
│   ○ Pitch video recorded (0 MB)                        │
│   ○ Prototype sketches uploaded (optional)             │
│                                                         │
│ 🔗 Upload Resources (drag-drop or file picker):        │
│   [📄 Files] [🎥 YouTube] [📊 Google Drive] [Link]   │
│                                                         │
│ 💬 Judge Feedback (3 comments from 3 judges):          │
│   Judge 1: "Great field research. Focus the pitch."    │
│   Judge 2: "Needs stronger problem articulation."      │
│   Judge 3: "Love the sketches—very expressive!"        │
│   [→ Reply to feedback]                                │
│                                                         │
│ 🎯 Next Steps: Record pitch video, refine based on... │
│ [Request Hint?]  [Submit Stage]  [Save Draft]         │
└─────────────────────────────────────────────────────────┘
```

---

## 4. Gamification System

### XP (Experience Points) — Teacher-Visible, Student-Earning
| Action | XP | When | Example |
|--------|----|----|---------|
| Submit a stage | 100 | On submission | First upload = 100 XP |
| Receive judge feedback | 25 | Per judge per stage | 3 judges = 75 XP bonus |
| Iterate (resubmit after feedback) | 50 | Per resubmission | Resubmit once = 50 XP |
| Early submission | 25 | Submit before deadline | 1 week early = 25 XP |
| Peer review (judge other team's work) | 30 | Per review submitted | Judge judges → 30 XP |
| **Stage complete** | 200 | All deliverables done | Finish stage = 200 XP |

**Team XP Bar:** Shows cumulative progress toward badges/tier unlock
- 1,000 XP = Bronze Badge (basic competence)
- 2,500 XP = Silver Badge (strong execution)
- 4,000 XP = Gold Badge (exceptional work)
- 5,000+ XP = Platinum (mastery)

### Missions (Flexible, per-stage)
Each stage unlocks 3–5 optional **micro-missions** aligned to the handbook:

**Stage 1 (Design Pitch) Missions:**
1. **Field Research Sprint** — Document 10+ insights from your target user (10 XP)
2. **Problem Deep Dive** — Write a 500+ word problem statement (15 XP)
3. **Peer Review** — Review another team's pitch and comment (10 XP)
4. **Inspiration Mood Board** — Collect 10+ visual references (5 XP)

**Stage 2 (Hardware Build) Missions:**
1. **Component Teardown** — Disassemble and sketch an existing product (20 XP)
2. **Prototype Iteration** — Show 3+ versions (sketch → CAD → physical) (25 XP)
3. **Test & Measure** — Document performance metrics (15 XP)

**Stage 3 (AI Intelligize) Missions:**
1. **Prompt Engineering Challenge** — Achieve task in < N tokens (10 XP)
2. **Bias Audit** — Document edge cases & model failures (15 XP)
3. **Integration Sprint** — Connect hardware + AI in working prototype (30 XP)

---

## 5. Age-Group UX Differentiation

### Primary (Ages 7–12)
- **Copy:** Short, direct, joyful ("Build your idea!" not "Execute your prototype vision")
- **Visual:** More icons, less text, bright accent colors per division
- **Missions:** Simpler, shorter time commitment (3–5 days max)
- **Feedback:** 2 lines max per comment, positive framing
- **Resources:** Video-first (YouTube embeds), fewer written docs
- **XP/Gamification:** Larger progress bars, celebratory animations on unlock

### Secondary (Ages 13–16)
- **Copy:** Balanced (technical without jargon, motivational without condescension)
- **Visual:** Cleaner, more information density, subtle accent colors
- **Missions:** Moderate complexity, 1–2 week commitment
- **Feedback:** Full comments, constructive tone
- **Resources:** Mix of video + docs + live links
- **XP/Gamification:** Standard progress system, achievement badges

### Sixth Form (Ages 16–18)
- **Copy:** Technical, professional ("Implement," "Validate," "Deploy")
- **Visual:** Dense, data-forward, mono typography for code/specs
- **Missions:** High complexity, hypothesis-driven, research papers encouraged
- **Feedback:** In-depth critique, technical suggestions
- **Resources:** Full range (papers, GitHub repos, CAD files, etc.)
- **XP/Gamification:** Leaderboard-forward, publication credit system

---

## 6. Third-Party Content Integration

### Supported Embeds (Priority order)
1. **YouTube** — Drag-drop URL or embed code
2. **Google Drive** — Link to shared document/spreadsheet; embed preview
3. **GitHub** — Link to repo; render README + star count
4. **Figma** — Embed live prototype / design file
5. **Loom** — Screen recording / walkthrough
6. **Standard links** — Auto-preview title + description

### Upload Workflow
```
[Upload Resources]
├─ File upload (.pdf, .doc, .xls, .ppt, .zip, .mp4)
├─ Paste YouTube URL (auto-embed)
├─ Paste Google Drive link (auto-preview)
├─ Paste GitHub repo URL (auto-fetch README)
├─ Paste Figma prototype link (auto-embed live)
├─ Paste generic link (auto-preview w/ og:image)
└─ Drag-drop multiple files at once
```

**Limits per stage:** ~5 files + 10 external links per team.

---

## 7. Feedback Loop (Teacher → Judge → Student)

### Judge Submits Score & Feedback
- Rubric: 20/30/30/20 weights (Design / Hardware / AI / Presentation)
- Text comments: threaded, @-mentions, live updates
- Status: "In Review" → "Feedback Ready" (teacher gets notified)

### Teacher Sees Aggregated Feedback
- 3 judge scorecards shown side-by-side (highlight differences)
- Auto-summary of common themes ("All 3 judges noted weak prompt engineering")
- Option to request additional feedback or clarification

### Student Sees Feedback
- Judges shown anonymously (unless brief reveals names)
- Constructive framing ("Focus area" not "Weakness")
- One-tap "I understand" to unlock next stage
- Option to reply ("Can you explain what you mean by 'weak integration'?")

---

## 8. Real-Time Progression (Organizer View)

**Organizer Dashboard** shows:
- **Heatmap:** Stage completion by division (rows: Primary/Secondary/Sixth Form, cols: Stages 1-4)
- **Leaderboard:** Top 10 teams by XP this week
- **Stage Gate Control:** Manual unlock/lock per division (broadcast message when unlocked)
- **Judge Queue:** Submissions awaiting review (SLA tracking)

---

## 9. Responsive Layout Rules

### Desktop (≥ 1024px)
- Sidebar (24%) + Content (76%)
- Stage cards full-width, 2-column grid if needed
- Inline feedback panels (judges side-by-side)

### Tablet (768–1023px)
- Sidebar collapses to hamburger
- Content takes full width
- Stage cards stack vertically
- Feedback panels stack with tabs

### Mobile (< 768px)
- No sidebar; hamburger-only
- Stage cards full-width, single column
- Accordion-style feedback ("View 3 judge comments")
- Upload component uses native file picker
- Leaderboard: scroll-snap tiles, one per tap

---

## 10. Critical Interactions

### Stage Submission Flow
1. Team opens a stage card (e.g., Design Pitch)
2. Reads brief + sees component checklist
3. Completes each component (records video, writes doc, sketches)
4. Status bar updates live as they upload
5. Once all components done, "Submit Stage" button unlocks
6. Teacher (or auto-gate) reviews
7. Stage moves to "Under Review"
8. Judge scores arrive → stage moves to "Feedback Ready"
9. Student reads feedback → can iterate
10. Resubmit flow (same as initial, but marked "Resubmission v2")

### Feedback Reply Flow
1. Student clicks a judge comment
2. Expandable reply box appears below comment
3. Student types reply (e.g., "Thanks! We'll clarify the integration in v2.")
4. Teacher/Judge get notified of reply
5. Threaded conversation visible to all (except judge ID hidden from student)

---

## 11. Technical Implementation (Phased)

### Phase 1 (This Sprint) — Teacher Dashboard MVP
- [ ] Team roster display
- [ ] Single stage card template (responsive, all age-group styles)
- [ ] XP progress bar
- [ ] Feedback thread display (read-only)
- [ ] Upload component (files + YouTube/Drive links)

### Phase 2 (Next Sprint) — Student Submission Flow
- [ ] Stage brief display
- [ ] Component checklist (interactive, real-time save)
- [ ] Upload workflow (full integration)
- [ ] Feedback reply flow
- [ ] Submission confirmation

### Phase 3 (Later) — Judge Scoring & Leaderboard
- [ ] Judge review queue
- [ ] Scoring rubric form
- [ ] Organizer stage-gate controls
- [ ] Real-time leaderboard

---

## 12. Design System Applied

### Logo Treatment (LOCKED — NO CHANGES)
The **STEAM Foundry logo with flame mark** is the signature of the Lab experience. It appears at the top of every Lab page:
- Wordmark: "STEAM FOUNDRY" (Archivo display font)
- Flame icon: Golden/accent-colored mark integrated into the wordmark
- Sizing: Responsive (sm/md/lg per screen size)
- **Constraint:** Keep this treatment intuitive and clean. No stylistic modifications. It is the visual anchor that makes the Lab feel cohesive and recognizable.

### Tokens (Already defined in visual-world redesign)
- **Colors:** Warm-ink background, brass/ember/indigo accents per division
- **Typography:** Archivo (display), Inter (body), Mono (data)
- **Spacing:** Standard Tailwind scale (py-4, gap-6, etc.)
- **Motion:** Fade-in on enter, no infinite loops (respects reduced-motion)

### Division Color Coding (Subtle)
| Division | Accent | Icon Tint | Left Border |
|----------|--------|-----------|------------|
| Primary (7–12) | Brass `#E0A944` | 🟡 Yellow-tinted | Brass hairline |
| Secondary (13–16) | Ember `#E85D3A` | 🟠 Orange-tinted | Ember hairline |
| Sixth Form (16–18) | Indigo `#6B7DFF` | 🔵 Blue-tinted | Indigo hairline |

---

## 13. Copy Tone (Experiential, Age-Appropriate)

### For Primary
- "You're solving a real problem—design it!"
- "What did your users tell you?"
- "Show us what you built!"
- "Your team earned 250 XP!"

### For Secondary
- "Define the problem your team is solving."
- "Iterate on your prototype based on feedback."
- "Your approach to AI integration shows strong thinking."
- "Leaderboard: You're in the top 20!"

### For Sixth Form
- "Articulate the problem space and validate your assumptions."
- "Demonstrate integration and test coverage."
- "Bias audit required: document edge cases."
- "Top 20 standings: Technical merit, innovation, execution."

---

## 14. Success Metrics

| Metric | Target | How Measured |
|--------|--------|--------------|
| **Submission Rate** | > 90% teams submit at least once | Query count in `submissions` table |
| **Iteration Rate** | > 50% teams resubmit after feedback | Resubmission count / total submissions |
| **Feedback Acceptance** | > 70% feedback comments receive replies | Reply count / comment count |
| **Time-on-Dashboard** | Avg 15–20 min / session | Analytics instrumentation |
| **Mobile Usability** | > 80% mobile sessions complete upload | Conversion rate by device |
| **Judge SLA** | 90% feedback delivered < 7 days | Timestamp comparisons |

---

## Next Steps

1. **Build Phase 1 dashboard** (this sprint) — stage card component, roster, XP bar
2. **Implement upload integration** (Google Drive, YouTube embed)
3. **Design feedback reply UX** (threaded comments)
4. **Test with pilot schools** (feedback loop)
5. **Roll out leaderboard** (organizer view)

---

**Owner:** STEAM Foundry Experience Team  
**Last Updated:** 2026-08-30  
**Status:** ACTIVE DESIGN (awaiting Phase 1 approval)
