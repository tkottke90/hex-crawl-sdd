import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { SeedInfoCard } from '../../../src/game/ui/SeedInfoCard';

describe('SeedInfoCard', () => {
  let card: SeedInfoCard | null = null;

  afterEach(() => {
    card?.destroy();
    card = null;
    // Clean up any stray elements left by failed tests
    document.querySelectorAll('#seed-info-card').forEach((el) => el.remove());
  });

  it('appends a #seed-info-card element to document.body', () => {
    card = new SeedInfoCard('casual', 'lrno8owk3x7mq2p');
    const el = document.querySelector('#seed-info-card');
    expect(el).not.toBeNull();
  });

  it('displays the seed value in the card', () => {
    card = new SeedInfoCard('casual', 'lrno8owk3x7mq2p');
    const el = document.querySelector('#seed-info-card');
    expect(el?.textContent).toContain('lrno8owk3x7mq2p');
  });

  it('includes a mode indicator element', () => {
    card = new SeedInfoCard('casual', 'lrno8owk3x7mq2p');
    const el = document.querySelector('#seed-info-card');
    // Mode pill should exist and contain mode text
    const modeEl = el?.querySelector('[data-mode]');
    expect(modeEl).not.toBeNull();
  });

  it('shows CASUAL label for casual mode', () => {
    card = new SeedInfoCard('casual', 'test-seed');
    const el = document.querySelector('#seed-info-card');
    expect(el?.textContent?.toUpperCase()).toContain('CASUAL');
  });

  it('shows ROGUELIKE label for roguelike mode', () => {
    card = new SeedInfoCard('roguelike', 'test-seed');
    const el = document.querySelector('#seed-info-card');
    expect(el?.textContent?.toUpperCase()).toContain('ROGUELIKE');
  });

  it('destroy() removes the element from document.body', () => {
    card = new SeedInfoCard('casual', 'lrno8owk3x7mq2p');
    expect(document.querySelector('#seed-info-card')).not.toBeNull();
    card.destroy();
    card = null;
    expect(document.querySelector('#seed-info-card')).toBeNull();
  });
});
