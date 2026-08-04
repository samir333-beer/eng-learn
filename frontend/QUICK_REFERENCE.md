# 🔧 БЫСТРЫЙ СПРАВОЧНИК ДЛЯ РАЗРАБОТЧИКА

## Файлы которые были изменены:

### 1. frontend/.env (НОВЫЙ)
```
EXPO_PUBLIC_API_URL=http://192.168.0.23:8000
```

### 2. frontend/app/(auth)/login.tsx
**Главные изменения:**
- Русский текст заголовков
- Иконки для полей ввода (mail, lock)
- Кнопка показа пароля (eye icon)
- Чекбокс "Запомнить меня"
- Круглые цветные соцсети (Google, Apple, Telegram)

**Ключевые линии кода:**
```tsx
// Круглые цветные кнопки соцсетей
<Pressable 
  style={[styles.socialButton, { backgroundColor: '#EA4335' }]}
>
  <Ionicons name="logo-google" size={24} color="#fff" />
</Pressable>

// Стиль
socialButton: {
  width: 64,
  height: 64,
  borderRadius: 32,  // КРУГЛЫЕ!
  alignItems: 'center',
  justifyContent: 'center',
}
```

### 3. frontend/app/(auth)/register.tsx
**Главные изменения:**
- Полный русский язык
- Иконки для всех полей
- Такой же дизайн как login
- Одинаковые соцсети
- Кнопка "Назад"

### 4. frontend/components/auth/SocialAuthRow.tsx
**Главные изменения:**
- Фирменные цвета для каждой соцсети
- Круглые кнопки вместо квадратных
- Telegram вместо Facebook
- Используется в старых компонентах для совместимости

---

## Цвета соцсетей:

```javascript
const socialProviders = [
  { id: 'google', icon: 'logo-google', color: '#EA4335' },    // Красная Google
  { id: 'apple', icon: 'logo-apple', color: '#000' },          // Чёрная Apple  
  { id: 'telegram', icon: 'paper-plane', color: '#0088cc' },   // Голубая Telegram
];
```

---

## Где что искать:

| Что нужно | Где искать |
|---|---|
| **Строка подключения API** | `frontend/constants/api.ts` |
| **Клиент API** | `frontend/lib/api/client.ts` |
| **Методы авторизации** | `frontend/lib/api/auth.ts` |
| **Контекст аутентификации** | `frontend/context/AuthContext.tsx` |
| **Экран входа** | `frontend/app/(auth)/login.tsx` |
| **Экран регистрации** | `frontend/app/(auth)/register.tsx` |
| **Соцсети компонент** | `frontend/components/auth/SocialAuthRow.tsx` |

---

## Быстрые команды:

```bash
# Проверить TypeScript
cd frontend && npx tsc --noEmit

# Запустить линтер
cd frontend && npm run lint

# Запустить приложение
cd frontend && npm start

# Выполнить сброс проекта (если что-то сломалось)
cd frontend && npm run reset-project
```

---

## Если что-то не работает:

### "Нет связи с сервером"
- Проверьте IP в `.env`: должен быть IP вашего компьютера в локальной сети
- Убедитесь что компьютер и телефон в одной Wi-Fi сети
- Проверьте что FastAPI запущен: `python main.py`

### Ошибка при отправке кода
- Проверьте что Gmail правильно настроен на бэкенде
- Смотрите логи сервера: `python main.py` (вывод в консоль)

### Социальные кнопки не работают
- Они пока placeholder-ы, при нажатии пишут в консоль
- Интеграция Google/Apple/Telegram идёт на бэкенде

---

## Тестирование на телефоне:

```bash
# 1. Запустить фронтенд
cd frontend
npm start

# 2. На телефоне открыть Expo Go
# 3. Отсканировать QR код или ввести:
192.168.0.23:19000
```

---

## Стиль и размеры:

```javascript
// Заголовки
title: { fontSize: 36, fontWeight: '700' }

// Подзаголовки  
subtitle: { fontSize: 16, lineHeight: 24 }

// Текст кнопок
primaryText: { fontSize: 16, fontWeight: '700' }

// Поля ввода
input: { 
  borderRadius: 16,
  paddingVertical: 18,
  paddingHorizontal: 16,
  fontSize: 15,
  fontWeight: '500'
}

// Соцсети
socialButton: {
  width: 64,
  height: 64,
  borderRadius: 32
}
```

---

## Как добавить свою социальную сеть:

```javascript
// В socialProviders массив добавьте:
{ 
  id: 'vk', 
  icon: 'logo-vimeo',  // или другая иконка из Ionicons
  label: 'VK', 
  color: '#0077FF'     // цвет VK
}
```

---

## Конфиг API:

Если нужно изменить URL:
```typescript
// frontend/constants/api.ts
export const API_BASE_URL =
  process.env.EXPO_PUBLIC_API_URL ?? 'http://192.168.0.23:8000';
```

Или через окружение:
```bash
# .env файл
EXPO_PUBLIC_API_URL=http://ваш-ip:8000
```

---

## Русский язык для новых компонентов:

Используйте эти переводы для единообразия:
- "Email адрес" (не "Email")
- "Пароль" (не "Password")
- "Запомнить меня"
- "Забыли пароль?"
- "Войти"
- "Создать аккаунт"
- "Отправить код"
- "Зарегистрироваться"

---

✨ **Всё готово! Проект работает как часы.** ⏰
