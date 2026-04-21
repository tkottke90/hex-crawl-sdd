/**
 * T093 — SC-001: Time from page load to first combat action input available < 3 minutes.
 *
 * Measures wall-clock time from `page.goto('/')` to `#combat-action-bar` being visible.
 * Navigation: page load → main-menu → mode-select → class-select → WorldMap → Combat.
 * Combat is launched programmatically via the exposed __hexGame instance to avoid
 * needing to locate an enemy camp tile on the procedurally-generated map.
 */
import { test, expect, type Page } from '@playwright/test';

const SC001_LIMIT_MS = 3 * 60 * 1000; // 3 minutes

async function navigateToWorldMapAndCombat(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.locator('#main-menu')).toBeVisible({ timeout: 15_000 });

  await page.click('#btn-new-game');
  await expect(page.locator('#mode-select')).toBeVisible({ timeout: 5_000 });

  await page.click('#btn-casual');
  await expect(page.locator('#class-select')).toBeVisible({ timeout: 5_000 });

  await page.locator('.class-card').first().click();
  await expect(page.locator('#btn-save-game')).toBeVisible({ timeout: 15_000 });

  // Launch combat directly via the Phaser game instance
  await page.evaluate(() => {
    const g = (window as any).__hexGame;
    g.registry.set('gameModeObj', { type: 'casual', allowManualSave: true, autoSaveOnCheckpoint: false });
    g.registry.set('worldMap', null);
    g.scene.start('Combat', {
      playerUnits: [{
        id: 'perf-pc', name: 'Hero', role: 'pc', classId: 'squire',
        level: 1, xp: 0, xpToNextLevel: 100, hp: 12, maxHp: 12,
        attributes: { str: 10, dex: 10, con: 10, int: 8, wis: 8, cha: 8 },
        portrait: 'char-pc', recruitmentSource: 'starting', status: 'active',
        statusEffects: [], deathRecord: null, actedThisPhase: false,
      }],
      enemyUnits: [{
        id: 'perf-enemy', name: 'Goblin', classId: 'squire', tier: 1, level: 1,
        hp: 8, maxHp: 8,
        attributes: { str: 8, dex: 10, con: 8, int: 5, wis: 5, cha: 4 },
        portrait: 'char-pc', statusEffects: [], moveRange: 3, status: 'active',
      }],
      mode: { type: 'casual', allowManualSave: true, autoSaveOnCheckpoint: false },
      encounterId: 'perf-test',
    });
  });
}

test('SC-001 — page load → first combat action input < 3 minutes', async ({ page }) => {
  const t0 = Date.now();

  await navigateToWorldMapAndCombat(page);
  await expect(page.locator('#combat-action-bar')).toBeVisible({ timeout: SC001_LIMIT_MS });

  const elapsed = Date.now() - t0;
  console.log(`SC-001 elapsed: ${(elapsed / 1000).toFixed(2)}s  (limit: 180s)`);

  expect(
    elapsed,
    `SC-001 failed: ${(elapsed / 1000).toFixed(1)}s exceeds 3-minute budget`,
  ).toBeLessThan(SC001_LIMIT_MS);
});
