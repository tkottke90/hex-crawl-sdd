import type { Character } from '../../models/character';

type EventCallback = (payload: Record<string, unknown>) => void;

const listeners: EventCallback[] = [];

function emit(event: string, payload: Record<string, unknown>): void {
  listeners.forEach((cb) => cb({ event, ...payload }));
}

/**
 * ItemService v1 stub.
 * useItem returns the character unchanged and emits item:not-available.
 * No item inventory exists in v1.
 */
export const ItemService = {
  useItem(character: Character, itemId: string): Character {
    emit('item:not-available', { characterId: character.id, itemId });
    return character;
  },

  onEvent(cb: EventCallback): void {
    listeners.push(cb);
  },
};
