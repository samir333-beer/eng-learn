import { apiClient } from '@/lib/api/client';

export type SRSCardItem = {
  card_id: number;
  phrase_id: number;
  en: string;
  ru: string;
  topic: string;
  level: string;
  is_new: boolean;
  box: number;
};

export type SRSReview = {
  items: SRSCardItem[];
  total: number;
};

export type SRSStats = {
  total_cards: number;
  due_cards: number;
  new_cards: number;
  learned_cards: number;
};

export type SRSReviewResult = {
  card_id: number;
  phrase_id: number;
  box: number;
  interval_days: number;
  next_review_at: string | null;
};

export async function fetchSRSReview(limit = 20) {
  const { data } = await apiClient.get<SRSReview>('/srs/review', {
    params: { limit },
  });
  return data;
}

export async function submitSRSReview(cardId: number, quality: 0 | 1) {
  const { data } = await apiClient.post<SRSReviewResult>('/srs/review', {
    card_id: cardId,
    quality,
  });
  return data;
}

export async function fetchSRSStats() {
  const { data } = await apiClient.get<SRSStats>('/srs/stats');
  return data;
}