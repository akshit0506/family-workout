"use client";

import { useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { useAppState } from "@/components/providers/AppStateProvider";
import { parseDateKey, toDateKey } from "@/lib/date";
import { INTERACTIVE_CLASSES } from "@/lib/interactive";

function formatDateTitle(dateKey: string, today: Date): string {
  if (dateKey === toDateKey(today)) return "Today";
  return parseDateKey(dateKey).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function DayDetailsSheet() {
  const {
    dayDetailsDateKey,
    entries,
    currentUser,
    closeDayDetails,
    openAddActivity,
    openEditActivity,
    deleteActivity,
  } = useAppState();
  const [deletingEntryId, setDeletingEntryId] = useState<string | null>(null);

  const dateKey = dayDetailsDateKey;
  const dayEntries = dateKey
    ? entries.filter(
        (entry) =>
          entry.athleteId === currentUser.id && toDateKey(new Date(entry.loggedAt)) === dateKey
      )
    : [];

  function handleAdd() {
    if (!dateKey) return;
    closeDayDetails();
    openAddActivity(dateKey);
  }

  function handleEdit(entryId: string) {
    closeDayDetails();
    openEditActivity(entryId);
  }

  function handleDeleteConfirmed() {
    if (deletingEntryId) deleteActivity(deletingEntryId);
    setDeletingEntryId(null);
  }

  return (
    <>
      <BottomSheet
        open={dateKey !== null}
        onClose={closeDayDetails}
        title={dateKey ? formatDateTitle(dateKey, new Date()) : "Activities"}
      >
        <div className="flex flex-col gap-3 pb-2">
          {dayEntries.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted">No activities logged.</p>
          ) : (
            dayEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-ink/10 bg-card px-4 py-3"
              >
                <div>
                  <p className="font-bold text-ink">{entry.activities.join(" · ")}</p>
                  {entry.durationLabel && (
                    <p className="text-sm text-muted">{entry.durationLabel}</p>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    aria-label="Edit activity"
                    onClick={() => handleEdit(entry.id)}
                    className={`flex h-9 w-9 items-center justify-center rounded-md border border-ink/15 text-ink hover:bg-ink/5 ${INTERACTIVE_CLASSES}`}
                  >
                    ✎
                  </button>
                  <button
                    type="button"
                    aria-label="Delete activity"
                    onClick={() => setDeletingEntryId(entry.id)}
                    className={`flex h-9 w-9 items-center justify-center rounded-md border border-ink/15 text-rust hover:bg-rust/5 ${INTERACTIVE_CLASSES}`}
                  >
                    🗑
                  </button>
                </div>
              </div>
            ))
          )}

          <Button variant="solid" fullWidth onClick={handleAdd}>
            Add Activity
          </Button>
        </div>
      </BottomSheet>

      <ConfirmationDialog
        open={deletingEntryId !== null}
        title="Delete activity?"
        message="This will permanently remove this activity from the feed, calendar, and your stats."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setDeletingEntryId(null)}
      />
    </>
  );
}
