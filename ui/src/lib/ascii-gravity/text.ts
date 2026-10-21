const MOBILE_COLS = 60;
const DESKTOP_SCALE = 0.14;
const WIDTH_FILL = 0.9;
const LINE_FILL = 0.8;
const LINE_HEIGHT = 1.05;

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
  box: TextBox
) {
  const heightLimit = box.height * (LINE_FILL / lines.length);
  setFont(ctx, 100);
  const widest = Math.max(...lines.map((line) => ctx.measureText(line).width));
  const widthLimit = (box.width * WIDTH_FILL * 100) / widest;
  const preferred =
    box.width >= MOBILE_COLS ? box.width * DESKTOP_SCALE : widthLimit;
  return Math.min(preferred, widthLimit, heightLimit);
}

export function drawTextLines(
  ctx: CanvasRenderingContext2D,
  lines: string[],
  box: TextBox
) {
  if (!lines.length) return;
  const fontSize = fitFontSize(ctx, lines, box);
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
