export const DOT_LAYOUT_WIDTH = 1866;
export const DOT_LAYOUT_HEIGHT = 2596;
export const DOT_LAYOUT_TOTAL_WEEKS = 52 * 100;
export const DOT_LAYOUT_WEEKS_PER_ROW = 52;

export type DotLayoutConfig = {
  columnsPerBlock: [number, number, number, number, number, number];
  rowsPerBlock: [number, number, number, number, number, number, number, number, number, number];
  startX: number;
  startY: number;
  dotGapX: number;
  dotGapY: number;
  horizontalBlockGaps: [number, number, number, number];
  verticalBlockGaps: [number, number, number, number, number, number, number, number, number];
  tailGapX: number;
  tailOffsetY: number;
  pointRadius: number;
};

export const DEFAULT_DOT_LAYOUT: DotLayoutConfig = {
  columnsPerBlock: [10, 10, 10, 10, 10, 2],
  rowsPerBlock: [10, 10, 10, 10, 10, 10, 10, 10, 10, 10],
  startX: 554,
  startY: 160,
  dotGapX: 21.3,
  dotGapY: 21.4,
  horizontalBlockGaps: [18.7, 18, 19.7, 19.4],
  verticalBlockGaps: [19.9, 15, 18, 18.4, 16.4, 17.7, 18.3, 18, 17.4],
  tailGapX: 232.1,
  tailOffsetY: 0,
  pointRadius: 6
};

export type DotPosition = {
  weekIndex: number;
  row: number;
  column: number;
  x: number;
  y: number;
};

function sum(values: number[]) {
  return values.reduce((total, value) => total + value, 0);
}

function sumUntil(values: number[], count: number) {
  return values.slice(0, Math.max(0, count)).reduce((total, value) => total + value, 0);
}

export function generateDotPositions(
  config: DotLayoutConfig = DEFAULT_DOT_LAYOUT
): DotPosition[] {
  const positions: DotPosition[] = [];
  const rows = sum(config.rowsPerBlock);
  const columns = sum(config.columnsPerBlock);

  for (let row = 0; row < rows; row += 1) {
    const verticalBlockIndex = Math.floor(row / 10);
    const innerRow = row % 10;

    for (let column = 0; column < columns; column += 1) {
      const horizontalBlockIndex = column < 50 ? Math.floor(column / 10) : 5;
      const innerColumn = column < 50 ? column % 10 : column - 50;

      const x =
        config.startX +
        Math.min(horizontalBlockIndex, 4) * 10 * config.dotGapX +
        sumUntil(config.horizontalBlockGaps, Math.min(horizontalBlockIndex, 4)) +
        innerColumn * config.dotGapX +
        (column >= 50 ? config.tailGapX : 0);

      const y =
        config.startY +
        verticalBlockIndex * 10 * config.dotGapY +
        sumUntil(config.verticalBlockGaps, verticalBlockIndex) +
        innerRow * config.dotGapY +
        (column >= 50 ? config.tailOffsetY : 0);

      positions.push({
        weekIndex: row * columns + column,
        row,
        column,
        x,
        y
      });
    }
  }

  return positions;
}

export function getDotPosition(
  weekIndex: number,
  config: DotLayoutConfig = DEFAULT_DOT_LAYOUT
) {
  return generateDotPositions(config)[weekIndex];
}

export function getYearLabelPosition(
  rowIndex: number,
  config: DotLayoutConfig = DEFAULT_DOT_LAYOUT
) {
  const verticalBlockIndex = Math.floor(rowIndex / 10);
  const innerRow = rowIndex % 10;

  const y =
    config.startY +
    verticalBlockIndex * 10 * config.dotGapY +
    sumUntil(config.verticalBlockGaps, verticalBlockIndex) +
    innerRow * config.dotGapY;

  return {
    x: DOT_LAYOUT_WIDTH - 84,
    y
  };
}
