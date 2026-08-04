import { apiClient } from '@/lib/api/client';

export type UserStats = {
  phrases_learned: number;
  phrases_seen: number;
  total_views: number;
  total_phrases: number;
  progress_percent: number;
  active_days_week: number;
  study_time_seconds: number;
  streak_days: number;
  by_level: Record<string, number>;
};

export async function fetchMyStats() {
  const { data } = await apiClient.get<UserStats>('/progress/stats');
  return data;
}

export async function markPhraseLearned(phraseId: number) {
  await apiClient.post('/progress/learned', { phrase_id: phraseId });
}
