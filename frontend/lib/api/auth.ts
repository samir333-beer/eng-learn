import { apiClient } from '@/lib/api/client';

export type User = {
  id: number;
  email: string;
  username: string;
};

export type TokenResponse = {
  access_token: string;
  token_type: string;
};

export async function sendEmailCode(
  email: string,
  purpose: 'register' | 'login' | 'reset',
) {
  const { data } = await apiClient.post<{ message: string }>(
    '/auth/email/send-code',
    { email, purpose },
  );
  return data;
}

export async function verifyRegistrationCode(email: string, code: string) {
  const { data } = await apiClient.post<{ status: 'success' }>(
    '/api/verify-code',
    { email, code },
  );
  return data;
}

export async function registerWithEmail(
  email: string,
  code: string,
  username: string,
  password: string,
) {
  const { data } = await apiClient.post<TokenResponse>('/auth/email/register', {
    email,
    code,
    username,
    password,
  });
  return data;
}

export async function loginWithEmailCode(email: string, code: string) {
  const { data } = await apiClient.post<TokenResponse>('/auth/email/login-code', {
    email,
    code,
  });
  return data;
}

export async function loginWithPassword(email: string, password: string) {
  const { data } = await apiClient.post<TokenResponse>('/auth/login', {
    email,
    password,
  });
  return data;
}

export async function forgotPassword(email: string) {
  const { data } = await apiClient.post<{ message: string }>(
    '/auth/forgot-password',
    { email },
  );
  return data;
}

export async function resetPassword(
  email: string,
  code: string,
  newPassword: string,
) {
  const { data } = await apiClient.post<{ message: string }>(
    '/auth/reset-password',
    { email, code, new_password: newPassword },
  );
  return data;
}

export async function fetchMe() {
  const { data } = await apiClient.get<User>('/auth/me');
  return data;
}
