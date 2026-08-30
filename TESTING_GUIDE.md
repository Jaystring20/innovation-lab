# STEAM Foundry Innovation Lab - Testing Guide

## Overview

Comprehensive testing guide for unit tests, integration tests, and end-to-end tests.

## Test Setup

### Installation

```bash
# Unit & Integration Tests
npm install --save-dev vitest @testing-library/react @testing-library/jest-dom

# E2E Tests
npm install --save-dev playwright

# Coverage
npm install --save-dev @vitest/coverage-v8
```

### Configuration

#### vitest.config.ts
```typescript
import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: ['src/**/*.{ts,tsx}'],
      exclude: ['src/**/*.d.ts', 'src/**/*.test.*'],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
});
```

#### playwright.config.ts
```typescript
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:5173',
    trace: 'on-first-retry',
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
    {
      name: 'firefox',
      use: { ...devices['Desktop Firefox'] },
    },
    {
      name: 'webkit',
      use: { ...devices['Desktop Safari'] },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !process.env.CI,
  },
});
```

## Unit Tests

### Structure
```
src/
├── components/
│   ├── Panel.test.tsx
│   ├── FileUpload.test.tsx
│   └── Wordmark.test.tsx
├── lib/
│   ├── uploads.test.ts
│   ├── organizer.test.ts
│   └── lab.test.ts
└── test/
    ├── setup.ts
    └── mocks.ts
```

### Example Unit Test

```typescript
// src/components/Panel.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Panel from '@/components/Panel';

describe('Panel', () => {
  it('renders with children', () => {
    render(<Panel>Test content</Panel>);
    expect(screen.getByText('Test content')).toBeInTheDocument();
  });

  it('applies hover style when hover prop is true', () => {
    const { container } = render(
      <Panel hover={true}>Hover test</Panel>
    );
    expect(container.querySelector('.panel')).toHaveClass('hover:bg-white/5');
  });

  it('applies custom className', () => {
    const { container } = render(
      <Panel className="custom-class">Custom</Panel>
    );
    expect(container.querySelector('.panel')).toHaveClass('custom-class');
  });
});
```

### Running Unit Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test -- --watch

# Run specific test file
npm run test -- Panel.test.tsx

# Generate coverage report
npm run test -- --coverage
```

## Integration Tests

### Structure
```
src/test/
├── setup.ts
├── mocks.ts
└── fixtures/
    ├── teams.ts
    ├── submissions.ts
    └── auth.ts
```

### Mock Setup

```typescript
// src/test/setup.ts
import { expect, afterEach, vi } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock Supabase
vi.mock('@/lib/supabase', () => ({
  supabase: {
    from: vi.fn(),
    auth: {
      getSession: vi.fn(),
      onAuthStateChange: vi.fn(),
    },
  },
}));

// Mock useAuth hook
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    session: { user: { id: 'test-user' } },
    profile: { school_id: 'test-school' },
    role: 'teacher',
    loading: false,
  }),
}));
```

### Integration Test Example

```typescript
// src/lib/uploads.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { uploadFile, validateFile, UploadError } from '@/lib/uploads';

describe('Upload Functions', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('validateFile', () => {
    it('throws error for files exceeding size limit', () => {
      const largeFile = new File(['x'.repeat(6 * 1024 * 1024 * 1024)], 'large.mp4', {
        type: 'video/mp4',
      });

      expect(() => validateFile(largeFile, 'video')).toThrow(UploadError);
      expect(() => validateFile(largeFile, 'video')).toThrow('exceeds');
    });

    it('throws error for invalid file types', () => {
      const invalidFile = new File(['content'], 'file.exe', { type: 'application/x-msdownload' });

      expect(() => validateFile(invalidFile, 'video')).toThrow(UploadError);
      expect(() => validateFile(invalidFile, 'video')).toThrow('not allowed');
    });

    it('passes validation for correct file type and size', () => {
      const validFile = new File(['content'], 'video.mp4', { type: 'video/mp4' });

      expect(() => validateFile(validFile, 'video')).not.toThrow();
    });
  });

  describe('uploadFile', () => {
    it('calls supabase storage upload with correct path', async () => {
      const file = new File(['content'], 'test.mp4', { type: 'video/mp4' });
      const submissionId = 'sub-123';

      // Mock implementation would go here
      // await uploadFile(file, submissionId, 'video');
      // expect(supabase.storage.from).toHaveBeenCalledWith('team-submissions');
    });
  });
});
```

## End-to-End Tests

### Structure
```
e2e/
├── auth.spec.ts
├── teacher-dashboard.spec.ts
├── judge-scoring.spec.ts
├── organizer-console.spec.ts
└── file-upload.spec.ts
```

### Example E2E Test

```typescript
// e2e/teacher-dashboard.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Teacher Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Login as teacher
    await page.goto('/lab');
    await page.fill('input[type="email"]', 'teacher@school.edu.ng');
    await page.fill('input[type="password"]', 'password123');
    await page.click('button:has-text("Sign in")');
    await page.waitForNavigation();
  });

  test('displays team list', async ({ page }) => {
    await page.goto('/lab/dashboard');
    expect(await page.locator('text=Your teams').isVisible()).toBeTruthy();
  });

  test('can add a new team', async ({ page }) => {
    await page.goto('/lab/dashboard');
    await page.fill('input[placeholder*="Team"]', 'Test Team');
    await page.click('button:has-text("Add team")');
    await expect(page.locator('text=Test Team')).toBeVisible();
  });

  test('displays stage cards for team', async ({ page }) => {
    await page.goto('/lab/dashboard');
    // Click first team
    await page.click('button[role="tab"]');
    // Check for stage cards
    expect(await page.locator('text=Design').count()).toBeGreaterThan(0);
  });

  test('can upload a file submission', async ({ page }) => {
    await page.goto('/lab/dashboard');
    const fileInput = page.locator('input[type="file"]').first();
    await fileInput.setInputFiles('test-video.mp4');
    await expect(page.locator('text=File uploaded')).toBeVisible();
  });
});
```

### Running E2E Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run specific E2E test file
npm run test:e2e -- auth.spec.ts

# Run in headed mode (see browser)
npm run test:e2e -- --headed

# Debug mode
npm run test:e2e -- --debug
```

## Test Coverage Targets

### Minimum Coverage
- **Statements:** 80%
- **Branches:** 75%
- **Functions:** 80%
- **Lines:** 80%

### Critical Paths (100% target)
- Authentication flows
- Data validation (file size, type)
- Payment processing
- File uploads
- Judge scoring calculations

### View Coverage Report
```bash
npm run test -- --coverage
# Open coverage/index.html in browser
```

## Test Data & Fixtures

### Fixture Files

```typescript
// src/test/fixtures/teams.ts
export const MOCK_TEAM = {
  id: 'team-123',
  school_id: 'school-456',
  name: 'Test Team',
  division: 'primary' as const,
  member_count: 3,
  created_at: '2026-08-01T00:00:00Z',
};

// src/test/fixtures/submissions.ts
export const MOCK_SUBMISSION = {
  id: 'sub-123',
  team_id: 'team-123',
  stage_id: 'stage-456',
  status: 'submitted' as const,
  payload: {
    video_url: 'https://example.com/video.mp4',
    doc_url: 'https://example.com/doc.pdf',
    notes: 'Test submission',
  },
  submitted_at: '2026-08-15T00:00:00Z',
  updated_at: '2026-08-15T00:00:00Z',
};

// src/test/fixtures/auth.ts
export const MOCK_AUTH_SESSION = {
  user: {
    id: 'user-123',
    email: 'test@example.com',
    user_metadata: { role: 'teacher' },
  },
  session: {
    access_token: 'mock-token',
    expires_in: 3600,
  },
};
```

## Testing Checklists

### Pre-Release Testing
- [ ] All unit tests pass (80%+ coverage)
- [ ] All integration tests pass
- [ ] E2E tests pass on all browsers
- [ ] No console errors or warnings
- [ ] Network requests logged properly
- [ ] Error boundaries render on errors
- [ ] Offline queue works when network disconnected

### Feature Testing
- [ ] Landing page renders without errors
- [ ] Auth flows work (login, register, logout)
- [ ] Dashboard loads data correctly
- [ ] File uploads work with progress
- [ ] Offline queue persists and retries
- [ ] Judge scoring updates correctly
- [ ] Team advancement works
- [ ] Organizer console loads all data

### Browser Testing
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Mobile browsers (iOS Safari, Chrome Mobile)

### Performance Testing
- [ ] Initial load < 3 seconds
- [ ] Dashboard data load < 1 second
- [ ] File upload starts immediately
- [ ] No memory leaks in DevTools

## Continuous Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/test.yml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: npm install
      - run: npm run test -- --coverage
      - run: npm run test:e2e
      - uses: codecov/codecov-action@v3
```

## Debugging Tests

### Debug Unit Test
```bash
node --inspect-brk ./node_modules/vitest/vitest.mjs run Panel.test.tsx
```

### Debug E2E Test
```bash
npx playwright test auth.spec.ts --debug
```

### Take Screenshots on Failure
```typescript
test('should fail gracefully', async ({ page }) => {
  try {
    await page.goto('/invalid-route');
  } catch (error) {
    await page.screenshot({ path: 'failure.png' });
    throw error;
  }
});
```

## Common Testing Patterns

### Testing Async Components
```typescript
it('loads and displays data', async () => {
  render(<LabDashboard />);
  await waitFor(() => {
    expect(screen.getByText('Team Name')).toBeInTheDocument();
  });
});
```

### Testing User Interactions
```typescript
it('submits form on button click', async () => {
  const { user } = render(<LoginForm />);
  await user.type(screen.getByLabelText('Email'), 'test@example.com');
  await user.click(screen.getByRole('button', { name: /sign in/i }));
  expect(mockSignIn).toHaveBeenCalled();
});
```

### Testing Error States
```typescript
it('displays error message on failure', async () => {
  vi.mocked(uploadFile).mockRejectedValue(new Error('Upload failed'));
  render(<FileUpload />);
  await user.click(screen.getByText('Upload'));
  expect(await screen.findByText('Upload failed')).toBeInTheDocument();
});
```

## Resources

- **Vitest Docs:** https://vitest.dev
- **Testing Library:** https://testing-library.com
- **Playwright Docs:** https://playwright.dev
- **Best Practices:** https://kentcdodds.com/blog/common-mistakes-with-react-testing-library

---

**Last Updated:** 2026-08-31  
**Status:** Ready for Implementation
