import type { WorldMap } from '../../models/world-map';
import type { HexTile, HexCoord } from '../../models/hex';

type EventName = 'tile:explored' | 'occupant:moved' | 'move:rejected';
type EventHandler = (data: unknown) => void;

function key(c: HexCoord): string {
  return `${c.q},${c.r},${c.s}`;
}

export class HexGridStore {
  private map: WorldMap;
  private listeners: Map<EventName, EventHandler[]> = new Map();

  constructor(map: WorldMap) {
    this.map = { ...map, tiles: { ...map.tiles } };
  }

  getTile(coord: HexCoord): HexTile | undefined {
    return this.map.tiles[key(coord)];
  }

  queryTiles(predicate: (tile: HexTile) => boolean): HexTile[] {
    return Object.values(this.map.tiles).filter(predicate);
  }

  moveOccupant(characterId: string, from: HexCoord, to: HexCoord): boolean {
    const fromTile = this.map.tiles[key(from)];
    const toTile = this.map.tiles[key(to)];
    if (!fromTile || !toTile || !toTile.passable) return false;

    if (toTile.occupants.length >= 8) {
      this.emit('move:rejected', { characterId, from, to, reason: 'tile-full' });
      return false;
    }

    fromTile.occupants = fromTile.occupants.filter((id) => id !== characterId);
    toTile.occupants = [...toTile.occupants, characterId];
    this.emit('occupant:moved', { characterId, from, to });
    return true;
  }

  exploreTile(coord: HexCoord): void {
    const tile = this.map.tiles[key(coord)];
    if (tile && !tile.explored) {
      tile.explored = true;
      tile.fogOfWar = false;
      this.emit('tile:explored', { coord });
    }
  }

  getMap(): Readonly<WorldMap> {
    return this.map;
  }

  on(event: EventName, handler: EventHandler): void {
    if (!this.listeners.has(event)) this.listeners.set(event, []);
    this.listeners.get(event)!.push(handler);
  }

  off(event: EventName, handler: EventHandler): void {
    const handlers = this.listeners.get(event);
    if (handlers) {
      this.listeners.set(event, handlers.filter((h) => h !== handler));
    }
  }

  private emit(event: EventName, data: unknown): void {
    this.listeners.get(event)?.forEach((h) => h(data));
  }
}
