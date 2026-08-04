import { useEffect } from 'react';
import { AppState, type AppStateStatus } from 'react-native';

import { reportStudyTime } from '@/lib/api/leaderboard';

const SYNC_INTERVAL_SEC = 30;

export function useStudyTimer(enabled: boolean) {
  useEffect(() => {
    if (!enabled) return;

    let activeSince = Date.now();
    let pendingSeconds = 0;
    let intervalId: ReturnType<typeof setInterval> | null = null;

    const flush = async () => {
      if (pendingSeconds < 1) return;
      const batch = Math.min(pendingSeconds, 300);
      pendingSeconds -= batch;
      try {
        await reportStudyTime(batch);
      } catch {
        pendingSeconds += batch;
      }
    };

    const tick = () => {
      const now = Date.now();
      const elapsed = Math.floor((now - activeSince) / 1000);
      if (elapsed > 0) {
        pendingSeconds += elapsed;
        activeSince = now;
      }
      if (pendingSeconds >= SYNC_INTERVAL_SEC) {
        void flush();
      }
    };

    const onAppState = (state: AppStateStatus) => {
      if (state === 'active') {
        activeSince = Date.now();
        intervalId = setInterval(tick, 1000);
      } else {
        tick();
        void flush();
        if (intervalId) {
          clearInterval(intervalId);
          intervalId = null;
        }
      }
    };

    intervalId = setInterval(tick, 1000);
    const sub = AppState.addEventListener('change', onAppState);

    return () => {
      tick();
      void flush();
      if (intervalId) clearInterval(intervalId);
      sub.remove();
    };
  }, [enabled]);
}
