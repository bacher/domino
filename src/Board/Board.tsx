import { useRef, useState } from "react";
import gsap from "gsap";
import { useGSAP } from "@gsap/react";
import Draggable from "gsap/Draggable";

import { DominoTile } from "../DominoTile/DominoTile.tsx";
import styles from "./Board.module.css";
import { generateRandomizedDeck } from "./utils.ts";
import type { DeckTile, TileEndValue, TileId } from "./types.ts";
import { last } from "lodash";
import classNames from "classnames";

const OVERLAPPING_THRESHOLD = "60%";

const TILE_WIDTH = 94;
const TILE_HEIGHT = 50;

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

  function getTileById(tileId: TileId): DeckTile {
    const tile = gameState.tiles.find((tile) => tile.tileId === tileId);
    if (!tile) {
      throw new Error(`Tile with id ${tileId} not found`);
    }
    return tile;
  }

  function getNormalizedValues(tile: DeckTile): [TileEndValue, TileEndValue] {
    if (tile.rotated === tile.compensate) {
      return [tile.values[1], tile.values[0]];
    }
    return tile.values;
  }

  function getHardTileInterval() {
    const handSize = gameState.hand.length;
    if (handSize < 2) {
      return TILE_HEIGHT;
    }

    const w = containerRef.current!.clientWidth;
    const wa = w - 16 * 2 - TILE_HEIGHT;
    return Math.min(TILE_HEIGHT, wa / (handSize - 1));
  }

  function getShiftOffset(index: number) {
    const len2 = (gameState.hand.length - 1) / 2;
    return getHardTileInterval() * (index - len2);
  }

  function getHandTilePosition(index: number): { x: number; y: number } {
    return {
      x: getShiftOffset(index),
      y: 170,
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
    const count = gameState.onBoardTiles.length;

    if (count === 0) {
      return;
    }

    const isEven = count % 2 === 0;
    const centerTiles = Math.min(count, isEven ? 2 : 3);
    const shoulder = (count - centerTiles) / 2;

    const centerHalf = centerTiles / 2;
    for (let i = 0; i < centerTiles; i += 1) {
      const tileId = gameState.onBoardTiles[shoulder + i];
      const { rotated, compensate } = gameState.tiles.find(
        (tile) => tile.tileId === tileId,
      )!;

      const extraRotation = (rotated ? 180 : 0) + (compensate ? -180 : 0);

      const bigGaps = !isEven && shoulder > 0;
      let extra = 0;
      if (count > 3) {
        extra =
          TILE_HEIGHT / 2 + TILE_HEIGHT * (isEven ? 0 : -1) - (bigGaps ? 1 : 0);
      }

      gsap.to(tileSelector(tileId), {
        x: (TILE_WIDTH + (bigGaps ? 3 : 0)) * (i - centerHalf + 0.5),
        y: TILE_WIDTH * -shoulder + extra,
        rotate: 90 + extraRotation,
        duration: 0.15,
      });
    }

    for (let i = 0; i < shoulder; i += 1) {
      const tileId = gameState.onBoardTiles[i];
      const { rotated, compensate } = gameState.tiles.find(
        (tile) => tile.tileId === tileId,
      )!;
      const extraRotation = (rotated ? 180 : 0) + (compensate ? -180 : 0);

      gsap.to(tileSelector(tileId), {
        x: -(TILE_HEIGHT / 2 + TILE_WIDTH),
        y: TILE_WIDTH * -i - TILE_WIDTH / 2,
        rotate: extraRotation,
        duration: 0.15,
      });
    }

    for (let i = 0; i < shoulder; i += 1) {
      const tileIndex = shoulder + centerTiles + (shoulder - 1 - i);
      const tileId = gameState.onBoardTiles[tileIndex];
      const { rotated, compensate } = gameState.tiles.find(
        (tile) => tile.tileId === tileId,
      )!;
      const extraRotation = (rotated ? 180 : 0) + (compensate ? -180 : 0);

      gsap.to(tileSelector(tileId), {
        x: TILE_HEIGHT / 2 + TILE_WIDTH,
        y: TILE_WIDTH * -i - TILE_WIDTH / 2,
        rotate: 180 + extraRotation,
        duration: 0.15,
      });
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

  function rotateTile(tile: DeckTile): void {
    tile.rotated = !tile.rotated;

    gsap.to(tileSelector(tile.tileId), {
      rotate: tile.rotated ? 180 : 0,
      duration: 0.25,
    });
  }

  function validateTurn(side: "left" | "right", tileId: TileId): boolean {
    const currentTile = getTileById(tileId);
    const currentValues = getNormalizedValues(currentTile);

    const tileOnBoard = getTileById(
      side === "left"
        ? gameState.onBoardTiles[0]
        : last(gameState.onBoardTiles)!,
    );
    const [leftValue, rightValue] = getNormalizedValues(tileOnBoard);
    const targetValue = side === "left" ? leftValue : rightValue;

    return currentValues[1] === targetValue;
  }

  useGSAP(
    // @ts-expect-error: arguments can be used in the future.
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    (context, contextSafe) => {
      const w = containerRef.current!.clientWidth;
      const screenWidth = Math.min(w, 500);

      leftZone.current!.classList.add("hide");
      rightZone.current!.classList.add("hide");

      for (const { tileId, rotated } of gameState.tiles) {
        gsap.to(tileSelector(tileId), {
          duration: 0,
          x: -screenWidth * 0.4,
          y: -160,
          rotate: rotated ? 180 : 0,
        });
      }

      gsap.to(leftZone.current, {
        duration: 0,
        x: -120,
      });
      gsap.to(rightZone.current, {
        duration: 0,
        x: 120,
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
          initialZone.current!.classList.toggle("dragOver", isInitialHit);
          leftZone.current!.classList.toggle("dragOver", isLeftHit);
          rightZone.current!.classList.toggle("dragOver", isRightHit);

          if (isLeftHit) {
            const currentTile = getTileById(t.target.dataset.tileId!);
            const currentValues = getNormalizedValues(currentTile);

            const leftTileOnBoard = getTileById(gameState.onBoardTiles[0]);
            const [leftValue] = getNormalizedValues(leftTileOnBoard);

            if (leftValue === currentValues[1]) {
              leftZone.current!.classList.add("highlight");
            } else if (leftValue === currentValues[0]) {
              rotateTile(currentTile);
              leftZone.current!.classList.add("highlight");
            } else {
              leftZone.current!.classList.remove("highlight");
            }
          } else {
            leftZone.current!.classList.remove("highlight");
          }

          if (isRightHit) {
            const currentTile = getTileById(t.target.dataset.tileId!);
            const currentValues = getNormalizedValues(currentTile);

            const rightTileOnBoard = getTileById(last(gameState.onBoardTiles)!);

            const [, rightValue] = getNormalizedValues(rightTileOnBoard);

            if (rightValue === currentValues[1]) {
              rightZone.current!.classList.add("highlight");
            } else if (rightValue === currentValues[0]) {
              rotateTile(currentTile);
              rightZone.current!.classList.add("highlight");
            } else {
              rightZone.current!.classList.remove("highlight");
            }
          } else {
            rightZone.current!.classList.remove("highlight");
          }
        },
        onRelease() {
          const t = this as Draggable;
          const tileId = t.target.dataset.tileId!;
          const handIndex = gameState.hand.indexOf(tileId);
          const isInHand = handIndex !== -1;

          initialZone.current!.classList.remove("highlight");
          initialZone.current!.classList.remove("dragOver");
          leftZone.current!.classList.remove("highlight");
          leftZone.current!.classList.remove("dragOver");
          rightZone.current!.classList.remove("highlight");
          rightZone.current!.classList.remove("dragOver");

          const isInitialHit = checkInitialHit(t);
          const isLeftHit = checkLeftHit(t);
          const isRightHit = checkRightHit(t);

          if (isInitialHit || isLeftHit || isRightHit) {
            // Validate turn
            const tileIndex = gameState.tiles.findIndex(
              (tile) => tile.tileId === tileId,
            );

            if (
              (!isLeftHit || validateTurn("left", tileId)) &&
              (!isRightHit || validateTurn("right", tileId))
            ) {
              draggables.current[tileIndex].disable();

              if (isInHand) {
                gameState.hand.splice(handIndex, 1);
                actualizeHandTilesPosition();
              }

              if (isLeftHit) {
                gameState.onBoardTiles.unshift(tileId);
              } else {
                gameState.onBoardTiles.push(tileId);
                gameState.tiles[tileIndex].compensate = true;
              }
              actualizeOnBoardTilesPosition();

              if (isInitialHit) {
                initialZone.current!.classList.add("hide");
                leftZone.current!.classList.remove("hide");
                rightZone.current!.classList.remove("hide");
              }

              return;
            }
          }

          if (!isInHand) {
            gameState.hand.push(tileId);
            actualizeHandTilesPosition();
          } else {
            gsap.to(t.target, {
              ...getHandTilePosition(handIndex),
              duration: 0.4,
            });
          }
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
      <div
        ref={initialZone}
        className={classNames(styles.dropZone, styles.dropZone_initial)}
      ></div>
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
