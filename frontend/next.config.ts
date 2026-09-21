import type { NextConfig } from "next";

/**
 * next/image is locked down by default — it will refuse to render any
 * image whose hostname isn't on the allow-list. The hotel's photographs
 * used to live in `public/images/`, but the admin dashboard uploads new
 * ones to Supabase Storage at `<project-ref>.supabase.co`, so the
 * remote host has to be permitted here, otherwise every CMS-uploaded
 * image 404s on first render.
 *
 * Without this, the day-one seed works (the rows point at `/images/*`
 * static paths, served from `public/`), but the moment the admin
 * uploads anything the public page silently breaks. Added on
 * 2026-09-20 alongside the Supabase migration; the constant
 * mirrors `NEXT_PUBLIC_SUPABASE_URL`'s host portion.
 */
const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "pkdjihgspulrtkkxgynh.supabase.co",
        pathname: "/storage/v1/object/public/menu-assets/**",
      },
    ],
  },
};

export default nextConfig;
