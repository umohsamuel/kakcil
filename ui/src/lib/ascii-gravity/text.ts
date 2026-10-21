const MOBILE_COLS = 60;
const DESKTOP_SCALE = 0.14;
const WIDTH_FILL = 0.9;
const LINE_FILL = 0.8;
const LINE_HEIGHT = 1.05;
const FILL_WIDTH = 0.99;
const FILL_LINE = 0.96;

export interface TextBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

function setFont(ctx: CanvasRenderingContext2D, size: number) {
  ctx.font = `900 ${size}px ${getComputedStyle(document.body).fontFamily}`;
}

function fitFontSize(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  box: TextBox,
  fill: boolean
) {
  const heightLimit =
    box.height * ((fill ? FILL_LINE : LINE_FILL) / lines.length);
  setFont(ctx, 100);
  const widest = Math.max(...lines.map((line) => ctx.measureText(line).width));
  const widthLimit =
    (box.width * (fill ? FILL_WIDTH : WIDTH_FILL) * 100) / widest;
  const preferred =
    fill || box.width < MOBILE_COLS ? widthLimit : box.width * DESKTOP_SCALE;
  return Math.min(preferred, widthLimit, heightLimit);
}

export function drawTextLines(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  box: TextBox,
  fill = false
) {
  if (!lines.length) return;
  const fontSize = fitFontSize(ctx, lines, box, fill);
  setFont(ctx, fontSize);
  ctx.fillStyle = "#ffffff";
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";

  const lineHeight = fontSize * LINE_HEIGHT;
  const startY =
    box.y + (box.height - lines.length * lineHeight) / 2 + lineHeight / 2;
  lines.forEach((line, i) => {
    ctx.fillText(line, box.x + box.width / 2, startY + i * lineHeight);
  });
}
