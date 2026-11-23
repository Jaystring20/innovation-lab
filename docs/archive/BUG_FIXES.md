# STEAM Foundry - Bug Fixes & Issue Resolution

## Known Issues & Fixes

### Issue #1: File Upload Size Validation

**Status:** ✅ Fixed in organizer.ts
**Severity:** Medium  
**Description:** File upload size limits not enforced on client  
**Root Cause:** Validation only on server  
**Fix Applied:**
```typescript
// In uploads.ts
export const SIZE_LIMITS = {
  video: 5 * 1024 * 1024 * 1024,    // 5GB
  doc: 100 * 1024 * 1024,            // 100MB
  image: 50 * 1024 * 1024,           // 50MB
};

export function validateFile(file: File, purpose: 'video' | 'doc' | 'image'): void {
  const limit = SIZE_LIMITS[purpose];
  if (file.size > limit) {
    const limitMB = Math.floor(limit / 1024 / 1024);
    throw new UploadError(
      `File exceeds ${limitMB}MB limit for ${purpose} uploads`,
      'FILE_TOO_LARGE',
    );
  }
}
```

### Issue #2: Offline Queue Not Retrying

**Status:** ✅ Fixed in OfflineQueueManager.tsx
**Severity:** High  
**Description:** Offline uploads not retrying after network restored  
**Root Cause:** Event listeners not attached properly  
**Fix Applied:**
```typescript
// Listen for network status changes
useEffect(() => {
  function handleOnline() {
    setOnline(true);
    // Auto-retry after 2 second delay
    setTimeout(() => handleRetry(), 2000);
  }

  window.addEventListener('online', handleOnline);
  return () => window.removeEventListener('online', handleOnline);
}, []);
```

### Issue #3: Judge Assignment Panel Missing Data

**Status:** ✅ Fixed with organizer.ts mutations
**Severity:** Medium  
**Description:** Judge list empty in assignment panel  
**Root Cause:** Data not loaded in LabConsole  
**Fix Applied:**
```typescript
// In LabConsole.tsx
const [judges, setJudges] = useState<JudgeProfile[]>([]);

const load = useCallback(async () => {
  const [stages, teams, submissions, assignments, judges, ...rest] = await Promise.all([
    listStages(),
    listAllTeams(),
    listAllSubmissions(),
    listAssignments(),
    listJudges(),  // ← Added this
    // ...
  ]);
  setJudges(judges);
}, []);
```

### Issue #4: GlassCard Component Not Removed

**Status:** ✅ Fixed - Replaced with Panel
**Severity:** Medium  
**Description:** GlassCard still referenced in multiple files causing build errors  
**Root Cause:** Migration not complete  
**Fix Applied:**
```bash
# Replaced all occurrences
git grep "GlassCard" | wc -l  # Check count
sed -i 's/<GlassCard/<Panel/g' src/pages/*.tsx
sed -i 's/<\/GlassCard>/<\/Panel>/g' src/pages/*.tsx
sed -i 's/glass-card/bg-secondary/g' src/**/*.tsx
```

### Issue #5: Login Form Shows Cached Error

**Status:** ⏳ Needs Fix
**Severity:** Low  
**Description:** Error message stays after successful login  
**Root Cause:** Error state not cleared on route change  
**Fix to Apply:**
```typescript
// In Login.tsx
useEffect(() => {
  if (session && role) {
    setError(null);  // Clear error before redirect
    navigate('/lab/dashboard');
  }
}, [session, role, navigate]);
```

### Issue #6: Organizer Console Slow Load

**Status:** ⏳ Needs Fix
**Severity:** Medium  
**Description:** LabConsole waits for all 8 endpoints before showing any data  
**Root Cause:** Parallel loading still blocks on slowest endpoint  
**Fix to Apply:**
```typescript
// Progressive loading - show what's available
useEffect(() => {
  loadStages().then(setStages);
  loadTeams().then(setTeams);
  loadSubmissions().then(setSubmissions);
  // Each sets data independently
}, []);
```

### Issue #7: File Upload Progress Not Showing

**Status:** ⏳ Needs Fix
**Severity:** Low  
**Description:** Upload progress percentage not displayed  
**Root Cause:** Supabase upload doesn't report progress directly  
**Fix to Apply:**
```typescript
// Estimate progress based on file size
const fakeProgress = () => {
  // Simulate progress 0 → 90% quickly, then wait
  setProgress(Math.min(progress + Math.random() * 40, 90));
};

const interval = setInterval(fakeProgress, 200);
// When upload completes, jump to 100%
```

### Issue #8: Mobile Menu Doesn't Close on Navigation

**Status:** ⏳ Needs Fix
**Severity:** Low  
**Description:** BottomNavBar stays visible after clicking link  
**Root Cause:** No state reset on route change  
**Fix to Apply:**
```typescript
// In BottomNavBar.tsx
const location = useLocation();

useEffect(() => {
  // Menu implicitly closes when route changes
  // (no state to manage, nav items just highlight)
}, [location]);
```

### Issue #9: Organizer Console Buttons Not Wired

**Status:** ⏳ Needs Implementation
**Severity:** High  
**Description:** Judge assignment and team advancement buttons don't do anything  
**Fix to Apply:**
```typescript
// In JudgeAssignmentPanel.tsx
const handleAssign = async () => {
  setBusy(true);
  try {
    await assignJudge(submissionId, selectedJudgeId, organizerId);
    onChanged(); // Refresh data
    toast.success('Judge assigned');
  } catch (error) {
    toast.error(error.message);
  } finally {
    setBusy(false);
  }
};
```

### Issue #10: No Error Handling on Network Timeout

**Status:** ⏳ Needs Fix
**Severity:** Medium  
**Description:** Long network requests freeze UI with no timeout  
**Fix to Apply:**
```typescript
// Add timeout wrapper
async function withTimeout<T>(
  promise: Promise<T>,
  ms: number = 10000
): Promise<T> {
  return Promise.race([
    promise,
    new Promise<T>((_, reject) =>
      setTimeout(() => reject(new Error('Request timeout')), ms)
    ),
  ]);
}

// Use in data loading
const submissions = await withTimeout(listAllSubmissions(), 10000);
```

## Bug Fix Priority

### Critical (Do First)
1. ✅ Issue #1 - File upload validation
2. ✅ Issue #2 - Offline queue retry
3. ✅ Issue #4 - GlassCard removal
4. ⏳ Issue #9 - Organizer buttons

### High
5. ⏳ Issue #6 - Slow console load
6. ⏳ Issue #10 - Network timeout

### Medium
7. ⏳ Issue #3 - Judge list data
8. ⏳ Issue #5 - Login error state
9. ⏳ Issue #7 - Upload progress

### Low
10. ⏳ Issue #8 - Mobile menu

## Testing Bug Fixes

### Before & After Testing

```bash
# Run tests after each fix
npm run test -- <fixed-component>.test.tsx

# For critical path bugs, run full test suite
npm run test

# For UI bugs, test in browser
npm run dev
```

### Regression Testing

After each fix, test:
- [ ] Original issue resolved
- [ ] No new errors in console
- [ ] Related features still work
- [ ] Mobile view works
- [ ] Offline mode works (if applicable)

## Bug Report Template

When logging new issues:

```markdown
## Title
[Component] - Description

### Severity
[ ] Critical [ ] High [ ] Medium [ ] Low

### Description
Clear explanation of the issue

### Steps to Reproduce
1. Go to...
2. Click...
3. Observe...

### Expected Behavior
What should happen

### Actual Behavior
What actually happens

### Environment
- Browser: Chrome 120
- Device: Desktop / Mobile / Tablet
- OS: Windows / macOS / iOS / Android

### Workaround (if any)
How to work around the issue

### Screenshots
[Attach if visual issue]

### Additional Context
Any other relevant info
```

## Issue Tracking

### GitHub Issues
All issues logged at: https://github.com/Jaystring20/innovation-lab/issues

### Labels
- `bug` - Confirmed bug
- `enhancement` - Feature request
- `documentation` - Docs needed
- `critical` - Blocks deployment
- `wontfix` - Not fixing

### Milestones
- `v1.0.0` - Launch release
- `v1.1.0` - First patch
- `v1.2.0` - Second patch

## Prevention

### Code Review Checklist
- [ ] All tests pass
- [ ] No console errors
- [ ] No TypeScript errors
- [ ] Tested on mobile
- [ ] Accessibility checked
- [ ] Performance verified

### Testing Before Merge
```bash
# Run full test suite
npm run test

# Run E2E tests
npm run test:e2e

# Build check
npm run build

# Type check
npm run type-check
```

## Hot Fixes (Emergency)

If critical bug in production:

```bash
# 1. Create hotfix branch
git checkout -b hotfix/critical-bug

# 2. Fix the issue
# (make changes)

# 3. Test thoroughly
npm run test
npm run test:e2e

# 4. Commit
git commit -m "fix: critical bug description"

# 5. Push and deploy
git push origin hotfix/critical-bug

# 6. Create PR and merge quickly
gh pr create --base main

# 7. Monitor after deploy
# Watch error rates, user reports
```

## Monitoring for Bugs

### Post-Deploy Monitoring
- [ ] Check Sentry error dashboard
- [ ] Check Vercel logs
- [ ] Monitor user reports
- [ ] Watch error rates spike

### Metrics to Watch
- Error rate (< 0.1%)
- Failed uploads
- Auth failures
- API response times
- File upload success rate

---

**Total Known Issues:** 10  
**Fixed:** 4  
**In Progress:** 6  
**Status:** Ready for Bug Squashing Sprint
