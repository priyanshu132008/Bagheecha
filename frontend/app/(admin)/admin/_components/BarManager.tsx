"use client";

import { useMemo, useState, useTransition } from "react";
import type { Json } from "@/lib/supabase/database.types";

import {
  addPourAction,
  deletePourAction,
  updatePourAction,
} from "@/app/(admin)/admin/_actions/menu";

import { cn } from "@/lib/utils";

type BarCategoryRow = {
  id: string;
  slug: string;
  name: string;
  sizes: Json;
  display_order: number;
};

type PourRow = {
  id: string;
  name: string;
  prices: Json;
  note: string | null;
  is_top_shelf: boolean;
  top_shelf_slot: number;
  image_url: string | null;
  display_order: number;
  bar_category_id: string;
};

const sizesOf = (cat: BarCategoryRow): string[] =>
  Array.isArray(cat.sizes) ? (cat.sizes as string[]) : [];

const pricesOf = (row: PourRow): (number | null)[] =>
  Array.isArray(row.prices) ? (row.prices as (number | null)[]) : [];

/**
 * The bar-menu manager.
 *
 * Same shape as `KitchenManager` — search, category filter, table,
 * add form. The price column renders the full `(750, 180, 90, 60,
 * 30)` matrix inline so the admin sees the null positions as dashes,
 * mirroring `Menu.tsx:871`. A "Top shelf" toggle marks the row for
 * the bottle polaroid.
 */
export function BarManager({
  categories,
  pours,
}: {
  categories: BarCategoryRow[];
  pours: PourRow[];
}) {
  const [query, setQuery] = useState("");
  const [categoryFilter, setCategoryFilter] = useState<string>("all");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  const catById = useMemo(
    () => new Map(categories.map((c) => [c.id, c])),
    [categories],
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return pours.filter((p) => {
      if (categoryFilter !== "all" && p.bar_category_id !== categoryFilter)
        return false;
      if (q && !p.name.toLowerCase().includes(q)) return false;
      return true;
    });
  }, [pours, query, categoryFilter]);

  const toggleTopShelf = (row: PourRow) => {
    startTransition(async () => {
      setError(null);
      const res = await updatePourAction({
        id: row.id,
        isTopShelf: !row.is_top_shelf,
        topShelfSlot: !row.is_top_shelf ? 1 : 0,
      });
      if (!res.ok) setError(res.error);
    });
  };

  const removePour = (row: PourRow) => {
    if (!confirm(`Delete "${row.name}"?`)) return;
    startTransition(async () => {
      setError(null);
      const res = await deletePourAction(row.id);
      if (!res.ok) setError(res.error);
    });
  };

  return (
    <div className="flex flex-col gap-12">
      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-1 flex-col gap-3 md:flex-row md:items-center md:gap-4">
          <input
            type="search"
            placeholder="Search pours…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="border border-line bg-surface px-4 py-3 text-[13px] text-ink outline-none focus:border-line-strong md:w-72"
          />
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="border border-line bg-surface px-4 py-3 text-[13px] text-ink outline-none focus:border-line-strong"
          >
            <option value="all">All categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <span className="text-[10px] uppercase tracking-[0.24em] text-ink-muted">
          {filtered.length} of {pours.length} pours
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
        <table className="w-full min-w-[1100px] border-collapse text-left text-[13px] text-ink">
          <thead>
            <tr className="border-b border-line bg-surface-sunk text-[10px] uppercase tracking-[0.22em] text-ink-muted">
              <th className="px-4 py-3 font-medium">Name</th>
              <th className="px-4 py-3 font-medium">Category</th>
              <th className="px-4 py-3 font-medium">Prices</th>
              <th className="px-4 py-3 font-medium">Top shelf</th>
              <th className="px-4 py-3 font-medium text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((p) => {
              const cat = catById.get(p.bar_category_id);
              const sizes = cat ? sizesOf(cat) : [];
              const prices = pricesOf(p);
              return (
                <tr
                  key={p.id}
                  className={cn(
                    "border-b border-line last:border-b-0",
                    pending && "opacity-60",
                  )}
                >
                  <td className="px-4 py-3 align-top">
                    <p className="font-medium text-ink">{p.name}</p>
                    {p.note && (
                      <p className="mt-0.5 text-[10px] uppercase tracking-[0.18em] text-ink-faint">
                        {p.note}
                      </p>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top text-ink-muted">
                    {cat?.name}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <div
                      className="grid gap-x-3"
                      style={{
                        gridTemplateColumns: `repeat(${sizes.length || 1}, minmax(0, 1fr))`,
                      }}
                    >
                      {sizes.map((size, i) => {
                        const v = prices[i];
                        return (
                          <span
                            key={size}
                            className="text-ink"
                            title={size}
                          >
                            {v === null || v === undefined ? (
                              <span className="text-ink-faint">—</span>
                            ) : (
                              v
                            )}
                          </span>
                        );
                      })}
                    </div>
                    {sizes.length === 0 && (
                      <span className="text-ink-faint">No sizes</span>
                    )}
                  </td>
                  <td className="px-4 py-3 align-top">
                    <button
                      type="button"
                      onClick={() => toggleTopShelf(p)}
                      aria-pressed={p.is_top_shelf}
                      className={cn(
                        "border px-3 py-1 text-[10px] uppercase tracking-[0.22em] transition-colors",
                        p.is_top_shelf
                          ? "border-vermillion bg-vermillion/20 text-cream"
                          : "border-line-strong text-ink-faint hover:text-ink",
                      )}
                    >
                      {p.is_top_shelf
                        ? `Slot ${p.top_shelf_slot}`
                        : "Mark"}
                    </button>
                  </td>
                  <td className="px-4 py-3 align-top text-right">
                    <button
                      type="button"
                      onClick={() => removePour(p)}
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
                  No pours match.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <AddPourForm
        categories={categories}
        onSubmit={async (input) => {
          startTransition(async () => {
            setError(null);
            const res = await addPourAction(input);
            if (!res.ok) setError(res.error);
          });
        }}
        pending={pending}
      />
    </div>
  );
}

/* ------------------------------------------------------------------
   Add-pour form
------------------------------------------------------------------- */

function AddPourForm({
  categories,
  onSubmit,
  pending,
}: {
  categories: BarCategoryRow[];
  onSubmit: (input: {
    barCategoryId: string;
    name: string;
    prices: (number | null)[];
    note?: string | null;
  }) => void;
  pending: boolean;
}) {
  const first = categories[0];
  const [catId, setCatId] = useState(first?.id ?? "");
  const cat = categories.find((c) => c.id === catId);
  const sizes = cat ? sizesOf(cat) : [];
  const [name, setName] = useState("");
  const [note, setNote] = useState("");
  const [priceFields, setPriceFields] = useState<string[]>(
    () => sizes.map(() => ""),
  );

  // Reset price fields when the category changes.
  const onChangeCat = (nextId: string) => {
    setCatId(nextId);
    const nextCat = categories.find((c) => c.id === nextId);
    setPriceFields(sizesOf(nextCat ?? categories[0]!).map(() => ""));
  };

  const submit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!catId || !name.trim()) return;
    const prices = priceFields.map((v) => (v.trim() === "" ? null : Number(v)));
    onSubmit({
      barCategoryId: catId,
      name: name.trim(),
      prices,
      note: note.trim() || null,
    });
    setName("");
    setNote("");
    setPriceFields(sizes.map(() => ""));
  };

  return (
    <form
      onSubmit={submit}
      className="border border-line-strong bg-surface-sunk p-6 md:p-8"
    >
      <h2 className="font-display text-2xl font-normal leading-tight tracking-[-0.02em] text-ink">
        Add a pour
      </h2>
      <p className="mt-2 text-[12px] leading-5 text-ink-muted">
        Pick a category — its size columns define the price grid. Leave a
        column blank to mark the size as not stocked.
      </p>

      <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-2">
          <span className="text-[10px] uppercase tracking-[0.24em] text-ink-muted">
            Category
          </span>
          <select
            required
            value={catId}
            onChange={(e) => onChangeCat(e.target.value)}
            className="border border-line bg-surface px-4 py-3 text-[14px] text-ink outline-none focus:border-line-strong"
          >
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
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
            className="border border-line bg-surface px-4 py-3 text-[14px] text-ink outline-none focus:border-line-strong"
          />
        </label>

        <fieldset className="md:col-span-2">
          <legend className="text-[10px] uppercase tracking-[0.24em] text-ink-muted">
            Prices by size
          </legend>
          <div
            className="mt-2 grid gap-3"
            style={{
              gridTemplateColumns: `repeat(${sizes.length || 1}, minmax(0, 1fr))`,
            }}
          >
            {sizes.map((size, i) => (
              <label key={size} className="flex flex-col gap-1.5">
                <span className="text-[9px] uppercase tracking-[0.18em] text-ink-muted">
                  {size}
                </span>
                <input
                  type="number"
                  step="0.01"
                  placeholder="—"
                  value={priceFields[i] ?? ""}
                  onChange={(e) => {
                    const next = [...priceFields];
                    next[i] = e.target.value;
                    setPriceFields(next);
                  }}
                  className="border border-line bg-surface px-3 py-2 text-[14px] text-ink outline-none focus:border-line-strong"
                />
              </label>
            ))}
          </div>
        </fieldset>
      </div>

      <button
        type="submit"
        disabled={pending}
        className="mt-6 bg-action px-6 py-3 text-[10px] uppercase tracking-[0.28em] text-action-ink transition-opacity disabled:opacity-50"
      >
        {pending ? "Adding…" : "Add pour"}
      </button>
    </form>
  );
}
