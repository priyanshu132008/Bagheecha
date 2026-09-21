/* eslint-disable @next/next/no-img-element */

/**
 * Open Graph image — POLISH BRIEF (2026-09-20, G8).
 *
 * Generates a 1200×630 PNG at build time via Next.js's built-in
 * `@vercel/og` (the package that lives at `next/og`). The PNG is
 * served at `/opengraph-image` and is referenced by:
 *
 *   - `metadata.openGraph.images` in `app/layout.tsx`
 *   - `metadata.twitter.images` in `app/layout.tsx`
 *   - the JSON-LD `image` field in `components/seo/RestaurantJsonLd.tsx`
 *
 * DESIGN
 *   The image mirrors the brand:
 *
 *   - Deep plum ground (`--plum` = #240B14).
 *   - The cream asterisk brand mark, enlarged to a wordmark-equivalent
 *     glyph at the upper-centre. Same shape as `app/icon.svg` but
 *     drawn with ImageResponse primitives.
 *   - "Hotel Bageecha" in Playfair Display Bold.
 *   - A single tagline below: "Restaurant, Terrace Lounge & Bar".
 *   - The locality as the smallest line: "Virar · Maharashtra".
 *
 * FONT FETCH
 *   Satori (the renderer under `next/og`) only parses static TTF.
 *   Google Fonts' public API serves only WOFF2 to every browser UA,
 *   and the variable-axis TTFs in the Google Fonts GitHub repo are
 *   not parsable by Satori. We therefore fetch per-weight static
 *   TTFs from Fontsource's jsdelivr mirror, which serves true static
 *   TTFs (magic bytes `00 01 00 00`) at per-weight URLs.
 *
 *   The URL pattern is `latin-<weight>-normal.ttf`. The latin
 *   subset covers the entire copy on this image.
 *
 *   If jsdelivr is unavailable at build time, the build fails loudly
 *   — better than shipping an OG image with a substituted font and
 *   silently drifting from the brand.
 */

import { ImageResponse } from "next/og";

export const runtime = "nodejs"; /* @vercel/og requires Node, not Edge */
export const alt = "Hotel Bageecha — Restaurant, Terrace Lounge & Bar in Virar";
export const size = { width: 1200, height: 630 } as const;
export const contentType = "image/png";

/* Six-ray asterisk drawn as three SVG <line> elements. The brand's
   icon.svg uses two paths (vertical + X); this is the same shape. */
function Asterisk({
  x,
  y,
  markSize,
  color,
}: {
  x: number;
  y: number;
  markSize: number;
  color: string;
}) {
  const stroke = Math.round(markSize * 0.075);
  return (
    <svg
      x={x}
      y={y}
      width={markSize}
      height={markSize}
      viewBox="0 0 32 32"
      style={{ position: "absolute" }}
    >
      <g stroke={color} strokeWidth={stroke} strokeLinecap="round" fill="none">
        <line x1="16" y1="2" x2="16" y2="30" />
        <line x1="4" y1="9" x2="28" y2="23" />
        <line x1="4" y1="23" x2="28" y2="9" />
      </g>
    </svg>
  );
}

const FONT_BASE =
  "https://cdn.jsdelivr.net/fontsource/fonts/playfair-display@latest/";

async function loadFont(weight: 400 | 700): Promise<ArrayBuffer> {
  const url = `${FONT_BASE}latin-${weight}-normal.ttf`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(
      `Could not fetch Playfair Display ${weight} from ${url} (status ${res.status})`,
    );
  }
  return res.arrayBuffer();
}

export default async function OpengraphImage() {
  /* Fetch both weights in parallel. Satori expects a separate font
     entry per (family, weight) tuple, so two TTFs in this slot — not
     one variable font. */
  const [fontRegular, fontBold] = await Promise.all([
    loadFont(400),
    loadFont(700),
  ]);

  /* Satori runs the styles; no class names, no Tailwind. */
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          backgroundColor: "#240B14", /* --plum */
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "80px 80px",
          fontFamily: '"Playfair Display"',
          color: "#F9F6F0", /* --cream */
          position: "relative",
        }}
      >
        {/* The asterisk mark. Same six-ray shape as app/icon.svg, but
            sized for a 1200×630 frame: roughly 14% of the width. */}
        <Asterisk x={520} y={92} markSize={160} color="#F9F6F0" />

        {/* Wordmark */}
        <div
          style={{
            display: "flex",
            fontSize: 92,
            fontWeight: 700,
            letterSpacing: "0.04em",
            textTransform: "uppercase",
            marginTop: 36,
          }}
        >
          Hotel Bageecha
        </div>

        {/* Hairline */}
        <div
          style={{
            width: 120,
            height: 1,
            backgroundColor: "rgba(249, 246, 240, 0.34)",
            marginTop: 32,
          }}
        />

        {/* Tagline */}
        <div
          style={{
            display: "flex",
            fontSize: 32,
            fontWeight: 400,
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            marginTop: 32,
            color: "rgba(249, 246, 240, 0.74)",
          }}
        >
          Restaurant · Terrace Lounge · Bar
        </div>

        {/* Pin */}
        <div
          style={{
            display: "flex",
            fontSize: 22,
            fontWeight: 400,
            letterSpacing: "0.28em",
            textTransform: "uppercase",
            marginTop: 18,
            color: "rgba(249, 246, 240, 0.6)",
          }}
        >
          Virar · Maharashtra
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Playfair Display", data: fontRegular, weight: 400, style: "normal" },
        { name: "Playfair Display", data: fontBold, weight: 700, style: "normal" },
      ],
    },
  );
}
