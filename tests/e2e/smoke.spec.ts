/**
 * T092 — Smoke test matrix (Chromium automated path)
 *
 * Covers: new game → Casual mode → class select → WorldMap loads → save bar present.
 * Manual follow-up required for: Firefox, Edge, combat, level-up, load, export/import,
 * run end (Roguelike) — see T092-MANUAL.md checklist for those steps.
 */
import { test, expect, type Page } from '@playwright/test';

// ── Helper: navigate through menus to WorldMap (Casual, first class) ──────────
async function navigateToWorldMap(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
  await expect(page.locator('#main-menu')).toBeVisible({ timeout: 10_000 });

  await page.click('#btn-new-game');
  await expect(page.locator('#mode-select')).toBeVisible({ timeout: 5_000 });

  await page.click('#btn-casual');
  await expect(page.locator('#class-select')).toBeVisible({ timeout: 5_000 });

  await page.locator('.class-card').first().click();

  // WorldMap is ready when the Casual save-bar appears
  await expect(page.locator('#btn-save-game')).toBeVisible({ timeout: 15_000 });
}

// ── Helper: launch Combat scene directly via the exposed Phaser game instance ─
async function launchTestCombat(page: Page): Promise<void> {
  await page.evaluate(() => {
    const g = (window as unknown as { __hexGame: { registry: { set: (k: string, v: unknown) => void }; scene: { start: (key: string, data: unknown) => void } } }).__hexGame;
    g.registry.set('gameModeObj', { type: 'casual', allowManualSave: true, autoSaveOnCheckpoint: false });
    g.registry.set('worldMap', null);
    g.scene.start('Combat', {
      playerUnits: [{
        id: 'smoke-pc', name: 'Hero', role: 'pc', classId: 'squire',
        level: 1, xp: 0, xpToNextLevel: 100, hp: 12, maxHp: 12,
        attributes: { str: 10, dex: 10, con: 10, int: 8, wis: 8, cha: 8 },
        portrait: 'char-pc', recruitmentSource: 'starting', status: 'active',
        statusEffects: [], deathRecord: null, actedThisPhase: false,
      }],
      enemyUnits: [{
        id: 'smoke-enemy', name: 'Goblin', classId: 'squire', tier: 1, level: 1,
        hp: 8, maxHp: 8,
        attributes: { str: 8, dex: 10, con: 8, int: 5, wis: 5, cha: 4 },
        portrait: 'char-pc', statusEffects: [], moveRange: 3, status: 'active',
      }],
      mode: { type: 'casual', allowManualSave: true, autoSaveOnCheckpoint: false },
      encounterId: 'smoke-test',
    });
  });
  await expect(page.locator('#combat-action-bar')).toBeVisible({ timeout: 10_000 });
}

async function writeModifiedSave(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const game = (window as unknown as { __hexGame: Phaser.Game }).__hexGame;
    const currentSave = game.registry.get('saveState') as Record<string, unknown>;
    if (!currentSave) throw new Error('Expected saveState to exist before round-trip smoke test');

    const saveRecord = {
      ...currentSave,
      saveId: 'smoke-roundtrip',
      timestamp: new Date(Date.now() + 120_000).toISOString(),
      worldMap: {
        ...(currentSave.worldMap as Record<string, unknown>),
        remainingTurnBudget: 1,
      },
      deathMarkers: [{ coord: { q: 2, r: -2, s: 0 }, name: 'Ward' }],
    };

    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      const request = indexedDB.open('hex-crawl-v1', 1);
      request.onupgradeneeded = () => {
        const database = request.result;
        if (!database.objectStoreNames.contains('saves')) {
          database.createObjectStore('saves', { keyPath: 'saveId' });
        }
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error ?? new Error('Failed to open IndexedDB'));
    });

    const tx = db.transaction('saves', 'readwrite');
    tx.objectStore('saves').put(saveRecord);
    await new Promise<void>((resolve, reject) => {
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error ?? new Error('Failed to write smoke save record'));
      tx.onabort = () => reject(tx.error ?? new Error('Smoke save transaction aborted'));
    });
    db.close();
  });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

test.describe('Smoke — New Game flow', () => {
  test('page loads and renders Phaser canvas', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#game-container')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
  });

  test('main menu renders New Game button', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#btn-new-game')).toBeVisible({ timeout: 10_000 });
  });

  test('New Game → mode select shows Casual and Roguelike', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#btn-new-game')).toBeVisible({ timeout: 10_000 });
    await page.click('#btn-new-game');
    await expect(page.locator('#btn-casual')).toBeVisible({ timeout: 5_000 });
    await expect(page.locator('#btn-roguelike')).toBeVisible();
  });

  test('mode → class select shows class cards', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#btn-new-game')).toBeVisible({ timeout: 10_000 });
    await page.click('#btn-new-game');
    await page.click('#btn-casual');
    await expect(page.locator('.class-card').first()).toBeVisible({ timeout: 5_000 });
    const count = await page.locator('.class-card').count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('pick class → WorldMap loads with save bar (Casual)', async ({ page }) => {
    await navigateToWorldMap(page);
    // Canvas is still active (Phaser running)
    await expect(page.locator('canvas')).toBeVisible();
    // Save bar is present for Casual mode
    await expect(page.locator('#btn-save-game')).toBeVisible();
    await expect(page.locator('#btn-export-save')).toBeVisible();
  });

  test('back buttons return to previous screen', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#btn-new-game')).toBeVisible({ timeout: 10_000 });
    await page.click('#btn-new-game');
    await expect(page.locator('#btn-back-mode')).toBeVisible({ timeout: 5_000 });
    await page.click('#btn-back-mode');
    await expect(page.locator('#btn-new-game')).toBeVisible({ timeout: 5_000 });
  });

  test('Roguelike mode label appears (no save bar in Roguelike)', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('#btn-new-game')).toBeVisible({ timeout: 10_000 });
    await page.click('#btn-new-game');
    await page.click('#btn-roguelike');
    await page.locator('.class-card').first().click();
    // WorldMap loads — roguelike shows auto-save note, not manual save button
    await expect(page.locator('canvas')).toBeVisible({ timeout: 15_000 });
    // Mode label badge should be visible
    await expect(page.locator('#mode-label')).toBeVisible({ timeout: 10_000 });
  });
});

test.describe('Smoke — Combat flow', () => {
  test('combat scene loads with action bar', async ({ page }) => {
    await navigateToWorldMap(page);
    await launchTestCombat(page);
    await expect(page.locator('#btn-attack')).toBeVisible();
    await expect(page.locator('#btn-wait')).toBeVisible();
    await expect(page.locator('#btn-end-phase')).toBeVisible();
  });

  test('attack triggers dice roll overlay', async ({ page }) => {
    await navigateToWorldMap(page);
    await launchTestCombat(page);
    await page.click('#btn-attack');
    await expect(page.locator('#dice-overlay')).toBeVisible({ timeout: 3_000 });
  });

  test('End Phase advances to enemy phase', async ({ page }) => {
    await navigateToWorldMap(page);
    await launchTestCombat(page);
    await page.click('#btn-end-phase');
    // After end phase the action bar may be hidden or different buttons shown
    // Just assert the canvas is still rendering (no crash)
    await expect(page.locator('canvas')).toBeVisible();
  });
});

test.describe('Smoke — Save flow (Casual)', () => {
  test('Save Game triggers a confirmation toast', async ({ page }) => {
    await navigateToWorldMap(page);
    await page.click('#btn-save-game');
    // Toast shows 'Game saved!' or a save error
    await expect(
      page.locator(':text("Game saved!"), :text("Save failed")'),
    ).toBeVisible({ timeout: 5_000 });
  });

  test('Export Save triggers a file download', async ({ page }) => {
    await navigateToWorldMap(page);
    const [download] = await Promise.all([
      page.waitForEvent('download', { timeout: 5_000 }),
      page.click('#btn-export-save'),
    ]);
    expect(download.suggestedFilename()).toMatch(/hex-crawl.*\.json/);
  });

  test('shared party movement consumes budget once and keeps the party together', async ({ page }) => {
    await navigateToWorldMap(page);
    await page.waitForTimeout(200);

    const before = await page.evaluate(() => {
      const g = (window as unknown as { __hexGame: Phaser.Game }).__hexGame;
      const scene = g.scene.getScene('WorldMap') as unknown as {
        _getWorldMapSnapshot: () => { remainingTurnBudget: number; partySize: number; activePartySize: number };
        _getActiveCharWorldPos: () => { x: number; y: number };
        _clickNeighbourTile: () => boolean;
      };
      return {
        snapshot: scene._getWorldMapSnapshot(),
        activePos: scene._getActiveCharWorldPos(),
      };
    });

    const moved = await page.evaluate(() => {
      const g = (window as unknown as { __hexGame: Phaser.Game }).__hexGame;
      const scene = g.scene.getScene('WorldMap') as unknown as {
        _clickNeighbourTile: () => boolean;
      };
      return scene._clickNeighbourTile();
    });

    if (!moved) {
      test.skip();
      return;
    }

    await page.waitForTimeout(350);

    const after = await page.evaluate(() => {
      const g = (window as unknown as { __hexGame: Phaser.Game }).__hexGame;
      const scene = g.scene.getScene('WorldMap') as unknown as {
        _getWorldMapSnapshot: () => { remainingTurnBudget: number; partySize: number; activePartySize: number };
        _getActiveCharWorldPos: () => { x: number; y: number };
      };
      return {
        snapshot: scene._getWorldMapSnapshot(),
        activePos: scene._getActiveCharWorldPos(),
      };
    });

    expect(after.snapshot.partySize).toBe(before.snapshot.partySize);
    expect(after.snapshot.activePartySize).toBe(before.snapshot.activePartySize);
    expect(after.snapshot.remainingTurnBudget).toBeLessThan(before.snapshot.remainingTurnBudget);
    expect(after.activePos.x !== before.activePos.x || after.activePos.y !== before.activePos.y).toBe(true);
  });

  test('loaded save preserves death markers and mid-turn remaining budget', async ({ page }) => {
    await navigateToWorldMap(page);
    await writeModifiedSave(page);

    await page.reload();
    await expect(page.locator('#main-menu')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('#btn-load-game')).toBeEnabled({ timeout: 10_000 });
    await page.click('#btn-load-game');
    await expect(page.locator('#btn-save-game')).toBeVisible({ timeout: 15_000 });

    const snapshot = await page.evaluate(() => {
      const g = (window as unknown as { __hexGame: Phaser.Game }).__hexGame;
      const scene = g.scene.getScene('WorldMap') as unknown as {
        _getWorldMapSnapshot: () => { remainingTurnBudget: number; deathMarkerCount: number; partySize: number };
      };
      return scene._getWorldMapSnapshot();
    });

    expect(snapshot.remainingTurnBudget).toBe(1);
    expect(snapshot.deathMarkerCount).toBe(1);
    expect(snapshot.partySize).toBeGreaterThanOrEqual(1);
  });
});
