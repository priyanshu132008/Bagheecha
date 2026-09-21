import { KitchenManager } from "@/app/(admin)/admin/_components/KitchenManager";
import { BarManager } from "@/app/(admin)/admin/_components/BarManager";
import { AdminTabs } from "@/app/(admin)/admin/_components/AdminTabs";
import { signOutAction } from "@/app/(admin)/admin/_actions/auth";

import { getSupabaseServer } from "@/lib/supabase/server";

/**
 * Admin dashboard root.
 *
 * SERVER COMPONENT. Fetches the full menu tree (food + bar) and the
 * admin profile in one round trip, then hands the data to the two
 * manager components below.
 *
 * The `data-tone="dark"` shell is on the layout; this page only adds
 * the rail alignment and the tab switcher. The dark theme carries
 * across both managers automatically.
 */
export default async function AdminDashboardPage() {
  const sb = await getSupabaseServer();

  const [
    { data: cats },
    { data: groups },
    { data: dishes },
    { data: barCats },
    { data: pours },
    { data: { user } },
  ] = await Promise.all([
    sb.from("food_categories").select("id, slug, name, display_order").order("display_order"),
    sb.from("food_groups").select("id, slug, name, food_category_id, display_order").order("display_order"),
    sb
      .from("food_dishes")
      .select(
        "id, name, price_half, price_full, price_single, note, on_request, is_featured, image_url, display_order, food_group_id",
      )
      .order("display_order"),
    sb.from("bar_categories").select("id, slug, name, sizes, display_order").order("display_order"),
    sb
      .from("bar_pours")
      .select(
        "id, name, prices, note, is_top_shelf, top_shelf_slot, image_url, display_order, bar_category_id",
      )
      .order("display_order"),
    sb.auth.getUser(),
  ]);

  return (
    <div className="container-x pt-[clamp(4rem,8vw,7rem)] pb-24">
      {/* The dashboard masthead. Same rail shape as the public site:
          eyebrow in column 1, display heading + sign-out from column 5. */}
      <div className="grid grid-cols-12 gap-x-6 gap-y-6">
        <div className="col-span-12 lg:col-span-3">
          <p className="text-[10px] uppercase tracking-[0.32em] text-ink-muted">
            Back of house
          </p>
        </div>

        <div className="col-span-12 flex flex-col gap-6 lg:col-span-9 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-display text-4xl font-normal leading-[1.05] tracking-[-0.02em] text-ink md:text-5xl">
              Edit the menu
            </h1>
            {user?.email && (
              <p className="mt-3 text-[13px] leading-6 text-ink-muted">
                Signed in as <span className="text-ink">{user.email}</span>
              </p>
            )}
          </div>

          <form action={signOutAction}>
            <button
              type="submit"
              className="border border-line-strong px-6 py-3 text-[10px] uppercase tracking-[0.28em] text-ink transition-colors hover:border-line"
            >
              Sign out
            </button>
          </form>
        </div>
      </div>

      {/* The two managers, swapped by a client-side tablist so the
          underlying data fetches don't re-fire on toggle. */}
      <AdminTabs
        kitchen={
          <KitchenManager
            categories={cats ?? []}
            groups={groups ?? []}
            dishes={dishes ?? []}
          />
        }
        bar={
          <BarManager
            categories={barCats ?? []}
            pours={pours ?? []}
          />
        }
      />
    </div>
  );
}
