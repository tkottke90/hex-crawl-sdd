import { describe, it, expect } from 'vitest';
import { DeathMarkerStore } from '../../../src/modules/world-map/DeathMarkerStore';

describe('DeathMarkerStore', () => {
  it('adds markers and returns defensive copies', () => {
    const store = new DeathMarkerStore();
    store.addMarker({ q: 1, r: -1, s: 0 }, 'Ward');

    const markers = store.getMarkers();
    expect(markers).toHaveLength(1);
    expect(markers[0]).toEqual({ coord: { q: 1, r: -1, s: 0 }, name: 'Ward' });

    markers[0].name = 'Changed';
    expect(store.getMarkers()[0].name).toBe('Ward');
  });

  it('serialises and reloads markers', () => {
    const store = new DeathMarkerStore();
    store.addMarker({ q: 2, r: -2, s: 0 }, 'Hero');

    const serialised = store.serialise();
    const next = new DeathMarkerStore();
    next.load(serialised);

    expect(next.getMarkers()).toEqual(serialised);
  });

  it('ignores duplicate markers for the same tile and name', () => {
    const store = new DeathMarkerStore();
    store.addMarker({ q: 3, r: -3, s: 0 }, 'Hero');
    store.addMarker({ q: 3, r: -3, s: 0 }, 'Hero');

    expect(store.getMarkers()).toHaveLength(1);
  });
});
