# Wishlist Backend API

FastAPI бэкенд для приложения вишлистов.

## Установка

```bash
# Создать виртуальное окружение
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Установить зависимости
pip install -r requirements.txt

# Настроить переменные окружения
cp .env.example .env
# Отредактируйте .env файл
```

## Запуск

```bash
# Разработка
uvicorn app.main:app --reload

# Продакшн
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

## API Документация

После запуска сервера:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Миграции базы данных

```bash
# Создать миграцию
alembic revision --autogenerate -m "описание"

# Применить миграции
alembic upgrade head
```

## Эндпоинты

### Авторизация
- `POST /api/auth/register` - Регистрация
- `POST /api/auth/login` - Вход
- `GET /api/auth/me` - Текущий пользователь
- `GET /api/auth/google` - OAuth Google
- `GET /api/auth/github` - OAuth GitHub

### Вишлисты
- `GET /api/wishlists` - Список вишлистов пользователя
- `POST /api/wishlists` - Создать вишлист
- `GET /api/wishlists/{id}` - Получить вишлист
- `PUT /api/wishlists/{id}` - Обновить вишлист
- `DELETE /api/wishlists/{id}` - Удалить вишлист
- `GET /api/wishlists/public/{slug}` - Публичный вишлист

### Товары
- `POST /api/wishlists/{id}/items` - Добавить товар
- `PUT /api/items/{id}` - Обновить товар
- `DELETE /api/items/{id}` - Удалить товар
- `POST /api/items/{id}/mark` - Отметить как купленный
