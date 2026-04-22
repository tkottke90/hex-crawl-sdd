import { test, expect, type Page } from '@playwright/test';

async function navigateToWorldMap(page: Page): Promise<void> {
  await page.goto('/');
  await expect(page.locator('canvas')).toBeVisible({ timeout: 10_000 });
  await expect(page.locator('#main-menu')).toBeVisible({ timeout: 10_000 });

  await page.click('#btn-new-game');
  await expect(page.locator('#mode-select')).toBeVisible({ timeout: 5_000 });

  await page.click('#btn-casual');
  await expect(page.locator('#class-select')).toBeVisible({ timeout: 5_000 });

  await page.locator('.class-card').first().click();
  await expect(page.locator('#btn-save-game')).toBeVisible({ timeout: 15_000 });
}

async function storeModifiedSave(page: Page): Promise<void> {
  await page.evaluate(async () => {
    const game = (window as unknown as { __hexGame: Phaser.Game }).__hexGame;
    const currentSave = game.registry.get('saveState') as Record<string, unknown>;
    if (!currentSave) throw new Error('Expected saveState to exist before round-trip test');

    const saveRecord = {
      ...currentSave,
      saveId: 'roundtrip-test',
      timestamp: new Date(Date.now() + 60_000).toISOString(),
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
      tx.onerror = () => reject(tx.error ?? new Error('Failed to write save record'));
      tx.onabort = () => reject(tx.error ?? new Error('Save transaction aborted'));
    });
    db.close();
  });
}

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

  test('save/load round-trip preserves remaining budget and death markers', async ({ page }) => {
    await navigateToWorldMap(page);
    await storeModifiedSave(page);

    await page.reload();
    await expect(page.locator('#main-menu')).toBeVisible({ timeout: 10_000 });
    await expect(page.locator('#btn-load-game')).toBeEnabled({ timeout: 10_000 });
    await page.click('#btn-load-game');
    await expect(page.locator('#btn-save-game')).toBeVisible({ timeout: 15_000 });

    const snapshot = await page.evaluate(() => {
      const game = (window as unknown as { __hexGame: Phaser.Game }).__hexGame;
      const scene = game.scene.getScene('WorldMap') as unknown as {
        _getWorldMapSnapshot: () => { remainingTurnBudget: number; deathMarkerCount: number; partySize: number; activePartySize: number };
      };
      return scene._getWorldMapSnapshot();
    });

    expect(snapshot.remainingTurnBudget).toBe(1);
    expect(snapshot.deathMarkerCount).toBe(1);
    expect(snapshot.partySize).toBeGreaterThanOrEqual(1);
    expect(snapshot.activePartySize).toBeGreaterThanOrEqual(1);
  });
});
