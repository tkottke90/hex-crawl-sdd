import type { HexCoord } from './hex';

export type RecruitmentEventStatus =
  | 'pending'
  | 'accepted'
  | 'declined'
  | 'failed-npc-died'
  | 'failed-party-full';

export interface RecruitmentEvent {
  id: string;
  triggerCoord: HexCoord;
  npcCharacterId: string;
  encounterRef: string;
  status: RecruitmentEventStatus;
}
