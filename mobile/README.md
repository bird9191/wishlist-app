# Wishlist Mobile (iOS)

Мобильный клиент в отдельной папке `mobile/` на `Expo + React Native`.

## Что реализовано

- Email/пароль auth (логин/регистрация, JWT)
- Дашборд владельца с созданием вишлистов
- Экран вишлиста владельца:
  - добавление товара
  - автозаполнение по URL
  - удаление товара (с backend edge-case проверкой вкладов)
- Публичный экран вишлиста:
  - резервирование
  - вклад в pooling-подарки
  - live-обновления через WebSocket
- OAuth-инфо кнопки (соответствуют текущей backend заглушке)

## Быстрый старт

1. Установить зависимости:
   - `cd mobile`
   - `npm install`
2. Запуск:
   - `npm run start`
3. iOS:
   - открыть в Expo Go **или** `npm run ios` (если настроен Xcode)

## API URL

По умолчанию берется из `app.json`:

- `expo.extra.apiUrl`

Сейчас установлен:

- `https://wishlist-app-production-7db1.up.railway.app`
