export interface BoardSettings {
  size: number;
  minimumCombineLength: number;
  allowDiagonalPlacement: boolean;
  fixedStart: boolean;
  autoUpgrade: boolean;
  ruins: boolean;
}

export const DEFAULT_SETTINGS: BoardSettings = {
  size: 8,
  minimumCombineLength: 3,
  allowDiagonalPlacement: false,
  fixedStart: true,
  autoUpgrade: true,
  ruins: false,
};
