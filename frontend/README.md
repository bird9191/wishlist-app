# Wishlist Frontend

Next.js фронтенд для приложения вишлистов.

## Установка

```bash
npm install
# или
yarn install
```

## Настройка

Создайте `.env.local` файл:

```bash
cp .env.example .env.local
```

Отредактируйте переменные окружения в `.env.local`.

## Запуск

```bash
# Разработка
npm run dev

# Продакшн
npm run build
npm start
```

Приложение будет доступно на http://localhost:3000

## Страницы

- `/` - Главная страница
- `/login` - Вход
- `/register` - Регистрация
- `/dashboard` - Мои вишлисты
- `/wishlist/[slug]` - Публичный вишлист

## Технологии

- Next.js 14
- React 18
- TypeScript
- Tailwind CSS
- Axios
- Zustand (state management)
- React Toastify (notifications)
- React Icons
