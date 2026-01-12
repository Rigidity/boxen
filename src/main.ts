import { v4 as uuidv4 } from "uuid";
import { downloadGame, uploadGame } from "./api.ts";
import {
  BOARD_SIZE,
  Cell,
  cellFromTypeAndColor,
  CellType,
  Color,
  Game,
  getCellColor,
  getCellType,
  oppositeColor,
  type Position,
} from "./game.ts";

const urlParams = new URLSearchParams(window.location.search);
const uuid = urlParams.get("uuid") ?? uuidv4();

if (urlParams.get("uuid") !== uuid) {
  urlParams.set("uuid", uuid);
  window.location.search = urlParams.toString();
  localStorage.setItem(uuid, "red");
}

const myColor = localStorage.getItem(uuid) === "red" ? Color.Red : Color.Black;
localStorage.setItem(uuid, myColor === Color.Red ? "red" : "black");

const CELL_SIZE = 56;
const OUTLINE_WIDTH = 2;
const BUFFER_WIDTH = 6;
const RING_WIDTH = 6;
const TOWER_RADIUS = 2;
const LASER_WIDTH = 2;

const canvas = document.querySelector<HTMLCanvasElement>("#canvas")!;
canvas.width = BOARD_SIZE * CELL_SIZE;
canvas.height = BOARD_SIZE * CELL_SIZE;

const ctx = canvas.getContext("2d")!;

let game: Game | null = null;
let turn: Color | null = null;

const mousePosition = { x: 0, y: 0 };
const upgradePositions: Position[] = [];

window.requestAnimationFrame(renderGame);

function renderGame() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

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

        if (!upgradePositions.length && !isTouchDevice()) {
          if (
            mousePosition.x >= x &&
            mousePosition.x < x + CELL_SIZE &&
            mousePosition.y >= y &&
            mousePosition.y < y + CELL_SIZE
          ) {
            const valid = turn === myColor && game.canPlaceRing(i, j);

            drawHighlightedCell(x, y, valid);

            if (valid) {
              drawCell(
                x,
                y,
                cellFromTypeAndColor(CellType.Ring, game.getOurColor()),
                true
              );
            }
          }
        }

        const cell = game.getCell(i, j);

        if (cell !== null) {
          for (const upgradePosition of upgradePositions) {
            if (upgradePosition.x === i && upgradePosition.y === j) {
              drawHighlightedCell(x, y, true);
              break;
            }
          }

          drawCell(x, y, cell);

          if (cell === Cell.Empty) {
            const hint = game.getInvalidityHint(i, j);

            if (hint !== null) {
              if (hint === myColor) {
                drawControlHint(x, y, hint);
              } else {
                drawInvalidityHint(x, y, hint);
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

        drawLaser(i * CELL_SIZE, j * CELL_SIZE, color);
      }
    }
  }

  window.requestAnimationFrame(renderGame);
}

window.addEventListener("mousemove", (event) => {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  mousePosition.x = (event.clientX - rect.left) * scaleX;
  mousePosition.y = (event.clientY - rect.top) * scaleY;
});

function handleClick(clientX: number, clientY: number) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  mousePosition.x = (clientX - rect.left) * scaleX;
  mousePosition.y = (clientY - rect.top) * scaleY;

  const x = Math.floor(mousePosition.x / CELL_SIZE);
  const y = Math.floor(mousePosition.y / CELL_SIZE);

  if (game && turn === myColor) {
    if (upgradePositions.length === 0) {
      if (game.canPlaceRing(x, y)) {
        upgradePositions.push(...game.placeRing(x, y));
        if (!upgradePositions.length) passTurn();
      }
    } else {
      for (const upgradePosition of upgradePositions) {
        if (upgradePosition.x === x && upgradePosition.y === y) {
          upgradePositions.length = 0;
          upgradePositions.push(...game.upgrade({ x, y }));
          if (!upgradePositions.length) passTurn();
          break;
        }
      }
    }
  }
}

window.addEventListener("click", (event) => {
  if (event.button !== 0) return;
  handleClick(event.clientX, event.clientY);
});

canvas.addEventListener("touchstart", (event) => {
  event.preventDefault();
  if (event.touches.length === 1) {
    const touch = event.touches[0];
    handleClick(touch.clientX, touch.clientY);
  }
});

function drawHighlightedCell(x: number, y: number, valid: boolean) {
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
    CELL_SIZE - ctx.lineWidth
  );
}

function drawInvalidityHint(x: number, y: number, color: Color) {
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

function drawControlHint(x: number, y: number, color: Color) {
  ctx.fillStyle = getColorString(color, true);
  ctx.beginPath();
  const dotRadius = 6;
  ctx.arc(x + CELL_SIZE / 2, y + CELL_SIZE / 2, dotRadius, 0, 2 * Math.PI);
  ctx.fill();
  ctx.closePath();
}

function drawCell(
  x: number,
  y: number,
  cell: Cell,
  partiallyTransparent: boolean = false
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
        2 * Math.PI
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
        TOWER_RADIUS
      );
      ctx.fill();
      ctx.closePath();
      break;
  }
}

function drawLaser(x: number, y: number, color: Color) {
  ctx.fillStyle = getColorString(color, true);
  ctx.fillRect(
    0,
    y + CELL_SIZE / 2 - LASER_WIDTH / 2,
    canvas.width,
    LASER_WIDTH
  );
  ctx.fillRect(
    x + CELL_SIZE / 2 - LASER_WIDTH / 2,
    0,
    LASER_WIDTH,
    canvas.height
  );

  ctx.lineWidth = RING_WIDTH;
  ctx.fillStyle = getColorString(color, false);
  ctx.beginPath();
  ctx.arc(
    x + CELL_SIZE / 2,
    y + CELL_SIZE / 2,
    CELL_SIZE / 2 - ctx.lineWidth / 2 - BUFFER_WIDTH,
    0,
    2 * Math.PI
  );
  ctx.fill();
  ctx.closePath();
}

function getColorString(color: Color, partiallyTransparent: boolean) {
  let style = color === Color.Red ? "#FF0000" : "#000000";
  return partiallyTransparent ? `${style}80` : `${style}FF`;
}

document
  .querySelector<HTMLInputElement>("#new-game")!
  .addEventListener("click", (event) => {
    if (event.button !== 0) return;

    if (confirm("Are you sure you want to reset the game?")) {
      localStorage.clear();
      urlParams.delete("uuid");
      window.location.search = urlParams.toString();
    }
  });

function setTurn(next: Color) {
  const label = document.querySelector<HTMLParagraphElement>("#turn")!;
  const color = next === Color.Red ? "red" : "black";
  label.textContent =
    next === myColor ? `Your turn (${color})` : `Opponent's turn (${color})`;
  const winner = game?.getWinner();
  if (winner !== null && winner !== undefined) {
    label.textContent =
      winner === myColor ? `You won (${color})` : `Opponent won (${color})`;
  }
  turn = next;
}

function updateGame() {
  downloadGame(uuid).then(async (content) => {
    if (!game) {
      game = new Game(myColor);
    }

    if (!JSON.parse(content)) {
      await uploadGame(uuid, game.exportGame(myColor));
    }

    setTurn(game.importGame(content));
    console.log(content);
  });
}

function passTurn() {
  if (game && turn === myColor) {
    setTurn(oppositeColor(myColor));
    uploadGame(uuid, game.exportGame(turn));
  }
}

updateGame();

setInterval(() => {
  if (turn === game?.getOurColor()) return;

  updateGame();
}, 1000);

function isTouchDevice() {
  return "ontouchstart" in window || navigator.maxTouchPoints > 0;
}
