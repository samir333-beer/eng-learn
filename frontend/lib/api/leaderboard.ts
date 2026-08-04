import { apiClient } from '@/lib/api/client';

export type LeaderboardEntry = {
  rank: number;
  user_id: number;
  username: string;
  value: number;
};

export type Leaderboard = {
  category: 'words' | 'time';
  total: number;
  entries: LeaderboardEntry[];
  my_rank: number | null;
  my_value: number | null;
};

export async function fetchWordsLeaderboard() {
  const { data } = await apiClient.get<Leaderboard>('/leaderboard/words');
  return data;
}

export async function fetchTimeLeaderboard() {
  const { data } = await apiClient.get<Leaderboard>('/leaderboard/time');
  return data;
}

export async function reportStudyTime(seconds: number) {
  const { data } = await apiClient.post<{ ok: boolean; study_time_seconds: number }>(
    '/leaderboard/study-time',
    { seconds },
  );
  return data;
}
