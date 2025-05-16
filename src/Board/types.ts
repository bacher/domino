export type TileId = string;

export type TileEndValue = 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type DeckTile = {
  tileId: TileId;
  values: [TileEndValue, TileEndValue];
  rotated: boolean;
};
