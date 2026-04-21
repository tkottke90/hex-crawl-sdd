export interface HexCoord {
  q: number;
  r: number;
  s: number;
}

export type TerrainType = 'ocean' | 'beach' | 'grassland' | 'forest' | 'desert' | 'mountain' | 'snow';
export type PoiTag = 'empty' | 'town' | 'enemy-camp' | 'recruitment-event' | 'dungeon-entrance';

export interface HexTile {
  coord: HexCoord;
  terrain: TerrainType;
  passable: boolean;
  moveCost: number;
  poiTag: PoiTag;
  occupants: string[];
  fogOfWar: boolean;
  explored: boolean;
}
