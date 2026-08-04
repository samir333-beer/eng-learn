# English Learning App

Expo (React Native) + FastAPI — 100 фраз, уровни A1–B2, email-регистрация, профиль со статистикой.

## Бэкенд

```powershell
cd backend
pip install -r requirements.txt
# При обновлении схемы БД удалите english_app.db
python main.py
```

### Почта (код регистрации)

В `backend/.env` укажите SMTP (Gmail — пароль приложения):

```
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=your@gmail.com
SMTP_PASSWORD=xxxx
SMTP_FROM=your@gmail.com
```

Без SMTP код печатается в **консоль сервера** (режим разработки).

### Масштаб (~10 000 пользователей)

- PostgreSQL в Docker (`docker compose up`)
- Connection pool на API
- Rate limit на отправку кодов и вход
- Уникальный индекс на `email`
- Пагинация списка фраз (`limit` ≤ 50)

## Фронтенд (Expo Go)

```powershell
cd frontend
npx expo start
```

IP ПК в `frontend/constants/api.ts` или `.env`:

```
EXPO_PUBLIC_API_URL=http://192.168.0.23:8000
```

## Регистрация

1. Email → код на почту (или в консоль сервера)
2. Ввод кода → имя и пароль
3. Дубликат email: «Эта почта уже используется»

## Вкладки

- **Учёба** — случайные фразы, фильтр уровня, озвучка
- **Словарь** — 100 фраз с фильтрами
- **Профиль** — статистика, прогресс по уровням
