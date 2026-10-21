const HOVER_RADIUS = 10;
const HOVER_PUSH = 2;
const HOVER_EASE = 0.1;
const SCATTER_RANGE = 20;
const SCATTER_EASE = 0.05;
const RETURN_EASE = 0.05;
const STAGGER_FRAMES = 15;
const ENTRANCE_SPREAD = 4;
const MOVE_EPSILON = 0.001;
const HOME_EPSILON = 0.05;

export type GravityPhase = "idle" | "scattered" | "returning";

export class GravityField {
  cols = 0;
  rows = 0;
  phase: GravityPhase = "idle";
  levels = new Float32Array(0);
  offsetX = new Float32Array(0);
  offsetY = new Float32Array(0);
  seeds = new Uint8Array(0);
  private scatterX = new Float32Array(0);
  private scatterY = new Float32Array(0);
  private wait = new Uint8Array(0);

  resize(cols: number, rows: number) {
    const size = cols * rows;
    this.cols = cols;
    this.rows = rows;
    this.phase = "idle";
    this.levels = new Float32Array(size);
    this.offsetX = new Float32Array(size);
    this.offsetY = new Float32Array(size);
    this.scatterX = new Float32Array(size);
    this.scatterY = new Float32Array(size);
    this.seeds = new Uint8Array(size);
    this.wait = new Uint8Array(size);
    for (let i = 0; i < size; i++) {
      this.scatterX[i] = (Math.random() - 0.5) * SCATTER_RANGE;
      this.scatterY[i] = (Math.random() - 0.5) * SCATTER_RANGE;
      this.seeds[i] = Math.floor(Math.random() * 256);
    }
  }

  toggle() {
    if (this.phase === "idle") this.release("scattered");
    else if (this.phase === "scattered") this.release("returning");
  }

  enter() {
    for (let i = 0; i < this.levels.length; i++) {
      this.offsetX[i] = this.scatterX[i]! * ENTRANCE_SPREAD;
      this.offsetY[i] = this.scatterY[i]! * ENTRANCE_SPREAD;
    }
    this.release("returning");
  }

  step(cursorCol: number, cursorRow: number) {
    const { cols, rows, phase, offsetX, offsetY, scatterX, scatterY, wait } =
      this;
    let moved = false;
    let settled = phase === "returning";

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        const i = row * cols + col;
        if (wait[i]! > 0) {
          wait[i]!--;
          settled = false;
          continue;
        }

        let targetX = 0;
        let targetY = 0;
        let ease = RETURN_EASE;

        if (phase === "scattered") {
          targetX = scatterX[i]!;
          targetY = scatterY[i]!;
          ease = SCATTER_EASE;
        } else if (phase === "idle") {
          ease = HOVER_EASE;
          const distCol = col - cursorCol;
          const distRow = row - cursorRow;
          const distance = Math.sqrt(distCol * distCol + distRow * distRow);
          if (distance < HOVER_RADIUS && distance > 0) {
            const push = (1 - distance / HOVER_RADIUS) * HOVER_PUSH;
            targetX = (distCol / distance) * push;
            targetY = (distRow / distance) * push;
          }
        }

        const dx = (targetX - offsetX[i]!) * ease;
        const dy = (targetY - offsetY[i]!) * ease;
        offsetX[i]! += dx;
        offsetY[i]! += dy;
        if (Math.abs(dx) > MOVE_EPSILON || Math.abs(dy) > MOVE_EPSILON)
          moved = true;
        if (
          settled &&
          (Math.abs(offsetX[i]!) > HOME_EPSILON ||
            Math.abs(offsetY[i]!) > HOME_EPSILON)
        )
          settled = false;
      }
    }

    if (settled) this.phase = "idle";
    return moved;
  }

  private release(phase: GravityPhase) {
    this.phase = phase;
    for (let i = 0; i < this.wait.length; i++) {
      this.wait[i] = Math.floor(Math.random() * STAGGER_FRAMES);
    }
  }
}
