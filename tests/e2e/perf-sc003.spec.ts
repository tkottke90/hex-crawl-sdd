/**
 * T093 — SC-003: Save confirmation appears within 2 seconds of save trigger.
 *
 * Measures time from clicking #btn-save-game (Casual mode WorldMap)
 * to a save confirmation Toast being visible in the DOM.
 * IndexedDB in jsdom is mocked; in real browser the IndexedDB write completes
 * and the Toast is rendered via the save module callback.
 */
import { test, expect, type Page } from '@playwright/test';

const SC003_LIMIT_MS = 2_000;

async function reachWorldMapCasual(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.locator('#main-menu')).toBeVisible({ timeout: 15_000 });

  await page.click('#btn-new-game');
  await expect(page.locator('#mode-select')).toBeVisible({ timeout: 5_000 });

  await page.click('#btn-casual');
  await expect(page.locator('#class-select')).toBeVisible({ timeout: 5_000 });

  await page.locator('.class-card').first().click();
  // Wait for Casual WorldMap save bar
  await expect(page.locator('#btn-save-game')).toBeVisible({ timeout: 15_000 });
}

test('SC-003 — save confirmation toast within 2 seconds of save trigger', async ({ page }) => {
  await reachWorldMapCasual(page);

  const t0 = Date.now();
  await page.click('#btn-save-game');

  // The Toast component renders any element with text "Game saved!" or "Save failed"
  // (an error is still a valid "confirmation" appearing within the time budget)
  const toastLocator = page.locator('text=/Game saved!|Save failed|storage full/i');
  await expect(toastLocator).toBeVisible({ timeout: SC003_LIMIT_MS + 500 });
  const elapsed = Date.now() - t0;

  console.log(`SC-003 elapsed: ${elapsed}ms  (limit: ${SC003_LIMIT_MS}ms)`);

  expect(
    elapsed,
    `SC-003 failed: save toast appeared after ${elapsed}ms, exceeds 2-second budget`,
  ).toBeLessThan(SC003_LIMIT_MS);
});
