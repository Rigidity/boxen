export const BOARD_SIZE = 10;
export const COMBINE_COUNT = 3;

export class Game {
  private board: Board;
  private ourColor: Color;
  private enemyColor: Color;
  private canWeMove: boolean = true;
  private canEnemyMove: boolean = true;
  private upgradeablePosition: Position | null = null;

  public constructor(color: Color) {
    this.board = {
      cells: Array.from({ length: BOARD_SIZE }, () =>
        Array.from({ length: BOARD_SIZE }, () => Cell.Empty)
      ),
    };
    this.ourColor = color;
    this.enemyColor = oppositeColor(color);
  }

  public getOurColor() {
    return this.ourColor;
  }

  public getWinner() {
    if (this.canWeMove === this.canEnemyMove) {
      return null;
    }

    return this.canWeMove ? this.ourColor : this.enemyColor;
  }

  public isDraw() {
    return !this.canWeMove && !this.canEnemyMove;
  }

  public isGameOver() {
    return !this.canWeMove || !this.canEnemyMove;
  }

  public getCell(x: number, y: number) {
    return getCell(this.board, x, y);
  }

  public canPlaceRing(x: number, y: number) {
    return canPlaceRing(this.board, x, y, this.ourColor);
  }

  public placeRing(x: number, y: number): Position[] {
    if (!this.canPlaceRing(x, y)) {
      throw new Error("Invalid ring placement");
    }

    placeRing(this.board, x, y, this.ourColor);

    this.updateState();

    const upgradePositions = getUpgradePositions(
      this.board,
      x,
      y,
      this.ourColor
    );

    if (upgradePositions.length > 0) {
      this.upgradeablePosition = { x, y };
    }

    return upgradePositions;
  }

  public upgrade(upgradePosition: Position) {
    if (!this.upgradeablePosition) {
      throw new Error("No last placement");
    }

    const position = this.upgradeablePosition;

    upgrade(this.board, position.x, position.y, upgradePosition, this.ourColor);

    position.x = upgradePosition.x;
    position.y = upgradePosition.y;

    const upgradePositions = getUpgradePositions(
      this.board,
      position.x,
      position.y,
      this.ourColor
    );

    if (upgradePositions.length === 0) {
      this.upgradeablePosition = null;
    }

    this.updateState();

    return upgradePositions;
  }

  public exportGame(turn: Color) {
    return JSON.stringify({
      board: this.board,
      turn,
    });
  }

  public importGame(game: string): Color {
    const parsed = JSON.parse(game);
    if (!parsed) return this.ourColor;

    this.board = parsed.board;
    this.updateState();
    return parsed.turn;
  }

  private updateState() {
    this.canWeMove = canMove(this.board, this.ourColor);
    this.canEnemyMove = canMove(this.board, this.enemyColor);
  }
}

export interface Board {
  cells: Cell[][];
}

export const enum Color {
  Red,
  Black,
}

export const enum Cell {
  Empty,
  RedRing,
  RedTower,
  RedLaser,
  BlackRing,
  BlackTower,
  BlackLaser,
}

export const enum CellType {
  Empty,
  Ring,
  Tower,
  Laser,
}

export function getCellType(cell: Cell) {
  switch (cell) {
    case Cell.Empty:
      return CellType.Empty;
    case Cell.RedRing:
      return CellType.Ring;
    case Cell.RedTower:
      return CellType.Tower;
    case Cell.RedLaser:
      return CellType.Laser;
    case Cell.BlackRing:
      return CellType.Ring;
    case Cell.BlackTower:
      return CellType.Tower;
    case Cell.BlackLaser:
      return CellType.Laser;
    default:
      throw new Error("Invalid cell");
  }
}

export function getCellColor(cell: Cell) {
  switch (cell) {
    case Cell.Empty:
      return null;
    case Cell.RedRing:
      return Color.Red;
    case Cell.RedTower:
      return Color.Red;
    case Cell.RedLaser:
      return Color.Red;
    case Cell.BlackRing:
      return Color.Black;
    case Cell.BlackTower:
      return Color.Black;
    case Cell.BlackLaser:
      return Color.Black;
    default:
      throw new Error("Invalid cell");
  }
}

export function cellFromTypeAndColor(cellType: CellType, cellColor: Color) {
  switch (cellType) {
    case CellType.Ring:
      return cellColor === Color.Red ? Cell.RedRing : Cell.BlackRing;
    case CellType.Tower:
      return cellColor === Color.Red ? Cell.RedTower : Cell.BlackTower;
    case CellType.Laser:
      return cellColor === Color.Red ? Cell.RedLaser : Cell.BlackLaser;
    default:
      throw new Error("Invalid cell type");
  }
}

export function oppositeColor(color: Color) {
  return color === Color.Red ? Color.Black : Color.Red;
}

export interface Position {
  x: number;
  y: number;
}

function getCell(board: Board, x: number, y: number) {
  if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE) {
    return null;
  }

  return board.cells[x][y];
}

function setCell(board: Board, x: number, y: number, cell: Cell) {
  if (x < 0 || x >= BOARD_SIZE || y < 0 || y >= BOARD_SIZE) {
    return;
  }

  board.cells[x][y] = cell;

  const color = getCellColor(cell);

  if (color !== null) {
    const enemy = oppositeColor(color);

    for (let i = 0; i < BOARD_SIZE; i++) {
      for (let j = 0; j < BOARD_SIZE; j++) {
        if (!isValidCell(board, i, j, enemy)) {
          const invalidCell = getCell(board, i, j);

          if (invalidCell !== null && getCellColor(invalidCell) === enemy) {
            setCell(board, i, j, Cell.Empty);
          }
        }
      }
    }
  }
}

function canMove(board: Board, color: Color) {
  for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      if (canPlaceRing(board, i, j, color)) {
        return true;
      }
    }
  }

  return false;
}

function placeRing(board: Board, x: number, y: number, color: Color) {
  if (!canPlaceRing(board, x, y, color)) {
    throw new Error("Invalid ring placement");
  }

  setCell(board, x, y, cellFromTypeAndColor(CellType.Ring, color));
}

function upgrade(
  board: Board,
  x: number,
  y: number,
  upgradePosition: Position,
  color: Color
) {
  const positions = getUpgradePositions(board, x, y, color);

  if (positions.length === 0) {
    throw new Error("Invalid upgrade position");
  }

  const cell = getCell(board, x, y) as Cell;

  for (const position of positions) {
    setCell(board, position.x, position.y, Cell.Empty);
  }

  const newType =
    getCellType(cell) === CellType.Ring ? CellType.Tower : CellType.Laser;
  const newCell = cellFromTypeAndColor(newType, color);

  setCell(board, upgradePosition.x, upgradePosition.y, newCell);
}

function getUpgradePositions(
  board: Board,
  x: number,
  y: number,
  color: Color
): Position[] {
  const cell = getCell(board, x, y);

  if (
    cell === null ||
    getCellColor(cell) !== color ||
    getCellType(cell) === CellType.Laser
  ) {
    return [];
  }

  const positions: Position[] = [{ x, y }];

  let lineX = 1;

  for (let i = x + 1; i < BOARD_SIZE; i++) {
    if (getCell(board, i, y) === cell) {
      positions.push({ x: i, y });
      lineX += 1;
    } else {
      break;
    }
  }

  for (let i = x - 1; i >= 0; i--) {
    if (getCell(board, i, y) === cell) {
      positions.push({ x: i, y });
      lineX += 1;
    } else {
      break;
    }
  }

  let lineY = 1;

  for (let i = y + 1; i < BOARD_SIZE; i++) {
    if (getCell(board, x, i) === cell) {
      positions.push({ x, y: i });
      lineY += 1;
    } else {
      break;
    }
  }

  for (let i = y - 1; i >= 0; i--) {
    if (getCell(board, x, i) === cell) {
      positions.push({ x, y: i });
      lineY += 1;
    } else {
      break;
    }
  }

  if (lineX < COMBINE_COUNT && lineY < COMBINE_COUNT) {
    return [];
  }

  return positions;
}

function canPlaceRing(board: Board, x: number, y: number, color: Color) {
  if (!isValidCell(board, x, y, color)) {
    return false;
  }

  if (getCell(board, x, y) !== Cell.Empty) {
    return false;
  }

  if (!hasCells(board, color)) {
    return true;
  }

  const positions: Position[] = [
    { x: x - 1, y },
    { x: x + 1, y },
    { x, y: y - 1 },
    { x, y: y + 1 },
  ];

  for (const position of positions) {
    const cell = getCell(board, position.x, position.y);

    if (cell !== null && getCellColor(cell) === color) {
      return true;
    }
  }

  return false;
}

function isValidCell(board: Board, x: number, y: number, color: Color) {
  const enemy = oppositeColor(color);
  const cell = getCell(board, x, y);

  if (cell === null) {
    return false;
  }

  if (getCellColor(cell) === enemy) {
    return false;
  }

  for (let i = 0; i < BOARD_SIZE; i++) {
    const laserX = getCell(board, i, y);
    const laserY = getCell(board, x, i);

    if (
      laserX !== null &&
      getCellType(laserX) === CellType.Laser &&
      getCellColor(laserX) === enemy
    ) {
      return false;
    }

    if (
      laserY !== null &&
      getCellType(laserY) === CellType.Laser &&
      getCellColor(laserY) === enemy
    ) {
      return false;
    }
  }

  for (let i = -1; i <= 1; i++) {
    for (let j = -1; j <= 1; j++) {
      if (i === 0 && j === 0) {
        continue;
      }

      const tower = getCell(board, x + i, y + j);

      if (
        tower !== null &&
        getCellType(tower) === CellType.Tower &&
        getCellColor(tower) === enemy
      ) {
        return false;
      }
    }
  }

  return true;
}

function hasCells(board: Board, color: Color) {
  for (let i = 0; i < BOARD_SIZE; i++) {
    for (let j = 0; j < BOARD_SIZE; j++) {
      const cell = getCell(board, i, j);

      if (cell !== null && getCellColor(cell) === color) {
        return true;
      }
    }
  }

  return false;
}
