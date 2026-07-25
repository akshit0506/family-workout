"use client";

import { useState } from "react";
import { Chip } from "@/components/ui/Chip";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { useAppState } from "@/components/providers/AppStateProvider";
import { DURATION_PRESETS } from "@/lib/activityTypes";
import type { ActivityFormValues } from "@/lib/types";

const PRESET_DURATIONS: readonly string[] = DURATION_PRESETS;

type ActivityFormProps = {
  dateLabel: string;
  initialValues?: ActivityFormValues;
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

  function handleSubmit() {
    if (selectedActivities.length === 0) return;
    const durationLabel = showCustomDuration
      ? customDuration.trim() || undefined
      : selectedDuration;

    onSubmit({
      activities: selectedActivities,
      durationLabel,
      notes: notes.trim() || undefined,
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
        <p className="text-sm font-bold text-ink">Proof photo</p>
        <button
          type="button"
          onClick={() => showToast("Photo upload coming soon")}
          className="flex items-center justify-center gap-2 rounded-lg border-2 border-dashed border-ink/20 py-6 text-sm font-bold text-muted transition-colors hover:bg-ink/5"
        >
          📷 Add photo
        </button>
      </div>

      <div className="flex flex-col gap-2 pt-2">
        <Button
          variant="solid"
          fullWidth
          onClick={handleSubmit}
          disabled={selectedActivities.length === 0}
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
