export interface BoardSettings {
  size: number;
  minimumCombineLength: number;
  allowDiagonalPlacement: boolean;
}

export const DEFAULT_SETTINGS: BoardSettings = {
  size: 8,
  minimumCombineLength: 3,
  allowDiagonalPlacement: false,
};
