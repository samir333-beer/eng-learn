import axios from 'axios';

export function getApiError(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    if (!err.response) {
      if (err.code === 'ECONNABORTED') {
        return 'Сервер не отвечает. Проверьте, что backend запущен.';
      }
      return 'Нет связи с сервером. Запустите backend и проверьте Wi‑Fi.';
    }
    const detail = err.response.data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg;
    if (err.response.status === 429) return 'Слишком много запросов. Подождите минуту.';
  }
  return fallback;
}
