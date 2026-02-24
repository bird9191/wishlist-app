Wishlist Frontend

Next.js фронтенд для приложения вишлистов.

Установка и запуск

  npm install
  npm run dev

Приложение будет доступно на localhost:3000.

Для продакшн-сборки: npm run build && npm start.

Переменная NEXT_PUBLIC_API_URL в файле .env.local указывает на адрес бэкенда.

Страницы

  /              главная
  /login         вход
  /register      регистрация
  /dashboard     мои вишлисты
  /wishlist/[slug]       публичный вишлист
  /wishlist/[slug]/edit  редактирование вишлиста
