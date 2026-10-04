import { api } from "./api";

export interface WeeklyPattern {
  text: string;
  sourceDates: string[];
}

export interface WeeklyOverview {
  weekStart: string;
  weekEnd: string;
  entryCount: number;
  entryDates: string[];
  themes: { title: string; type: string; entriesThisWeek: number; sourceDates: string[] }[];
  followedThrough: { title: string; resolvedAt: string; quote: string }[];
  openLoops: { title: string; entriesThisWeek: number; sourceDates: string[] }[];
  plan: { total: number; completed: number } | null;
  reflection: { patterns: WeeklyPattern[]; text: string; generatedAt: string; stale: boolean } | null;
}

export async function fetchWeeklyInsights(weekStart: string): Promise<WeeklyOverview> {
  const { data } = await api.get<WeeklyOverview>(`/insights/weekly/${weekStart}`);
  return data;
}

export async function generateWeeklyReflection(
  weekStart: string,
): Promise<{ generated: boolean; overview: WeeklyOverview }> {
  const { data } = await api.post<{ generated: boolean; overview: WeeklyOverview }>(
    `/insights/weekly/${weekStart}/generate`,
  );
  return data;
}