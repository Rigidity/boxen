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
  Empty = "empty",
  Ring = "ring",
  Tower = "tower",
  Laser = "laser",
}

export const enum Color {
  Red = "red",
  Black = "black",
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

export function getCellOf(cellType: CellType, cellColor: Color) {
  switch (cellType) {
    case CellType.Ring:
      return cellColor === Color.Red ? Cell.RedRing : Cell.BlackRing;
    case CellType.Tower:
      return cellColor === Color.Red ? Cell.RedTower : Cell.BlackTower;
    case CellType.Laser:
      return cellColor === Color.Red ? Cell.RedLaser : Cell.BlackLaser;
    case CellType.Empty:
      return Cell.Empty;
    default:
      throw new Error("Invalid cell type");
  }
}
