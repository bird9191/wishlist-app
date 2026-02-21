# Wishlist Mobile Flutter

Flutter/Dart версия мобильного клиента в отдельной папке `mobile_flutter/`.

## Реализовано

- Регистрация и вход (JWT через FastAPI)
- Дашборд владельца:
  - создание вишлистов
  - открытие существующих
  - переход в публичный экран по slug
- Экран владельца:
  - добавление товара
  - автозаполнение по URL
  - удаление товара
  - pooling toggle
- Публичный экран:
  - резервирование
  - вклады в pooling
  - real-time обновления через WebSocket
- OAuth info-кнопки (соответствуют backend заглушке)

## Запуск

```bash
cd mobile_flutter
flutter pub get
flutter run
```

Для iOS:

```bash
flutter run -d ios
```

## API

API URL задается в `lib/config.dart`:

- `https://wishlist-app-production-7db1.up.railway.app`
