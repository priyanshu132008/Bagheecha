"use server";

import { createHash } from "node:crypto";
import { revalidatePath } from "next/cache";
import { getPlaiceholder } from "plaiceholder";

import { getSupabaseAdmin } from "@/lib/supabase/admin";
import type { Database } from "@/lib/supabase/database.types";

/**
 * Server Actions for the admin dashboard.
 *
 * Every action uses `getSupabaseAdmin()` — the service-role client
 * that bypasses RLS. The admin's own role check still happens server-
 * side at the layout level, and the storage policies additionally
 * require `is_admin()` for INSERT/UPDATE/DELETE on `menu-assets`. The
 * service-role key is the only path through that writes to the menu.
 *
 * After every successful mutation, `revalidatePath("/")` and
 * `revalidatePath("/admin")` clear Next's RSC cache so the public site
 * picks up the change without a rebuild. The public site is "ISR
 * revalidate-on-write" — these calls are the write half.
 */

type ActionResult<T = unknown> =
  | { ok: true; data?: T }
  | { ok: false; error: string };

/* ------------------------------------------------------------------
   Pricing — the food_dishes shape invariant.

   `food_dish_price_shape_chk` enforces that a row is one of:
     - onRequest (all three price columns null)
     - half+full (price_half, price_full set; price_single null)
     - single (price_single set; price_half, price_full null)
   Server-side we map the three UI states to that invariant.
------------------------------------------------------------------- */

type PriceField = { kind: "half-full"; half: number; full: number }
  | { kind: "single"; single: number }
  | { kind: "on-request" };

const priceToColumns = (p: PriceField) => {
  switch (p.kind) {
    case "half-full":
      return { price_half: p.half, price_full: p.full, price_single: null };
    case "single":
      return { price_half: null, price_full: null, price_single: p.single };
    case "on-request":
      return { price_half: null, price_full: null, price_single: null };
  }
};

/* ------------------------------------------------------------------
   Food dish CRUD
------------------------------------------------------------------- */

export async function addDishAction(input: {
  foodGroupId: string;
  name: string;
  price: PriceField;
  note?: string | null;
  isFeatured?: boolean;
  imageUrl?: string | null;
  blurDataUrl?: string | null;
  displayOrder?: number;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from("food_dishes")
      .insert({
        food_group_id: input.foodGroupId,
        name: input.name.trim(),
        ...priceToColumns(input.price),
        note: input.note ?? null,
        on_request: input.price.kind === "on-request",
        is_featured: input.isFeatured ?? false,
        image_url: input.imageUrl ?? null,
        blur_data_url: input.blurDataUrl ?? null,
        display_order: input.displayOrder ?? 9999,
      })
      .select("id")
      .single();
    if (error) return { ok: false, error: error.message };
    revalidatePath("/");
    revalidatePath("/admin");
    return { ok: true, data: { id: data!.id } };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function updateDishAction(input: {
  id: string;
  name?: string;
  price?: PriceField;
  note?: string | null;
  isFeatured?: boolean;
  imageUrl?: string | null;
  blurDataUrl?: string | null;
  displayOrder?: number;
}): Promise<ActionResult> {
  try {
    const sb = getSupabaseAdmin();
    const patch: Database["public"]["Tables"]["food_dishes"]["Update"] = {};
    if (input.name !== undefined) patch.name = input.name.trim();
    if (input.price !== undefined) {
      Object.assign(patch, priceToColumns(input.price));
      patch.on_request = input.price.kind === "on-request";
    }
    if (input.note !== undefined) patch.note = input.note;
    if (input.isFeatured !== undefined) patch.is_featured = input.isFeatured;
    if (input.imageUrl !== undefined) patch.image_url = input.imageUrl;
    if (input.blurDataUrl !== undefined) patch.blur_data_url = input.blurDataUrl;
    if (input.displayOrder !== undefined) patch.display_order = input.displayOrder;

    const { error } = await sb.from("food_dishes").update(patch).eq("id", input.id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/");
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function deleteDishAction(id: string): Promise<ActionResult> {
  try {
    const sb = getSupabaseAdmin();
    const { error } = await sb.from("food_dishes").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/");
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/* ------------------------------------------------------------------
   Bar pour CRUD
------------------------------------------------------------------- */

export async function addPourAction(input: {
  barCategoryId: string;
  name: string;
  prices: (number | null)[];
  note?: string | null;
  isTopShelf?: boolean;
  topShelfSlot?: number;
  imageUrl?: string | null;
  blurDataUrl?: string | null;
  displayOrder?: number;
}): Promise<ActionResult<{ id: string }>> {
  try {
    const sb = getSupabaseAdmin();
    const { data, error } = await sb
      .from("bar_pours")
      .insert({
        bar_category_id: input.barCategoryId,
        name: input.name.trim(),
        prices: input.prices,
        note: input.note ?? null,
        is_top_shelf: input.isTopShelf ?? false,
        top_shelf_slot: input.isTopShelf ? input.topShelfSlot ?? 0 : 0,
        image_url: input.imageUrl ?? null,
        blur_data_url: input.blurDataUrl ?? null,
        display_order: input.displayOrder ?? 9999,
      })
      .select("id")
      .single();
    if (error) return { ok: false, error: error.message };
    revalidatePath("/");
    revalidatePath("/admin");
    return { ok: true, data: { id: data!.id } };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function updatePourAction(input: {
  id: string;
  name?: string;
  prices?: (number | null)[];
  note?: string | null;
  isTopShelf?: boolean;
  topShelfSlot?: number;
  imageUrl?: string | null;
  blurDataUrl?: string | null;
  displayOrder?: number;
}): Promise<ActionResult> {
  try {
    const sb = getSupabaseAdmin();
    const patch: Database["public"]["Tables"]["bar_pours"]["Update"] = {};
    if (input.name !== undefined) patch.name = input.name.trim();
    if (input.prices !== undefined) patch.prices = input.prices;
    if (input.note !== undefined) patch.note = input.note;
    if (input.isTopShelf !== undefined) {
      patch.is_top_shelf = input.isTopShelf;
      if (!input.isTopShelf) patch.top_shelf_slot = 0;
    }
    if (input.topShelfSlot !== undefined && input.isTopShelf) {
      patch.top_shelf_slot = input.topShelfSlot;
    }
    if (input.imageUrl !== undefined) patch.image_url = input.imageUrl;
    if (input.blurDataUrl !== undefined) patch.blur_data_url = input.blurDataUrl;
    if (input.displayOrder !== undefined) patch.display_order = input.displayOrder;

    const { error } = await sb.from("bar_pours").update(patch).eq("id", input.id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/");
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

export async function deletePourAction(id: string): Promise<ActionResult> {
  try {
    const sb = getSupabaseAdmin();
    const { error } = await sb.from("bar_pours").delete().eq("id", id);
    if (error) return { ok: false, error: error.message };
    revalidatePath("/");
    revalidatePath("/admin");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/* ------------------------------------------------------------------
   Image upload

   Accepts a `File`, runs `plaiceholder` to compute a blur data URL,
   uploads to `menu-assets`, and returns the public URL + blur.
   The action is `formData`-shaped so it works from a native
   `<form>` and a `<input type="file">` without a JS upload helper.
------------------------------------------------------------------- */

export async function uploadImageAction(
  formData: FormData,
): Promise<ActionResult<{ url: string; blurDataUrl: string | null }>> {
  try {
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return { ok: false, error: "No file uploaded" };
    }

    // Cap at 2MB before plaiceholder decodes — sharp on a 4MB image
    // takes ~150ms, and an admin clicking through a 12MB phone photo
    // is the path that crashes a serverless function's memory budget.
    if (file.size > 2 * 1024 * 1024) {
      return { ok: false, error: "Image must be 2MB or smaller" };
    }
    if (!["image/jpeg", "image/png"].includes(file.type)) {
      return { ok: false, error: "Image must be a JPEG or PNG" };
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    // Compute the blur data URL server-side. `plaiceholder` decodes
    // via `sharp` and emits a tiny 10×7 base64 JPEG; pass straight to
    // `<Image placeholder="blur" blurDataURL={...}>`. On failure we
    // log and return null — the image still uploads and renders, just
    // without a placeholder.
    let blurDataUrl: string | null = null;
    try {
      const { base64 } = await getPlaiceholder(buffer, { size: 10 });
      blurDataUrl = base64;
    } catch (e) {
      console.warn("plaiceholder failed:", (e as Error).message);
    }

    // Filename: timestamp + content hash, so two admins uploading
    // "dish-chicken.jpeg" don't collide and the same image uploaded
    // twice overwrites the prior copy.
    const ext = file.type === "image/png" ? "png" : "jpg";
    const hash = createHash("sha256").update(buffer).digest("hex").slice(0, 12);
    const path = `dishes/${Date.now()}-${hash}.${ext}`;

    const sb = getSupabaseAdmin();
    const { error: uploadError } = await sb.storage
      .from("menu-assets")
      .upload(path, buffer, {
        contentType: file.type,
        cacheControl: "31536000", // 1 year — image URLs are content-addressed
        upsert: false,
      });
    if (uploadError) return { ok: false, error: uploadError.message };

    const {
      data: { publicUrl },
    } = sb.storage.from("menu-assets").getPublicUrl(path);

    return { ok: true, data: { url: publicUrl, blurDataUrl } };
  } catch (e) {
    return { ok: false, error: (e as Error).message };
  }
}

/* ------------------------------------------------------------------
   Type re-exports for client components.
------------------------------------------------------------------- */

export type { PriceField };
