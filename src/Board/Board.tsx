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

  function getShiftOffset(index: number) {
    const len2 = (gameState.hand.length - 1) / 2;
    return 50 * (index - len2);
  }

  function getHandTilePosition(index: number): { x: number; y: number } {
    return {
      x: getShiftOffset(index),
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
    // @ts-expect-error: arguments can be used in the future.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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
        onDragStart() {
          const t = this as Draggable;
          t.target.classList.remove("cover");
        },
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
          const isInHand = index !== -1;

          const isLeftHit = t.hitTest(leftZone.current);
          const isRightHit = t.hitTest(rightZone.current);

          if (isLeftHit || isRightHit) {
            // Validate turn
            const tileIndex = gameState.tiles.indexOf(tileId);
            draggables.current[tileIndex].disable();

            if (isInHand) {
              gameState.hand.splice(index, 1);
              actualizeHandTilesPosition();
            }
          } else {
            if (!isInHand) {
              gameState.hand.push(tileId);
              actualizeHandTilesPosition();
            } else {
              gsap.to(t.target, {
                ...getHandTilePosition(index),
                duration: 0.4,
              });
            }
          }

          leftZone.current!.classList.remove("highlight");
          rightZone.current!.classList.remove("highlight");
        },
      });

      // for (const drag of draggables.current) {
      //   // drag.disable();
      // }

      gameState.hand = gameState.tiles.slice(28 - 5, 28);
      gameState.hand.reverse();

      gsap.delayedCall(0.5, () => {
        gameState.hand.forEach((tileId, index) => {
          const node = containerRef.current!.querySelector(
            tileSelector(tileId),
          )!;

          node.classList.remove("cover");

          gsap.to(node, {
            ...getHandTilePosition(index),
            delay: 0.1 * index,
          });
          draggables.current[index].enable();
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
