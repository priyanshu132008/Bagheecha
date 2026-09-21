"use client";

import { useId, useMemo, useState, type FormEvent } from "react";

import { MaskReveal } from "@/components/motion/MaskReveal";
import { ActionButton } from "@/components/ui/ActionButton";
import {
  CONTACT,
  H2_MASSIVE,
  LEDE,
  ZONES,
  waLink,
} from "@/lib/constants/site";
import { cn } from "@/lib/utils";

/**
 * Reserve — the closing chapter, polished.
 *
 * The Phase 3 build parked two CTAs in this section ("Reserve on
 * WhatsApp" + "Call the Hotel"). Turn 10 replaces the first one with a
 * client-side form: the guest fills in five fields, hits the submit
 * button, and we launch WhatsApp with a freshly-composed message in
 * the same order the desk already reads (`RESERVATION_MESSAGE` in
 * `lib/constants/site.ts` is the source of truth for that order).
 *
 * The architecture mirrors `OrderOnline.tsx`: a single client
 * component, mounted from `app/page.tsx`, owning its own form state.
 * The surrounding section, heading and lede are byte-equivalent to
 * the previous build — what changes is what lives under the lede.
 *
 * SECTION RAIL. The wider `WideSection` rail (column 2) is kept so
 * the `#visit` / `#reserve` pair reads as one closing book. The
 * `e2e/hero.spec.ts` rail-geometry assertion (`#reserve h2` x equals
 * `#visit h2` x, both greater than the eyebrow rail) keeps passing
 * because the heading column (`col-span-12 lg:col-span-10`) is
 * unchanged.
 *
 * FORM AS THE PRIMARY ACTION. The submit button is the section's
 * only solid `primary` button. "Call the hotel" sits below as a
 * quiet `secondary` — the brief lists it as a fallback for guests
 * who would rather dial than type, and on this page the form *is*
 * the conversion.
 *
 * The submit handler composes the message in the same field order as
 * `RESERVATION_MESSAGE` so the desk reads it the way it already does.
 * "Preferred Seating" is the heading the desk expects; the form's
 * `seating` field carries the guest's choice verbatim from `ZONES`
 * (so a rename in `site.ts` updates both at once).
 *
 * ACCENT ON ERRORS. Vermillion-ink (`#B8321F`) is the only form
 * small accent text that clears AA on cream (5.54:1) — see the
 * "AUBERGINE & CREAM" note in `app/globals.css`. Inline errors use
 * it in `text-[11px] uppercase tracking-[0.22em]` for the same
 * reason the eyebrows do: small text, extreme tracking, deliberately
 * quiet so the form doesn't shout.
 *
 * NO BACKEND. The brief is explicit: the form is client-side, the
 * payload is a WhatsApp launch. The Supabase reservation backend is
 * the partner's scope; this section is the guest's surface for now.
 */

const FIELD_LABEL =
  "text-[10px] uppercase tracking-[0.28em] text-ink-faint";

const FIELD_INPUT_BASE =
  "block w-full min-h-14 rounded-xs border bg-transparent px-4 text-[15px] text-ink " +
  "placeholder:text-ink-faint " +
  "transition-colors duration-300 ease-[cubic-bezier(0.32,0.72,0,1)] " +
  "focus:outline-none focus:ring-2 focus:ring-ink focus:ring-offset-2 focus:ring-offset-surface";

const FIELD_INPUT_RESTING = "border-line focus:border-line-strong";
const FIELD_INPUT_INVALID =
  "border-vermillion-ink focus:border-vermillion-ink focus:ring-vermillion-ink";

const FIELD_ERROR = "mt-2 text-[11px] uppercase tracking-[0.22em] text-vermillion-ink";

const NO_PREFERENCE = "No preference" as const;

/** Per-field error message. `null` means no error. */
type Errors = Partial<{
  name: string;
  guests: string;
  date: string;
  time: string;
  seating: string;
}>;

const SEATING_OPTIONS: ReadonlyArray<{ value: string; label: string }> = [
  ...ZONES.map((z) => ({ value: z.id, label: z.name })),
  { value: NO_PREFERENCE, label: NO_PREFERENCE },
];

/**
 * Today's date in `YYYY-MM-DD` form, the format `<input type="date">`
 * expects for its `min` attribute. Computed once at module load — the
 * form does not need to roll forward at midnight during a session,
 * and a server/client mismatch on this is irrelevant because the
 * field is empty until the guest picks a date.
 */
const TODAY_ISO = new Date().toISOString().slice(0, 10);

/** Validate the form. Returns a populated `Errors` object if any
 *  field failed, or `{}` if everything is fine. */
function validate(values: {
  name: string;
  guests: string;
  date: string;
  time: string;
  seating: string;
}): Errors {
  const errors: Errors = {};

  if (!values.name.trim()) {
    errors.name = "Please tell us your name.";
  }

  const n = Number(values.guests);
  if (!values.guests || !Number.isInteger(n) || n < 1) {
    errors.guests = "How many guests?";
  } else if (n > 50) {
    errors.guests = "For groups above 50, please call us.";
  }

  if (!values.date) {
    errors.date = "Pick a date.";
  } else if (values.date < TODAY_ISO) {
    errors.date = "Pick a future date.";
  }

  if (!values.time) {
    errors.time = "Pick a time.";
  }

  if (!values.seating) {
    errors.seating = "Pick a seating.";
  }

  return errors;
}

function ReservationForm() {
  // `useId` keeps the label-for / input-id pairing deterministic
  // across server and client renders; the form is client-only but the
  // section is server-rendered, so we still want stable ids in the SSR
  // markup.
  const baseId = useId();
  const nameId = `${baseId}-name`;
  const guestsId = `${baseId}-guests`;
  const dateId = `${baseId}-date`;
  const timeId = `${baseId}-time`;
  const seatingId = `${baseId}-seating`;

  const [name, setName] = useState("");
  const [guests, setGuests] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [seating, setSeating] = useState("");
  const [errors, setErrors] = useState<Errors>({});

  // The submit only re-validates when called; we don't want a
  // re-render on every keystroke. `errors` is set on submit and
  // cleared when the guest changes the offending field.
  const handleSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const next = validate({ name, guests, date, time, seating });
    setErrors(next);
    if (Object.keys(next).length > 0) {
      // Move focus to the first invalid field so a screen reader
      // user hears the error and a keyboard user lands where the fix
      // is needed. `useId` keys are stable across renders.
      const firstKey = Object.keys(next)[0]!;
      const id = {
        name: nameId,
        guests: guestsId,
        date: dateId,
        time: timeId,
        seating: seatingId,
      }[firstKey];
      if (id) {
        const el = document.getElementById(id);
        if (el && "focus" in el) (el as HTMLInputElement).focus();
      }
      return;
    }

    // Field order matches `RESERVATION_MESSAGE` in `site.ts` so the
    // desk reads it in the order they already know.
    const preferredSeating = SEATING_OPTIONS.find((o) => o.value === seating)?.label ?? seating;
    const message =
      `Hi Hotel Bagheecha! I would like to reserve a table.\n\n` +
      `Name: ${name.trim()}\n` +
      `Number of People: ${guests}\n` +
      `Date: ${date}\n` +
      `Time: ${time}\n` +
      `Preferred Seating: ${preferredSeating}\n`;

    window.open(waLink(message), "_blank", "noopener,noreferrer");
  };

  // Clear a field's error as soon as the guest edits it. The submit
  // button re-runs the full validate() so a new error elsewhere
  // still surfaces.
  const clearError = (key: keyof Errors) => () => {
    setErrors((prev) => {
      if (!(key in prev)) return prev;
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  // Memoised class strings so a re-render from validation doesn't
  // recompute every field's className. The invalid flag is the only
  // thing that flips per field.
  const nameCls = useMemo(
    () =>
      cn(FIELD_INPUT_BASE, errors.name ? FIELD_INPUT_INVALID : FIELD_INPUT_RESTING),
    [errors.name],
  );
  const guestsCls = useMemo(
    () =>
      cn(FIELD_INPUT_BASE, errors.guests ? FIELD_INPUT_INVALID : FIELD_INPUT_RESTING),
    [errors.guests],
  );
  const dateCls = useMemo(
    () =>
      cn(FIELD_INPUT_BASE, errors.date ? FIELD_INPUT_INVALID : FIELD_INPUT_RESTING),
    [errors.date],
  );
  const timeCls = useMemo(
    () =>
      cn(FIELD_INPUT_BASE, errors.time ? FIELD_INPUT_INVALID : FIELD_INPUT_RESTING),
    [errors.time],
  );
  const seatingCls = useMemo(
    () =>
      cn(FIELD_INPUT_BASE, errors.seating ? FIELD_INPUT_INVALID : FIELD_INPUT_RESTING),
    [errors.seating],
  );

  return (
    <form
      noValidate
      onSubmit={handleSubmit}
      aria-describedby={`${baseId}-help`}
      className="mt-10"
    >
      <p
        id={`${baseId}-help`}
        className="sr-only"
      >
        Five fields are required. Submitting opens WhatsApp with your
        details pre-filled.
      </p>

      <div className="grid grid-cols-1 gap-x-6 gap-y-6 md:grid-cols-2 md:gap-y-7">
        {/* Name — full width on every breakpoint so the field is the
            same shape regardless of column count. */}
        <div className="md:col-span-1">
          <label htmlFor={nameId} className={FIELD_LABEL}>
            Name
          </label>
          <input
            id={nameId}
            name="name"
            type="text"
            autoComplete="name"
            required
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              clearError("name")();
            }}
            aria-invalid={errors.name ? "true" : undefined}
            aria-describedby={errors.name ? `${nameId}-error` : undefined}
            placeholder="Your name"
            className={`mt-3 ${nameCls}`}
          />
          {errors.name && (
            <p id={`${nameId}-error`} role="alert" className={FIELD_ERROR}>
              {errors.name}
            </p>
          )}
        </div>

        {/* Guests — number input with sensible floor / ceiling. The
            brief's "a party of twenty" plus headroom = 50; the browser
            spinner stops there, the validator stops at 50 just in
            case. */}
        <div className="md:col-span-1">
          <label htmlFor={guestsId} className={FIELD_LABEL}>
            Guests
          </label>
          <input
            id={guestsId}
            name="guests"
            type="number"
            inputMode="numeric"
            min={1}
            max={50}
            required
            value={guests}
            onChange={(e) => {
              setGuests(e.target.value);
              clearError("guests")();
            }}
            aria-invalid={errors.guests ? "true" : undefined}
            aria-describedby={errors.guests ? `${guestsId}-error` : undefined}
            placeholder="2"
            className={`mt-3 ${guestsCls}`}
          />
          {errors.guests && (
            <p id={`${guestsId}-error`} role="alert" className={FIELD_ERROR}>
              {errors.guests}
            </p>
          )}
        </div>

        {/* Date — native picker; `min` blocks past dates at the input
            level, the validator catches it too in case the browser is
            permissive. */}
        <div className="md:col-span-1">
          <label htmlFor={dateId} className={FIELD_LABEL}>
            Date
          </label>
          <input
            id={dateId}
            name="date"
            type="date"
            min={TODAY_ISO}
            required
            value={date}
            onChange={(e) => {
              setDate(e.target.value);
              clearError("date")();
            }}
            aria-invalid={errors.date ? "true" : undefined}
            aria-describedby={errors.date ? `${dateId}-error` : undefined}
            className={`mt-3 ${dateCls}`}
          />
          {errors.date && (
            <p id={`${dateId}-error`} role="alert" className={FIELD_ERROR}>
              {errors.date}
            </p>
          )}
        </div>

        {/* Time — native picker. No `min` here because the choice
            depends on the date; if the guest picks today + 02:00 and
            it's 03:00 now, the desk will simply reschedule. */}
        <div className="md:col-span-1">
          <label htmlFor={timeId} className={FIELD_LABEL}>
            Time
          </label>
          <input
            id={timeId}
            name="time"
            type="time"
            required
            value={time}
            onChange={(e) => {
              setTime(e.target.value);
              clearError("time")();
            }}
            aria-invalid={errors.time ? "true" : undefined}
            aria-describedby={errors.time ? `${timeId}-error` : undefined}
            className={`mt-3 ${timeCls}`}
          />
          {errors.time && (
            <p id={`${timeId}-error`} role="alert" className={FIELD_ERROR}>
              {errors.time}
            </p>
          )}
        </div>

        {/* Seating — spans both columns at `md+` so the select sits
            on its own row, the way a single decision reads. The four
            options come straight from `ZONES` plus the "No
            preference" escape hatch the brief specifies. */}
        <div className="md:col-span-2">
          <label htmlFor={seatingId} className={FIELD_LABEL}>
            Seating
          </label>
          <select
            id={seatingId}
            name="seating"
            required
            value={seating}
            onChange={(e) => {
              setSeating(e.target.value);
              clearError("seating")();
            }}
            aria-invalid={errors.seating ? "true" : undefined}
            aria-describedby={errors.seating ? `${seatingId}-error` : undefined}
            className={`mt-3 appearance-none ${seatingCls}`}
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath fill='none' stroke='%23240B14' stroke-width='1.2' stroke-linecap='round' stroke-linejoin='round' d='M1 1.5 6 6.5 11 1.5'/%3E%3C/svg%3E\")",
              backgroundRepeat: "no-repeat",
              backgroundPosition: "right 1.1rem center",
              paddingRight: "2.75rem",
            }}
          >
            <option value="" disabled>
              Choose a room
            </option>
            {SEATING_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {errors.seating && (
            <p id={`${seatingId}-error`} role="alert" className={FIELD_ERROR}>
              {errors.seating}
            </p>
          )}
        </div>
      </div>

      {/* The submit + call stack. `mt-8` is the body-to-CTA rhythm
          (40px) the polish brief formalises as `.rhythm-body-cta` —
          inline here because the form sits on its own and that
          utility would be the only other one to mention. */}
      <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:items-center sm:gap-4">
        <ActionButton
          type="submit"
          variant="primary"
          size="lg"
          cursor="cta"
          cursorLabel="WhatsApp"
          className="w-full justify-center sm:w-auto"
        >
          Reserve on WhatsApp
        </ActionButton>
        <ActionButton
          href={CONTACT.call.href}
          variant="secondary"
          size="lg"
          cursor="hover"
          className="w-full justify-center sm:w-auto"
        >
          Call the hotel
        </ActionButton>
      </div>
    </form>
  );
}

/**
 * The section. The wrapper is a server-renderable shell — the form
 * is the only client island inside it — but the section is mounted
 * from a server component (`app/page.tsx`), so it stays `"use client"`
 * for symmetry with `OrderOnline.tsx`. The MaskReveal-driven reveal
 * is the same primitive the rest of the closing chapters use.
 */
export default function Reserve() {
  return (
    <section
      id="reserve"
      data-tone="light"
      className="section-pad bg-surface"
    >
      <div className="container-x grid grid-cols-12 gap-x-6 gap-y-8">
        <div className="col-span-12 lg:col-span-2">
          <MaskReveal as="p" className="eyebrow" duration={0.8}>
            Reservations
          </MaskReveal>
        </div>

        <div className="col-span-12 lg:col-span-10">
          <h2 className={H2_MASSIVE}>
            <MaskReveal className="text-balance">
              Reserve your table.
            </MaskReveal>
          </h2>

          <MaskReveal delay={0.12} duration={0.9}>
            <p className={`mt-6 ${LEDE}`}>
              Tell us the date, the time and how many are coming, and
              we&apos;ll hold it — on the terrace, in the AC room or in
              the classic dining hall. A table for two and a party of
              twenty are the same phone call.
            </p>
          </MaskReveal>

          <MaskReveal delay={0.22} duration={0.9}>
            <ReservationForm />
          </MaskReveal>
        </div>
      </div>
    </section>
  );
}
