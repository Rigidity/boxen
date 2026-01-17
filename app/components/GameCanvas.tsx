"use client";

import { useEffect, useRef, useState } from "react";
import {
  BOARD_SIZE,
  Cell,
  cellFromTypeAndColor,
  CellType,
  Color,
  Game,
  getCellColor,
  getCellType,
  Position,
} from "../engine/game";

const CELL_SIZE = 56;
const OUTLINE_WIDTH = 2;
const BUFFER_WIDTH = 6;
const RING_WIDTH = 6;
const TOWER_RADIUS = 2;
const LASER_WIDTH = 2;
const CANVAS_SIZE = BOARD_SIZE * CELL_SIZE;

export interface GameCanvasProps {
  game: Game;
  myColor: Color;
  activeColor: Color;
  upgradePositions: Position[];
  onCellClick: (x: number, y: number) => void;
}

export function GameCanvas({
  game,
  myColor,
  activeColor,
  upgradePositions,
  onCellClick,
}: GameCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [mousePosition, setMousePosition] = useState<Position | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let isMounted = true;
    let animationFrameId: number | null = null;

    const renderFrame = () => {
      renderGame(
        game,
        ctx,
        mousePosition,
        upgradePositions,
        myColor,
        activeColor,
      );

      if (isMounted) {
        animationFrameId = window.requestAnimationFrame(renderFrame);
      }
    };

    renderFrame();

    return () => {
      isMounted = false;

      if (animationFrameId !== null) {
        window.cancelAnimationFrame(animationFrameId);
      }
    };
  }, [game, mousePosition, upgradePositions, myColor, activeColor]);

  const handleClick = (clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = CANVAS_SIZE / rect.width;
    const scaleY = CANVAS_SIZE / rect.height;

    const newMousePosition = {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };

    setMousePosition(newMousePosition);

    const x = Math.floor(newMousePosition.x / CELL_SIZE);
    const y = Math.floor(newMousePosition.y / CELL_SIZE);

    if (activeColor === myColor) {
      onCellClick(x, y);
    }
  };

  const onClick = (event: React.MouseEvent<HTMLCanvasElement>) => {
    if (event.button !== 0) return;
    handleClick(event.clientX, event.clientY);
  };

  const onTouchStart = (event: React.TouchEvent<HTMLCanvasElement>) => {
    event.preventDefault();
    if (event.touches.length === 1) {
      const touch = event.touches[0];
      handleClick(touch.clientX, touch.clientY);
    }
  };

  const onMouseMove = (event: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();

    const scaleX = CANVAS_SIZE / rect.width;
    const scaleY = CANVAS_SIZE / rect.height;

    setMousePosition({
      x: (event.clientX - rect.left) * scaleX,
      y: (event.clientY - rect.top) * scaleY,
    });
  };

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_SIZE}
      height={CANVAS_SIZE}
      onClick={onClick}
      onTouchStart={onTouchStart}
      onMouseLeave={() => setMousePosition(null)}
      onMouseMove={onMouseMove}
    />
  );
}

function renderGame(
  game: Game,
  ctx: CanvasRenderingContext2D,
  mousePosition: Position | null,
  upgradePositions: Position[],
  myColor: Color,
  activeColor: Color,
) {
  ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

  for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      ctx.fillStyle = (i + j) % 2 === 0 ? "#FFF" : "#CCCDB4";

      const x = i * CELL_SIZE;
      const y = j * CELL_SIZE;

      ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
    }
  }

  if (game) {
    for (let i = 0; i < BOARD_SIZE; i++) {
      for (let j = 0; j < BOARD_SIZE; j++) {
        const x = i * CELL_SIZE;
        const y = j * CELL_SIZE;

        if (!upgradePositions.length && !isTouchDevice() && mousePosition) {
          if (
            mousePosition.x >= x &&
            mousePosition.x < x + CELL_SIZE &&
            mousePosition.y >= y &&
            mousePosition.y < y + CELL_SIZE
          ) {
            const valid = activeColor === myColor && game.canPlaceRing(i, j);

            drawHighlightedCell(ctx, x, y, valid);

            if (valid) {
              drawCell(
                ctx,
                x,
                y,
                cellFromTypeAndColor(CellType.Ring, game.getOurColor()),
                true,
              );
            }
          }
        }

        const cell = game.getCell(i, j);

        if (cell !== null) {
          for (const upgradePosition of upgradePositions) {
            if (upgradePosition.x === i && upgradePosition.y === j) {
              drawHighlightedCell(ctx, x, y, true);
              break;
            }
          }

          drawCell(ctx, x, y, cell);

          if (cell === Cell.Empty) {
            const hint = game.getInvalidityHint(i, j);

            if (hint !== null) {
              if (hint === myColor) {
                drawControlHint(ctx, x, y, hint);
              } else {
                drawInvalidityHint(ctx, x, y, hint);
              }
            }
          }
        }
      }
    }
  }

  if (game) {
    for (let i = 0; i < BOARD_SIZE; i++) {
      for (let j = 0; j < BOARD_SIZE; j++) {
        const cell = game.getCell(i, j);

        if (cell === null || getCellType(cell) !== CellType.Laser) continue;

        const color = getCellColor(cell);
        if (color === null) continue;

        drawLaser(ctx, i * CELL_SIZE, j * CELL_SIZE, color);
      }
    }
  }
}

function drawHighlightedCell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  valid: boolean,
) {
  if (!valid) {
    ctx.fillStyle = "#FF9999";
    ctx.fillRect(x, y, CELL_SIZE, CELL_SIZE);
  }

  ctx.strokeStyle = "#000";
  ctx.lineWidth = OUTLINE_WIDTH;
  ctx.strokeRect(
    x + ctx.lineWidth / 2,
    y + ctx.lineWidth / 2,
    CELL_SIZE - ctx.lineWidth,
    CELL_SIZE - ctx.lineWidth,
  );
}

function drawInvalidityHint(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: Color,
) {
  ctx.strokeStyle = getColorString(color, true);
  ctx.lineWidth = 4;
  ctx.beginPath();
  const padding = CELL_SIZE / 3;
  ctx.moveTo(x + padding, y + padding);
  ctx.lineTo(x + CELL_SIZE - padding, y + CELL_SIZE - padding);
  ctx.moveTo(x + CELL_SIZE - padding, y + padding);
  ctx.lineTo(x + padding, y + CELL_SIZE - padding);
  ctx.stroke();
  ctx.closePath();
}

function drawControlHint(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: Color,
) {
  ctx.fillStyle = getColorString(color, true);
  ctx.beginPath();
  const dotRadius = 6;
  ctx.arc(x + CELL_SIZE / 2, y + CELL_SIZE / 2, dotRadius, 0, 2 * Math.PI);
  ctx.fill();
  ctx.closePath();
}

function drawCell(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  cell: Cell,
  partiallyTransparent: boolean = false,
) {
  const type = getCellType(cell);
  const color = getCellColor(cell);

  if (color === null) return;

  switch (type) {
    case CellType.Empty:
      break;
    case CellType.Ring:
      ctx.lineWidth = RING_WIDTH;
      ctx.strokeStyle = getColorString(color, partiallyTransparent);
      ctx.beginPath();
      ctx.arc(
        x + CELL_SIZE / 2,
        y + CELL_SIZE / 2,
        CELL_SIZE / 2 - ctx.lineWidth / 2 - BUFFER_WIDTH,
        0,
        2 * Math.PI,
      );
      ctx.stroke();
      ctx.closePath();
      break;
    case CellType.Tower:
      ctx.fillStyle = getColorString(color, partiallyTransparent);
      ctx.beginPath();
      ctx.roundRect(
        x + BUFFER_WIDTH,
        y + BUFFER_WIDTH,
        CELL_SIZE - BUFFER_WIDTH * 2,
        CELL_SIZE - BUFFER_WIDTH * 2,
        TOWER_RADIUS,
      );
      ctx.fill();
      ctx.closePath();
      break;
  }
}

function drawLaser(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: Color,
) {
  ctx.fillStyle = getColorString(color, true);
  ctx.fillRect(
    0,
    y + CELL_SIZE / 2 - LASER_WIDTH / 2,
    CANVAS_SIZE,
    LASER_WIDTH,
  );
  ctx.fillRect(
    x + CELL_SIZE / 2 - LASER_WIDTH / 2,
    0,
    LASER_WIDTH,
    CANVAS_SIZE,
  );

  ctx.lineWidth = RING_WIDTH;
  ctx.fillStyle = getColorString(color, false);
  ctx.beginPath();
  ctx.arc(
    x + CELL_SIZE / 2,
    y + CELL_SIZE / 2,
    CELL_SIZE / 2 - ctx.lineWidth / 2 - BUFFER_WIDTH,
    0,
    2 * Math.PI,
  );
  ctx.fill();
  ctx.closePath();
}

function getColorString(color: Color, partiallyTransparent: boolean) {
  const style = color === Color.Red ? "#FF0000" : "#000000";
  return partiallyTransparent ? `${style}80` : `${style}FF`;
}

function isTouchDevice() {
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
}
