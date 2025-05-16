import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import Draggable from "gsap/Draggable";

import { DominoTile } from "../DominoTile/DominoTile.tsx";
import styles from "./Board.module.css";
import { generateRandomizedDeck } from "./utils.ts";
import type { DeckTile, TileId } from "./types.ts";

const OVERLAPPING_THRESHOLD = "60%";

type GameState = {
  tiles: DeckTile[];
  onBoardTiles: TileId[];
  hand: TileId[];
};

export const Board = () => {
  const containerRef = useRef<HTMLDivElement>(null);

  const initialZone = useRef<HTMLDivElement>(null);
  const leftZone = useRef<HTMLDivElement>(null);
  const rightZone = useRef<HTMLDivElement>(null);

  const [gameState] = useState<GameState>(() => ({
    tiles: generateRandomizedDeck(),
    onBoardTiles: [],
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
      y: 146,
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

  function actualizeOnBoardTilesPosition() {
    if (gameState.onBoardTiles.length === 1) {
      gameState.onBoardTiles.forEach((tileId) => {
        gsap.to(tileSelector(tileId), {
          x: 0,
          y: 0,
          rotate: 90,
          duration: 0.15,
        });
      });
    } else if (gameState.onBoardTiles.length === 2) {
      gameState.onBoardTiles.forEach((tileId, index) => {
        gsap.to(tileSelector(tileId), {
          x: 94 * (index - 0.5),
          y: 0,
          rotate: 90,
          duration: 0.15,
        });
      });
    } else {
      // TODO
    }
  }

  function checkInitialHit(t: Draggable): boolean {
    return (
      gameState.onBoardTiles.length === 0 &&
      t.hitTest(initialZone.current, OVERLAPPING_THRESHOLD)
    );
  }

  function checkLeftHit(t: Draggable): boolean {
    return (
      gameState.onBoardTiles.length > 0 &&
      t.hitTest(leftZone.current, OVERLAPPING_THRESHOLD)
    );
  }

  function checkRightHit(t: Draggable): boolean {
    return (
      gameState.onBoardTiles.length > 0 &&
      t.hitTest(rightZone.current, OVERLAPPING_THRESHOLD)
    );
  }

  useGSAP(
    // @ts-expect-error: arguments can be used in the future.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (context, contextSafe) => {
      leftZone.current!.classList.add("hide");
      rightZone.current!.classList.add("hide");

      for (const { tileId, rotated } of gameState.tiles) {
        gsap.to(tileSelector(tileId), {
          duration: 0,
          x: -160,
          y: -140,
          rotate: rotated ? 180 : 0,
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

          const isInitialHit = checkInitialHit(t);
          const isLeftHit = checkLeftHit(t);
          const isRightHit = checkRightHit(t);

          initialZone.current!.classList.toggle("highlight", isInitialHit);
          leftZone.current!.classList.toggle("highlight", isLeftHit);
          rightZone.current!.classList.toggle("highlight", isRightHit);
        },
        onRelease() {
          const t = this as Draggable;
          const tileId = t.target.dataset.tileId!;
          const index = gameState.hand.indexOf(tileId);
          const isInHand = index !== -1;

          const isInitialHit = checkInitialHit(t);
          const isLeftHit = checkLeftHit(t);
          const isRightHit = checkRightHit(t);

          if (isInitialHit || isLeftHit || isRightHit) {
            // Validate turn
            const tileIndex = gameState.tiles.findIndex(
              (tile) => tile.tileId === tileId,
            );
            draggables.current[tileIndex].disable();

            if (isInHand) {
              gameState.hand.splice(index, 1);
              actualizeHandTilesPosition();
            }

            if (isLeftHit) {
              gameState.onBoardTiles.unshift(tileId);
            } else {
              gameState.onBoardTiles.push(tileId);
            }
            actualizeOnBoardTilesPosition();

            if (isInitialHit) {
              initialZone.current!.classList.add("hide");
              leftZone.current!.classList.remove("hide");
              rightZone.current!.classList.remove("hide");
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

      gameState.hand = gameState.tiles
        .slice(28 - 5, 28)
        .map((tile) => tile.tileId);
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
      <div ref={initialZone} className={styles.dropZone}></div>
      <div ref={leftZone} className={styles.dropZone}></div>
      <div ref={rightZone} className={styles.dropZone}></div>
      {gameState.tiles.map(({ tileId, values }) => (
        <DominoTile key={tileId} values={values} tileId={tileId} />
      ))}
    </div>
  );
};

function tileSelector(tileId: TileId): string {
  return `.domino-tile[data-tile-id="${tileId}"]`;
}
