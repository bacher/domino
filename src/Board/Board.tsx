import { useRef, useState } from "react";
import { times } from "lodash";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import Draggable from "gsap/Draggable";

import { DominoTile } from "../DominoTile/DominoTile.tsx";
import styles from "./Board.module.css";

type TileId = string;

type GameState = {
  tiles: TileId[];
  hand: TileId[];
};

export const Board = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const leftZone = useRef<HTMLDivElement>(null);
  const rightZone = useRef<HTMLDivElement>(null);

  const [gameState] = useState<GameState>(() => ({
    tiles: times(28).map((index) => `tile:${index}`),
    hand: [],
  }));

  const draggables = useRef<Draggable[]>([]);

  function getShiftIndex(index: number) {
    const len2 = (gameState.hand.length - 1) / 2;
    return index - len2;
  }

  function getHandTilePosition(index: number): { x: number; y: number } {
    return {
      x: 50 * getShiftIndex(index),
      y: 150,
    };
  }

  function actualizeHandTilesPosition() {
    gameState.hand.forEach((tileId, index) => {
      gsap.to(tileSelector(tileId), {
        ...getHandTilePosition(index),
        duration: 0.25,
      });
    });
  }

  useGSAP(
    (context, contextSafe) => {
      for (const tileId of gameState.tiles) {
        gsap.to(tileSelector(tileId), {
          duration: 0,
          x: -160,
          y: -140,
        });
      }

      gsap.to(leftZone.current, {
        duration: 0,
        x: -100,
      });
      gsap.to(rightZone.current, {
        duration: 0,
        x: 100,
      });

      draggables.current = Draggable.create(".domino-tile", {
        type: "x,y",
        onDrag() {
          const t = this as Draggable;

          const isLeftOverlapped = t.hitTest(leftZone.current, "99%");
          leftZone.current!.classList.toggle("highlight", isLeftOverlapped);

          const isRightOverlapped = t.hitTest(rightZone.current, "99%");
          rightZone.current!.classList.toggle("highlight", isRightOverlapped);
        },
        onRelease() {
          const t = this as Draggable;
          const tileId = t.target.dataset.tileId!;
          const index = gameState.hand.indexOf(tileId);

          const isLeftHit = t.hitTest(leftZone.current);
          const isRightHit = t.hitTest(rightZone.current);

          if (isLeftHit || isRightHit) {
            const tileIndex = gameState.tiles.indexOf(tileId);
            draggables.current[tileIndex].disable();

            gameState.hand.splice(index, 1);
            actualizeHandTilesPosition();
          } else {
            gsap.to(t.target, {
              ...getHandTilePosition(index),
              duration: 0.4,
            });
          }

          leftZone.current!.classList.remove("highlight");
          rightZone.current!.classList.remove("highlight");
        },
      });

      gameState.hand = gameState.tiles.slice(0, 5);

      gameState.hand.forEach((tileId, index) => {
        gsap.to(tileSelector(tileId), {
          ...getHandTilePosition(index),
          delay: 0.1 * index,
        });
      });
    },
    { scope: containerRef },
  );

  return (
    <div ref={containerRef} className={styles.board}>
      <div ref={leftZone} className={styles.dropZone}></div>
      <div ref={rightZone} className={styles.dropZone}></div>
      {gameState.tiles.map((tileId) => (
        <DominoTile
          key={tileId}
          values={[1, 6]}
          className="domino-tile"
          tileId={tileId}
        />
      ))}
    </div>
  );
};

function tileSelector(tileId: TileId): string {
  return `.domino-tile[data-tile-id="${tileId}"]`;
}
