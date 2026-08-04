import { apiClient } from '@/lib/api/client';

export type Phrase = {
  id: number;
  en: string;
  ru: string;
  topic: string;
  level: string;
};

export type PhraseList = {
  items: Phrase[];
  total: number;
  skip: number;
  limit: number;
};

export async function fetchRandomPhrase(level?: string, topic?: string) {
  const { data } = await apiClient.get<Phrase>('/phrases/random', {
    params: { level, topic },
  });
  return data;
}

export async function fetchPhrasesPage(params: {
  skip?: number;
  limit?: number;
  level?: string;
  topic?: string;
}) {
  const { data } = await apiClient.get<PhraseList>('/phrases/', { params });
  return data;
}

export async function fetchLevels() {
  const { data } = await apiClient.get<{ levels: string[] }>('/phrases/levels');
  return data.levels;
}
