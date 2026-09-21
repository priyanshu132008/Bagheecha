"use client";

import { useMemo, useState, useTransition } from "react";

import {
  addDishAction,
  deleteDishAction,
  updateDishAction,
  type PriceField,
} from "@/app/(admin)/admin/_actions/menu";

import { formatPrice, type Price } from "@/lib/constants/menu";
import { cn } from "@/lib/utils";

type CategoryRow = {
  id: string;
  slug: string;
  name: string;
  display_order: number;
};

type GroupRow = {
  id: string;
  slug: string;
  name: string;
  food_category_id: string;
  display_order: number;
};

type DishRow = {
  id: string;
  name: string;
  price_half: number | null;
  price_full: number | null;
  price_single: number | null;
  note: string | null;
  on_request: boolean;
  is_featured: boolean;
  image_url: string | null;
  display_order: number;
  food_group_id: string;
};

const priceFromRow = (d: DishRow): Price | undefined => {
  if (d.on_request) return undefined;
  if (d.price_half != null && d.price_full != null) {
    return [Number(d.price_half), Number(d.price_full)];
  }
  if (d.price_single != null) return Number(d.price_single);
  return undefined;
};

/**
 * The kitchen-menu manager.
 *
 * Layout: search input + group filter on top, a table of all dishes
 * sorted by category/group/display_order. Each row has a featured
 * toggle (with `revalidatePath` firing the public page), an Edit
 * inline form, and a delete button.
 *
 * The "Add new dish" form sits below the table. It calls
 * `addDishAction`, which inserts via the service-role client and
 * revalidates `/` and `/admin`.
 *
 * `useTransition` keeps the table interactive while the action runs;
 * the new row appears in place once `router.refresh()` runs on the
 * server. We deliberately don't auto-refresh here — the user's own
 * re-render after the action resolves triggers the updated `dishes`
 * prop on the next navigation.
 */
export function KitchenManager({
  categories,
  groups,
  dishes,
}: {
  categories: CategoryRow[];
  groups: GroupRow[];
  dishes: DishRow[];
}) {
  const [query, setQuery] = useState("");
  const [groupFilter, setGroupFilter] = useState<string>("all");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const groupById = useMemo(
    () => new Map(groups.map((g) => [g.id, g])),
    [groups],
  );
  const catById = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return dishes.filter((d) => {
      if (groupFilter !== "all" && d.food_group_id !== groupFilter) return false;
      if (q && !d.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [dishes, query, groupFilter]);

  const toggleFeatured = (row: DishRow) => {
    startTransition(async () => {
      setError(null);
      const res = await updateDishAction({
        id: row.id,
        isFeatured: !row.is_featured,
      });
      if (!res.ok) setError(res.error);
    });
  };

  const removeDish = (row: DishRow) => {
    if (!confirm(`Delete "${row.name}"?`)) return;
    startTransition(async () => {
      setError(null);
      const res = await deleteDishAction(row.id);
      if (!res.ok) setError(res.error);
    });
  };

  return (
    <div className="flex flex-col gap-12">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center md:gap-4">
          <input
            type="search"
            placeholder="Search dishes…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border border-line bg-surface px-4 py-3 text-[13px] text-ink outline-none focus:border-line-strong md:w-72"
          />
          <select
            value={groupFilter}
            onChange={(e) => setGroupFilter(e.target.value)}
            className="border border-line bg-surface px-4 py-3 text-[13px] text-ink outline-none focus:border-line-strong"
          >
            <option value="all">All groups</option>
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {catById.get(g.food_category_id)?.name} · {g.name}
              </option>
            ))}
          </select>
        </div>
        <span className="text-[10px] uppercase tracking-[0.24em] text-ink-muted">
          {filtered.length} of {dishes.length} dishes
        </span>
      </header>

      {error && (
        <p
          role="alert"
          className="border border-vermillion/60 bg-vermillion/10 px-4 py-3 text-[12px] leading-5 text-cream"
        >
          {error}
        </p>
      )}

      <div className="overflow-x-auto border border-line">
        <table className="w-full min-w-[820px] border-collapse text-left text-[13px] text-ink">
          <thead>
            <tr className="border-b border-line bg-surface-sunk text-[10px] uppercase tracking-[0.22em] text-ink-muted">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Group</th>
              <th className="px-4 py-3 font-medium">Price</th>
              <th className="px-4 py-3 font-medium">Featured</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((d) => {
              const g = groupById.get(d.food_group_id);
              const c = g ? catById.get(g.food_category_id) : undefined;
              const price = priceFromRow(d);
              return (
                <tr
                  key={d.id}
                  className={cn(
                    "border-b border-line last:border-b-0",
                    pending && "opacity-60",
                  )}
                >
                  <td className="px-4 py-3 align-top">
                    <p className="font-medium text-ink">{d.name}</p>
                    {d.note && (
                      <p className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-ink-faint">
                        {d.note}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top text-ink-muted">
                    {c?.name}
                    <span className="mx-1.5 text-ink-faint">·</span>
                    {g?.name}
                  </td>
                  <td className="px-4 py-3 align-top text-ink">
                    {d.on_request ? (
                      <span className="text-ink-muted">Ask</span>
                    ) : price !== undefined ? (
                      formatPrice(price)
                    ) : (
                      <span className="text-ink-faint">—</span>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <button
                      type="button"
                      onClick={() => toggleFeatured(d)}
                      aria-pressed={d.is_featured}
                      className={cn(
                        "border px-3 py-1 text-[10px] uppercase tracking-[0.22em] transition-colors",
                        d.is_featured
                          ? "border-vermillion bg-vermillion/20 text-cream"
                          : "border-line-strong text-ink-faint hover:text-ink",
                      )}
                    >
                      {d.is_featured ? "Featured" : "Mark"}
                    </button>
                  </td>
                  <td className="px-4 py-3 align-top text-right">
                    <button
                      type="button"
                      onClick={() => removeDish(d)}
                      className="border border-line px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-ink-faint transition-colors hover:border-vermillion hover:text-cream"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              );
            })}
            {filtered.length === 0 && (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-12 text-center text-[12px] text-ink-muted"
                >
                  No dishes match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AddDishForm
        groups={groups}
        catById={catById}
        onSubmit={async (input) => {
          startTransition(async () => {
            setError(null);
            const res = await addDishAction(input);
            if (!res.ok) setError(res.error);
          });
        }}
        pending={pending}
      />
    </div>
  );
}

/* ------------------------------------------------------------------
   Add-dish form
------------------------------------------------------------------- */

function AddDishForm({
  groups,
  catById,
  onSubmit,
  pending,
}: {
  groups: GroupRow[];
  catById: Map<string, CategoryRow>;
  onSubmit: (input: {
    foodGroupId: string;
    name: string;
    price: PriceField;
    note?: string | null;
  }) => void;
  pending: boolean;
}) {
  const [groupId, setGroupId] = useState(groups[0]?.id ?? "");
  const [name, setName] = useState("");
  const [priceKind, setPriceKind] = useState<"half-full" | "single" | "on-request">("half-full");
  const [half, setHalf] = useState("");
  const [full, setFull] = useState("");
  const [single, setSingle] = useState("");
  const [note, setNote] = useState("");

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!groupId || !name.trim()) return;

    let price: PriceField;
    if (priceKind === "half-full") {
      price = { kind: "half-full", half: Number(half), full: Number(full) };
    } else if (priceKind === "single") {
      price = { kind: "single", single: Number(single) };
    } else {
      price = { kind: "on-request" };
    }

    onSubmit({
      foodGroupId: groupId,
      name: name.trim(),
      price,
      note: note.trim() || null,
    });

    setName("");
    setHalf("");
    setFull("");
    setSingle("");
    setNote("");
  };

  return (
    <form
      onSubmit={submit}
      className="border border-line-strong bg-surface-sunk p-6 md:p-8"
    >
      <h2 className="font-display text-2xl font-normal leading-tight tracking-[-0.02em] text-ink">
        Add a dish
      </h2>
      <p className="mt-2 text-[12px] leading-5 text-ink-muted">
        Pick a group, name the dish, choose a price shape. The row lands in the
        category at the bottom — reorder by editing <code>display_order</code> in
        Supabase directly.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-[10px] uppercase tracking-[0.24em] text-ink-muted">
            Group
          </span>
          <select
            required
            value={groupId}
            onChange={(e) => setGroupId(e.target.value)}
            className="border border-line bg-surface px-4 py-3 text-[14px] text-ink outline-none focus:border-line-strong"
          >
            {groups.map((g) => (
              <option key={g.id} value={g.id}>
                {catById.get(g.food_category_id)?.name} · {g.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-2">
          <span className="text-[10px] uppercase tracking-[0.24em] text-ink-muted">
            Name
          </span>
          <input
            required
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="border border-line bg-surface px-4 py-3 text-[14px] text-ink outline-none focus:border-line-strong"
          />
        </label>

        <label className="flex flex-col gap-2 md:col-span-2">
          <span className="text-[10px] uppercase tracking-[0.24em] text-ink-muted">
            Note (optional)
          </span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Boneless · Spicy"
            className="border border-line bg-surface px-4 py-3 text-[14px] text-ink outline-none focus:border-line-strong"
          />
        </label>

        <fieldset className="md:col-span-2">
          <legend className="text-[10px] uppercase tracking-[0.24em] text-ink-muted">
            Price shape
          </legend>
          <div className="mt-2 flex flex-wrap gap-2">
            {(
              [
                { id: "half-full" as const, label: "Half / Full" },
                { id: "single" as const, label: "Single price" },
                { id: "on-request" as const, label: "On request" },
              ]
            ).map((opt) => (
              <button
                key={opt.id}
                type="button"
                onClick={() => setPriceKind(opt.id)}
                aria-pressed={priceKind === opt.id}
                className={cn(
                  "border px-4 py-2 text-[10px] uppercase tracking-[0.24em] transition-colors",
                  priceKind === opt.id
                    ? "border-action bg-action text-action-ink"
                    : "border-line-strong text-ink-faint hover:text-ink",
                )}
              >
                {opt.label}
              </button>
            ))}
          </div>

          <div className="mt-4 grid grid-cols-2 gap-3">
            {priceKind === "half-full" && (
              <>
                <input
                  required
                  type="number"
                  step="0.01"
                  placeholder="Half"
                  value={half}
                  onChange={(e) => setHalf(e.target.value)}
                  className="border border-line bg-surface px-4 py-3 text-[14px] text-ink outline-none focus:border-line-strong"
                />
                <input
                  required
                  type="number"
                  step="0.01"
                  placeholder="Full"
                  value={full}
                  onChange={(e) => setFull(e.target.value)}
                  className="border border-line bg-surface px-4 py-3 text-[14px] text-ink outline-none focus:border-line-strong"
                />
              </>
            )}
            {priceKind === "single" && (
              <input
                required
                type="number"
                step="0.01"
                placeholder="Price"
                value={single}
                onChange={(e) => setSingle(e.target.value)}
                className="col-span-2 border border-line bg-surface px-4 py-3 text-[14px] text-ink outline-none focus:border-line-strong"
              />
            )}
            {priceKind === "on-request" && (
              <p className="col-span-2 text-[12px] leading-5 text-ink-muted">
                The dish prints as <span className="text-ink">Ask</span> and
                carries no figure — the seafood list uses this for APS pricing.
              </p>
            )}
          </div>
        </fieldset>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-6 bg-action px-6 py-3 text-[10px] uppercase tracking-[0.28em] text-action-ink transition-opacity disabled:opacity-50"
      >
        {pending ? "Adding…" : "Add dish"}
      </button>
    </form>
  );
}
