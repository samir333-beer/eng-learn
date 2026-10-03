/**
 * Код подтверждения регистрации, проверенный на шаге 2, передаётся на шаг 3
 * через память модуля, а не через параметры роута. Так код не попадает в URL
 * (а значит — в логи навигации/дев-логгер).
 *
 * Время жизни: от успешной проверки кода на шаге 2 до успешной регистрации
 * либо выхода из флоу. При перезапуске приложения состояние сбрасывается.
 */
type PendingRegistration = {
  email: string;
  code: string;
};

let pending: PendingRegistration | null = null;

export function setPendingRegistration(email: string, code: string): void {
  pending = { email, code };
}

export function getPendingRegistration(): PendingRegistration | null {
  return pending;
}

export function clearPendingRegistration(): void {
  pending = null;
}
