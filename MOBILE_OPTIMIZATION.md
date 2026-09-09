# STEAM Foundry - Mobile Optimization Guide

## Mobile-First Philosophy

The app is **mobile-first by design**, but there are still optimizations for tablets and desktops.

## Viewport Configuration

### Current Setup (index.html)
```html
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=5.0">
```

✅ Already correct - allows zoom up to 5x for accessibility

## Breakpoints & Responsive Design

### Tailwind Breakpoints
```
- sm: 640px
- md: 768px
- lg: 1024px
- xl: 1280px
- 2xl: 1536px
```

### Usage Pattern
```typescript
// Mobile-first approach
<div className="
  w-full                  // Mobile: full width
  md:w-1/2                // Tablet: half width
  lg:w-1/3                // Desktop: one-third
">
  Content
</div>
```

## Critical Mobile Optimizations

### 1. Touch Target Sizes

**Standard:** 44x44px minimum  
**Verify all interactive elements:**

```typescript
// ✅ Good
<button className="p-3 rounded-lg">  {/* 48x48px minimum */}
  <Icon className="w-5 h-5" />
</button>

// ❌ Bad
<button className="p-1">  {/* Too small */}
  <Icon className="w-3 h-3" />
</button>
```

**Checklist:**
- [ ] All buttons ≥ 44x44px
- [ ] All form inputs ≥ 44px height
- [ ] All clickable areas have padding
- [ ] Touch targets spaced 8px+ apart

### 2. Safe Area (Notched Phones)

```css
/* Add padding for notches and home indicators */
@supports (padding: max(0px)) {
  .bottom-nav {
    padding-bottom: max(1rem, env(safe-area-inset-bottom));
  }
  
  .app-header {
    padding-top: max(1rem, env(safe-area-inset-top));
  }
}
```

**Current Status:** ✅ Already handled in BottomNavBar

### 3. Input Interactions

```typescript
// ✅ Good - no zoom needed
<input
  type="text"
  className="text-base"  {/* Prevents auto-zoom on iOS */}
/>

// ❌ Bad - triggers auto-zoom on iOS
<input
  type="text"
  className="text-sm"    {/* < 16px triggers zoom */}
/>
```

**Verify:**
- [ ] All inputs are `text-base` (16px)
- [ ] Font size ≥ 16px on all inputs
- [ ] No zoom-on-focus issue on iOS

### 4. Viewport Handling

```typescript
// Prevent pulling down refresh on certain elements
<div className="overflow-y-auto" onTouchMove={(e) => {
  if (e.target.scrollTop === 0) {
    e.preventDefault();  // Prevent overscroll
  }
}>
  Scrollable content
</div>
```

## Responsive Component Patterns

### 1. Navigation (Mobile/Tablet/Desktop)

```typescript
// Navigation strategy:
// Mobile:      BottomNavBar (fixed bottom)
// Tablet:      BottomNavBar (fixed bottom)
// Desktop:     SidebarNav (fixed left)

export default function NavLayout() {
  return (
    <>
      {/* Desktop sidebar - hidden on mobile/tablet */}
      <aside className="hidden lg:fixed">
        <SidebarNav />
      </aside>
      
      {/* Mobile bottom nav - hidden on desktop */}
      <nav className="lg:hidden fixed bottom-0">
        <BottomNavBar />
      </nav>
      
      {/* Main content - adjust for nav */}
      <main className="pb-16 lg:pl-64 lg:pb-0">
        {/* Content */}
      </main>
    </>
  );
}
```

### 2. Tables (Mobile-Optimized)

```typescript
// On mobile, stack table into cards
export function ResponsiveTable({ data }) {
  return (
    <>
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          {/* Table rows */}
        </table>
      </div>
      
      {/* Mobile stacked view */}
      <div className="md:hidden space-y-3">
        {data.map((row) => (
          <Card key={row.id}>
            {/* Row as card */}
          </Card>
        ))}
      </div>
    </>
  );
}
```

### 3. Modals & Dialogs

```typescript
// Mobile: Full-screen sheet from bottom
// Desktop: Centered modal
export function ResponsiveDialog() {
  return (
    <>
      {/* Mobile - sheet from bottom */}
      <Sheet>
        <SheetContent side="bottom">
          {/* Content */}
        </SheetContent>
      </Sheet>
      
      {/* Desktop - centered modal */}
      <Dialog>
        <DialogContent>
          {/* Content */}
        </DialogContent>
      </Dialog>
    </>
  );
}
```

## Performance on Mobile

### 1. Image Optimization

```typescript
// Use srcset for responsive images
<img
  src="/image-small.webp"
  srcSet="
    /image-small.webp 320w,
    /image-medium.webp 640w,
    /image-large.webp 1280w
  "
  sizes="(max-width: 640px) 100vw, 50vw"
  alt="Description"
/>
```

### 2. Code Splitting

```typescript
// Already implemented - dynamic imports per route
const Dashboard = lazy(() => import('./pages/Dashboard'));
const OrganizerDashboard = lazy(() => import('./pages/OrganizerDashboard'));
```

**Bundle targets:**
- Main: < 50KB (gzipped)
- Dashboard: < 30KB
- Organizer: < 40KB

### 3. Reduce Initial Load

```typescript
// Defer non-critical data
useEffect(() => {
  // Load immediately
  loadTeams();
  loadStages();
  
  // Defer until idle
  if ('requestIdleCallback' in window) {
    requestIdleCallback(() => loadAnalytics());
  }
}, []);
```

## Testing on Mobile

### Device Testing Checklist

```bash
# iOS Testing
- [ ] iPhone SE (375px)
- [ ] iPhone 14 (390px)
- [ ] iPhone 14 Pro (393px)
- [ ] iPad (768px)
- [ ] iPad Pro (1024px)

# Android Testing
- [ ] Galaxy S22 (360px)
- [ ] Pixel 7 (412px)
- [ ] Pixel Tablet (600px)

# Browsers
- [ ] Safari iOS
- [ ] Chrome Android
- [ ] Samsung Internet
- [ ] Firefox Android
```

### Browser DevTools Testing

```bash
# Chrome DevTools
1. Open DevTools (F12)
2. Click device icon (top left)
3. Select device from dropdown
4. Test each breakpoint

# Common viewports to test:
- iPhone 12 Pro: 390x844
- Pixel 5: 393x851
- iPad Air: 768x1024
- iPad Pro: 1024x1366
```

### Real Device Testing

**Recommended:** Test on actual devices

```bash
# Via ngrok (expose local dev server)
npm install -g ngrok
ngrok http 5173
# Share ngrok URL with testers
```

## Mobile-Specific Features

### 1. Pull-to-Refresh

```typescript
// Already implemented via Supabase refresh button
// But could add native pull-to-refresh for better UX
import { PullToRefresh } from 'react-pull-to-refresh';

<PullToRefresh onRefresh={handleRefresh}>
  <Dashboard />
</PullToRefresh>
```

### 2. Haptic Feedback

```typescript
// Provide haptic feedback on iOS/Android
function handleTap() {
  if ('vibrate' in navigator) {
    navigator.vibrate(50);  // 50ms vibration
  }
}
```

### 3. Home Screen Installation (PWA)

Current status: ✅ Partially implemented

**To complete PWA:**
```json
{
  "manifest.json": {
    "name": "STEAM Foundry",
    "short_name": "STEAM",
    "icons": [
      { "src": "/icon-192.png", "sizes": "192x192" },
      { "src": "/icon-512.png", "sizes": "512x512" }
    ],
    "theme_color": "#000000",
    "background_color": "#ffffff"
  }
}
```

Add to `index.html`:
```html
<link rel="manifest" href="/manifest.json">
<meta name="theme-color" content="#000000">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black">
```

## Common Mobile Issues & Fixes

### Issue: Text Too Small

**Problem:** Text < 16px on inputs causes zoom on iOS
**Solution:**
```css
input, textarea, select {
  font-size: 16px;  /* Never smaller */
}
```

### Issue: Horizontal Scroll

**Problem:** Wide content breaks mobile layout
**Solution:**
```css
/* All wide content must scroll internally */
.overflow-container {
  overflow-x: auto;
  overflow-y: hidden;
}

/* Main body never scrolls horizontally */
body {
  max-width: 100vw;
  overflow-x: hidden;
}
```

### Issue: Keyboard Overlap

**Problem:** Virtual keyboard hides form inputs on mobile
**Solution:**
```typescript
// Scroll input into view when focused
<input
  onFocus={(e) => {
    e.target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }}
/>
```

### Issue: Slow Animations

**Problem:** Animations stutter on low-end Android
**Solution:**
```typescript
// Reduce motion on slower devices
const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

<motion.div
  animate={{ x: 100 }}
  transition={{ duration: prefersReducedMotion ? 0 : 0.3 }}
>
  Content
</motion.div>
```

## Mobile Performance Targets

| Metric | Target | Test |
|--------|--------|------|
| First Contentful Paint | < 2s | Lighthouse |
| Largest Contentful Paint | < 2.5s | Lighthouse |
| Layout Shift | < 0.1 | Lighthouse |
| Time to Interactive | < 3.5s | Lighthouse |

## Optimization Checklist

### Responsiveness
- [ ] Mobile-first CSS (no desktop-first)
- [ ] All breakpoints tested (sm, md, lg)
- [ ] No horizontal scroll
- [ ] Touch targets ≥ 44x44px
- [ ] Safe area padding applied

### Performance
- [ ] Images optimized for mobile
- [ ] Animations disabled for `prefers-reduced-motion`
- [ ] Code splitting applied
- [ ] Bundle size < 50KB
- [ ] Lighthouse score ≥ 90

### Usability
- [ ] Form inputs ≥ 16px
- [ ] Links clearly distinguishable
- [ ] Error messages clear
- [ ] Loading states visible
- [ ] Offline mode works

### Compatibility
- [ ] Tested on iOS Safari
- [ ] Tested on Chrome Android
- [ ] Notch/safe area handled
- [ ] Virtual keyboard handled
- [ ] Slow network tested (3G)

---

**Status:** Optimized for mobile-first  
**Testing:** In Progress  
**Target Score:** Lighthouse 95+
