import { test, expect } from '@playwright/test';

test.describe('New Game flow', () => {
  test('loads the game page and shows a canvas', async ({ page }) => {
    await page.goto('/');
    // Phaser renders into a canvas; wait up to 10s for it to appear
    await expect(page.locator('canvas')).toBeVisible({ timeout: 10000 });
  });

  test('game container is present', async ({ page }) => {
    await page.goto('/');
    const container = page.locator('#game-container');
    await expect(container).toBeVisible({ timeout: 5000 });
  });
});
