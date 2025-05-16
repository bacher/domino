import { shuffle } from "lodash";

import type { DeckTile, TileEndValue } from "./types.ts";

export function generateRandomizedDeck(): DeckTile[] {
  const deck: DeckTile[] = [];

  for (let i = 1; i <= 7; i += 1) {
    for (let j = i; j <= 7; j += 1) {
      deck.push({
        tileId: `tile:${i * 7 + j}`,
        values: [i as TileEndValue, j as TileEndValue],
        rotated: Math.random() < 0.5,
        compensate: false,
      });
    }
  }

  return shuffle(deck);
}
