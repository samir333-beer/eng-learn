import { apiClient } from '@/lib/api/client';

export type QuizQuestion = {
  phrase_id: number;
  en: string;
  level: string;
  options: string[];
  correct_index: number;
};

export type Quiz = {
  questions: QuizQuestion[];
  total: number;
};

export async function fetchQuiz(level?: string, count = 10) {
  const { data } = await apiClient.get<Quiz>('/quiz/', {
    params: { level, count },
  });
  return data;
}