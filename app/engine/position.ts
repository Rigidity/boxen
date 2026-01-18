export interface Position {
  x: number;
  y: number;
}

export function getUp(position: Position) {
  return { x: position.x, y: position.y - 1 };
}

export function getDown(position: Position) {
  return { x: position.x, y: position.y + 1 };
}

export function getLeft(position: Position) {
  return { x: position.x - 1, y: position.y };
}

export function getRight(position: Position) {
  return { x: position.x + 1, y: position.y };
}

export function getUpLeft(position: Position) {
  return getUp(getLeft(position));
}

export function getUpRight(position: Position) {
  return getUp(getRight(position));
}

export function getDownLeft(position: Position) {
  return getDown(getLeft(position));
}

export function getDownRight(position: Position) {
  return getDown(getRight(position));
}

export function getAdjacentSides(position: Position) {
  return [
    getUp(position),
    getDown(position),
    getLeft(position),
    getRight(position),
  ];
}

export function getAdjacentCorners(position: Position) {
  return [
    getUpLeft(position),
    getUpRight(position),
    getDownLeft(position),
    getDownRight(position),
  ];
}

export function getAdjacentPositions(position: Position) {
  return [...getAdjacentSides(position), ...getAdjacentCorners(position)];
}
