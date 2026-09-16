# CLAUDE.md - Developer 1 (Frontend & Experience Architect)

## 1. Environment & Commands
- **Framework:** Next.js 14+ (App Router, React 18+, TypeScript)
- **Styling:** Tailwind CSS + Custom CSS Variables
- **Development Server:** `npm run dev`
- **Production Build:** `npm run build`
- **E2E Testing:** `npx playwright test`

## 2. Design System & Theme Directives ("Midnight Reserve")
- **Background:** Primary Deep Charcoal (`#121212`), Secondary Dark (`#0A0A0A`)
- **Accents:** Brushed Gold (`#D4AF37`), Copper (`#B87333`)
- **Typography:** 
  - Headings: `Playfair Display` or `Cormorant Garamond` (Serif)
  - Body/UI/Prices: `Inter` or `DM Sans` (Sans-Serif)
- **Visual Aesthetic:** Dark-mode luxury, high contrast, warm mood lighting imagery, glassmorphism overlays (`backdrop-blur-md`). ZERO generic white-background layouts or default Tailwind templates.

## 3. Frontend Architecture Rules
- Use clean client-side component separation (`"use client"`) strictly for interactive canvases, cursor trackers, and Framer Motion wrappers.
- **Three.js / WebGL Guidelines:** Render canvases inside absolute background wrappers with `pointer-events-none` so interactive HTML elements are never blocked. Optimize animation loops with `requestAnimationFrame`.
- **Framer Motion Rules:** Prefer staggered reveals (`staggerChildren`), subtle scale transitions, and spring physics over harsh linear easing.
- **Micro-Interactions:** Custom cursor glow/tracing that expands or changes state when hovering over primary CTAs (e.g., "Reserve Table", "View Bar Menu").

## 4. Work Scope Boundary
- Focus **100% on UI/UX, animations, WebGL canvas, and responsive design**.
- Connect form inputs to mock states or pass structured payloads to the API endpoints managed by Dev 2.