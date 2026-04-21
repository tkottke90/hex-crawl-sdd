/**
 * T093 — SC-002: Dice roll UI visible within 500 ms of attack confirmation.
 *
 * Measures time from clicking #btn-attack to #dice-overlay being present in the DOM.
 * Requires the game to be in the Player Phase of a combat encounter.
 */
import { test, expect, type Page } from '@playwright/test';

const SC002_LIMIT_MS = 500;

async function reachCombatActionBar(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.locator('#main-menu')).toBeVisible({ timeout: 15_000 });

  await page.click('#btn-new-game');
  await expect(page.locator('#mode-select')).toBeVisible({ timeout: 5_000 });

  await page.click('#btn-casual');
  await page.locator('.class-card').first().click();
  await expect(page.locator('#btn-save-game')).toBeVisible({ timeout: 15_000 });

  await page.evaluate(() => {
    const g = (window as any).__hexGame;
    g.registry.set('gameModeObj', { type: 'casual', allowManualSave: true, autoSaveOnCheckpoint: false });
    g.registry.set('worldMap', null);
    g.scene.start('Combat', {
      playerUnits: [{
        id: 'sc002-pc', name: 'Hero', role: 'pc', classId: 'squire',
        level: 1, xp: 0, xpToNextLevel: 100, hp: 12, maxHp: 12,
        attributes: { str: 10, dex: 10, con: 10, int: 8, wis: 8, cha: 8 },
        portrait: 'char-pc', recruitmentSource: 'starting', status: 'active',
        statusEffects: [], deathRecord: null, actedThisPhase: false,
      }],
      enemyUnits: [{
        id: 'sc002-enemy', name: 'Goblin', classId: 'squire', tier: 1, level: 1,
        hp: 8, maxHp: 8,
        attributes: { str: 8, dex: 10, con: 8, int: 5, wis: 5, cha: 4 },
        portrait: 'char-pc', statusEffects: [], moveRange: 3, status: 'active',
      }],
      mode: { type: 'casual', allowManualSave: true, autoSaveOnCheckpoint: false },
      encounterId: 'sc002-test',
    });
  });

  await expect(page.locator('#combat-action-bar')).toBeVisible({ timeout: 10_000 });
}

test('SC-002 — dice roll UI visible within 500 ms of attack click', async ({ page }) => {
  await reachCombatActionBar(page);

  // Dismiss any existing dice overlay (shouldn't be one, but be safe)
  const existingOverlay = page.locator('#dice-overlay');
  if (await existingOverlay.isVisible()) {
    await existingOverlay.click();
    await expect(existingOverlay).not.toBeVisible({ timeout: 2_000 });
  }

  // Attack button should be available during Player Phase
  await expect(page.locator('#btn-attack')).toBeVisible();

  // Measure: click Attack → dice overlay appears
  const t0 = Date.now();
  await page.click('#btn-attack');
  await expect(page.locator('#dice-overlay')).toBeVisible({ timeout: SC002_LIMIT_MS + 200 });
  const elapsed = Date.now() - t0;

  console.log(`SC-002 elapsed: ${elapsed}ms  (limit: ${SC002_LIMIT_MS}ms)`);

  expect(
    elapsed,
    `SC-002 failed: dice overlay appeared after ${elapsed}ms, exceeds 500ms budget`,
  ).toBeLessThan(SC002_LIMIT_MS);
});
