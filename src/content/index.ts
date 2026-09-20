import type { WordPack, WordEntry } from '../game/types';

import { bollywoodPack } from './bollywood';
import { foodPack } from './food';
import { cricketPack } from './cricket';
import { placesPack } from './places';
import { desiPack } from './desi';
import { festivalsPack } from './festivals';
import { screenPack } from './screen';
import { asiaPack } from './asia';
import { musicPack } from './music';
import { mythologyPack } from './mythology';

export const PACKS: WordPack[] = [
  bollywoodPack,
  foodPack,
  cricketPack,
  placesPack,
  desiPack,
  festivalsPack,
  screenPack,
  asiaPack,
  musicPack,
  mythologyPack,
];

export const ALL_PACK_IDS: string[] = PACKS.map((p) => p.id);

export function getAllEntries(packIds: string[]): WordEntry[] {
  if (packIds.includes('__mixed__')) {
    return PACKS.flatMap((p) => p.entries);
  }
  return PACKS.filter((p) => packIds.includes(p.id)).flatMap((p) => p.entries);
}

export function getPackById(id: string): WordPack | undefined {
  return PACKS.find((p) => p.id === id);
}
