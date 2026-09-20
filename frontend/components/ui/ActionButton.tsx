"use client";

/**
 * ActionButton — DEPRECATED ALIAS for `<Button>`.
 *
 * The polish brief (2026-09-20, G4) renamed the variant nomenclature
 * and tightened the geometry. The single canonical component lives at
 * `components/ui/Button.tsx`; this file exists only as a re-export so
 * existing imports keep resolving without touching every call site.
 *
 * MIGRATION
 *   Every existing call site still uses `variant="solid"` (now `primary`)
 *   or `variant="outline"` (now `secondary`). Replace at your leisure;
 *   the props below stay identical so a search-and-replace is mechanical:
 *
 *     variant="solid"   -> variant="primary"
 *     variant="outline" -> variant="secondary"
 *     size="sm" | "md"  -> size="md"
 *     size="lg"         -> size="lg"
 *
 * The pre-filled WhatsApp targets, `external` / `target="_blank"`, and
 * the data-cursor attributes are preserved exactly.
 */

export {
  Button as ActionButton,
  type ButtonProps as ActionButtonProps,
  type ButtonVariant,
  type ButtonSize,
} from "@/components/ui/Button";

