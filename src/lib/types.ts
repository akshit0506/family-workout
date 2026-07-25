export type Athlete = {
  id: string;
  name: string;
};

export type FeedEntry = {
  id: string;
  athleteId: string;
  loggedAt: string;
  activities: string[];
  durationLabel?: string;
  notes?: string;
  achievementNote?: string;
  kudosFromAthleteIds: string[];
};

export type ActivityType = {
  id: string;
  label: string;
};

export type ActivityFormValues = {
  activities: string[];
  durationLabel?: string;
  notes?: string;
};

export type CurrentUserSummary = {
  periodLabel: string;
  entriesThisPeriod: number;
  last30Days: number;
  rank: number;
  sparkline: number[];
  streakDays: number;
  weekStatus: boolean[];
  allTimeEntries: number;
  bestStreak: number;
  kudosReceived: number;
  todayLogged: boolean;
};

export type Comment = {
  id: string;
  athleteId: string;
  text: string;
  postedAt: string;
};

export type ActivityBreakdownItem = {
  label: string;
  count: number;
  percent: number;
};

export type PeriodOption = {
  id: string;
  label: string;
};

export type PeriodProgress = {
  periodLabel: string;
  currentDay: number;
  totalDays: number;
};

export type LeaderboardRow = {
  athleteId: string;
  rank: number;
  workoutDays: number;
  recentCountLabel?: string;
  streakLabel?: string;
};

export type PeriodRankSummary = {
  periodId: string;
  rank: number | null;
  workoutDays: number;
};
