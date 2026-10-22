import { ImageResponse } from "next/og";
import { siteName } from "@/constants/metadata";

export const alt = siteName;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const FOCUS = { x: 880, y: 300 };

function noise(seed: number) {
  const value = Math.sin(seed * 127.1 + 311.7) * 43758.5453;
  return value - Math.floor(value);
}

type Strand = { d: string; opacity: number; node?: { x: number; y: number } };

function buildStrands(): Strand[] {
  const sources: { x: number; y: number }[] = [];

  for (let x = 420; x <= size.width; x += 26) sources.push({ x, y: -10 });
  for (let y = 0; y <= size.height; y += 26) {
    sources.push({ x: size.width + 10, y });
  }
  for (let x = size.width; x >= 640; x -= 26) {
    sources.push({ x, y: size.height + 10 });
  }

  return sources.map((source, index) => {
    const bend = (noise(index) - 0.5) * 220;
    const midX = (source.x + FOCUS.x) / 2 + bend;
    const midY = (source.y + FOCUS.y) / 2 - bend * 0.6;
    const highlighted = index % 9 === 4;
    const t = 0.3 + noise(index * 3) * 0.2;

    return {
      d: `M${source.x} ${source.y} Q${midX} ${midY} ${FOCUS.x} ${FOCUS.y}`,
      opacity: highlighted ? 0.55 : 0.06 + noise(index * 7) * 0.14,
      node: highlighted
        ? {
            x:
              (1 - t) * (1 - t) * source.x +
              2 * (1 - t) * t * midX +
              t * t * FOCUS.x,
            y:
              (1 - t) * (1 - t) * source.y +
              2 * (1 - t) * t * midY +
              t * t * FOCUS.y,
          }
        : undefined,
    };
  });
}

const STRANDS = buildStrands();

async function loadFont(family: string, weight: number) {
  try {
    const css = await fetch(
      `https://fonts.googleapis.com/css2?family=${family}:wght@${weight}`
    ).then((response) => response.text());
    const url = css.match(
      /src: url\((.+?)\) format\('(?:truetype|opentype)'\)/
    )?.[1];
    if (!url) return null;
    return await fetch(url).then((response) => response.arrayBuffer());
  } catch {
    return null;
  }
}

export default async function OpenGraphImage() {
  const [geist, pixel] = await Promise.all([
    loadFont("Geist", 400),
    loadFont("Bitcount+Grid+Double", 400),
  ]);

  const fonts = [
    geist && { name: "Geist", data: geist, weight: 400 as const },
    pixel && { name: "Bitcount", data: pixel, weight: 400 as const },
  ].filter((font) => !!font);

  return new ImageResponse(
    <div
      style={{
        width: "100%",
        height: "100%",
        display: "flex",
        position: "relative",
        backgroundColor: "#0a0a0a",
        color: "#ededed",
        fontFamily: geist ? "Geist" : undefined,
      }}
    >
      <svg
        width={size.width}
        height={size.height}
        viewBox={`0 0 ${size.width} ${size.height}`}
        style={{ position: "absolute", top: 0, left: 0 }}
      >
        <defs>
          <radialGradient id="glow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#ffffff" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx={FOCUS.x} cy={FOCUS.y} r="190" fill="url(#glow)" />
        {STRANDS.map((strand, index) => (
          <path
            key={index}
            d={strand.d}
            fill="none"
            stroke="#ffffff"
            strokeOpacity={strand.opacity}
            strokeWidth={strand.node ? 1.6 : 1}
          />
        ))}
        {STRANDS.filter((strand) => strand.node).map((strand, index) => (
          <circle
            key={`node-${index}`}
            cx={strand.node!.x}
            cy={strand.node!.y}
            r="6"
            fill="#0a0a0a"
            stroke="#ededed"
            strokeWidth="2"
          />
        ))}
        <circle
          cx={FOCUS.x}
          cy={FOCUS.y}
          r="34"
          fill="none"
          stroke="#ffffff"
          strokeOpacity="0.25"
        />
        <circle
          cx={FOCUS.x}
          cy={FOCUS.y}
          r="20"
          fill="none"
          stroke="#ffffff"
          strokeOpacity="0.5"
        />
        <circle cx={FOCUS.x} cy={FOCUS.y} r="10" fill="#ffffff" />
      </svg>

      <div
        style={{
          position: "absolute",
          left: 72,
          bottom: 64,
          display: "flex",
          flexDirection: "column",
        }}
      >
        <span
          style={{
            fontSize: 30,
            color: "#9a9a9a",
            marginBottom: 22,
          }}
        >
          Many models. One answer they agree on.
        </span>
        <span
          style={{
            fontFamily: pixel ? "Bitcount" : undefined,
            fontSize: 168,
            lineHeight: 0.85,
            letterSpacing: 4,
          }}
        >
          KAKCIL
        </span>
      </div>
    </div>,
    { ...size, fonts }
  );
}
