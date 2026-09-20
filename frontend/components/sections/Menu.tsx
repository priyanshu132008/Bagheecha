import {
  getBarCategories,
  getFeaturedDishes,
  getFoodCategories,
  getTopShelfByCategory,
} from "@/lib/menu/queries";

import MenuClient from "./MenuClient";

/**
 * Server wrapper for `#menus`.
 *
 * The split:
 *  - `Menu.tsx` (this file) is a Server Component. It pulls the menu
 *    data from Supabase via the typed getters in `lib/menu/queries.ts`,
 *    then renders the client component below with serialised props.
 *  - `MenuClient.tsx` holds every interactive surface — the tab toggle,
 *    the page-turn AnimatePresence, the bar collage's pointer tracking.
 *
 * Why the split: the public site is "Server Components with ISR
 * revalidate-on-write". The Server Component is what revalidates when
 * an admin Server Action calls `revalidatePath("/")`. Lifting the data
 * fetch here (rather than calling `getSupabaseServer()` from a client
 * component, which would require the anon key on the wire and would
 * defeat RLS) is the architecture the plan specifies.
 *
 * The fetches run in parallel; a single round trip covers the whole
 * menu. If `SUPABASE_FALLBACK_TO_STATIC === "true"`, every getter
 * short-circuits to `lib/constants/menu.ts`, so this file's behaviour
 * is identical with or without a database.
 */
export default async function Menu() {
  const [food, bar, featuredDishes, topShelfByCategory] = await Promise.all([
    getFoodCategories(),
    getBarCategories(),
    getFeaturedDishes(),
    getTopShelfByCategory(),
  ]);

  return (
    <MenuClient
      food={food}
      bar={bar}
      featuredDishes={featuredDishes}
      topShelfByCategory={topShelfByCategory}
    />
  );
}
