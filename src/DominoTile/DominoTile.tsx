import classNames from "classnames";

import styles from "./DominoTile.module.css";

type DominoTileProps = {
  values: [number, number];
  className?: string;
  tileId: string;
};

export const DominoTile = ({ values, className, tileId }: DominoTileProps) => {
  return (
    <div className={classNames(styles.root, className)} data-tile-id={tileId}>
      <div className={styles.end}>{values[0]}</div>
      <hr className={styles.separator} />
      <div className={styles.end}>{values[1]}</div>
    </div>
  );
};
