"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { ActivityModal } from "@/components/activity/ActivityModal";
import { DayDetailsSheet } from "@/components/profile/DayDetailsSheet";
import { Toast } from "@/components/ui/Toast";
import { createBrowserSupabaseClient } from "@/lib/supabase/client";
import { parseDateKey, toDateKey } from "@/lib/date";
import {
  buildTrailingWindow,
  buildWeekStatus,
  computeBestStreak,
  computeCurrentStreak,
  computeKudosReceived,
  countLoggedDaysInWindow,
  getLoggedDateKeys,
  isDayLogged,
} from "@/lib/stats";
import type {
  ActivityFormValues,
  ActivityType,
  Athlete,
  Comment,
  CurrentUserSummary,
  FeedEntry,
} from "@/lib/types";

type ActivityModalState =
  | { mode: "add"; dateKey: string }
  | { mode: "edit"; entryId: string }
  | null;

type AppState = {
  summary: CurrentUserSummary;
  entries: FeedEntry[];
  athletes: Athlete[];
  currentUser: Athlete;
  commentsByEntryId: Record<string, Comment[]>;
  activityTypes: ActivityType[];
  toastMessage: string | null;
  activityModal: ActivityModalState;
  dayDetailsDateKey: string | null;

  toggleKudos: (entryId: string) => void;
  addComment: (entryId: string, text: string) => void;
  addCustomActivityType: (label: string) => Promise<string>;
  saveActivity: (values: ActivityFormValues) => void;
  deleteActivity: (entryId: string) => void;
  showToast: (message: string) => void;

  openAddActivity: (dateKey: string) => void;
  openEditActivity: (entryId: string) => void;
  closeActivityModal: () => void;
  openDayDetails: (dateKey: string) => void;
  closeDayDetails: () => void;
};

const AppStateContext = createContext<AppState | null>(null);

type AppStateProviderProps = {
  initialSummary: CurrentUserSummary;
  initialEntries: FeedEntry[];
  athletes: Athlete[];
  currentUser: Athlete;
  initialComments: Record<string, Comment[]>;
  periodDaysElapsed: number;
  initialActivityTypes: ActivityType[];
  children: ReactNode;
};

export function AppStateProvider({
  initialSummary,
  initialEntries,
  athletes,
  currentUser,
  initialComments,
  periodDaysElapsed,
  initialActivityTypes,
  children,
}: AppStateProviderProps) {
  const [entries, setEntries] = useState(initialEntries);
  const [commentsByEntryId, setCommentsByEntryId] = useState(initialComments);
  const [activityTypes, setActivityTypes] = useState<ActivityType[]>(initialActivityTypes);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [activityModal, setActivityModal] = useState<ActivityModalState>(null);
  const [dayDetailsDateKey, setDayDetailsDateKey] = useState<string | null>(null);

  useEffect(() => {
    if (!toastMessage) return;
    const timeout = setTimeout(() => setToastMessage(null), 2500);
    return () => clearTimeout(timeout);
  }, [toastMessage]);

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
  }, []);

  const summary = useMemo<CurrentUserSummary>(() => {
    const today = new Date();
    const loggedDateKeys = getLoggedDateKeys(entries, currentUser.id);
    const streakDays = computeCurrentStreak(loggedDateKeys, today);
    const bestStreak = Math.max(computeBestStreak(loggedDateKeys), streakDays);

    return {
      periodLabel: initialSummary.periodLabel,
      rank: initialSummary.rank,
      entriesThisPeriod: countLoggedDaysInWindow(loggedDateKeys, today, periodDaysElapsed),
      last30Days: countLoggedDaysInWindow(loggedDateKeys, today, 30),
      sparkline: buildTrailingWindow(loggedDateKeys, today, 30),
      streakDays,
      weekStatus: buildWeekStatus(loggedDateKeys, today),
      allTimeEntries: loggedDateKeys.size,
      bestStreak,
      kudosReceived: computeKudosReceived(entries, currentUser.id),
      todayLogged: isDayLogged(loggedDateKeys, today),
    };
  }, [entries, currentUser.id, initialSummary.periodLabel, initialSummary.rank, periodDaysElapsed]);

  const toggleKudos = useCallback(
    (entryId: string) => {
      const entry = entries.find((e) => e.id === entryId);
      if (!entry) return;
      const hasGiven = entry.kudosFromAthleteIds.includes(currentUser.id);

      setEntries((prev) =>
        prev.map((e) =>
          e.id !== entryId
            ? e
            : {
                ...e,
                kudosFromAthleteIds: hasGiven
                  ? e.kudosFromAthleteIds.filter((id) => id !== currentUser.id)
                  : [...e.kudosFromAthleteIds, currentUser.id],
              }
        )
      );

      const revert = () => {
        setEntries((prev) =>
          prev.map((e) =>
            e.id !== entryId
              ? e
              : {
                  ...e,
                  kudosFromAthleteIds: hasGiven
                    ? [...e.kudosFromAthleteIds, currentUser.id]
                    : e.kudosFromAthleteIds.filter((id) => id !== currentUser.id),
                }
          )
        );
        showToast("Couldn't update kudos — try again");
      };

      const supabase = createBrowserSupabaseClient();
      const write = hasGiven
        ? supabase.from("kudos").delete().eq("activity_id", entryId).eq("athlete_id", currentUser.id)
        : supabase.from("kudos").insert({ activity_id: entryId, athlete_id: currentUser.id });

      write.then(({ error }) => {
        if (error) revert();
      });
    },
    [entries, currentUser.id, showToast]
  );

  const addComment = useCallback(
    (entryId: string, text: string) => {
      const trimmed = text.trim();
      if (!trimmed) return;

      const id = crypto.randomUUID();
      const newComment: Comment = {
        id,
        athleteId: currentUser.id,
        text: trimmed,
        postedAt: new Date().toISOString(),
      };

      setCommentsByEntryId((prev) => {
        const existing = prev[entryId] ?? [];
        return { ...prev, [entryId]: [...existing, newComment] };
      });

      const supabase = createBrowserSupabaseClient();
      supabase
        .from("comments")
        .insert({ id, activity_id: entryId, athlete_id: currentUser.id, text: trimmed })
        .then(({ error }) => {
          if (!error) return;
          setCommentsByEntryId((prev) => {
            const existing = prev[entryId] ?? [];
            return { ...prev, [entryId]: existing.filter((comment) => comment.id !== id) };
          });
          showToast("Couldn't post comment — try again");
        });
    },
    [currentUser.id, showToast]
  );

  const addCustomActivityType = useCallback(
    async (label: string): Promise<string> => {
      const trimmed = label.trim();
      if (!trimmed) return "";

      const existing = activityTypes.find(
        (type) => type.label.toLowerCase() === trimmed.toLowerCase()
      );
      if (existing) return existing.label;

      const id = crypto.randomUUID();
      setActivityTypes((prev) => [...prev, { id, label: trimmed }]);

      const supabase = createBrowserSupabaseClient();
      const { error } = await supabase
        .from("activity_types")
        .insert({ id, label: trimmed, created_by: currentUser.id });

      if (error) {
        setActivityTypes((prev) => prev.filter((type) => type.id !== id));
        showToast("Couldn't add that activity type — try again");
        return "";
      }

      return trimmed;
    },
    [activityTypes, currentUser.id, showToast]
  );

  const saveActivity = useCallback(
    (values: ActivityFormValues) => {
      if (!activityModal) return;

      const supabase = createBrowserSupabaseClient();
      const typeIdByLabel = new Map(activityTypes.map((type) => [type.label, type.id]));
      const typeIds = values.activities
        .map((label) => typeIdByLabel.get(label))
        .filter((id): id is string => Boolean(id));

      if (activityModal.mode === "edit") {
        const { entryId } = activityModal;
        const previousEntries = entries;

        setEntries((prev) =>
          prev.map((entry) =>
            entry.id === entryId
              ? {
                  ...entry,
                  activities: values.activities,
                  durationLabel: values.durationLabel,
                  notes: values.notes,
                }
              : entry
          )
        );
        showToast("Activity updated");
        setActivityModal(null);

        (async () => {
          const { error: updateError } = await supabase
            .from("activities")
            .update({
              duration_label: values.durationLabel ?? null,
              notes: values.notes ?? null,
            })
            .eq("id", entryId);
          if (updateError) throw updateError;

          const { error: deleteTypesError } = await supabase
            .from("activity_entry_types")
            .delete()
            .eq("activity_id", entryId);
          if (deleteTypesError) throw deleteTypesError;

          if (typeIds.length > 0) {
            const { error: insertTypesError } = await supabase
              .from("activity_entry_types")
              .insert(typeIds.map((activity_type_id) => ({ activity_id: entryId, activity_type_id })));
            if (insertTypesError) throw insertTypesError;
          }
        })().catch(() => {
          setEntries(previousEntries);
          showToast("Couldn't save that update — try again");
        });
      } else {
        const { dateKey } = activityModal;
        const now = new Date();
        const isToday = toDateKey(now) === dateKey;
        const entryDate = isToday ? now : parseDateKey(dateKey);
        if (!isToday) entryDate.setHours(12, 0, 0, 0);

        const id = crypto.randomUUID();
        const newEntry: FeedEntry = {
          id,
          athleteId: currentUser.id,
          loggedAt: entryDate.toISOString(),
          activities: values.activities,
          durationLabel: values.durationLabel,
          notes: values.notes,
          kudosFromAthleteIds: [],
        };

        const previousEntries = entries;
        setEntries((prev) => [newEntry, ...prev]);
        showToast("Activity logged");
        setActivityModal(null);

        (async () => {
          const { error: insertError } = await supabase.from("activities").insert({
            id,
            athlete_id: currentUser.id,
            logged_at: newEntry.loggedAt,
            duration_label: values.durationLabel ?? null,
            notes: values.notes ?? null,
          });
          if (insertError) throw insertError;

          if (typeIds.length > 0) {
            const { error: typesError } = await supabase
              .from("activity_entry_types")
              .insert(typeIds.map((activity_type_id) => ({ activity_id: id, activity_type_id })));
            if (typesError) throw typesError;
          }
        })().catch(() => {
          setEntries(previousEntries);
          showToast("Couldn't save that activity — try again");
        });
      }
    },
    [activityModal, activityTypes, currentUser.id, entries, showToast]
  );

  const deleteActivity = useCallback(
    (entryId: string) => {
      const previousEntries = entries;
      const previousComments = commentsByEntryId;

      setEntries((prev) => prev.filter((entry) => entry.id !== entryId));
      setCommentsByEntryId((prev) => {
        const next = { ...prev };
        delete next[entryId];
        return next;
      });
      setActivityModal(null);
      showToast("Activity deleted");

      const supabase = createBrowserSupabaseClient();
      supabase
        .from("activities")
        .delete()
        .eq("id", entryId)
        .then(({ error }) => {
          if (!error) return;
          setEntries(previousEntries);
          setCommentsByEntryId(previousComments);
          showToast("Couldn't delete — try again");
        });
    },
    [entries, commentsByEntryId, showToast]
  );

  const openAddActivity = useCallback((dateKey: string) => {
    setActivityModal({ mode: "add", dateKey });
  }, []);

  const openEditActivity = useCallback((entryId: string) => {
    setActivityModal({ mode: "edit", entryId });
  }, []);

  const closeActivityModal = useCallback(() => setActivityModal(null), []);
  const openDayDetails = useCallback((dateKey: string) => setDayDetailsDateKey(dateKey), []);
  const closeDayDetails = useCallback(() => setDayDetailsDateKey(null), []);

  const value: AppState = {
    summary,
    entries,
    athletes,
    currentUser,
    commentsByEntryId,
    activityTypes,
    toastMessage,
    activityModal,
    dayDetailsDateKey,
    toggleKudos,
    addComment,
    addCustomActivityType,
    saveActivity,
    deleteActivity,
    showToast,
    openAddActivity,
    openEditActivity,
    closeActivityModal,
    openDayDetails,
    closeDayDetails,
  };

  return (
    <AppStateContext.Provider value={value}>
      {children}
      <DayDetailsSheet />
      <ActivityModal />
      <Toast message={toastMessage} />
    </AppStateContext.Provider>
  );
}

export function useAppState(): AppState {
  const context = useContext(AppStateContext);
  if (!context) {
    throw new Error("useAppState must be used within an AppStateProvider");
  }
  return context;
}
