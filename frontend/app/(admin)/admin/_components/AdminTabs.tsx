"use client";

import { useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * The dashboard's tablist.
 *
 * Same pattern as the public `#menus` toggle: a `role="tablist"` with
 * a sliding indicator. The two panels are mounted into DOM and hidden
 * with `hidden` rather than unmounted on switch — `revalidatePath` is
 * the source of truth for fresh data, and remounting would discard any
 * unsaved form state.
 */
export function AdminTabs({
  kitchen,
  bar,
}: {
  kitchen: ReactNode;
  bar: ReactNode;
}) {
  const [tab, setTab] = useState<"kitchen" | "bar">("kitchen");

  return (
    <div className="mt-14">
      <div
        role="tablist"
        aria-label="Admin sections"
        className="inline-flex border border-line-strong p-1"
      >
        {(
          [
            { id: "kitchen" as const, label: "Kitchen Menu" },
            { id: "bar" as const, label: "Bar Menu" },
          ]
        ).map((t) => {
          const isActive = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`admin-panel-${t.id}`}
              onClick={() => setTab(t.id)}
              className="relative px-6 py-3 text-[10px] uppercase tracking-[0.28em] transition-colors"
            >
              <span
                aria-hidden="true"
                className={cn(
                  "absolute inset-0 -z-0 bg-action transition-opacity",
                  isActive ? "opacity-100" : "opacity-0",
                )}
              />
              <span
                className={cn(
                  "relative transition-colors",
                  isActive ? "text-action-ink" : "text-ink-faint",
                )}
              >
                {t.label}
              </span>
            </button>
          );
        })}
      </div>

      <div
        id="admin-panel-kitchen"
        role="tabpanel"
        hidden={tab !== "kitchen"}
        className="mt-10"
      >
        {kitchen}
      </div>

      <div
        id="admin-panel-bar"
        role="tabpanel"
        hidden={tab !== "bar"}
        className="mt-10"
      >
        {bar}
      </div>
    </div>
  );
}
