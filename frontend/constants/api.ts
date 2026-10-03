/**
 * IP вашего компьютера в локальной Wi‑Fi сети.
 * Узнать: ipconfig (Windows) → IPv4 Address.
 * Телефон и ПК должны быть в одной сети.
 */
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.0.105:8000';
