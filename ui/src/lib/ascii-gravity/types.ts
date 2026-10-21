export type GravityVariant = "ascii" | "dots";

export type GravityRender = (
  ctx: CanvasRenderingContext2D,
  cols: number,
  rows: number,
  time: number
) => void;
