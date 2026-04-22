import type { DeathMarker } from '../../models/world-map';
import type { HexCoord } from '../../models/hex';

function key(coord: HexCoord): string {
  return `${coord.q},${coord.r},${coord.s}`;
}

export class DeathMarkerStore {
  private markers: DeathMarker[] = [];

  constructor(initialMarkers: DeathMarker[] = []) {
    this.load(initialMarkers);
  }

  addMarker(coord: HexCoord, name: string): void {
    const markerKey = key(coord);
    if (this.markers.some((marker) => key(marker.coord) === markerKey && marker.name === name)) {
      return;
    }
    this.markers.push({ coord: { ...coord }, name });
  }

  getMarkers(): DeathMarker[] {
    return this.markers.map((marker) => ({ coord: { ...marker.coord }, name: marker.name }));
  }

  serialise(): DeathMarker[] {
    return this.getMarkers();
  }

  load(serialised: DeathMarker[] | undefined | null): void {
    this.markers = Array.isArray(serialised)
      ? serialised.map((marker) => ({ coord: { ...marker.coord }, name: marker.name }))
      : [];
  }
}