"use client";

import { useEffect, useRef, useState } from "react";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { useAppState } from "@/components/providers/AppStateProvider";
import { DURATION_PRESETS } from "@/lib/activityTypes";
import { compressImage, MAX_PHOTOS_PER_ACTIVITY, PHOTO_INPUT_ACCEPT } from "@/lib/photo";
import type { ActivityFormInitialValues, ActivityFormValues, ActivityPhoto } from "@/lib/types";

const PRESET_DURATIONS: readonly string[] = DURATION_PRESETS;

type PendingPhoto = {
  key: string;
  previewUrl: string;
  status: "compressing" | "ready" | "error";
  blob?: Blob;
};

type ActivityFormProps = {
  dateLabel: string;
  initialValues?: ActivityFormInitialValues;
  submitLabel: string;
  onSubmit: (values: ActivityFormValues) => void;
  onCancel: () => void;
  onDelete?: () => void;
};

export function ActivityForm({
  dateLabel,
  initialValues,
  submitLabel,
  onSubmit,
  onCancel,
  onDelete,
}: ActivityFormProps) {
  const { activityTypes, addCustomActivityType, showToast } = useAppState();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [existingPhotos, setExistingPhotos] = useState<ActivityPhoto[]>(initialValues?.photos ?? []);
  const [pendingPhotos, setPendingPhotos] = useState<PendingPhoto[]>([]);
  const photoCount = existingPhotos.length + pendingPhotos.length;

  // Revoke object URLs for photos the user picked this session so they
  // don't leak — only ours to clean up; signed URLs from the server aren't.
  useEffect(() => {
    return () => {
      for (const photo of pendingPhotos) URL.revokeObjectURL(photo.previewUrl);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handlePhotosSelected(files: FileList | null) {
    if (!files || files.length === 0) return;

    const room = MAX_PHOTOS_PER_ACTIVITY - photoCount;
    const picked = Array.from(files).slice(0, Math.max(0, room));
    if (files.length > picked.length) {
      showToast(`Up to ${MAX_PHOTOS_PER_ACTIVITY} photos per activity`);
    }

    for (const file of picked) {
      const key = crypto.randomUUID();
      const previewUrl = URL.createObjectURL(file);
      setPendingPhotos((prev) => [...prev, { key, previewUrl, status: "compressing" }]);

      try {
        const blob = await compressImage(file);
        setPendingPhotos((prev) =>
          prev.map((photo) => (photo.key === key ? { ...photo, status: "ready", blob } : photo))
        );
      } catch (error) {
        setPendingPhotos((prev) =>
          prev.map((photo) => (photo.key === key ? { ...photo, status: "error" } : photo))
        );
        showToast(error instanceof Error ? error.message : "Couldn't process that photo");
      }
    }
  }

  function removeExistingPhoto(id: string) {
    setExistingPhotos((prev) => prev.filter((photo) => photo.id !== id));
  }

  function removePendingPhoto(key: string) {
    setPendingPhotos((prev) => {
      const target = prev.find((photo) => photo.key === key);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((photo) => photo.key !== key);
    });
  }

  const [selectedActivities, setSelectedActivities] = useState<string[]>(
    initialValues?.activities ?? []
  );
  const [showCustomActivity, setShowCustomActivity] = useState(false);
  const [customActivityText, setCustomActivityText] = useState("");

  const initialDuration = initialValues?.durationLabel;
  const presetDuration =
    initialDuration && PRESET_DURATIONS.includes(initialDuration) ? initialDuration : undefined;
  const customInitialDuration = initialDuration && !presetDuration ? initialDuration : "";

  const [selectedDuration, setSelectedDuration] = useState<string | undefined>(presetDuration);
  const [showCustomDuration, setShowCustomDuration] = useState(Boolean(customInitialDuration));
  const [customDuration, setCustomDuration] = useState(customInitialDuration);

  const [notes, setNotes] = useState(initialValues?.notes ?? "");

  const activityOptions = activityTypes.map((type) => type.label);

  function toggleActivity(activity: string) {
    setSelectedActivities((prev) =>
      prev.includes(activity) ? prev.filter((a) => a !== activity) : [...prev, activity]
    );
  }

  async function handleAddCustomActivity() {
    const added = await addCustomActivityType(customActivityText);
    if (!added) return;
    setSelectedActivities((prev) => (prev.includes(added) ? prev : [...prev, added]));
    setCustomActivityText("");
    setShowCustomActivity(false);
  }

  const isProcessingPhotos = pendingPhotos.some((photo) => photo.status === "compressing");

  function handleSubmit() {
    if (selectedActivities.length === 0 || isProcessingPhotos) return;
    const durationLabel = showCustomDuration
      ? customDuration.trim() || undefined
      : selectedDuration;

    onSubmit({
      activities: selectedActivities,
      durationLabel,
      notes: notes.trim() || undefined,
      newPhotos: pendingPhotos
        .filter((photo): photo is PendingPhoto & { blob: Blob } => photo.status === "ready" && Boolean(photo.blob))
        .map((photo) => photo.blob),
      keepPhotoIds: existingPhotos.map((photo) => photo.id),
    });
  }

  return (
    <div className="flex flex-col gap-5 pb-2">
      <Eyebrow>{dateLabel}</Eyebrow>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-bold text-ink">Activity</p>
        <div className="flex flex-wrap gap-2">
          {activityOptions.map((activity) => (
            <Chip
              key={activity}
              variant={selectedActivities.includes(activity) ? "filled" : "outline"}
              tone={selectedActivities.includes(activity) ? "success" : "ink"}
              onClick={() => toggleActivity(activity)}
              aria-pressed={selectedActivities.includes(activity)}
            >
              {activity}
            </Chip>
          ))}
          <Chip variant="outline" onClick={() => setShowCustomActivity((prev) => !prev)}>
            + Add Your Own
          </Chip>
        </div>
        {showCustomActivity && (
          <div className="flex items-center gap-2 pt-1">
            <input
              type="text"
              value={customActivityText}
              onChange={(event) => setCustomActivityText(event.target.value)}
              placeholder="Name your activity"
              className="flex-1 rounded-lg border border-ink/15 bg-card px-3 py-2 text-sm text-ink placeholder:text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-rust"
            />
            <Button
              variant="solid"
              onClick={handleAddCustomActivity}
              disabled={!customActivityText.trim()}
            >
              Add
            </Button>
          </div>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-bold text-ink">Duration</p>
        <div className="flex flex-wrap gap-2">
          {DURATION_PRESETS.map((preset) => (
            <Chip
              key={preset}
              variant={!showCustomDuration && selectedDuration === preset ? "filled" : "outline"}
              tone="success"
              onClick={() => {
                setSelectedDuration(preset);
                setShowCustomDuration(false);
              }}
              aria-pressed={!showCustomDuration && selectedDuration === preset}
            >
              {preset}
            </Chip>
          ))}
          <Chip
            variant={showCustomDuration ? "filled" : "outline"}
            tone="success"
            onClick={() => {
              setShowCustomDuration(true);
              setSelectedDuration(undefined);
            }}
            aria-pressed={showCustomDuration}
          >
            Custom
          </Chip>
        </div>
        {showCustomDuration && (
          <input
            type="text"
            value={customDuration}
            onChange={(event) => setCustomDuration(event.target.value)}
            placeholder="e.g. 2 hours"
            className="rounded-lg border border-ink/15 bg-card px-3 py-2 text-sm text-ink placeholder:text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-rust"
          />
        )}
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-bold text-ink">Notes</p>
        <textarea
          value={notes}
          onChange={(event) => setNotes(event.target.value)}
          placeholder="Optional"
          rows={3}
          className="rounded-lg border border-ink/15 bg-card px-3 py-2 text-sm text-ink placeholder:text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-rust"
        />
      </div>

      <div className="flex flex-col gap-2">
        <p className="text-sm font-bold text-ink">{`Proof photo${photoCount > 0 ? ` · ${photoCount}/${MAX_PHOTOS_PER_ACTIVITY}` : ""}`}</p>

        {(existingPhotos.length > 0 || pendingPhotos.length > 0) && (
          <div className="grid grid-cols-4 gap-2">
            {existingPhotos.map((photo) => (
              <div key={photo.id} className="relative aspect-square overflow-hidden rounded-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photo.url} alt="" className="h-full w-full object-cover" />
                <button
                  type="button"
                  aria-label="Remove photo"
                  onClick={() => removeExistingPhoto(photo.id)}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-ink/70 text-xs text-card"
                >
                  ✕
                </button>
              </div>
            ))}
            {pendingPhotos.map((photo) => (
              <div key={photo.key} className="relative aspect-square overflow-hidden rounded-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={photo.previewUrl}
                  alt=""
                  className={`h-full w-full object-cover ${photo.status === "error" ? "opacity-40" : ""}`}
                />
                {photo.status === "compressing" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-ink/30">
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-card border-t-transparent" />
                  </div>
                )}
                {photo.status === "error" && (
                  <div className="absolute inset-0 flex items-center justify-center bg-ink/40 text-xs text-card">
                    Failed
                  </div>
                )}
                <button
                  type="button"
                  aria-label="Remove photo"
                  onClick={() => removePendingPhoto(photo.key)}
                  className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-ink/70 text-xs text-card"
                >
                  ✕
                </button>
              </div>
            ))}
          </div>
        )}

        {photoCount < MAX_PHOTOS_PER_ACTIVITY && (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-ink/20 py-6 text-sm font-bold text-muted transition-colors hover:bg-ink/5"
          >
            📷 Add photo
          </button>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept={PHOTO_INPUT_ACCEPT}
          multiple
          className="hidden"
          onChange={(event) => {
            void handlePhotosSelected(event.target.files);
            event.target.value = "";
          }}
        />
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <Button
          variant="solid"
          fullWidth
          onClick={handleSubmit}
          disabled={selectedActivities.length === 0 || isProcessingPhotos}
        >
          {submitLabel}
        </Button>
        <Button fullWidth onClick={onCancel}>
          Cancel
        </Button>
        {onDelete && (
          <Button fullWidth onClick={onDelete}>
            Delete Activity
          </Button>
        )}
      </div>
    </div>
  );
}
