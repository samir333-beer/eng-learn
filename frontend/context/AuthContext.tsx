import { useRouter, useSegments } from 'expo-router';
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
  loginWithPassword,
  registerWithEmail,
  type User,
} from '@/lib/api/auth';
import { setAuthToken } from '@/lib/api/client';
import { clearToken, loadToken, saveToken } from '@/lib/storage/token';

type AuthContextValue = {
  user: User | null;
  isLoading: boolean;
  signInPassword: (email: string, password: string) => Promise<void>;
  signInCode: (email: string, code: string) => Promise<void>;
  signUp: (
    email: string,
    code: string,
    username: string,
    password: string,
  ) => Promise<void>;
  signOut: () => Promise<void>;
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const segments = useSegments();

  const applyToken = useCallback(async (token: string) => {
    setAuthToken(token);
    await saveToken(token);
    const me = await fetchMe();
    setUser(me);
  }, []);

  useEffect(() => {
    (async () => {
      try {
        const token = await loadToken();
        if (token) {
          setAuthToken(token);
          setUser(await fetchMe());
        }
      } catch {
        await clearToken();
        setAuthToken(null);
        setUser(null);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  useEffect(() => {
    if (isLoading) return;
    const inAuth = segments[0] === '(auth)';
    if (!user && !inAuth) router.replace('/(auth)/login');
    else if (user && inAuth) router.replace('/(tabs)');
  }, [user, isLoading, segments, router]);

  const signInPassword = useCallback(
    async (email: string, password: string) => {
      const { access_token } = await loginWithPassword(email, password);
      await applyToken(access_token);
    },
    [applyToken],
  );

  const signInCode = useCallback(
    async (email: string, code: string) => {
      const { access_token } = await loginWithEmailCode(email, code);
      await applyToken(access_token);
    },
    [applyToken],
  );

  const signUp = useCallback(
    async (
      email: string,
      code: string,
      username: string,
      password: string,
    ) => {
      const { access_token } = await registerWithEmail(
        email,
        code,
        username,
        password,
      );
      await applyToken(access_token);
    },
    [applyToken],
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

  const value = useMemo(
    () => ({
      user,
      isLoading,
      signInPassword,
      signInCode,
      signUp,
      signOut,
      refreshUser,
    }),
    [user, isLoading, signInPassword, signInCode, signUp, signOut, refreshUser],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
