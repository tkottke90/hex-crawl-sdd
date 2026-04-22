/**
 * T093a — Frame-time guard (provisional SC-005 coverage).
 *
 * Records requestAnimationFrame deltas for 120 frames across two phases:
 *   Phase A: WorldMap initial render (map generation + tile drawing)
 *   Phase B: Combat scene initial render
 *
 * Asserts: no individual frame delta exceeds 33 ms (≥ 30 fps floor).
 *
 * On failure the test attaches a JSON artifact with the full frame-time
 * distribution to help diagnose which frame caused the regression.
 *
 * NOTE: Only runs on Chromium (CDP available + most consistent rAF timing).
 */
import { test, expect, type Page, type TestInfo } from '@playwright/test';

const FRAME_LIMIT_MS = 33;
const SAMPLE_FRAMES = 120;

/**
 * Collect `count` rAF frame deltas, optionally discarding `warmup` frames first.
 * The warm-up skips initial JIT-compilation and asset-loading spikes that would
 * produce false positives on the very first render pass.
 */
async function collectFrameDeltas(
  page: Page,
  count: number,
  warmup = 0,
): Promise<number[]> {
  return page.evaluate(([n, w]: [number, number]) => {
    return new Promise<number[]>((resolve) => {
      const deltas: number[] = [];
      let lastTime: number | null = null;
      let warmupLeft = w;

      function tick(now: number) {
        if (warmupLeft > 0) {
          warmupLeft--;
          lastTime = now;
          requestAnimationFrame(tick);
          return;
        }
        if (lastTime !== null) {
          deltas.push(now - lastTime);
        }
        lastTime = now;
        if (deltas.length < n) {
          requestAnimationFrame(tick);
        } else {
          resolve(deltas);
        }
      }
      requestAnimationFrame(tick);
    });
  }, [count, warmup] as [number, number]);
}

function frameStats(deltas: number[]) {
  const max = Math.max(...deltas);
  const avg = deltas.reduce((s, d) => s + d, 0) / deltas.length;
  const p95 = [...deltas].sort((a, b) => a - b)[Math.floor(deltas.length * 0.95)];
  const violations = deltas.filter((d) => d > FRAME_LIMIT_MS);
  return { max, avg, p95, violationCount: violations.length, violations };
}

function saveArtifact(testInfo: TestInfo, name: string, data: unknown): void {
  testInfo.attach(name, {
    contentType: 'application/json',
    body: new TextEncoder().encode(JSON.stringify(data, null, 2)),
  });
}

test.describe('T093a — Frame-time guard (≥ 30 fps)', () => {
  test.skip(({ browserName }) => browserName !== 'chromium', 'CDP timing only on Chromium');

  test('WorldMap initial render — no frame > 33 ms', async ({ page }, testInfo) => {
    await page.goto('/');
    await expect(page.locator('#main-menu')).toBeVisible({ timeout: 15_000 });

    await page.click('#btn-new-game');
    await page.click('#btn-casual');
    await page.locator('.class-card').first().click();
    await expect(page.locator('#btn-save-game')).toBeVisible({ timeout: 15_000 });

    const initialSnapshot = await page.evaluate(() => {
      const g = (window as unknown as { __hexGame: Phaser.Game }).__hexGame;
      const scene = g.scene.getScene('WorldMap') as unknown as {
        _getWorldMapSnapshot: () => { tileDisplaySize: number; tileCount: number; sampleTileFrame: number };
      };
      return scene._getWorldMapSnapshot();
    });

    expect(initialSnapshot.tileDisplaySize).toBe(72);
    expect(initialSnapshot.tileCount).toBeGreaterThan(0);

    // Skip 30 warm-up frames to let the JIT and initial asset loads settle before measuring
    const deltas = await collectFrameDeltas(page, SAMPLE_FRAMES, 30);
    const stats = frameStats(deltas);

    console.log(
      `WorldMap frame stats  |  avg: ${stats.avg.toFixed(1)}ms  max: ${stats.max.toFixed(1)}ms  p95: ${stats.p95.toFixed(1)}ms  violations: ${stats.violationCount}`,
    );

    if (stats.violationCount > 0) {
      saveArtifact(testInfo, 'worldmap-frame-deltas', { stats, deltas });
    }

    expect(
      stats.violationCount,
      `${stats.violationCount} frames exceeded ${FRAME_LIMIT_MS}ms on WorldMap render — see attached worldmap-frame-deltas.json`,
    ).toBe(0);
  });

  test('Combat scene render — no frame > 33 ms', async ({ page }, testInfo) => {
    await page.goto('/');
    await expect(page.locator('#main-menu')).toBeVisible({ timeout: 15_000 });

    await page.click('#btn-new-game');
    await page.click('#btn-casual');
    await page.locator('.class-card').first().click();
    await expect(page.locator('#btn-save-game')).toBeVisible({ timeout: 15_000 });

    // Launch combat directly
    await page.evaluate(() => {
      const g = (window as any).__hexGame;
      g.registry.set('gameModeObj', { type: 'casual', allowManualSave: true, autoSaveOnCheckpoint: false });
      g.registry.set('worldMap', null);
      g.scene.start('Combat', {
        playerUnits: [{
          id: 'ft-pc', name: 'Hero', role: 'pc', classId: 'squire',
          level: 1, xp: 0, xpToNextLevel: 100, hp: 12, maxHp: 12,
          attributes: { str: 10, dex: 10, con: 10, int: 8, wis: 8, cha: 8 },
          portrait: 'char-pc', recruitmentSource: 'starting', status: 'active',
          statusEffects: [], deathRecord: null, actedThisPhase: false,
        }],
        enemyUnits: [{
          id: 'ft-enemy', name: 'Goblin', classId: 'squire', tier: 1, level: 1,
          hp: 8, maxHp: 8,
          attributes: { str: 8, dex: 10, con: 8, int: 5, wis: 5, cha: 4 },
          portrait: 'char-pc', statusEffects: [], moveRange: 3, status: 'active',
        }],
        mode: { type: 'casual', allowManualSave: true, autoSaveOnCheckpoint: false },
        encounterId: 'frametime-test',
      });
    });
    await expect(page.locator('#combat-action-bar')).toBeVisible({ timeout: 10_000 });

    // Skip 30 warm-up frames to let the scene finish initializing before measuring
    const deltas = await collectFrameDeltas(page, SAMPLE_FRAMES, 30);
    const stats = frameStats(deltas);

    console.log(
      `Combat frame stats    |  avg: ${stats.avg.toFixed(1)}ms  max: ${stats.max.toFixed(1)}ms  p95: ${stats.p95.toFixed(1)}ms  violations: ${stats.violationCount}`,
    );

    if (stats.violationCount > 0) {
      saveArtifact(testInfo, 'combat-frame-deltas', { stats, deltas });
    }

    expect(
      stats.violationCount,
      `${stats.violationCount} frames exceeded ${FRAME_LIMIT_MS}ms in Combat scene — see attached combat-frame-deltas.json`,
    ).toBe(0);
  });
});
