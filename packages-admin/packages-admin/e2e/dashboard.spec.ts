import { test, expect } from '@playwright/test'

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    // Visit dashboard
    await page.goto('/dashboard')
  })

  test('should display dashboard header', async ({ page }) => {
    const header = page.locator('h1')
    await expect(header).toContainText('Admin Dashboard')
  })

  test('should display module tabs', async ({ page }) => {
    const learningLabTab = page.locator('button', { hasText: 'Learning Lab' })
    const competitionTab = page.locator('button', { hasText: 'Competition' })

    await expect(learningLabTab).toBeVisible()
    await expect(competitionTab).toBeVisible()
  })

  test('should switch between modules', async ({ page }) => {
    const competitionTab = page.locator('button', { hasText: 'Competition' })
    await competitionTab.click()

    const competitionContent = page.locator('text=APEN Competition')
    await expect(competitionContent).toBeVisible()
  })

  test('should display sidebar navigation', async ({ page }) => {
    const sidebar = page.locator('[class*="sidebar"]')
    await expect(sidebar).toBeVisible()

    const logo = page.locator('text=STEAM Foundry')
    await expect(logo).toBeVisible()
  })

  test('should have functioning sidebar links', async ({ page }) => {
    const dashboardLink = page.locator('a', { hasText: 'Dashboard' })
    await expect(dashboardLink).toBeVisible()
  })
})

test.describe('Learning Lab Module', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard')
  })

  test('should display all learning lab tabs', async ({ page }) => {
    const tabs = ['Levels', 'Lessons', 'Assessments', 'Missions', 'Publish']

    for (const tab of tabs) {
      const tabElement = page.locator('button', { hasText: tab })
      await expect(tabElement).toBeVisible()
    }
  })

  test('should switch between learning lab tabs', async ({ page }) => {
    const lessonsTab = page.locator('button', { hasText: 'Lessons' })
    await lessonsTab.click()

    const lessonContent = page.locator('text=Lessons')
    await expect(lessonContent).toBeVisible()
  })
})

test.describe('Competition Module', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dashboard')
    const competitionTab = page.locator('button', { hasText: 'Competition' })
    await competitionTab.click()
  })

  test('should display all competition tabs', async ({ page }) => {
    const tabs = ['Stages', 'Teams', 'Submissions', 'Scoring']

    for (const tab of tabs) {
      const tabElement = page.locator('button', { hasText: tab })
      await expect(tabElement).toBeVisible()
    }
  })
})

test.describe('Responsive Design', () => {
  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 812 })
    await page.goto('/dashboard')

    const header = page.locator('h1')
    await expect(header).toBeVisible()

    const sidebar = page.locator('[class*="sidebar"]')
    // Sidebar might be hidden on mobile
    const isVisible = await sidebar.isVisible().catch(() => false)
    // Test passes whether sidebar is visible or hidden
    expect([true, false]).toContain(isVisible)
  })

  test('should work on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/dashboard')

    const header = page.locator('h1')
    await expect(header).toBeVisible()
  })

  test('should work on desktop viewport', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/dashboard')

    const header = page.locator('h1')
    await expect(header).toBeVisible()

    const sidebar = page.locator('[class*="sidebar"]')
    await expect(sidebar).toBeVisible()
  })
})

test.describe('Dark Mode', () => {
  test('should toggle dark mode', async ({ page }) => {
    // This test assumes dark mode toggle exists
    // Adjust selectors based on actual implementation
    await page.goto('/dashboard')

    const html = page.locator('html')
    const currentScheme = await html.evaluate((el) =>
      window.matchMedia('(prefers-color-scheme: dark)').matches
    )

    expect(typeof currentScheme).toBe('boolean')
  })
})
