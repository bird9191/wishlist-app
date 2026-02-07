# 🚀 Пошаговая инструкция перед деплоем

## Шаг 1: Подготовка кода

### 1.1 Проверь что всё работает локально (опционально)
```bash
cd /Users/magomed199/project1

# Если есть Docker:
docker compose up -d

# Если нет - пропусти этот шаг
```

### 1.2 Создай .gitignore (уже есть ✅)
```bash
# Проверь что файл существует:
cat .gitignore
# Должен содержать: .env, node_modules/, __pycache__, *.db
```

---

## Шаг 2: GitHub

### 2.1 Создай репозиторий на GitHub
1. Иди на https://github.com/new
2. Название: `wishlist-app` (или любое)
3. Public
4. НЕ добавляй README, .gitignore (у тебя уже есть)
5. Нажми "Create repository"

### 2.2 Запушь код
```bash
cd /Users/magomed199/project1

# Проверь что git инициализирован
git status

# Если нет - инициализируй:
git init

# Добавь все файлы
git add .

# Коммит
git commit -m "Initial commit: Wishlist app with real-time reservations"

# Добавь remote (замени YOUR_USERNAME на свой)
git remote add origin https://github.com/YOUR_USERNAME/wishlist-app.git

# Запушь
git branch -M main
git push -u origin main
```

**Проверка:** Зайди на GitHub и убедись что код загрузился.

---

## Шаг 3: Подготовь данные для Railway

### 3.1 Сгенерируй SECRET_KEY
```bash
# Выполни в терминале:
openssl rand -hex 32

# Скопируй результат (будет нужен для Railway)
# Пример: a3b7c2d1e5f6g8h9i0j1k2l3m4n5o6p7q8r9s0t1u2v3w4x5y6z7a8b9c0d1e2f3
```

### 3.2 Запиши данные:
```
GitHub URL: https://github.com/YOUR_USERNAME/wishlist-app
SECRET_KEY: <результат из openssl>
```

---

## Шаг 4: Теперь можешь идти на Railway! 🎯

### Railway деплой (15 минут):

1. **Зайди на railway.app** → Sign up с GitHub
2. **New Project** → Deploy PostgreSQL
3. Скопируй `DATABASE_URL` из PostgreSQL сервиса
4. **New Service** → Deploy from GitHub
5. Выбери `wishlist-app` репозиторий
6. Root directory: `backend`
7. Добавь Variables:
   ```
   DATABASE_URL=<из шага 3>
   SECRET_KEY=<из openssl>
   FRONTEND_URL=https://твой-домен.vercel.app (добавишь позже)
   ```
8. Deploy!

### Vercel деплой (5 минут):

1. **Зайди на vercel.com** → Sign up с GitHub
2. **Import Project** → выбери `wishlist-app`
3. Root Directory: `frontend`
4. Environment Variable:
   ```
   NEXT_PUBLIC_API_URL=https://твой-backend.railway.app
   ```
5. Deploy!

### Обновление CORS:

1. Вернись в Railway → Backend → Variables
2. Обнови `FRONTEND_URL` на настоящий Vercel URL
3. Redeploy

---

## ✅ Готово!

Твоё приложение живёт на:
- Frontend: `https://wishlist-app-xxxxxx.vercel.app`
- Backend: `https://wishlist-app-production-xxxx.up.railway.app`

Проверь:
```bash
# Backend health:
curl https://твой-backend.railway.app/health

# Frontend:
open https://твой-frontend.vercel.app
```

---

## 📝 Что сдать:

1. **Ссылка на приложение:** https://твой-frontend.vercel.app
2. **GitHub:** https://github.com/YOUR_USERNAME/wishlist-app
3. **Видео:** 3-5 минут как работал с Cursor (запись экрана)
4. **Продуктовые решения:** Скопируй `PRODUCT_DECISIONS.md`

Удачи! 🚀
