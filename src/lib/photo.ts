// Shared constants + client-side compression for activity proof photos.
// Kept framework-agnostic (no Supabase imports) so both the server data
// layer (signed URL resolution) and the browser upload path can import it
// without pulling in the wrong Supabase client.

export const ACTIVITY_PHOTOS_BUCKET = "activity-photos";

// Matches the storage.buckets.file_size_limit set in
// 20260725120200_storage.sql (10 MiB) with headroom, since we compress
// client-side before upload and never expect to get near that ceiling.
export const MAX_PHOTOS_PER_ACTIVITY = 4;
export const MAX_SOURCE_FILE_BYTES = 25 * 1024 * 1024; // reject absurd picks before we try to decode them
export const COMPRESSED_MAX_DIMENSION = 1600; // long edge, px — plenty for a phone-width feed card
export const COMPRESSED_JPEG_QUALITY = 0.82;

// Signed URLs are cached client-side for the life of the session; a week
// comfortably outlives that without needing a refresh path.
export const SIGNED_URL_TTL_SECONDS = 60 * 60 * 24 * 7;

// `accept` for the file picker. HEIC/HEIF (common on iPhone) is included
// because Safari can decode it via createImageBitmap even though the
// storage bucket's allowed_mime_types doesn't list it — compression always
// re-encodes to JPEG before upload, so the bucket only ever sees JPEG.
export const PHOTO_INPUT_ACCEPT = "image/jpeg,image/png,image/webp,image/heic,image/heif";

/**
 * Downscales + re-encodes an image file to a JPEG blob suitable for upload.
 * Throws a user-facing message (shown via toast) if the file is too large
 * to bother reading, or if the browser can't decode it.
 */
export async function compressImage(file: File): Promise<Blob> {
  if (file.size > MAX_SOURCE_FILE_BYTES) {
    throw new Error(`"${file.name}" is too large (max 25 MB).`);
  }

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error(`Couldn't read "${file.name}" — try a JPEG, PNG, or WEBP.`);
  }

  try {
    const scale = Math.min(1, COMPRESSED_MAX_DIMENSION / Math.max(bitmap.width, bitmap.height));
    const width = Math.max(1, Math.round(bitmap.width * scale));
    const height = Math.max(1, Math.round(bitmap.height * scale));

    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Couldn't process that photo.");
    ctx.drawImage(bitmap, 0, 0, width, height);

    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/jpeg", COMPRESSED_JPEG_QUALITY)
    );
    if (!blob) throw new Error("Couldn't process that photo.");
    return blob;
  } finally {
    bitmap.close();
  }
}
