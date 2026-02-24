Wishlist Backend

FastAPI бэкенд для приложения вишлистов.

Установка и запуск

  pip install -r requirements.txt
  cp .env.example .env
  uvicorn app.main:app --reload --port 8000

После запуска документация доступна по адресам localhost:8000/docs (Swagger) и localhost:8000/redoc.

Переменные окружения задаются в .env: DATABASE_URL для подключения к PostgreSQL, SECRET_KEY для JWT.

Эндпоинты

Авторизация:
  POST /api/auth/register
  POST /api/auth/login
  POST /api/auth/login/json
  GET  /api/auth/me

Вишлисты:
  GET    /api/wishlists
  POST   /api/wishlists
  GET    /api/wishlists/{id}
  PUT    /api/wishlists/{id}
  DELETE /api/wishlists/{id}
  GET    /api/wishlists/public/{slug}

Товары:
  POST   /api/wishlists/{id}/items
  PUT    /api/items/{id}
  DELETE /api/items/{id}
  POST   /api/items/{id}/reserve
  DELETE /api/items/{id}/reserve
  POST   /api/items/{id}/contribute

Прочее:
  POST /api/url/parse
  WS   /api/items/ws/{wishlist_id}
