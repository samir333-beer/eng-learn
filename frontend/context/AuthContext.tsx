import { useRouter, useSegments } from 'expo-router';
import axios from 'axios';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  fetchMe,
  loginWithEmailCode,
  loginWithGoogle,
  loginWithPassword,
  registerWithEmail,
  type User,
  type AuthResponse,
} from '@/lib/api/auth';
import { setAuthToken } from '@/lib/api/client';
import { clearToken, loadToken, saveToken } from '@/lib/storage/token';

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  sessionError: boolean;
  signInPassword: (email: string, password: string) => Promise<void>;
  signInCode: (email: string, code: string) => Promise<void>;
  signInWithGoogle: (idToken: string) => Promise<void>;
  signUp: (
    email: string,
    code: string,
    username: string,
    password: string,
  ) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
  retrySession: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [sessionError, setSessionError] = useState(false);
  const router = useRouter();
  const segments = useSegments();

  const applyToken = useCallback(async (token: string) => {
    setAuthToken(token);
    try {
      const me = await fetchMe();
      await saveToken(token);
      setUser(me);
      setSessionError(false);
    } catch (error) {
      setAuthToken(null);
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        await clearToken();
      }
      throw error;
    }
  }, []);

  // Вход/регистрация: эндпоинты уже возвращают профиль в том же ответе,
  // поэтому второй запрос /auth/me не нужен — экономим целый сетевой круг.
  const applyAuth = useCallback(async (auth: AuthResponse) => {
    setAuthToken(auth.access_token);
    await saveToken(auth.access_token);
    setUser(auth.user);
    setSessionError(false);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const token = await loadToken();
        if (token) {
          setAuthToken(token);
          setUser(await fetchMe());
        }
        setSessionError(false);
      } catch (error) {
        if (axios.isAxiosError(error) && error.response?.status === 401) {
          await clearToken();
          setAuthToken(null);
        } else {
          setSessionError(true);
        }
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const inAuth = segments[0] === '(auth)';
    if (!user && !sessionError && !inAuth) router.replace('/(auth)/login');
    else if (user && inAuth) router.replace('/(tabs)');
  }, [user, isLoading, sessionError, segments, router]);

  const signInPassword = useCallback(
    async (email: string, password: string) => {
      await applyAuth(await loginWithPassword(email, password));
    },
    [applyAuth],
  );

  const signInCode = useCallback(
    async (email: string, code: string) => {
      await applyAuth(await loginWithEmailCode(email, code));
    },
    [applyAuth],
  );

  const signUp = useCallback(
    async (
      email: string,
      code: string,
      username: string,
      password: string,
    ) => {
      await applyAuth(
        await registerWithEmail(email, code, username, password),
      );
    },
    [applyAuth],
  );

  const signInWithGoogle = useCallback(
    async (idToken: string) => {
      await applyAuth(await loginWithGoogle(idToken));
    },
    [applyAuth],
  );

  const signOut = useCallback(async () => {
    await clearToken();
    setAuthToken(null);
    setUser(null);
    router.replace('/(auth)/login');
  }, [router]);

  const refreshUser = useCallback(async () => {
    if (!user) return;
    setUser(await fetchMe());
  }, [user]);

  const retrySession = useCallback(async () => {
    setIsLoading(true);
    setSessionError(false);
    try {
      const token = await loadToken();
      if (!token) {
        setUser(null);
        return;
      }
      setAuthToken(token);
      setUser(await fetchMe());
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 401) {
        await clearToken();
        setAuthToken(null);
        setSessionError(false);
      } else {
        setSessionError(true);
      }
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      isLoading,
      sessionError,
      signInPassword,
      signInCode,
      signInWithGoogle,
      signUp,
      signOut,
      refreshUser,
      retrySession,
    }),
    [
      user,
      isLoading,
      sessionError,
      signInPassword,
      signInCode,
      signInWithGoogle,
      signUp,
      signOut,
      refreshUser,
      retrySession,
    ],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
