import {
  Cell,
  CellType,
  Color,
  getCellColor,
  getCellOf,
  getCellType,
} from "./cell";
import { getAdjacentPositions, getAdjacentSides, Position } from "./position";
import { BoardSettings } from "./settings";

export interface Board {
  settings: BoardSettings;
  cells: Cell[];
}

function getCellIndex(boardSize: number, position: Position) {
  if (
    position.x < 0 ||
    position.x >= boardSize ||
    position.y < 0 ||
    position.y >= boardSize
  ) {
    return null;
  }

  return position.x + position.y * boardSize;
}

export function createBoard(settings: BoardSettings) {
  const cells = Array.from(
    { length: settings.size * settings.size },
    () => Cell.Empty,
  );

  return {
    settings,
    cells,
  };
}

export function getCellAt(board: Board, position: Position) {
  const index = getCellIndex(board.settings.size, position);

  return index === null ? Cell.Empty : board.cells[index];
}

export function setCellAt(board: Board, position: Position, cell: Cell) {
  const index = getCellIndex(board.settings.size, position);

  if (index === null) {
    if (cell === Cell.Empty) {
      return;
    }

    throw new Error("Invalid position");
  }

  board.cells[index] = cell;

  const color = getCellColor(cell);

  if (color === null) return;

  switch (getCellType(cell)) {
    case CellType.Tower: {
      for (const adjacentPosition of getAdjacentPositions(position)) {
        const adjacentCell = getCellAt(board, adjacentPosition);

        if (getCellColor(adjacentCell) !== color) {
          setCellAt(board, adjacentPosition, Cell.Empty);
        }
      }
      break;
    }
    case CellType.Laser: {
      for (let i = 0; i < board.settings.size; i++) {
        const affectedPositions = [
          { x: i, y: position.y },
          { x: position.x, y: i },
        ];

        for (const affectedPosition of affectedPositions) {
          const affectedCell = getCellAt(board, affectedPosition);

          if (getCellColor(affectedCell) !== color) {
            setCellAt(board, affectedPosition, Cell.Empty);
          }
        }
      }
      break;
    }
  }
}

export function placeRing(board: Board, position: Position, color: Color) {
  if (!canPlaceRing(board, position, color)) {
    throw new Error("Invalid placement");
  }

  setCellAt(board, position, getCellOf(CellType.Ring, color));
}

export function upgrade(
  board: Board,
  originPosition: Position,
  targetPosition: Position,
) {
  const upgradePositions = getUpgradePositions(board, originPosition);

  if (!upgradePositions.length) {
    throw new Error("Invalid upgrade");
  }

  const cell = getCellAt(board, originPosition);
  const color = getCellColor(cell) as Color;

  for (const upgradePosition of upgradePositions) {
    setCellAt(board, upgradePosition, Cell.Empty);
  }

  const type =
    getCellType(cell) === CellType.Ring ? CellType.Tower : CellType.Laser;

  setCellAt(board, targetPosition, getCellOf(type, color));
}

export function canPlaceRing(board: Board, position: Position, color: Color) {
  const cell = getCellAt(board, position);

  if (cell !== Cell.Empty) {
    return false;
  }

  if (!canOccupyCell(board, position, color)) {
    return false;
  }

  const hasCells = board.cells.some((cell) => getCellColor(cell) === color);

  if (!hasCells) {
    return true;
  }

  const adjacentPositions = board.settings.allowDiagonalPlacement
    ? getAdjacentPositions(position)
    : getAdjacentSides(position);

  for (const adjacentPosition of adjacentPositions) {
    const cell = getCellAt(board, adjacentPosition);

    if (getCellColor(cell) === color) {
      return true;
    }
  }

  return false;
}

export function canOccupyCell(board: Board, position: Position, color: Color) {
  for (const adjacentPosition of getAdjacentPositions(position)) {
    const adjacentCell = getCellAt(board, adjacentPosition);
    const adjacentColor = getCellColor(adjacentCell);

    if (getCellType(adjacentCell) !== CellType.Tower) {
      continue;
    }

    if (adjacentColor !== null && adjacentColor !== color) {
      return false;
    }
  }

  for (let i = 0; i < board.settings.size; i++) {
    const laserPositions = [
      { x: i, y: position.y },
      { x: position.x, y: i },
    ];

    for (const laserPosition of laserPositions) {
      const laserCell = getCellAt(board, laserPosition);
      const laserColor = getCellColor(laserCell);

      if (getCellType(laserCell) !== CellType.Laser) {
        continue;
      }

      if (laserColor !== null && laserColor !== color) {
        return false;
      }
    }
  }

  return true;
}

export function getUpgradePositions(
  board: Board,
  position: Position,
): Position[] {
  const cell = getCellAt(board, position);
  const color = getCellColor(cell);
  const type = getCellType(cell);

  if (color === null || type === CellType.Empty || type === CellType.Laser) {
    return [];
  }

  const upgradePositions: Position[] = [position];

  let lineX = 1;

  for (let x = position.x + 1; x < board.settings.size; x++) {
    const upgradePosition = { x, y: position.y };

    if (getCellAt(board, upgradePosition) === cell) {
      upgradePositions.push(upgradePosition);
      lineX += 1;
    } else {
      break;
    }
  }

  for (let x = position.x - 1; x >= 0; x--) {
    const upgradePosition = { x, y: position.y };

    if (getCellAt(board, upgradePosition) === cell) {
      upgradePositions.push(upgradePosition);
      lineX += 1;
    } else {
      break;
    }
  }

  let lineY = 1;

  for (let y = position.y + 1; y < board.settings.size; y++) {
    const upgradePosition = { x: position.x, y };

    if (getCellAt(board, upgradePosition) === cell) {
      upgradePositions.push(upgradePosition);
      lineY += 1;
    } else {
      break;
    }
  }

  for (let y = position.y - 1; y >= 0; y--) {
    const upgradePosition = { x: position.x, y };

    if (getCellAt(board, upgradePosition) === cell) {
      upgradePositions.push(upgradePosition);
      lineY += 1;
    } else {
      break;
    }
  }

  if (
    lineX < board.settings.minimumCombineLength &&
    lineY < board.settings.minimumCombineLength
  ) {
    return [];
  }

  return upgradePositions;
}
