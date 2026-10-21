"use client";

import { useEffect, useRef } from "react";
import { GravityField } from "@/lib/ascii-gravity/field";
import { buildGlyphAtlas, type GlyphAtlas } from "@/lib/ascii-gravity/atlas";
import { drawTextLines } from "@/lib/ascii-gravity/text";
import type { GravityVariant } from "@/lib/ascii-gravity/types";
import { cn } from "@/lib/utils";

const MOBILE_BREAKPOINT = 768;
const RESIZE_DEBOUNCE_MS = 200;

interface AsciiGravityProps {
  lines: string[];
  variant?: GravityVariant;
  cellSize?: number;
  mobileCellSize?: number;
  cellGap?: number;
  threshold?: number;
  entrance?: boolean;
  fill?: boolean;
  className?: string;
  label?: string;
}

function readColor() {
  return (
    getComputedStyle(document.documentElement)
      .getPropertyValue("--foreground")
      .trim() || "#111111"
  );
}

export function AsciiGravity({
  lines,
  variant = "ascii",
  cellSize = 8,
  mobileCellSize,
  cellGap = 2,
  threshold = 0.3,
  entrance = true,
  fill = false,
  className,
  label,
}: AsciiGravityProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const linesKey = lines.join("\n");

  useEffect(() => {
    const section = sectionRef.current;
    const canvas = canvasRef.current;
    if (!section || !canvas) return;

    const textLines = linesKey.split("\n");
    const field = new GravityField();
    const cursor = { col: -999, row: -999 };
    const pixelRatio = window.devicePixelRatio || 1;
    const reducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;

    let ctx: CanvasRenderingContext2D | null = null;
    let atlas: GlyphAtlas | null = null;
    let size = cellSize;
    let step = cellSize + cellGap;
    let rafId = 0;
    let needsDraw = true;
    let visible = false;
    let ready = false;
    let entered = false;
    let disposed = false;
    let resizeTimer: ReturnType<typeof setTimeout> | null = null;

    const rebuildAtlas = () => {
      atlas = buildGlyphAtlas({
        variant,
        density: false,
        color: readColor(),
        cellSize: size,
        step,
        pixelRatio,
      });
      needsDraw = true;
    };

    const buildGrid = () => {
      const narrow = window.innerWidth < MOBILE_BREAKPOINT;
      size = narrow ? (mobileCellSize ?? cellSize) : cellSize;
      step = size + cellGap;
      rebuildAtlas();

      const rect = section.getBoundingClientRect();
      if (rect.width === 0 || rect.height === 0) return;

      const cols = Math.floor(rect.width / step);
      const rows = Math.floor(rect.height / step);
      field.resize(cols, rows);

      canvas.width = rect.width * pixelRatio;
      canvas.height = rect.height * pixelRatio;
      ctx = canvas.getContext("2d");
      ctx?.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);

      const samplerCanvas = document.createElement("canvas");
      samplerCanvas.width = cols;
      samplerCanvas.height = rows;
      const sampler = samplerCanvas.getContext("2d", {
        willReadFrequently: true,
      });
      if (!sampler) return;

      drawTextLines(
        sampler,
        textLines,
        {
          x: 0,
          y: 0,
          width: cols,
          height: rows,
        },
        fill
      );
      const data = sampler.getImageData(0, 0, cols, rows).data;
      for (let i = 0; i < cols * rows; i++) {
        const p = i * 4;
        const luminance =
          (data[p]! * 0.299 + data[p + 1]! * 0.587 + data[p + 2]! * 0.114) /
          255;
        field.levels[i] = (luminance * data[p + 3]!) / 255;
      }
      needsDraw = true;
    };

    const draw = () => {
      if (!ctx || !atlas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const { cols, rows, levels, offsetX, offsetY, seeds } = field;
      const { canvas: glyphs, count, slot } = atlas;

      for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
          const i = row * cols + col;
          if (levels[i]! <= threshold) continue;
          ctx.drawImage(
            glyphs,
            (seeds[i]! % count) * slot,
            0,
            slot,
            slot,
            (col + offsetX[i]!) * step,
            (row + offsetY[i]!) * step,
            step,
            step
          );
        }
      }
    };

    const loop = () => {
      if (field.step(cursor.col, cursor.row) || needsDraw) {
        draw();
        needsDraw = false;
      }
      rafId = requestAnimationFrame(loop);
    };

    const start = () => {
      if (rafId || !ready || disposed) return;
      if (entrance && !entered && !reducedMotion) field.enter();
      entered = true;
      rafId = requestAnimationFrame(loop);
    };

    const stop = () => {
      cancelAnimationFrame(rafId);
      rafId = 0;
    };

    const onMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      cursor.col = (event.clientX - rect.left) / step;
      cursor.row = (event.clientY - rect.top) / step;
    };

    const onMouseLeave = () => {
      cursor.col = -999;
      cursor.row = -999;
    };

    const onClick = () => {
      if (field.levels.length) field.toggle();
    };

    const onResize = () => {
      if (resizeTimer) clearTimeout(resizeTimer);
      resizeTimer = setTimeout(buildGrid, RESIZE_DEBOUNCE_MS);
    };

    const visibility = new IntersectionObserver(([entry]) => {
      visible = !!entry?.isIntersecting;
      if (visible) start();
      else stop();
    });
    visibility.observe(section);

    const themeObserver = new MutationObserver(rebuildAtlas);
    themeObserver.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ["class"],
    });

    section.addEventListener("mousemove", onMouseMove);
    section.addEventListener("mouseleave", onMouseLeave);
    section.addEventListener("click", onClick);
    window.addEventListener("resize", onResize);

    document.fonts.ready.then(() => {
      if (disposed) return;
      buildGrid();
      ready = true;
      if (visible) start();
    });

    return () => {
      disposed = true;
      stop();
      visibility.disconnect();
      themeObserver.disconnect();
      section.removeEventListener("mousemove", onMouseMove);
      section.removeEventListener("mouseleave", onMouseLeave);
      section.removeEventListener("click", onClick);
      window.removeEventListener("resize", onResize);
      if (resizeTimer) clearTimeout(resizeTimer);
      canvas.width = 0;
      canvas.height = 0;
    };
  }, [
    linesKey,
    variant,
    cellSize,
    mobileCellSize,
    cellGap,
    threshold,
    entrance,
    fill,
  ]);

  return (
    <div
      ref={sectionRef}
      role="img"
      aria-label={label ?? lines.join(" ")}
      className={cn(
        "relative w-full cursor-pointer overflow-hidden",
        className
      )}
    >
      <canvas ref={canvasRef} className="block size-full" />
    </div>
  );
}
