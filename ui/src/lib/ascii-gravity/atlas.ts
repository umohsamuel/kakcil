import type { GravityVariant } from "./types";

const ASCII_CHARS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
const DENSITY_CHARS = ".:-=+*#%@";
const DOT_STEPS = 6;
const DOT_SCALE = 0.32;

export interface GlyphAtlas {
  canvas: HTMLCanvasElement;
  count: number;
  slot: number;
}

interface AtlasOptions {
  variant: GravityVariant;
  density: boolean;
  color: string;
  cellSize: number;
  step: number;
  pixelRatio: number;
}

function glyphCount(variant: GravityVariant, density: boolean) {
  if (variant === "dots") return density ? DOT_STEPS : 1;
  return density ? DENSITY_CHARS.length : ASCII_CHARS.length;
}

function drawDots(
  ctx: CanvasRenderingContext2D,
  count: number,
  cellSize: number,
  step: number
) {
  const maxRadius = cellSize * DOT_SCALE;
  for (let i = 0; i < count; i++) {
    ctx.beginPath();
    ctx.arc(
      i * step + step / 2,
      step / 2,
      (maxRadius * (i + 1)) / count,
      0,
      Math.PI * 2
    );
    ctx.fill();
  }
}

function drawChars(
  ctx: CanvasRenderingContext2D,
  chars: string,
  cellSize: number,
  step: number
) {
  ctx.font = `${cellSize}px monospace`;
  ctx.textBaseline = "top";
  ctx.textAlign = "center";
  for (let i = 0; i < chars.length; i++) {
    ctx.fillText(chars[i]!, i * step + step / 2, 0);
  }
}

export function buildGlyphAtlas({
  variant,
  density,
  color,
  cellSize,
  step,
  pixelRatio,
}: AtlasOptions): GlyphAtlas | null {
  const count = glyphCount(variant, density);
  const slot = step * pixelRatio;
  const canvas = document.createElement("canvas");
  canvas.width = slot * count;
  canvas.height = slot;
  const ctx = canvas.getContext("2d");
  if (!ctx) return null;

  ctx.scale(pixelRatio, pixelRatio);
  ctx.fillStyle = color;
  if (variant === "dots") drawDots(ctx, count, cellSize, step);
  else drawChars(ctx, density ? DENSITY_CHARS : ASCII_CHARS, cellSize, step);

  return { canvas, count, slot };
}
