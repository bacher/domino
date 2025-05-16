import classNames from "classnames";

import styles from "./DominoTile.module.css";
import type { TileEndValue } from "../Board/types.ts";

type Skin = Record<TileEndValue, string>;

const animalsSkin: Skin = {
  1: "skins/animals/cat.png",
  2: "skins/animals/chick.png",
  3: "skins/animals/dog.png",
  4: "skins/animals/frog.png",
  5: "skins/animals/hare.png",
  6: "skins/animals/pig.png",
  7: "skins/animals/swan.png",
};

type DominoTileProps = {
  values: [TileEndValue, TileEndValue];
  className?: string;
  tileId: string;
};

export const DominoTile = ({ values, className, tileId }: DominoTileProps) => {
  return (
    <div
      className={classNames(styles.root, "domino-tile", "cover", className)}
      data-tile-id={tileId}
    >
      <img
        alt=""
        className={styles.end}
        src={`${import.meta.env.BASE_URL}${animalsSkin[values[0]]}`}
        draggable={false}
      />
      <hr className={styles.separator} />
      <img
        alt=""
        className={classNames(styles.end, styles.end_second)}
        src={`${import.meta.env.BASE_URL}${animalsSkin[values[1]]}`}
        draggable={false}
      />
    </div>
  );
};
