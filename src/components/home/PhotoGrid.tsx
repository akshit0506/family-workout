import type { ActivityPhoto } from "@/lib/types";

type PhotoGridProps = {
  photos: ActivityPhoto[];
};

/** Read-only, mobile-first photo layout for a feed/activity card. Tapping a
 * photo opens the full-resolution signed URL in a new tab. */
export function PhotoGrid({ photos }: PhotoGridProps) {
  const isSingle = photos.length === 1;

  return (
    <div className={`grid gap-1.5 ${isSingle ? "grid-cols-1" : "grid-cols-2"}`}>
      {photos.map((photo) => (
        <a
          key={photo.id}
          href={photo.uploading ? undefined : photo.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-disabled={photo.uploading}
          className={`relative overflow-hidden rounded-lg bg-ink/5 ${
            isSingle ? "aspect-[4/3]" : "aspect-square"
          } ${photo.uploading ? "pointer-events-none" : ""}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={photo.url} alt="" className="h-full w-full object-cover" loading="lazy" />
          {photo.uploading && (
            <div className="absolute inset-0 flex items-center justify-center bg-ink/30">
              <span className="h-5 w-5 animate-spin rounded-full border-2 border-card border-t-transparent" />
            </div>
          )}
        </a>
      ))}
    </div>
  );
}
