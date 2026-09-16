import {
  CompassGlyph,
  PhoneGlyph,
  WhatsAppGlyph,
} from "@/components/ui/icons";
import { CONTACT, LOCATION } from "@/lib/constants/site";
import { cn } from "@/lib/utils";

/**
 * MobileActionBar — the three things a guest on a phone actually wants.
 *
 * Thumb-reachable, always on screen, and never rendered on desktop
 * (`md:hidden`): on a laptop these are all one click away in the page
 * body, and a permanent bottom bar would just eat vertical space.
 *
 * Each item is a real link — `wa.me` with the enquiry pre-filled, a
 * `tel:` URL that opens the dialler, and a Maps directions URL that
 * hands off to native turn-by-turn navigation.
 *
 * Z-INDEX: this sits at `z-30`, *below* the mobile drawer (`z-40`) and
 * the header (`z-50`). It has to — otherwise the bar would float over
 * an open menu and its buttons would be tappable through the overlay.
 *
 * No hooks and no client directive: it is pure markup, so it ships zero
 * JavaScript.
 */

type QuickAction = {
  key: string;
  label: string;
  href: string;
  Icon: typeof WhatsAppGlyph;
  /** Opens the OS dialler / Maps app rather than a new tab. */
  external?: boolean;
  /**
   * The lead action — WhatsApp is how India books tables. Marked in
   * full-strength plum against `ink-faint` for the other two: the
   * bar is ranked by value rather than by hue, which is the whole
   * editorial idea. (Champagne would be the obvious "accent" here and
   * is unusable — at 1.6:1 on cream it is not a colour, it is a
   * smudge.)
   */
  primary?: boolean;
};

const ACTIONS: QuickAction[] = [
  {
    key: "whatsapp",
    label: "WhatsApp",
    href: CONTACT.whatsapp.href,
    Icon: WhatsAppGlyph,
    external: true,
    primary: true,
  },
  {
    key: "call",
    label: "Call",
    href: CONTACT.call.href,
    Icon: PhoneGlyph,
  },
  {
    key: "directions",
    label: "Directions",
    href: LOCATION.directionsHref,
    Icon: CompassGlyph,
    external: true,
  },
];

export default function MobileActionBar() {
  return (
    <nav
      aria-label="Quick actions"
      data-tone="light"
      className="fixed inset-x-0 bottom-0 z-30 md:hidden"
    >
      <div className="border-t border-line bg-cream/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-md">
        <ul className="grid grid-cols-3">
          {ACTIONS.map(({ key, label, href, Icon, external, primary }, i) => (
            <li key={key} className={cn(i > 0 && "border-l border-line")}>
              <a
                href={href}
                data-cursor="hover"
                {...(external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : undefined)}
                className={cn(
                  // min-h-14 = 56px: comfortably past the 48px touch target
                  "group flex min-h-14 flex-col items-center justify-center gap-1 px-2 py-2",
                  "transition-colors duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]",
                  "active:bg-plum/[0.06]",
                  primary ? "text-plum" : "text-ink-muted",
                )}
              >
                <Icon className="size-5 transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] group-active:scale-90" />
                <span
                  className={cn(
                    "text-[10px] font-medium uppercase tracking-[0.14em]",
                    primary ? "text-plum" : "text-ink-faint",
                  )}
                >
                  {label}
                </span>
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
