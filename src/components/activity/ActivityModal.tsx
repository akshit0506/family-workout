"use client";

import { useState } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { ActivityForm } from "@/components/activity/ActivityForm";
import { useAppState } from "@/components/providers/AppStateProvider";
import { parseDateKey, toDateKey } from "@/lib/date";
import type { ActivityFormValues } from "@/lib/types";

function formatDateLabel(dateKey: string, today: Date): string {
  if (dateKey === toDateKey(today)) return "Today";
  return parseDateKey(dateKey).toLocaleDateString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function ActivityModal() {
  const { activityModal, entries, saveActivity, deleteActivity, closeActivityModal } =
    useAppState();
  const [confirmingDelete, setConfirmingDelete] = useState(false);

  const isOpen = activityModal !== null;
  const editingEntryId = activityModal?.mode === "edit" ? activityModal.entryId : undefined;
  const addDateKey = activityModal?.mode === "add" ? activityModal.dateKey : undefined;
  const editingEntry = editingEntryId
    ? entries.find((entry) => entry.id === editingEntryId)
    : undefined;

  const dateKey = editingEntry
    ? toDateKey(new Date(editingEntry.loggedAt))
    : (addDateKey ?? toDateKey(new Date()));
  const dateLabel = formatDateLabel(dateKey, new Date());
  const formKey = editingEntryId ? `edit-${editingEntryId}` : `add-${addDateKey ?? "none"}`;

  function handleClose() {
    setConfirmingDelete(false);
    closeActivityModal();
  }

  function handleSubmit(values: ActivityFormValues) {
    saveActivity(values);
  }

  function handleDeleteConfirmed() {
    if (editingEntry) deleteActivity(editingEntry.id);
    setConfirmingDelete(false);
  }

  return (
    <>
      <BottomSheet
        open={isOpen}
        onClose={handleClose}
        title={editingEntryId ? "Edit Activity" : "Add Activity"}
      >
        <ActivityForm
          key={formKey}
          dateLabel={dateLabel}
          initialValues={
            editingEntry
              ? {
                  activities: editingEntry.activities,
                  durationLabel: editingEntry.durationLabel,
                  notes: editingEntry.notes,
                  photos: editingEntry.photos,
                }
              : undefined
          }
          submitLabel={editingEntryId ? "Update" : "Save"}
          onSubmit={handleSubmit}
          onCancel={handleClose}
          onDelete={editingEntryId ? () => setConfirmingDelete(true) : undefined}
        />
      </BottomSheet>

      <ConfirmationDialog
        open={confirmingDelete}
        title="Delete activity?"
        message="This will permanently remove this activity from the feed, calendar, and your stats."
        confirmLabel="Delete"
        destructive
        onConfirm={handleDeleteConfirmed}
        onCancel={() => setConfirmingDelete(false)}
      />
    </>
  );
}
