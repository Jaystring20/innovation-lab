# STEAM Foundry Monorepo Migration Guide

**Status:** Phase 1 - Foundation Complete ✅  
**Date:** 2026-08-30  
**Next:** Move src/ files to packages/lab/src/

---

## ✅ What's Been Created

### Root Configuration
- ✅ `pnpm-workspace.yaml` — Monorepo workspace definition

### packages/shared/ (Core Business Logic)
All zero-React utilities, React hooks, and types that both `lab` and `apen` import.

**Structure:**
```
packages/shared/
├── package.json          — Dependencies shared across all packages
├── tsconfig.json         — TypeScript config
├── src/
│   ├── index.ts          — Main exports
│   ├── lib/              — Pure utilities (no React)
│   │   ├── xp-calc.ts           → Team XP pooling math
│   │   ├── role-helpers.ts      → Role assignment + formatting
│   │   ├── offline-sync.ts      → Offline queue utilities
│   │   ├── constants.ts         → Global constants (XP rewards, cache TTLs)
│   │   └── index.ts
│   ├── hooks/            — React hooks
│   │   ├── useOfflineQueue.ts   → Offline submission queue
│   │   ├── useAuth.ts           → Authentication hook
│   │   ├── useNavigation.ts     → Responsive nav detection
│   │   └── index.ts
│   ├── components/       — Design system primitives (Radix UI + custom)
│   │   └── index.ts      — Re-exports Wordmark, StatusPill, etc.
│   ├── api/              — API clients
│   │   ├── supabase.client.ts   → Singleton Supabase client
│   │   └── index.ts
│   └── types/            — Shared TypeScript types
│       ├── lab.types.ts         → School, Team, Stage, etc.
│       ├── user.types.ts        → User, UserRole
│       ├── submission.types.ts  → Submission, RoleAssignment
│       └── index.ts
```

**Exports:** Both `packages/lab` and `packages/apen` will import like:
```tsx
import { calculateTeamXP, getRoleColor } from '@steam-foundry/shared/lib'
import { useOfflineQueue } from '@steam-foundry/shared/hooks'
import { supabaseClient } from '@steam-foundry/shared/api'
import type { School, Team } from '@steam-foundry/shared/types'
```

### packages/lab/ (Main Platform)
Innovation lab platform (innovation-lab-seven.vercel.app)

**Structure:**
```
packages/lab/
├── package.json              — With code splitting config
├── vite.config.ts            — Route-based manual chunks ✅ READY
├── tsconfig*.json            — TypeScript configs
├── src/                      — ← FILES BEING MOVED HERE
│   ├── pages/
│   │   ├── Landing.tsx
│   │   ├── Store.tsx
│   │   ├── Login.tsx
│   │   ├── OrganizerLogin.tsx
│   │   ├── Lab.tsx
│   │   ├── Organizer.tsx
│   │   ├── Judge.tsx
│   │   └── NotFound.tsx
│   ├── components/
│   │   ├── navigation/       ← NEW for Phase 1
│   │   │   ├── NavShell.tsx
│   │   │   ├── BottomNavBar.tsx
│   │   │   ├── SidebarNav.tsx
│   │   │   └── ConnectionStatus.tsx
│   │   ├── lab/              ← NEW for Phase 1
│   │   │   ├── UnifiedLabDashboard.tsx
│   │   │   ├── TeamViewTab.tsx
│   │   │   ├── IndividualViewTab.tsx
│   │   │   ├── MaterialsTab.tsx
│   │   │   ├── LeaderboardTab.tsx
│   │   │   ├── StageCard.tsx
│   │   │   └── // ... other lab components
│   │   ├── ui/               ← Existing Radix UI primitives
│   │   ├── organizer/        ← Existing organizer components
│   │   ├── dashboard/        ← Existing dashboard components
│   │   └── // ... other components
│   ├── App.tsx               — React Router setup
│   ├── main.tsx              — Entry point with SW registration
│   ├── index.css             — Design tokens + reset
│   └── lib/
│       └── utils.ts          — Utility functions (cn, etc.)
├── public/
│   ├── index.html
│   ├── sw.js                 ← Service Worker (PWA)
│   ├── manifest.json         ← PWA manifest ✅ READY
│   ├── icon-192.png
│   └── // ... other assets
├── index.html                — Already has Google Fonts, SW registration
└── README.md                 — Lab-specific docs
```

### packages/apen/ (APEN Subdomain)
Skeleton for future Phase 2 deployment. Same pattern as `lab`, smaller scope.

---

## 🚀 Next Steps (Immediate)

### Step 1: Install pnpm
```bash
npm install -g pnpm
```

### Step 2: Copy src/ to packages/lab/src/
Move all existing source files:
```bash
# From repo root:
cp -r src/* packages/lab/src/

# Copy other root files that belong to lab
cp index.html packages/lab/
cp public/* packages/lab/public/
cp tailwind.config.ts packages/lab/
cp components.json packages/lab/
cp vite.config.ts packages/lab/ # (already created, verify it matches)
```

### Step 3: Update Imports (Critical!)
Find all imports from current codebase and update them:

**Before:**
```tsx
import { Wordmark } from '@/components/Wordmark'
import { supabaseClient } from '@/integrations/supabase/client'
```

**After:**
```tsx
import { /* Wordmark moved to shared */ } from '@steam-foundry/shared'
import { supabaseClient } from '@steam-foundry/shared/api'
```

**Files to update:**
- All `.tsx` files in `packages/lab/src/pages/`
- All `.tsx` files in `packages/lab/src/components/`
- `packages/lab/src/App.tsx`
- `packages/lab/src/main.tsx`

**Import map (moving from `src/` to shared):**
| Component/Utility | Old Location | New Location |
|---|---|---|
| Wordmark | `@/components/Wordmark` | `@steam-foundry/shared` (when moved) |
| StatusPill | `@/components/StatusPill` | `@steam-foundry/shared` (when moved) |
| StatRow | `@/components/StatRow` | `@steam-foundry/shared` (when moved) |
| Stepper | `@/components/Stepper` | `@steam-foundry/shared` (when moved) |
| supabaseClient | `@/integrations/supabase/client` | `@steam-foundry/shared/api` |
| Types (School, Team, etc.) | `@/types` (custom) | `@steam-foundry/shared/types` |
| XP utilities | Custom code | `@steam-foundry/shared/lib` |

### Step 4: Test Build
```bash
# From repo root
cd packages/lab
pnpm install   # Install dependencies (creates node_modules)
pnpm build     # Build and verify chunks

# You should see output like:
# dist/index-[hash].js (40 KB) - app shell
# dist/route-landing-[hash].js (45 KB)
# dist/route-store-[hash].js (38 KB)
# etc.
```

### Step 5: Test Dev Server
```bash
pnpm dev
# Navigate to http://localhost:8080
# Test that it loads and routes work
```

---

## 📋 Verification Checklist

### Monorepo Structure
- [ ] `pnpm-workspace.yaml` exists at root
- [ ] `packages/shared/` has lib/, hooks/, components/, api/, types/
- [ ] `packages/lab/` has package.json with code splitting
- [ ] `packages/apen/` exists (can be skeleton)

### Build Configuration
- [ ] `packages/lab/vite.config.ts` has `manualChunks` defined
- [ ] Route chunks will be created: landing, store, auth, lab, organizer, judge
- [ ] Library chunks: radix, charts, motion, query

### Imports Updated
- [ ] No remaining `@/integrations/supabase/client` imports (should be `@steam-foundry/shared/api`)
- [ ] No remaining `@/lib/xp-*` (should import from `@steam-foundry/shared/lib`)
- [ ] Design components (Wordmark, StatusPill, etc.) imported from shared

### Build Succeeds
- [ ] `pnpm --filter=lab build` completes without errors
- [ ] Bundle size < 500 KB (gzip < 200 KB) initially, then we optimize
- [ ] No TypeScript errors

---

## 🔄 Git Workflow (Recommended)

```bash
# Create a feature branch for this migration
git checkout -b feat/monorepo-migration

# After all files moved and imports updated:
git add .
git commit -m "chore: monorepo migration - move to packages/shared + packages/lab + packages/apen"

# Push and create PR for review
git push origin feat/monorepo-migration
```

---

## 📊 File Checklist (What Needs to Move)

From current `src/` → `packages/lab/src/`:

**Pages** (12 files)
- [ ] `pages/Landing.tsx`
- [ ] `pages/Store.tsx`
- [ ] `pages/Login.tsx`
- [ ] `pages/OrganizerLogin.tsx`
- [ ] `pages/Dashboard.tsx`
- [ ] `pages/Lab.tsx`
- [ ] `pages/OrganizerDashboard.tsx`
- [ ] `pages/JudgeDashboard.tsx`
- [ ] `pages/OrderStatus.tsx`
- [ ] `pages/NotFound.tsx`
- [ ] And any others

**Components** (60+ files)
- [ ] `components/ui/*` (Radix primitives)
- [ ] `components/organizer/*`
- [ ] `components/lab/*`
- [ ] `components/dashboard/*`
- [ ] `components/*.tsx` (Wordmark, StatusPill, Stepper, etc.)

**Contexts & Lib**
- [ ] `contexts/AuthContext.tsx`
- [ ] `contexts/ThemeContext.tsx`
- [ ] `lib/utils.ts`
- [ ] `hooks/use-mobile.tsx`

**Config & Assets**
- [ ] `index.css`
- [ ] `main.tsx`
- [ ] `App.tsx`
- [ ] Assets folder → `public/assets/`

---

## 🎯 What This Accomplishes

✅ **Modular Monolith Ready**
- Shared code in `packages/shared` used by both lab + apen
- Lab and apen are independent deployments

✅ **Code Splitting Configured**
- vite.config.ts has route-based manual chunks
- Initial bundle will be ~50 KB (vs current 660 KB)
- Each route loads on demand

✅ **PWA Foundation**
- Service Worker path is defined (`public/sw.js`)
- Manifest ready for install prompts

✅ **Navigation Structure Ready**
- Nav components scaffolded (BottomNavBar, SidebarNav)
- Responsive shell ready for implementation

✅ **TypeScript Types Centralized**
- Shared types in `packages/shared/types/`
- No duplication across packages

---

## 📞 Troubleshooting

### `Error: Cannot find module '@steam-foundry/shared'`
→ Make sure `pnpm install` was run and `pnpm-workspace.yaml` exists

### Build still shows 660 KB bundle
→ Verify vite.config.ts has `manualChunks` and all imports updated. Old monolithic bundle means code-splitting isn't active

### TypeScript errors after moving files
→ Update path aliases in moved files' `tsconfig.json` and imports

### Service Worker doesn't register
→ `public/sw.js` needs to exist and be referenced in `main.tsx` (already set up)

---

## Next Phase (Phase 1 Week 1 Continuation)

Once this migration is complete and builds successfully:

1. **Navigation Implementation** (Days 3-5 of Week 1)
   - Implement `BottomNavBar.tsx` for mobile/tablet
   - Implement `SidebarNav.tsx` for desktop
   - Test responsive at 375px, 768px, 1024px

2. **PWA Setup** (Concurrent)
   - Implement Service Worker (`public/sw.js`)
   - Register offline queue hooks
   - Test offline submission

3. **Lab Components** (Phase 1 Week 2)
   - Build `UnifiedLabDashboard.tsx`
   - Build `TeamViewTab.tsx`, `IndividualViewTab.tsx`
   - Build `StageCard.tsx`

---

## 📖 References

- [Modular Monolith Architecture](../1-MODULAR_MONOLITH_ARCHITECTURE.md)
- [PWA Offline Strategy](../2-PWA_OFFLINE_STRATEGY.md)
- [Navigation Mobile-First](../3-NAVIGATION_MOBILE_FIRST.md)
- [Performance Optimization Plan](../4-PERFORMANCE_OPTIMIZATION_PLAN.md)
- [Phase 1 Build Plan](../5-PHASE_1_BUILD_PLAN.md)

