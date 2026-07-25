"use client";

import { useState, type FormEvent } from "react";
import { BottomSheet } from "@/components/ui/BottomSheet";
import { Avatar } from "@/components/ui/Avatar";
import { Button } from "@/components/ui/Button";
import { useAppState } from "@/components/providers/AppStateProvider";
import { formatEntryTimestamp } from "@/lib/format";

type CommentsSheetProps = {
  entryId: string;
  open: boolean;
  onClose: () => void;
};

export function CommentsSheet({ entryId, open, onClose }: CommentsSheetProps) {
  const { commentsByEntryId, athletes, currentUser, addComment } = useAppState();
  const [text, setText] = useState("");

  const comments = commentsByEntryId[entryId] ?? [];
  const athleteById = new Map(athletes.map((athlete) => [athlete.id, athlete]));

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!text.trim()) return;
    addComment(entryId, text);
    setText("");
  }

  return (
    <BottomSheet open={open} onClose={onClose} title="Comments">
      <div className="flex flex-col gap-3 pb-2">
        {comments.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted">
            No comments yet — be the first to cheer them on!
          </p>
        ) : (
          comments.map((comment) => {
            const author = athleteById.get(comment.athleteId);
            return (
              <div key={comment.id} className="flex items-start gap-3">
                <Avatar
                  name={author?.name ?? "?"}
                  size="sm"
                  accent={comment.athleteId === currentUser.id}
                />
                <div className="flex-1">
                  <div className="flex items-baseline gap-2">
                    <p className="font-bold text-ink">{author?.name ?? "Unknown"}</p>
                    <p className="text-xs text-muted">{formatEntryTimestamp(comment.postedAt)}</p>
                  </div>
                  <p className="text-sm text-ink">{comment.text}</p>
                </div>
              </div>
            );
          })
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="flex items-center gap-2 border-t border-hairline pt-3"
      >
        <input
          type="text"
          value={text}
          onChange={(event) => setText(event.target.value)}
          placeholder="Add a comment..."
          className="flex-1 rounded-lg border border-ink/15 bg-card px-3 py-2 text-sm text-ink placeholder:text-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-rust"
        />
        <Button type="submit" variant="solid" disabled={!text.trim()}>
          Post
        </Button>
      </form>
    </BottomSheet>
  );
}
