import type { Character } from '../../models/character';
import type { DeathMarker } from '../../models/world-map';
import type { SaveState } from '../../models/save';

function markerKey(marker: DeathMarker): string {
  return `${marker.coord.q},${marker.coord.r},${marker.coord.s}:${marker.name}`;
}

function isPartyDeathMarker(character: Character): character is Character {
  return character.status === 'dead' && character.deathRecord != null && character.role !== 'pc';
}

export function createCombatDeathMarkers(party: Character[]): DeathMarker[] {
  return party
    .filter(isPartyDeathMarker)
    .map((character) => {
      const deathRecord = character.deathRecord;
      if (!deathRecord) {
        throw new Error('Expected deathRecord for dead party member');
      }
      return { coord: { ...deathRecord.coord }, name: character.name };
    });
}

export function applyCombatReturnState(saveState: SaveState, party: Character[]): SaveState {
  const deathMarkers = [...(saveState.deathMarkers ?? [])];
  const seen = new Set(deathMarkers.map(markerKey));

  for (const marker of createCombatDeathMarkers(party)) {
    const key = markerKey(marker);
    if (!seen.has(key)) {
      deathMarkers.push(marker);
      seen.add(key);
    }
  }

  const survivingParty = party.filter((character) => character.status !== 'dead' || character.role === 'pc');
  const deathHistory = [...saveState.deathHistory];

  for (const character of party) {
    if (character.status === 'dead' && character.deathRecord != null) {
      const alreadyTracked = deathHistory.some(
        (record) => record.turn === character.deathRecord!.turn &&
          record.coord.q === character.deathRecord!.coord.q &&
          record.coord.r === character.deathRecord!.coord.r &&
          record.coord.s === character.deathRecord!.coord.s,
      );
      if (!alreadyTracked) {
        deathHistory.push({ ...character.deathRecord });
      }
    }
  }

  return {
    ...saveState,
    party: survivingParty,
    deathMarkers,
    deathHistory,
  };
}
