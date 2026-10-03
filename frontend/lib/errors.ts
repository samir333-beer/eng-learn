import axios from 'axios';

export function getApiError(err: unknown, fallback: string): string {
  if (axios.isAxiosError(err)) {
    if (!err.response) {
      // Запрос не дошёл до сервера или не дождался ответа за таймаут
      if (err.code === 'ECONNABORTED') {
        return __DEV__
          ? 'Сервер не отвечает (таймаут 15 с). Проверьте, что backend запущен.'
          : 'Сервер не отвечает. Проверьте подключение к интернету и попробуйте ещё раз.';
      }
      return __DEV__
        ? `Нет связи с сервером (${err.message}). Проверьте, что backend запущен и Wi-Fi включён.`
        : 'Нет подключения к интернету. Проверьте сеть и попробуйте ещё раз.';
    }
    const detail = err.response.data?.detail;
    if (typeof detail === 'string') return detail;
    if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg;
    if (err.response.status === 429) return 'Слишком много запросов. Подождите минуту.';
    if (__DEV__) return `${fallback} (HTTP ${err.response.status})`;
  }
  return fallback;
}
