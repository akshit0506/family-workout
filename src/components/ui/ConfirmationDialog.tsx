"use client";

import { BottomSheet } from "@/components/ui/BottomSheet";
import { Button } from "@/components/ui/Button";

type ConfirmationDialogProps = {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmationDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  destructive = false,
  onConfirm,
  onCancel,
}: ConfirmationDialogProps) {
  return (
    <BottomSheet open={open} onClose={onCancel} title={title} zIndexClassName="z-[60]">
      <div className="flex flex-col gap-4 pb-2">
        <p className="text-sm text-ink">{message}</p>
        <div className="flex gap-2">
          <Button className="flex-1" onClick={onCancel}>
            {cancelLabel}
          </Button>
          <Button
            className="flex-1"
            variant={destructive ? "solid" : "outline"}
            onClick={onConfirm}
          >
            {confirmLabel}
          </Button>
        </div>
      </div>
    </BottomSheet>
  );
}
