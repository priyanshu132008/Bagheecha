"use client";

import { useState, useTransition } from "react";

import { uploadImageAction } from "@/app/(admin)/admin/_actions/menu";

/**
 * The image dropzone.
 *
 * A native `<input type="file">` dressed up as a dashed dropzone. On
 * change, the file is submitted to `uploadImageAction`, which:
 *
 *   - caps the file at 2MB (a 4MB JPEG would crash a serverless
 *     function's memory budget on plaiceholder's sharp decode);
 *   - decodes via `plaiceholder` for a 10×7 base64 blur;
 *   - uploads to `menu-assets` with a timestamp+hash filename;
 *   - returns `{ url, blurDataUrl }` to the caller.
 *
 * The result is propagated via `onUploaded` so the parent form can
 * stash the new `image_url` and `blurDataURL` and submit them with
 * the rest of the row's fields.
 */
export function ImageDropzone({
  onUploaded,
  initialImageUrl,
  label = "Upload image",
}: {
  onUploaded: (input: { url: string; blurDataUrl: string | null }) => void;
  initialImageUrl?: string | null;
  label?: string;
}) {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [preview, setPreview] = useState<string | null>(initialImageUrl ?? null);

  const onChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);
    const reader = new FileReader();
    reader.onload = () => setPreview(String(reader.result));
    reader.readAsDataURL(file);

    const fd = new FormData();
    fd.set("file", file);

    startTransition(async () => {
      const res = await uploadImageAction(fd);
      if (!res.ok) {
        setError(res.error);
        setPreview(initialImageUrl ?? null);
        return;
      }
      onUploaded(res.data!);
    });
  };

  return (
    <div className="flex flex-col gap-3">
      <label className="block cursor-pointer border border-dashed border-line-strong bg-surface-sunk p-6 text-center transition-colors hover:border-line">
        <span className="text-[10px] uppercase tracking-[0.24em] text-ink-muted">
          {label}
        </span>
        <p className="mt-2 text-[12px] leading-5 text-ink-muted">
          JPEG or PNG, up to 2MB. Server-side blur is computed automatically.
        </p>
        <input
          type="file"
          accept="image/jpeg,image/png"
          onChange={onChange}
          className="sr-only"
        />
      </label>

      {preview && (
        // eslint-disable-next-line @next/next/no-img-element -- admin preview is fine
        <img
          src={preview}
          alt="Preview"
          className="h-32 w-32 border border-line object-cover"
        />
      )}

      {pending && (
        <p className="text-[10px] uppercase tracking-[0.22em] text-ink-muted">
          Uploading…
        </p>
      )}

      {error && (
        <p
          role="alert"
          className="border border-vermillion/60 bg-vermillion/10 px-3 py-2 text-[11px] leading-5 text-cream"
        >
          {error}
        </p>
      )}
    </div>
  );
}
