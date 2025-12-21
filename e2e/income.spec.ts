import { test, expect } from '@playwright/test';

test.describe('Income Entry Management', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    // Navigate to income page
    await page.click('text=Income');
  });

  test('should create a new income entry', async ({ page }) => {
    // Click "Add Income" button
    await page.click('button:has-text("Add Income")');

    // Fill out the form
    await page.fill('input[name="date"]', '2025-12-01');
    await page.selectOption('select[name="platform"]', 'amazon_flex');

    // Use TimeCalculator
    await page.fill('input[placeholder*="Start time"]', '10:00 AM');
    await page.fill('input[placeholder*="End time"]', '2:00 PM');

    // Enter amount
    await page.fill('input[name="amount"]', '100');

    // Submit form
    await page.click('button:has-text("Save")');

    // Verify entry appears in the list
    await expect(page.locator('text=Amazon Flex')).toBeVisible();
    await expect(page.locator('text=$100.00')).toBeVisible();
  });

  test('should edit an existing income entry', async ({ page }) => {
    // Assuming there's an existing entry
    await page.click('[data-testid="income-entry-1"] button:has-text("Edit")');

    // Update amount
    await page.fill('input[name="amount"]', '150');

    // Save
    await page.click('button:has-text("Save")');

    // Verify updated amount
    await expect(page.locator('text=$150.00')).toBeVisible();
  });

  test('should delete an income entry', async ({ page }) => {
    // Get initial count
    const initialCount = await page.locator('[data-testid^="income-entry-"]').count();

    // Click delete on first entry
    await page.click('[data-testid="income-entry-1"] button:has-text("Delete")');

    // Confirm deletion
    await page.click('button:has-text("Confirm")');

    // Verify count decreased
    const newCount = await page.locator('[data-testid^="income-entry-"]').count();
    expect(newCount).toBe(initialCount - 1);
  });

  test('should calculate duration correctly', async ({ page }) => {
    await page.click('button:has-text("Add Income")');

    // Fill start and end times
    const startInput = page.locator('input[placeholder*="Start time"]');
    const endInput = page.locator('input[placeholder*="End time"]');
    const durationInput = page.locator('input[placeholder*="Duration"]');

    await startInput.fill('10:00 AM');
    await startInput.blur();

    await endInput.fill('2:00 PM');
    await endInput.blur();

    // Duration should be calculated (4 hours = 240 minutes)
    await expect(durationInput).toHaveValue(/240|4.*hours/);
  });

  test('should handle time input without jumping (BUG FIX E2E TEST)', async ({ page }) => {
    await page.click('button:has-text("Add Income")');

    const startInput = page.locator('input[placeholder*="Start time"]');

    // Focus the input
    await startInput.click();

    // Type slowly to simulate user typing
    await page.keyboard.type('1', { delay: 100 });
    await page.keyboard.type('2', { delay: 100 });
    await page.keyboard.type(':', { delay: 100 });
    await page.keyboard.type('3', { delay: 100 });

    // At this point, input should still contain "12:3", not "12:03 AM"
    const value = await startInput.inputValue();
    expect(value).toContain('12:3');

    // Complete typing
    await page.keyboard.type('0', { delay: 100 });
    await page.keyboard.type(' ', { delay: 100 });
    await page.keyboard.type('P', { delay: 100 });
    await page.keyboard.type('M', { delay: 100 });

    // Should now contain full value
    expect(await startInput.inputValue()).toContain('12:30');
  });

  test('should show error for invalid data', async ({ page }) => {
    await page.click('button:has-text("Add Income")');

    // Try to submit without required fields
    await page.click('button:has-text("Save")');

    // Should show validation errors
    await expect(page.locator('text=/required|invalid/i')).toBeVisible();
  });

  test('should filter income by date', async ({ page }) => {
    // Select a specific date filter
    await page.fill('input[type="date"]', '2025-12-01');

    // Should only show entries for that date
    const entries = page.locator('[data-testid^="income-entry-"]');
    const count = await entries.count();

    for (let i = 0; i < count; i++) {
      const entry = entries.nth(i);
      await expect(entry).toContainText('2025-12-01');
    }
  });

  test('should handle network errors gracefully', async ({ page }) => {
    // Simulate offline mode
    await page.context().setOffline(true);

    await page.click('button:has-text("Add Income")');
    await page.fill('input[name="date"]', '2025-12-01');
    await page.fill('input[name="amount"]', '100');
    await page.click('button:has-text("Save")');

    // Should show error message
    await expect(page.locator('text=/error|failed|network/i')).toBeVisible();

    // Restore connection
    await page.context().setOffline(false);
  });
});
